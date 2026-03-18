<?php

use Carbon\Carbon;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('psychologists', function (Blueprint $table) {
            $table->string('slug', 160)->nullable()->after('surname');
        });

        Schema::create('psychologist_appointment_types', function (Blueprint $table) {
            $table->id();
            $table->foreignId('psychologist_id')->constrained('psychologists')->cascadeOnDelete();
            $table->string('label', 120);
            $table->unsignedSmallInteger('duration_minutes')->default(50);
            $table->enum('location_mode', ['online', 'in_person', 'both'])->default('both');
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
            $table->index(['psychologist_id', 'is_active']);
        });

        Schema::create('psychologist_availability_rules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('psychologist_id')->constrained('psychologists')->cascadeOnDelete();
            $table->unsignedTinyInteger('weekday');
            $table->time('start_time');
            $table->time('end_time');
            $table->unsignedSmallInteger('interval_minutes')->default(60);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->index(['psychologist_id', 'weekday', 'is_active'], 'psych_availability_rules_lookup');
        });

        Schema::create('psychologist_availability_exceptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('psychologist_id')->constrained('psychologists')->cascadeOnDelete();
            $table->date('date');
            $table->boolean('is_available')->default(false);
            $table->time('start_time')->nullable();
            $table->time('end_time')->nullable();
            $table->unsignedSmallInteger('interval_minutes')->nullable();
            $table->string('note', 180)->nullable();
            $table->timestamps();
            $table->index(['psychologist_id', 'date'], 'psych_availability_exceptions_lookup');
        });

        Schema::table('appointments', function (Blueprint $table) {
            $table->foreignId('psychologist_id')->nullable()->after('user_id')->constrained('psychologists')->nullOnDelete();
            $table->foreignId('appointment_type_id')->nullable()->after('psychologist_id')->constrained('psychologist_appointment_types')->nullOnDelete();
            $table->timestamp('starts_at')->nullable()->after('appointment_type_id');
            $table->timestamp('ends_at')->nullable()->after('starts_at');
            $table->string('location_mode', 20)->nullable()->after('type');
            $table->index(['psychologist_id', 'starts_at'], 'appointments_psychologist_starts_at_idx');
        });

        $psychologists = DB::table('psychologists')
            ->orderBy('id')
            ->get(['id', 'title', 'name', 'surname', 'supports_online']);

        $existingSlugs = [];
        foreach ($psychologists as $psychologist) {
            $base = Str::slug(trim(collect([$psychologist->name, $psychologist->surname])->filter()->implode(' '))) ?: "specialist-{$psychologist->id}";
            $slug = $base;
            $suffix = 2;

            while (in_array($slug, $existingSlugs, true) || DB::table('psychologists')->where('slug', $slug)->where('id', '!=', $psychologist->id)->exists()) {
                $slug = "{$base}-{$suffix}";
                $suffix += 1;
            }

            $existingSlugs[] = $slug;
            DB::table('psychologists')->where('id', $psychologist->id)->update(['slug' => $slug]);
        }

        $defaults = DB::table('appointment_types')->orderBy('id')->pluck('label')->all();
        if ($defaults === []) {
            $defaults = ['Evaluare initiala', 'Sedinta individuala', 'Follow-up', 'Consiliere online'];
        }

        foreach ($psychologists as $psychologist) {
            foreach ($defaults as $index => $label) {
                $normalizedLabel = Str::lower($label);
                $duration = str_contains($normalizedLabel, 'evaluare') ? 60 : (str_contains($normalizedLabel, 'follow') ? 30 : 50);
                $locationMode = str_contains($normalizedLabel, 'online')
                    ? 'online'
                    : ((bool) $psychologist->supports_online ? 'both' : 'in_person');

                DB::table('psychologist_appointment_types')->insert([
                    'psychologist_id' => $psychologist->id,
                    'label' => $label,
                    'duration_minutes' => $duration,
                    'location_mode' => $locationMode,
                    'is_active' => true,
                    'sort_order' => $index,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }

        $appointments = DB::table('appointments')->orderBy('id')->get();
        foreach ($appointments as $appointment) {
            $normalizedPsychologistName = Str::of((string) $appointment->psychologist_name)->squish()->lower()->value();
            $matchedPsychologist = $psychologists->first(function ($psychologist) use ($normalizedPsychologistName) {
                $fullName = Str::of(trim(collect([$psychologist->title, $psychologist->name, $psychologist->surname])->filter()->implode(' ')))->squish()->lower()->value();
                return $fullName === $normalizedPsychologistName;
            });

            $typeRow = null;
            if ($matchedPsychologist) {
                $typeRow = DB::table('psychologist_appointment_types')
                    ->where('psychologist_id', $matchedPsychologist->id)
                    ->where('label', $appointment->type)
                    ->first(['id', 'duration_minutes', 'location_mode']);
            }

            $startsAt = $appointment->scheduled_for ? Carbon::parse($appointment->scheduled_for) : null;
            $duration = (int) ($typeRow->duration_minutes ?? 60);

            DB::table('appointments')
                ->where('id', $appointment->id)
                ->update([
                    'psychologist_id' => $matchedPsychologist?->id,
                    'appointment_type_id' => $typeRow?->id,
                    'starts_at' => $startsAt,
                    'ends_at' => $startsAt?->copy()->addMinutes($duration),
                    'location_mode' => $typeRow?->location_mode ?? null,
                ]);
        }

        Schema::table('psychologists', function (Blueprint $table) {
            $table->unique('slug');
        });
    }

    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->dropIndex('appointments_psychologist_starts_at_idx');
            $table->dropConstrainedForeignId('appointment_type_id');
            $table->dropConstrainedForeignId('psychologist_id');
            $table->dropColumn(['starts_at', 'ends_at', 'location_mode']);
        });

        Schema::dropIfExists('psychologist_availability_exceptions');
        Schema::dropIfExists('psychologist_availability_rules');
        Schema::dropIfExists('psychologist_appointment_types');

        Schema::table('psychologists', function (Blueprint $table) {
            $table->dropUnique(['slug']);
            $table->dropColumn('slug');
        });
    }
};

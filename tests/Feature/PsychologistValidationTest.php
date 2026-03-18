<?php

use App\Models\Psychologist;
use App\Support\PsychologistValidationCatalog;
use Illuminate\Support\Facades\DB;

it('saves multiple psychologist attestations in the validation flow', function () {
    $catalog = PsychologistValidationCatalog::ensureDefaults();
    $entityTypeId = collect($catalog['entityTypes'])->firstWhere('code', 'individual')['id'];
    $clinicianRoleId = collect($catalog['roles'])->firstWhere('code', 'psihologie_clinica')['id'];
    $psychotherapistRoleId = collect($catalog['roles'])->firstWhere('code', 'psihoterapie')['id'];
    $specialistGradeId = collect($catalog['grades'])->firstWhere('code', 'specialist')['id'];
    $practicantGradeId = collect($catalog['grades'])->firstWhere('code', 'practicant')['id'];

    $psychologistId = DB::table('psychologists')->insertGetId([
        'name' => 'Ana',
        'surname' => 'Popescu',
        'email' => 'ana.popescu.validation@example.local',
        'password_hash' => bcrypt('Password123!'),
        'created_at' => now(),
    ]);

    DB::table('psychologists_address')->insert([
        'psychologist_id' => $psychologistId,
    ]);

    DB::table('psychologist_individual_profiles')->insert([
        'psychologist_id' => $psychologistId,
    ]);

    DB::table('psychologist_validation_applications')->insert([
        'psychologist_id' => $psychologistId,
        'entity_type_id' => $entityTypeId,
        'status' => 'draft',
        'submitted_at' => now(),
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $psychologist = Psychologist::query()->findOrFail($psychologistId);

    $response = $this
        ->actingAs($psychologist, 'psychologist')
        ->withSession(['psychologist_mfa_confirmed_at' => now()->toIso8601String()])
        ->post(route('psychologists.validation.update'), [
            'entity_type_id' => $entityTypeId,
            'supports_online' => true,
            'city_mode' => 'other',
            'county' => 'Cluj',
            'address' => 'Str. Memorandumului 10',
            'first_name' => 'Ana',
            'last_name' => 'Popescu',
            'professional_email' => 'ana.popescu@example.com',
            'phone' => '0712345678',
            'rupa_code' => '12345',
            'competencies' => 'Evaluare clinica, interventii CBT',
            'public_bio' => 'Profil public de test',
            'attestations' => [
                [
                    'professional_role_id' => $clinicianRoleId,
                    'professional_grade_id' => $specialistGradeId,
                    'practice_regime' => 'autonom',
                    'license_number' => 'AT-001',
                    'license_issue_date' => '2024-09-01',
                    'specialty_commission' => 'Comisia de psihologie clinică și psihoterapie',
                    'specialization' => 'Psihologie Clinica',
                ],
                [
                    'professional_role_id' => $psychotherapistRoleId,
                    'professional_grade_id' => $practicantGradeId,
                    'practice_regime' => 'supervizare',
                    'license_number' => 'AT-002',
                    'license_issue_date' => '2026-10-01',
                    'specialty_commission' => 'Comisia de psihologie clinică și psihoterapie',
                    'specialization' => 'Psihoterapie',
                ],
            ],
        ]);

    $response->assertRedirect(route('psychologists.dashboard', ['section' => 'validation']));

    expect(DB::table('psychologist_validation_applications')->where('psychologist_id', $psychologistId)->exists())->toBeTrue();
    expect(DB::table('psychologist_validation_specialists')->count())->toBe(2);
    expect(DB::table('psychologist_validation_specialist_specializations')->count())->toBe(2);
    expect(DB::table('psychologist_specialties')->where('psychologist_id', $psychologistId)->pluck('label')->all())
        ->toEqualCanonicalizing(['Psihologie Clinica', 'Psihoterapie']);
});

<?php

namespace App\Http\Controllers;

use App\Mail\CommunityGroupInvitationMail;
use App\Mail\PsychologistEmailVerificationMail;
use App\Mail\PsychologistMfaCodeMail;
use App\Models\Appointment;
use App\Models\Psychologist;
use App\Models\NotificationTemplate;
use App\Support\AppointmentLifecycleService;
use App\Support\AppointmentReminderService;
use App\Support\PsychologistValidationCatalog;
use App\Support\NotificationService;
use App\Support\PsychologistBookingService;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class PsychologistController extends Controller
{
    public function __construct(
        protected PsychologistBookingService $booking,
        protected AppointmentLifecycleService $appointmentLifecycle,
        protected AppointmentReminderService $appointmentReminders,
    )
    {
    }

    public function signupPage(): Response
    {
        return Inertia::render('Psychologists/Signup');
    }

    public function signinPage(): Response
    {
        return Inertia::render('Psychologists/Signin');
    }

    public function mfaChallengePage(Request $request): Response|RedirectResponse
    {
        $pendingPsychologistId = (int) $request->session()->get('pending_psychologist_id');

        if ($pendingPsychologistId <= 0) {
            return redirect()->route('psychologists.signin');
        }

        $psychologist = DB::table('psychologists')->where('id', $pendingPsychologistId)->first(['email', 'name']);

        abort_unless($psychologist, 404);

        return Inertia::render('Psychologists/MfaChallenge', [
            'maskedEmail' => $this->maskEmail($psychologist->email),
            'purpose' => (string) $request->session()->get('pending_psychologist_mfa_purpose', 'login'),
        ]);
    }

    public function verifyEmail(Request $request, int $verificationId, string $token): RedirectResponse
    {
        $verification = DB::table('psychologist_email_verifications')->where('id', $verificationId)->first();

        if (! $verification || $verification->consumed_at || now()->greaterThan($verification->expires_at) || ! Hash::check($token, $verification->token_hash)) {
            return redirect()->route('psychologists.signin')->withErrors([
                'email' => 'Linkul de verificare este invalid sau a expirat.',
            ]);
        }

        DB::transaction(function () use ($verification) {
            DB::table('psychologists')
                ->where('id', $verification->psychologist_id)
                ->update(['email_verified_at' => now()]);

            DB::table('psychologist_email_verifications')
                ->where('psychologist_id', $verification->psychologist_id)
                ->whereNull('consumed_at')
                ->update(['consumed_at' => now()]);
        });

        return redirect()->route('psychologists.signin')->with('status', 'Emailul a fost confirmat. Continuă cu autentificarea și codul Multi-Factor Authentication.');
    }

    public function resendVerification(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
        ]);

        $psychologist = DB::table('psychologists')->where('email', $validated['email'])->first();

        if (! $psychologist) {
            return back()->withErrors(['email' => 'Nu exista un cont de specialist cu acest email.'])->onlyInput('email');
        }

        if ($psychologist->email_verified_at) {
            return back()->with('status', 'Emailul este deja confirmat. Continua cu autentificarea.');
        }

        if (! $this->sendPsychologistVerificationEmail((object) $psychologist)) {
            return back()->withErrors(['email' => 'Nu am putut trimite emailul de verificare. Incearca din nou.'])->onlyInput('email');
        }

        return back()->with('status', 'Am trimis un nou link de verificare pe emailul profesional.');
    }

    public function verifyMfaChallenge(Request $request): RedirectResponse
    {
        $pendingPsychologistId = (int) $request->session()->get('pending_psychologist_id');
        $pendingPurpose = (string) $request->session()->get('pending_psychologist_mfa_purpose', 'login');
        $intendedUrl = (string) $request->session()->get('pending_psychologist_intended_url', route('psychologists.dashboard'));

        if ($pendingPsychologistId <= 0) {
            return redirect()->route('psychologists.signin');
        }

        $validated = $request->validate([
            'code' => ['required', 'digits:6'],
        ]);

        $challenge = DB::table('psychologist_mfa_challenges')
            ->where('psychologist_id', $pendingPsychologistId)
            ->where('purpose', $pendingPurpose)
            ->whereNull('consumed_at')
            ->orderByDesc('id')
            ->first();

        if (! $challenge || now()->greaterThan($challenge->expires_at) || ! Hash::check($validated['code'], $challenge->code_hash)) {
            return back()->withErrors([
                'code' => 'Codul Multi-Factor Authentication este invalid sau a expirat.',
            ]);
        }

        DB::table('psychologist_mfa_challenges')
            ->where('id', $challenge->id)
            ->update(['consumed_at' => now()]);

        $psychologist = Psychologist::query()->find($pendingPsychologistId);

        abort_unless($psychologist, 404);

        Auth::guard('psychologist')->login($psychologist);
        $request->session()->put('psychologist_mfa_confirmed_at', now()->toIso8601String());
        $request->session()->forget(['pending_psychologist_id', 'pending_psychologist_mfa_purpose', 'pending_psychologist_intended_url']);
        $request->session()->regenerate();

        return redirect()->to($intendedUrl)->with('status', $pendingPurpose === 'login'
            ? 'Autentificarea specialistului a fost confirmata.'
            : 'Accesul sensibil a fost reconfirmat.');
    }

    public function resendMfaChallenge(Request $request): RedirectResponse
    {
        $pendingPsychologistId = (int) $request->session()->get('pending_psychologist_id');
        $pendingPurpose = (string) $request->session()->get('pending_psychologist_mfa_purpose', 'login');

        if ($pendingPsychologistId <= 0) {
            return redirect()->route('psychologists.signin');
        }

        $psychologist = DB::table('psychologists')->where('id', $pendingPsychologistId)->first();
        abort_unless($psychologist, 404);

        if (! $this->issueMfaChallenge((object) $psychologist, $pendingPurpose)) {
            return back()->withErrors(['code' => 'Nu am putut trimite un nou cod Multi-Factor Authentication. Încearcă din nou.']);
        }

        return back()->with('status', 'Am trimis un nou cod Multi-Factor Authentication pe emailul profesional.');
    }

    public function signup(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'first_name' => ['required', 'string', 'max:80'],
            'last_name' => ['required', 'string', 'max:80'],
            'email' => ['required', 'email', 'max:120', 'unique:psychologists,email'],
            'password' => ['required', 'confirmed', Password::defaults()],
        ]);

        $catalog = PsychologistValidationCatalog::ensureDefaults();

        $psychologistId = DB::transaction(function () use ($validated, $catalog) {
            $slug = $this->uniquePsychologistSlug("{$validated['first_name']} {$validated['last_name']}");
            $psychologistId = DB::table('psychologists')->insertGetId([
                'name' => $validated['first_name'],
                'surname' => $validated['last_name'],
                'slug' => $slug,
                'email' => $validated['email'],
                'password_hash' => Hash::make($validated['password']),
                'created_at' => now(),
            ]);

            DB::table('psychologist_individual_profiles')->insert([
                'psychologist_id' => $psychologistId,
            ]);

            DB::table('psychologists_address')->insert([
                'psychologist_id' => $psychologistId,
            ]);

            DB::table('psychologist_validation_applications')->insert([
                'psychologist_id' => $psychologistId,
                'entity_type_id' => $catalog['entityTypes'][0]['id'] ?? null,
                'status' => 'draft',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            return $psychologistId;
        });

        $psychologist = DB::table('psychologists')->where('id', $psychologistId)->first();

        if (! $psychologist || ! $this->sendPsychologistVerificationEmail((object) $psychologist)) {
            return redirect()->route('psychologists.signin')->withErrors([
                'email' => 'Contul a fost creat, dar emailul de verificare nu a putut fi trimis. Foloseste retrimiterea din pagina de autentificare.',
            ])->withInput(['email' => $validated['email']]);
        }

        return redirect()->route('psychologists.signin')->with('status', 'Contul a fost creat. Verifica emailul profesional pentru activare.');
    }

    public function signin(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $psychologist = DB::table('psychologists')->where('email', $validated['email'])->first();

        if (! $psychologist || ! Hash::check($validated['password'], $psychologist->password_hash ?? '')) {
            return back()->withErrors([
                'email' => 'Autentificare esuata.',
            ])->onlyInput('email');
        }

        if (! $psychologist->email_verified_at) {
            $this->sendPsychologistVerificationEmail((object) $psychologist);

            return back()->withErrors([
                'email' => 'Emailul profesional nu este confirmat. Am retrimis linkul de verificare.',
            ])->onlyInput('email');
        }

        if (! $this->issueMfaChallenge((object) $psychologist, 'login')) {
            return back()->withErrors([
                'email' => 'Nu am putut trimite codul Multi-Factor Authentication. Încearcă din nou.',
            ])->onlyInput('email');
        }

        Auth::guard('psychologist')->logout();
        $request->session()->forget(['psychologist_mfa_confirmed_at']);
        $request->session()->put('pending_psychologist_id', $psychologist->id);
        $request->session()->put('pending_psychologist_mfa_purpose', 'login');
        $request->session()->put('pending_psychologist_intended_url', route('psychologists.dashboard'));

        return redirect()->route('psychologists.mfa.challenge');
    }

    public function signout(Request $request): RedirectResponse
    {
        Auth::guard('psychologist')->logout();

        $request->session()->forget([
            'psychologist_mfa_confirmed_at',
            'pending_psychologist_id',
            'pending_psychologist_mfa_purpose',
            'pending_psychologist_intended_url',
        ]);

        return redirect()->route('psychologists.signin');
    }

    public function dashboard(Request $request): Response|RedirectResponse
    {
        $row = $this->requirePsychologistSession($request);

        if ($row instanceof RedirectResponse) {
            return $row;
        }

        $psychologistId = $row->id;

        $catalog = PsychologistValidationCatalog::ensureDefaults();
        $application = DB::table('psychologist_validation_applications')->where('psychologist_id', $psychologistId)->first();
        $addressRecord = DB::table('psychologists_address')->where('psychologist_id', $psychologistId)->first();
        $specialtiesRows = DB::table('psychologist_specialties')->where('psychologist_id', $psychologistId)->orderBy('id')->pluck('label');
        $validationStatus = $application?->status === 'approved' ? 1 : 0;
        $individualProfile = DB::table('psychologist_individual_profiles')->where('psychologist_id', $psychologistId)->first();
        $location = $application
            ? DB::table('psychologist_validation_locations')->where('application_id', $application->id)->first()
            : null;
        $specialists = $application
            ? DB::table('psychologist_validation_specialists')
                ->where('application_id', $application->id)
                ->orderByDesc('is_primary')
                ->orderBy('id')
                ->get()
            : collect();

        $attestations = $specialists->map(function ($specialist) {
            $specializations = DB::table('psychologist_validation_specialist_specializations')
                ->where('specialist_id', $specialist->id)
                ->orderBy('id')
                ->pluck('label')
                ->all();

            return [
                'id' => $specialist->id,
                'is_primary' => (bool) $specialist->is_primary,
                'title' => $specialist->title,
                'first_name' => $specialist->first_name,
                'last_name' => $specialist->last_name,
                'professional_role_id' => $specialist->professional_role_id,
                'professional_email' => $specialist->professional_email,
                'professional_phone' => $specialist->professional_phone,
                'cpr_code' => $specialist->cpr_code,
                'license_number' => $specialist->license_number,
                'license_issue_date' => $specialist->license_issue_date,
                'license_expiry_date' => $specialist->license_expiry_date,
                'professional_grade_id' => $specialist->professional_grade_id,
                'practice_regime' => $specialist->practice_regime,
                'specialty_commission' => $specialist->specialty_commission,
                'medical_authorization_number' => $specialist->medical_authorization_number,
                'clinical_competencies' => $specialist->clinical_competencies,
                'description' => $specialist->description,
                'specializations' => $specializations,
            ];
        })->all();

        if ($attestations === []) {
            $attestations[] = [
                'id' => null,
                'is_primary' => true,
                'title' => $row->title,
                'first_name' => $row->name,
                'last_name' => $row->surname,
                'professional_role_id' => null,
                'professional_email' => $row->email,
                'professional_phone' => $row->phone,
                'cpr_code' => $individualProfile->cpr_code ?? null,
                'license_number' => $individualProfile->license_number ?? null,
                'license_issue_date' => $individualProfile->license_issue_date ?? null,
                'license_expiry_date' => $individualProfile->license_expiry_date ?? null,
                'professional_grade_id' => null,
                'practice_regime' => null,
                'specialty_commission' => null,
                'medical_authorization_number' => $individualProfile->medical_authorization_number ?? null,
                'clinical_competencies' => $individualProfile->clinical_competencies ?? null,
                'description' => $individualProfile->public_bio ?? null,
                'specializations' => $specialtiesRows->all(),
            ];
        }

        $documents = $application
            ? DB::table('psychologist_validation_documents')
                ->where('application_id', $application->id)
                ->orderByDesc('id')
                ->get()
                ->map(fn ($item) => [
                    'id' => $item->id,
                    'name' => $item->original_name,
                    'url' => Storage::disk($item->disk)->url($item->path),
                    'size' => $item->size,
                    'mime_type' => $item->mime_type,
                ])
                ->all()
            : [];
        $validationMessages = $application
            ? DB::table('psychologist_validation_messages as pvm')
                ->leftJoin('superadmins as sa', 'sa.id', '=', 'pvm.superadmin_id')
                ->where('pvm.application_id', $application->id)
                ->orderByDesc('pvm.id')
                ->get(['pvm.id', 'pvm.message', 'pvm.created_at', 'sa.username'])
                ->map(fn ($item) => [
                    'id' => $item->id,
                    'message' => $item->message,
                    'created_at' => $item->created_at,
                    'author' => $item->username ?: 'superadmin',
                ])
                ->all()
            : [];

        $myArticles = DB::table('articles as a')
            ->leftJoin('article_topics as at', 'at.id', '=', 'a.topic_id')
            ->leftJoin('articles_validation as av', 'av.article_id', '=', 'a.id')
            ->where('a.author', $psychologistId)
            ->orderByDesc('a.id')
            ->get([
                'a.id',
                'a.title',
                'a.slug',
                'a.tag',
                'a.minutes',
                'a.topic_id',
                'a.hero_image',
                'a.body',
                'at.name as topic_name',
                'av.is_valid',
            ])
            ->map(fn ($item) => [
                'id' => $item->id,
                'title' => $item->title,
                'slug' => $item->slug,
                'tag' => $item->tag,
                'minutes' => $this->estimateArticleReadingMinutes(
                    $this->normalizeArticleEditorBody($item->body) ?: (string) ($item->minutes ?? '')
                ),
                'topic_id' => $item->topic_id,
                'topic_name' => $item->topic_name,
                'hero_image' => $item->hero_image,
                'body' => $this->normalizeArticleEditorBody($item->body),
                'isValid' => (bool) ($item->is_valid ?? 0),
            ]);

        $groupActivityRows = DB::table('community_dialogue_messages as messages')
            ->join('community_dialogues as dialogues', 'dialogues.id', '=', 'messages.dialogue_id')
            ->whereIn('dialogues.group_id', DB::table('community_groups')->where('author', $psychologistId)->select('id'))
            ->select('dialogues.group_id', 'dialogues.stamp', 'messages.time', 'dialogues.sort_order', 'messages.sort_order as message_sort_order')
            ->orderBy('dialogues.group_id')
            ->orderBy('dialogues.sort_order')
            ->orderBy('messages.sort_order')
            ->get()
            ->groupBy('group_id');

        $myGroups = DB::table('community_groups')
            ->leftJoin('community_groups_validation as cgv', 'cgv.group_id', '=', 'community_groups.id')
            ->where('author', $psychologistId)
            ->orderByDesc('community_groups.id')
            ->get([
                'community_groups.id',
                'community_groups.slug',
                'community_groups.name',
                'community_groups.members',
                'community_groups.is_private',
                'cgv.is_valid as validation_is_valid',
            ])
            ->map(function ($item) use ($groupActivityRows) {
                $lastMessage = collect($groupActivityRows->get($item->id, []))->last();
                $lastMessageAt = $this->communityMessageDateTime($lastMessage?->stamp, $lastMessage?->time);

                return [
                    'id' => $item->id,
                    'slug' => $item->slug,
                    'name' => $item->name,
                    'members' => $item->members,
                    'last_active' => $this->communityExactElapsedLabel($lastMessageAt),
                    'is_private' => (bool) $item->is_private,
                    'validation_status' => $item->validation_is_valid ? 'approved' : 'pending',
                ];
            });

        $appointmentTypes = DB::table('psychologist_appointment_types')
            ->where('psychologist_id', $psychologistId)
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get()
            ->map(fn ($item) => [
                'id' => $item->id,
                'label' => $item->label,
                'duration_minutes' => (int) $item->duration_minutes,
                'price_amount' => (float) $item->price_amount,
                'currency' => $item->currency,
                'is_paid_online' => (bool) $item->is_paid_online,
                'location_mode' => $item->location_mode,
                'is_active' => (bool) $item->is_active,
                'sort_order' => (int) $item->sort_order,
            ])
            ->all();

        $availabilityRules = DB::table('psychologist_availability_rules')
            ->where('psychologist_id', $psychologistId)
            ->orderBy('weekday')
            ->orderBy('start_time')
            ->get()
            ->map(fn ($item) => [
                'id' => $item->id,
                'weekday' => (int) $item->weekday,
                'start_time' => substr((string) $item->start_time, 0, 5),
                'end_time' => substr((string) $item->end_time, 0, 5),
                'interval_minutes' => (int) $item->interval_minutes,
                'is_active' => (bool) $item->is_active,
            ])
            ->all();

        $availabilityExceptions = DB::table('psychologist_availability_exceptions')
            ->where('psychologist_id', $psychologistId)
            ->orderBy('date')
            ->orderBy('start_time')
            ->get()
            ->map(fn ($item) => [
                'id' => $item->id,
                'date' => (string) $item->date,
                'is_available' => (bool) $item->is_available,
                'start_time' => $item->start_time ? substr((string) $item->start_time, 0, 5) : '',
                'end_time' => $item->end_time ? substr((string) $item->end_time, 0, 5) : '',
                'interval_minutes' => $item->interval_minutes ? (int) $item->interval_minutes : '',
                'note' => $item->note,
            ])
            ->all();

        $psychologistAppointments = Appointment::query()
            ->where('psychologist_id', $psychologistId)
            ->with(['user', 'appointmentType', 'reminderPreferences'])
            ->orderBy('starts_at')
            ->get()
            ->map(fn (Appointment $appointment) => [
                'id' => $appointment->id,
                'client' => $appointment->user?->name ?: $appointment->user?->email ?: 'Client confidential',
                'date' => optional($appointment->starts_at ?? $appointment->scheduled_for)?->locale('ro')->isoFormat('dddd, D MMM'),
                'slot' => optional($appointment->starts_at ?? $appointment->scheduled_for)?->format('H:i'),
                'status' => $appointment->status,
                'type' => $appointment->type,
                'location_mode' => $appointment->location_mode,
                'payment_status' => $appointment->payment_status,
                'price_total' => (float) $appointment->total_amount,
                'currency' => $appointment->currency,
                'expires_at' => optional($appointment->expires_at)->format('d.m.Y H:i'),
                'user_reminder_minutes' => optional($appointment->reminderPreferences->firstWhere('actor_type', 'user'))->minutes_before,
                'psychologist_reminder_minutes' => optional($appointment->reminderPreferences->firstWhere('actor_type', 'psychologist'))->minutes_before,
                'can_manage' => in_array($appointment->status, [
                    Appointment::STATUS_PENDING,
                    Appointment::STATUS_CONFIRMED,
                    Appointment::STATUS_NO_SHOW,
                ], true),
            ])
            ->all();

        return Inertia::render('Psychologists/Dashboard', [
            'initialValidationStatus' => $validationStatus,
            'approvalStatus' => $application->status ?? 'draft',
            'reviewerNotes' => $application->reviewer_notes ?? null,
            'validationMessages' => $validationMessages,
            'canManageContent' => ($application->status ?? 'draft') === 'approved',
            'validationCatalog' => $catalog,
            'initialValidationDraft' => [
                'entity_type_id' => $application->entity_type_id ?? ($catalog['entityTypes'][0]['id'] ?? null),
                'supports_online' => (bool) ($location->supports_online ?? $row->supports_online),
                'city_mode' => $location->city_mode ?? 'other',
                'city' => $location->city ?? $addressRecord->city ?? null,
                'county' => $location->county ?? $addressRecord->county ?? null,
                'sector' => $location->sector ?? null,
                'address' => $addressRecord->address ?? null,
                'first_name' => $row->name,
                'last_name' => $row->surname,
                'professional_email' => $row->email,
                'phone' => $row->phone,
                'rupa_code' => $row->rupa_code ?? null,
                'attestations' => $attestations,
                'competencies' => $individualProfile->clinical_competencies ?? '',
                'public_bio' => $individualProfile->public_bio ?? '',
                'documents' => $documents,
            ],
            'initialArticles' => $myArticles,
            'articleTopics' => DB::table('article_topics')->orderBy('name')->get(['id', 'name']),
            'initialGroups' => $myGroups,
            'appointmentTypes' => $appointmentTypes,
            'availabilityRules' => $availabilityRules,
            'availabilityExceptions' => $availabilityExceptions,
            'initialAppointments' => $psychologistAppointments,
            'initialProfile' => [
                'id' => $row->id,
                'title' => $row->title,
                'name' => $row->name,
                'surname' => $row->surname,
                'supportsOnline' => (bool) $row->supports_online,
                'address' => $addressRecord->address ?? '',
                'city' => $addressRecord->city ?? null,
                'county' => $addressRecord->county ?? null,
                'phone' => $row->phone,
                'email' => $row->email,
                'specialties' => $specialtiesRows->all(),
                'individualProfile' => $individualProfile ? [
                    'profession' => $individualProfile->profession,
                    'cprCode' => $individualProfile->cpr_code,
                    'professionalGrade' => $individualProfile->professional_grade,
                    'licenseNumber' => $individualProfile->license_number,
                    'licenseIssueDate' => $individualProfile->license_issue_date,
                    'licenseExpiryDate' => $individualProfile->license_expiry_date,
                    'medicalAuthorizationNumber' => $individualProfile->medical_authorization_number,
                    'clinicalCompetencies' => $individualProfile->clinical_competencies,
                ] : null,
            ],
        ]);
    }

    public function storeAppointmentType(Request $request): RedirectResponse
    {
        $psychologist = $this->requirePsychologistSession($request, true);

        if ($psychologist instanceof RedirectResponse) {
            return $psychologist;
        }

        $validated = $request->validate([
            'label' => ['required', 'string', 'max:120'],
            'duration_minutes' => ['required', 'integer', 'min:15', 'max:240'],
            'price_amount' => ['required', 'numeric', 'min:0'],
            'currency' => ['nullable', 'string', 'size:3'],
            'is_paid_online' => ['nullable', 'boolean'],
            'location_mode' => ['required', Rule::in(['online', 'in_person', 'both'])],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $nextSortOrder = (int) DB::table('psychologist_appointment_types')
            ->where('psychologist_id', $psychologist->id)
            ->max('sort_order') + 1;

        DB::table('psychologist_appointment_types')->insert([
            'psychologist_id' => $psychologist->id,
            'label' => $validated['label'],
            'duration_minutes' => (int) $validated['duration_minutes'],
            'price_amount' => (float) $validated['price_amount'],
            'currency' => strtoupper((string) ($validated['currency'] ?? 'RON')),
            'is_paid_online' => (bool) ($validated['is_paid_online'] ?? true),
            'location_mode' => $validated['location_mode'],
            'is_active' => (bool) ($validated['is_active'] ?? true),
            'sort_order' => $nextSortOrder,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return redirect()->route('psychologists.dashboard', ['section' => 'schedule'])->with('status', 'Tipul de ședință a fost adăugat.');
    }

    public function updateAppointmentType(Request $request, int $typeId): RedirectResponse
    {
        $psychologist = $this->requirePsychologistSession($request, true);

        if ($psychologist instanceof RedirectResponse) {
            return $psychologist;
        }

        $validated = $request->validate([
            'label' => ['required', 'string', 'max:120'],
            'duration_minutes' => ['required', 'integer', 'min:15', 'max:240'],
            'price_amount' => ['required', 'numeric', 'min:0'],
            'currency' => ['nullable', 'string', 'size:3'],
            'is_paid_online' => ['required', 'boolean'],
            'location_mode' => ['required', Rule::in(['online', 'in_person', 'both'])],
            'is_active' => ['required', 'boolean'],
        ]);

        $updated = DB::table('psychologist_appointment_types')
            ->where('id', $typeId)
            ->where('psychologist_id', $psychologist->id)
            ->update([
                'label' => $validated['label'],
                'duration_minutes' => (int) $validated['duration_minutes'],
                'price_amount' => (float) $validated['price_amount'],
                'currency' => strtoupper((string) ($validated['currency'] ?? 'RON')),
                'is_paid_online' => (bool) $validated['is_paid_online'],
                'location_mode' => $validated['location_mode'],
                'is_active' => (bool) $validated['is_active'],
                'updated_at' => now(),
            ]);

        abort_unless($updated, 404);

        return redirect()->route('psychologists.dashboard', ['section' => 'schedule'])->with('status', 'Tipul de ședință a fost actualizat.');
    }

    public function destroyAppointmentType(Request $request, int $typeId): RedirectResponse
    {
        $psychologist = $this->requirePsychologistSession($request, true);

        if ($psychologist instanceof RedirectResponse) {
            return $psychologist;
        }

        $hasActiveAppointments = Appointment::query()
            ->where('psychologist_id', $psychologist->id)
            ->where('appointment_type_id', $typeId)
            ->whereIn('status', [Appointment::STATUS_PENDING, Appointment::STATUS_CONFIRMED])
            ->exists();

        abort_if($hasActiveAppointments, 422, 'Tipul are programări active și nu poate fi șters.');

        $deleted = DB::table('psychologist_appointment_types')
            ->where('id', $typeId)
            ->where('psychologist_id', $psychologist->id)
            ->delete();

        abort_unless($deleted, 404);

        return redirect()->route('psychologists.dashboard', ['section' => 'schedule'])->with('status', 'Tipul de ședință a fost șters.');
    }

    public function storeAvailabilityRule(Request $request): RedirectResponse
    {
        $psychologist = $this->requirePsychologistSession($request, true);

        if ($psychologist instanceof RedirectResponse) {
            return $psychologist;
        }

        $validated = $request->validate([
            'weekday' => ['required', 'integer', 'min:0', 'max:6'],
            'start_time' => ['required', 'date_format:H:i'],
            'end_time' => ['required', 'date_format:H:i', 'after:start_time'],
            'interval_minutes' => ['required', 'integer', 'min:15', 'max:180'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        DB::table('psychologist_availability_rules')->insert([
            'psychologist_id' => $psychologist->id,
            'weekday' => (int) $validated['weekday'],
            'start_time' => $validated['start_time'],
            'end_time' => $validated['end_time'],
            'interval_minutes' => (int) $validated['interval_minutes'],
            'is_active' => (bool) ($validated['is_active'] ?? true),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return redirect()->route('psychologists.dashboard', ['section' => 'schedule'])->with('status', 'Regula de disponibilitate a fost adăugată.');
    }

    public function updateAvailabilityRule(Request $request, int $ruleId): RedirectResponse
    {
        $psychologist = $this->requirePsychologistSession($request, true);

        if ($psychologist instanceof RedirectResponse) {
            return $psychologist;
        }

        $validated = $request->validate([
            'weekday' => ['required', 'integer', 'min:0', 'max:6'],
            'start_time' => ['required', 'date_format:H:i'],
            'end_time' => ['required', 'date_format:H:i', 'after:start_time'],
            'interval_minutes' => ['required', 'integer', 'min:15', 'max:180'],
            'is_active' => ['required', 'boolean'],
        ]);

        $updated = DB::table('psychologist_availability_rules')
            ->where('id', $ruleId)
            ->where('psychologist_id', $psychologist->id)
            ->update([
                'weekday' => (int) $validated['weekday'],
                'start_time' => $validated['start_time'],
                'end_time' => $validated['end_time'],
                'interval_minutes' => (int) $validated['interval_minutes'],
                'is_active' => (bool) $validated['is_active'],
                'updated_at' => now(),
            ]);

        abort_unless($updated, 404);

        return redirect()->route('psychologists.dashboard', ['section' => 'schedule'])->with('status', 'Regula de disponibilitate a fost actualizata.');
    }

    public function destroyAvailabilityRule(Request $request, int $ruleId): RedirectResponse
    {
        $psychologist = $this->requirePsychologistSession($request, true);

        if ($psychologist instanceof RedirectResponse) {
            return $psychologist;
        }

        $deleted = DB::table('psychologist_availability_rules')
            ->where('id', $ruleId)
            ->where('psychologist_id', $psychologist->id)
            ->delete();

        abort_unless($deleted, 404);

        return redirect()->route('psychologists.dashboard', ['section' => 'schedule'])->with('status', 'Regula de disponibilitate a fost stearsa.');
    }

    public function storeAvailabilityException(Request $request): RedirectResponse
    {
        $psychologist = $this->requirePsychologistSession($request, true);

        if ($psychologist instanceof RedirectResponse) {
            return $psychologist;
        }

        $validated = $request->validate([
            'date' => ['required', 'date'],
            'is_available' => ['required', 'boolean'],
            'start_time' => ['nullable', 'date_format:H:i'],
            'end_time' => ['nullable', 'date_format:H:i', 'after:start_time'],
            'interval_minutes' => ['nullable', 'integer', 'min:15', 'max:180'],
            'note' => ['nullable', 'string', 'max:180'],
        ]);

        DB::table('psychologist_availability_exceptions')->insert([
            'psychologist_id' => $psychologist->id,
            'date' => $validated['date'],
            'is_available' => (bool) $validated['is_available'],
            'start_time' => $validated['start_time'] ?: null,
            'end_time' => $validated['end_time'] ?: null,
            'interval_minutes' => $validated['interval_minutes'] ?: null,
            'note' => $validated['note'] ?: null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return redirect()->route('psychologists.dashboard', ['section' => 'schedule'])->with('status', 'Exceptia de disponibilitate a fost salvata.');
    }

    public function updateAvailabilityException(Request $request, int $exceptionId): RedirectResponse
    {
        $psychologist = $this->requirePsychologistSession($request, true);

        if ($psychologist instanceof RedirectResponse) {
            return $psychologist;
        }

        $validated = $request->validate([
            'date' => ['required', 'date'],
            'is_available' => ['required', 'boolean'],
            'start_time' => ['nullable', 'date_format:H:i'],
            'end_time' => ['nullable', 'date_format:H:i', 'after:start_time'],
            'interval_minutes' => ['nullable', 'integer', 'min:15', 'max:180'],
            'note' => ['nullable', 'string', 'max:180'],
        ]);

        $updated = DB::table('psychologist_availability_exceptions')
            ->where('id', $exceptionId)
            ->where('psychologist_id', $psychologist->id)
            ->update([
                'date' => $validated['date'],
                'is_available' => (bool) $validated['is_available'],
                'start_time' => $validated['start_time'] ?: null,
                'end_time' => $validated['end_time'] ?: null,
                'interval_minutes' => $validated['interval_minutes'] ?: null,
                'note' => $validated['note'] ?: null,
                'updated_at' => now(),
            ]);

        abort_unless($updated, 404);

        return redirect()->route('psychologists.dashboard', ['section' => 'schedule'])->with('status', 'Exceptia de disponibilitate a fost actualizata.');
    }

    public function destroyAvailabilityException(Request $request, int $exceptionId): RedirectResponse
    {
        $psychologist = $this->requirePsychologistSession($request, true);

        if ($psychologist instanceof RedirectResponse) {
            return $psychologist;
        }

        $deleted = DB::table('psychologist_availability_exceptions')
            ->where('id', $exceptionId)
            ->where('psychologist_id', $psychologist->id)
            ->delete();

        abort_unless($deleted, 404);

        return redirect()->route('psychologists.dashboard', ['section' => 'schedule'])->with('status', 'Exceptia de disponibilitate a fost stearsa.');
    }

    public function updateAppointmentStatus(Request $request, int $appointmentId): RedirectResponse
    {
        $psychologist = $this->requirePsychologistSession($request, true);

        if ($psychologist instanceof RedirectResponse) {
            return $psychologist;
        }

        $validated = $request->validate([
            'status' => ['required', Rule::in([
                Appointment::STATUS_CONFIRMED,
                Appointment::STATUS_DECLINED_BY_PSYCHOLOGIST,
                Appointment::STATUS_CANCELLED_BY_PSYCHOLOGIST,
                Appointment::STATUS_COMPLETED,
                Appointment::STATUS_NO_SHOW,
            ])],
        ]);

        $appointment = Appointment::query()
            ->where('id', $appointmentId)
            ->where('psychologist_id', $psychologist->id)
            ->firstOrFail();

        match ($validated['status']) {
            Appointment::STATUS_CONFIRMED => $this->appointmentLifecycle->confirmByPsychologist($appointment, $psychologist),
            Appointment::STATUS_DECLINED_BY_PSYCHOLOGIST => $this->appointmentLifecycle->declineByPsychologist($appointment, $psychologist),
            Appointment::STATUS_CANCELLED_BY_PSYCHOLOGIST => $this->appointmentLifecycle->cancelByPsychologist($appointment, $psychologist),
            Appointment::STATUS_COMPLETED => $this->appointmentLifecycle->markCompleted($appointment, $psychologist),
            Appointment::STATUS_NO_SHOW => $this->appointmentLifecycle->markNoShow($appointment, $psychologist),
            default => null,
        };

        return redirect()->route('psychologists.dashboard', ['section' => 'schedule'])->with('status', 'Programarea a fost actualizata.');
    }

    public function updateAppointmentReminder(Request $request, int $appointmentId): RedirectResponse
    {
        $psychologist = $this->requirePsychologistSession($request, true);

        if ($psychologist instanceof RedirectResponse) {
            return $psychologist;
        }

        $validated = $request->validate([
            'minutes_before' => ['nullable'],
        ]);

        $appointment = Appointment::query()
            ->where('id', $appointmentId)
            ->where('psychologist_id', $psychologist->id)
            ->firstOrFail();

        $this->appointmentReminders->updatePreference(
            $appointment,
            'psychologist',
            $validated['minutes_before'] ?? null,
        );

        return redirect()->route('psychologists.dashboard', ['section' => 'schedule'])->with('status', 'Reminderul pentru programare a fost actualizat.');
    }

    public function createArticlePage(Request $request): Response|RedirectResponse
    {
        $psychologist = $this->requirePsychologistSession($request, true);

        if ($psychologist instanceof RedirectResponse) {
            return $psychologist;
        }

        return Inertia::render('Psychologists/Articles/New', [
            'topics' => $this->articleTopics(),
        ]);
    }

    public function createCommunityGroupPage(Request $request): Response|RedirectResponse
    {
        $psychologist = $this->requirePsychologistSession($request, true);

        if ($psychologist instanceof RedirectResponse) {
            return $psychologist;
        }

        return Inertia::render('Psychologists/Community/New');
    }

    public function editCommunityGroupPage(Request $request, int $groupId): Response|RedirectResponse
    {
        $psychologist = $this->requirePsychologistSession($request, true);

        if ($psychologist instanceof RedirectResponse) {
            return $psychologist;
        }

        $psychologistId = $psychologist->id;

        $group = DB::table('community_groups')
            ->where('id', $groupId)
            ->where('author', $psychologistId)
            ->first(['id', 'name', 'description', 'schedule', 'meeting_link', 'is_private']);

        abort_unless($group, 404);

        $focusAreas = DB::table('community_group_focus_areas')
            ->where('group_id', $groupId)
            ->orderBy('sort_order')
            ->pluck('label')
            ->all();

        $inviteEmails = DB::table('community_group_invitations')
            ->where('group_id', $groupId)
            ->orderBy('email')
            ->pluck('email')
            ->all();

        return Inertia::render('Psychologists/Community/Edit', [
            'group' => [
                'id' => $group->id,
                'title' => $group->name,
                'description' => $group->description,
                'schedule' => $group->schedule,
                'meeting_link' => $group->meeting_link,
                'focus_areas' => implode("\n", $focusAreas),
                'access_type' => $group->is_private ? 'private' : 'public',
                'invite_emails' => implode("\n", $inviteEmails),
            ],
        ]);
    }

    public function storeCommunityGroup(Request $request): RedirectResponse
    {
        $psychologist = $this->requirePsychologistSession($request, true);

        if ($psychologist instanceof RedirectResponse) {
            return $psychologist;
        }

        $psychologistId = $psychologist->id;

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:150'],
            'description' => ['required', 'string', 'max:2000'],
            'schedule' => ['nullable', 'string', 'max:200'],
            'meeting_link' => ['nullable', 'url', 'max:255'],
            'focus_areas' => ['required', 'string', 'max:1000'],
            'access_type' => ['required', Rule::in(['public', 'private'])],
            'invite_emails' => ['nullable', 'string', 'max:3000'],
        ]);

        $groupId = DB::table('community_groups')->insertGetId([
            'name' => $validated['title'],
            'slug' => $this->uniqueCommunityGroupSlug($validated['title']),
            'description' => $validated['description'],
            'schedule' => $validated['schedule'] ?? null,
            'meeting_link' => $validated['meeting_link'] ?? null,
            'safety_note' => 'Respectă confidențialitatea și evită detalii identificabile. Scrie la persoana întâi și cere pauză dacă ai nevoie.',
            'author' => $psychologistId,
            'members' => 0,
            'is_private' => $validated['access_type'] === 'private',
        ]);

        DB::table('community_groups_validation')->updateOrInsert(
            ['group_id' => $groupId],
            [
                'is_valid' => false,
                'validated_at' => null,
                'reviewer_notes' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );

        foreach ($this->parseTagLines($validated['focus_areas']) as $index => $label) {
            DB::table('community_group_focus_areas')->insert([
                'group_id' => $groupId,
                'label' => $label,
                'sort_order' => $index + 1,
            ]);
        }

        $missingEmails = [];
        if ($validated['access_type'] === 'private') {
            [$matchedUsers, $missingEmails] = $this->resolveInvitationUsers($validated['invite_emails'] ?? '');
            $this->storeCommunityInvitations($groupId, $matchedUsers);
        }

        $status = $missingEmails === []
            ? 'Grupul a fost creat si trimis pentru aprobare.'
            : 'Grupul a fost creat si trimis pentru aprobare. Acest email nu face parte din baza noastra de date: '.implode(', ', $missingEmails);

        return redirect()
            ->route('psychologists.dashboard', ['section' => 'community'])
            ->with('status', $status);
    }

    public function updateCommunityGroup(Request $request, int $groupId): RedirectResponse
    {
        $psychologist = $this->requirePsychologistSession($request, true);

        if ($psychologist instanceof RedirectResponse) {
            return $psychologist;
        }

        $psychologistId = $psychologist->id;

        $group = DB::table('community_groups')
            ->where('id', $groupId)
            ->where('author', $psychologistId)
            ->first(['id']);

        abort_unless($group, 404);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:150'],
            'description' => ['required', 'string', 'max:2000'],
            'schedule' => ['nullable', 'string', 'max:200'],
            'meeting_link' => ['nullable', 'url', 'max:255'],
            'focus_areas' => ['required', 'string', 'max:1000'],
            'access_type' => ['required', Rule::in(['public', 'private'])],
            'invite_emails' => ['nullable', 'string', 'max:3000'],
        ]);

        DB::table('community_groups')
            ->where('id', $groupId)
            ->update([
                'name' => $validated['title'],
                'slug' => $this->uniqueCommunityGroupSlug($validated['title'], $groupId),
                'description' => $validated['description'],
                'schedule' => $validated['schedule'] ?? null,
                'meeting_link' => $validated['meeting_link'] ?? null,
                'is_private' => $validated['access_type'] === 'private',
            ]);

        DB::table('community_groups_validation')->updateOrInsert(
            ['group_id' => $groupId],
            [
                'is_valid' => false,
                'validated_at' => null,
                'updated_at' => now(),
            ]
        );

        DB::table('community_group_focus_areas')->where('group_id', $groupId)->delete();
        foreach ($this->parseTagLines($validated['focus_areas']) as $index => $label) {
            DB::table('community_group_focus_areas')->insert([
                'group_id' => $groupId,
                'label' => $label,
                'sort_order' => $index + 1,
            ]);
        }

        DB::table('community_group_invitations')->where('group_id', $groupId)->delete();

        $missingEmails = [];
        if ($validated['access_type'] === 'private') {
            [$matchedUsers, $missingEmails] = $this->resolveInvitationUsers($validated['invite_emails'] ?? '');
            $this->storeCommunityInvitations($groupId, $matchedUsers);
        }

        $status = $missingEmails === []
            ? 'Grupul a fost actualizat si retrimis pentru aprobare.'
            : 'Grupul a fost actualizat si retrimis pentru aprobare. Acest email nu face parte din baza noastra de date: '.implode(', ', $missingEmails);

        return redirect()
            ->route('psychologists.dashboard', ['section' => 'community'])
            ->with('status', $status);
    }

    public function editArticlePage(Request $request, int $articleId): Response|RedirectResponse
    {
        $psychologist = $this->requirePsychologistSession($request, true);

        if ($psychologist instanceof RedirectResponse) {
            return $psychologist;
        }

        $psychologistId = $psychologist->id;

        $article = DB::table('articles')
            ->where('id', $articleId)
            ->where('author', $psychologistId)
            ->first(['id', 'title', 'tag', 'body', 'hero_image', 'topic_id']);

        abort_unless($article, 404);

        return Inertia::render('Psychologists/Articles/Edit', [
            'topics' => $this->articleTopics(),
            'article' => [
                'id' => $article->id,
                'title' => $article->title,
                'tag' => $article->tag,
                'body' => $this->normalizeArticleEditorBody($article->body),
                'hero_image' => $article->hero_image,
                'topic_id' => $article->topic_id,
            ],
        ]);
    }

    public function storeArticle(Request $request): RedirectResponse
    {
        $psychologist = $this->requirePsychologistSession($request, true);

        if ($psychologist instanceof RedirectResponse) {
            return $psychologist;
        }

        $psychologistId = $psychologist->id;

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'tag' => ['required', 'string', 'max:120'],
            'topic_id' => ['required', 'integer', 'exists:article_topics,id'],
            'body' => ['required', 'string'],
            'hero_image' => ['required', 'image', 'max:5120'],
        ]);

        $imagePath = $request->file('hero_image')->store('article-images', 'public');
        $slug = $this->uniqueArticleSlug($validated['title']);
        $minutes = $this->estimateArticleReadingMinutes($validated['body']);

        $articleId = DB::table('articles')->insertGetId([
            'title' => $validated['title'],
            'slug' => $slug,
            'tag' => $validated['tag'],
            'minutes' => $minutes,
            'hero_image' => $this->articleImagePath($imagePath),
            'author' => $psychologistId,
            'body' => json_encode($validated['body']),
            'is_recommended' => true,
            'topic_id' => $validated['topic_id'],
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('articles_validation')->updateOrInsert(
            ['article_id' => $articleId],
            ['is_valid' => false, 'validated_at' => null]
        );

        return redirect()
            ->route('psychologists.dashboard', ['section' => 'articles'])
            ->with('status', 'Articolul a fost trimis în așteptarea aprobării superadminului.');
    }

    public function updateArticle(Request $request, int $articleId): RedirectResponse
    {
        $psychologist = $this->requirePsychologistSession($request, true);

        if ($psychologist instanceof RedirectResponse) {
            return $psychologist;
        }

        $psychologistId = $psychologist->id;

        $article = DB::table('articles')->where('id', $articleId)->where('author', $psychologistId)->first();
        abort_unless($article, 404);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'tag' => ['required', 'string', 'max:120'],
            'topic_id' => ['required', 'integer', 'exists:article_topics,id'],
            'body' => ['required', 'string'],
            'hero_image' => ['nullable', 'image', 'max:5120'],
        ]);

        $heroImageUrl = $article->hero_image;

        if ($request->hasFile('hero_image')) {
            $imagePath = $request->file('hero_image')->store('article-images', 'public');
            $heroImageUrl = $this->articleImagePath($imagePath);
        }

        DB::table('articles')->where('id', $articleId)->update([
            'title' => $validated['title'],
            'slug' => $this->uniqueArticleSlug($validated['title'], $articleId),
            'tag' => $validated['tag'],
            'minutes' => $this->estimateArticleReadingMinutes($validated['body']),
            'hero_image' => $heroImageUrl,
            'body' => json_encode($validated['body']),
            'is_recommended' => true,
            'topic_id' => $validated['topic_id'],
            'updated_at' => now(),
        ]);

        DB::table('articles_validation')->updateOrInsert(
            ['article_id' => $articleId],
            ['is_valid' => false, 'validated_at' => null]
        );

        return redirect()
            ->route('psychologists.articles.edit', ['articleId' => $articleId])
            ->with('status', 'Modificarile au fost salvate si retrimise pentru aprobare.');
    }

    public function destroyArticle(Request $request, int $articleId): RedirectResponse
    {
        $psychologist = $this->requirePsychologistSession($request, true);

        if ($psychologist instanceof RedirectResponse) {
            return $psychologist;
        }

        $psychologistId = $psychologist->id;

        $deleted = DB::table('articles')->where('id', $articleId)->where('author', $psychologistId)->delete();
        abort_unless($deleted, 404);

        return redirect()
            ->route('psychologists.dashboard', ['section' => 'articles'])
            ->with('status', 'Articolul a fost sters.');
    }

    public function destroyCommunityGroup(Request $request, int $groupId): RedirectResponse
    {
        $psychologist = $this->requirePsychologistSession($request, true);

        if ($psychologist instanceof RedirectResponse) {
            return $psychologist;
        }

        $psychologistId = $psychologist->id;

        $deleted = DB::table('community_groups')
            ->where('id', $groupId)
            ->where('author', $psychologistId)
            ->delete();
        abort_unless($deleted, 404);

        return redirect()
            ->route('psychologists.dashboard', ['section' => 'community'])
            ->with('status', 'Grupul a fost sters.');
    }

    protected function uniquePsychologistSlug(string $name, ?int $ignoreId = null): string
    {
        $base = Str::slug($name) ?: 'specialist';
        $slug = $base;
        $suffix = 2;

        while (DB::table('psychologists')
            ->where('slug', $slug)
            ->when($ignoreId, fn ($query) => $query->where('id', '!=', $ignoreId))
            ->exists()) {
            $slug = "{$base}-{$suffix}";
            $suffix += 1;
        }

        return $slug;
    }

    protected function uniqueArticleSlug(string $title, ?int $ignoreId = null): string
    {
        $base = Str::slug($title) ?: 'articol';
        $slug = $base;
        $suffix = 2;

        while (
            DB::table('articles')
                ->where('slug', $slug)
                ->when($ignoreId, fn ($query) => $query->where('id', '!=', $ignoreId))
                ->exists()
        ) {
            $slug = "{$base}-{$suffix}";
            $suffix++;
        }

        return $slug;
    }

    protected function articleTopics()
    {
        return DB::table('article_topics')->orderBy('name')->get(['id', 'name']);
    }

    protected function uniqueCommunityGroupSlug(string $title, ?int $ignoreId = null): string
    {
        $base = Str::slug($title) ?: 'grup';
        $slug = $base;
        $suffix = 2;

        while (DB::table('community_groups')
            ->where('slug', $slug)
            ->when($ignoreId, fn ($query) => $query->where('id', '!=', $ignoreId))
            ->exists()) {
            $slug = "{$base}-{$suffix}";
            $suffix++;
        }

        return $slug;
    }

    protected function parseTagLines(string $value): array
    {
        $items = preg_split('/[\r\n,]+/', $value) ?: [];

        return array_values(array_unique(array_filter(array_map(fn ($item) => trim($item), $items), fn ($item) => $item !== '')));
    }

    protected function resolveInvitationUsers(string $inviteEmails): array
    {
        $emails = array_values(array_unique(array_filter(array_map(
            fn ($item) => Str::lower(trim($item)),
            preg_split('/[\r\n,;]+/', $inviteEmails) ?: []
        ))));

        if ($emails === []) {
            return [collect(), []];
        }

        $matchedUsers = DB::table('users')
            ->whereIn(DB::raw('LOWER(email)'), $emails)
            ->get(['id', 'email']);

        $matchedEmails = $matchedUsers->map(fn ($user) => Str::lower($user->email))->all();
        $missingEmails = array_values(array_diff($emails, $matchedEmails));

        return [$matchedUsers, $missingEmails];
    }

    protected function storeCommunityInvitations(int $groupId, $matchedUsers): void
    {
        if ($matchedUsers->isEmpty()) {
            return;
        }

        NotificationTemplate::query()->updateOrCreate(
            ['key' => 'community_private_invite'],
            [
                'audience' => 'authenticated',
                'actor_type' => 'user',
                'category' => 'community',
                'title' => 'Invitatie in grup privat',
                'message' => 'Ai primit o invitatie intr-un grup privat din comunitatea Calming.',
                'default_title' => 'Invitatie in grup privat',
                'default_body' => 'Ai primit o invitatie intr-un grup privat din comunitatea Calming.',
                'icon' => 'FiUsers',
                'icon_color' => 'indigo',
                'accent' => 'indigo',
                'priority' => 4,
                'cta_kind' => 'open',
                'cta_label' => 'Vezi grupul',
                'deep_link' => '/community',
                'published_at' => now(),
                'sort_order' => 900,
            ]
        );

        $group = DB::table('community_groups')->where('id', $groupId)->first(['name', 'slug', 'author']);

        if (! $group) {
            return;
        }

        $groupUrl = url("/community/{$group->slug}");
        $facilitatorName = $this->psychologistDisplayName((int) ($group->author ?? 0));
        $notifications = app(NotificationService::class);

        foreach ($matchedUsers as $user) {
            DB::table('community_group_invitations')->updateOrInsert(
                ['group_id' => $groupId, 'user_id' => $user->id],
                ['email' => $user->email, 'invited_at' => now()]
            );

            $notifications->publishToUser($user->id, 'community_private_invite', [
                'title' => 'Invitatie noua',
                'body' => "Ai fost invitat in grupul privat {$group->name}.",
                'trigger_type' => 'community_invitation',
                'trigger_id' => (string) $groupId,
                'dedupe_key' => "community_invite:{$user->id}:{$groupId}",
                'cta_kind' => 'open',
                'cta_payload' => ['href' => "/community/{$group->slug}", 'label' => 'Vezi grupul'],
            ]);

            try {
                Mail::to($user->email)->send(new CommunityGroupInvitationMail(
                    groupName: $group->name,
                    groupUrl: $groupUrl,
                    facilitatorName: $facilitatorName,
                ));
            } catch (\Throwable $exception) {
                Log::warning('Failed to send community invitation email.', [
                    'group_id' => $groupId,
                    'user_id' => $user->id,
                    'email' => $user->email,
                    'error' => $exception->getMessage(),
                ]);
            }
        }
    }

    protected function psychologistDisplayName(int $psychologistId): string
    {
        $row = DB::table('psychologists')->where('id', $psychologistId)->first(['title', 'name', 'surname']);

        return trim(collect([$row?->title, $row?->name, $row?->surname])->filter()->implode(' ')) ?: 'Specialist Calming';
    }

    protected function normalizeArticleEditorBody(?string $body): string
    {
        if (! $body) {
            return '';
        }

        $decoded = json_decode($body, true);

        if (is_array($decoded)) {
            $items = array_values(array_filter($decoded, fn ($item) => is_string($item) && trim($item) !== ''));

            return $items === []
                ? ''
                : '<p>'.implode('</p><p>', array_map(fn ($item) => trim($item), $items)).'</p>';
        }

        if (is_string($decoded)) {
            return $decoded;
        }

        return $body;
    }

    protected function estimateArticleReadingMinutes(string $body): int
    {
        $text = trim(strip_tags($body));
        $wordCount = str_word_count($text);

        return max(1, min(240, (int) ceil($wordCount / 200)));
    }

    protected function articleImagePath(string $path): string
    {
        return '/storage/'.ltrim($path, '/');
    }

    public function updateValidation(Request $request): RedirectResponse
    {
        $psychologist = $this->requirePsychologistSession($request);

        if ($psychologist instanceof RedirectResponse) {
            return $psychologist;
        }

        $psychologistId = $psychologist->id;

        $catalog = PsychologistValidationCatalog::ensureDefaults();
        $roleIds = collect($catalog['roles'])->pluck('id')->all();
        $gradeIds = collect($catalog['grades'])->pluck('id')->all();
        $entityTypeIds = collect($catalog['entityTypes'])->pluck('id')->all();

        $validated = $request->validate([
            'intent' => ['nullable', Rule::in(['draft', 'submit'])],
            'entity_type_id' => ['nullable', Rule::in($entityTypeIds)],
            'supports_online' => ['nullable', 'boolean'],
            'city_mode' => ['nullable', Rule::in(['bucuresti', 'other'])],
            'city' => ['nullable', 'string', 'max:120'],
            'county' => ['nullable', 'string', 'max:120'],
            'sector' => ['nullable', 'string', 'max:30'],
            'address' => ['nullable', 'string', 'max:200'],
            'first_name' => ['required', 'string', 'max:80'],
            'last_name' => ['required', 'string', 'max:80'],
            'professional_email' => ['required', 'email', 'max:120'],
            'phone' => ['nullable', 'string', 'max:40'],
            'rupa_code' => ['nullable', 'string', 'max:10'],
            'competencies' => ['nullable', 'string'],
            'public_bio' => ['nullable', 'string'],
            'documents' => ['nullable', 'array'],
            'documents.*' => ['file', 'mimes:pdf,jpg,jpeg,png,webp', 'max:5120'],
            'attestations' => ['required', 'array', 'min:1'],
            'attestations.*.professional_role_id' => ['required', Rule::in($roleIds)],
            'attestations.*.professional_grade_id' => ['nullable', Rule::in($gradeIds)],
            'attestations.*.practice_regime' => ['nullable', Rule::in(['supervizare', 'autonom'])],
            'attestations.*.license_number' => ['nullable', 'string', 'max:60'],
            'attestations.*.license_issue_date' => ['nullable', 'date'],
            'attestations.*.license_expiry_date' => ['nullable', 'date'],
            'attestations.*.specialty_commission' => ['nullable', 'string', 'max:160'],
            'attestations.*.specialization' => ['required', 'string', 'max:150'],
        ], [
            'first_name.required' => 'Completeaza prenumele.',
            'last_name.required' => 'Completeaza numele.',
            'professional_email.required' => 'Completeaza emailul profesional.',
            'professional_email.email' => 'Emailul profesional nu este valid.',
            'phone.max' => 'Numarul de telefon este prea lung.',
            'rupa_code.max' => 'Codul RUPA este prea lung.',
            'city.max' => 'Localitatea este prea lunga.',
            'county.max' => 'Judetul este prea lung.',
            'sector.max' => 'Sectorul este prea lung.',
            'address.max' => 'Adresa este prea lunga.',
            'documents.*.file' => 'Unul dintre documente nu este valid.',
            'documents.*.mimes' => 'Documentele trebuie sa fie PDF, JPG, JPEG, PNG sau WEBP.',
            'documents.*.max' => 'Fiecare document poate avea maximum 5 MB.',
            'attestations.required' => 'Adaugă cel puțin un atestat.',
            'attestations.min' => 'Adaugă cel puțin un atestat.',
            'attestations.*.professional_role_id.required' => 'Selecteaza un rol profesional valid pentru fiecare atestat.',
            'attestations.*.professional_role_id.in' => 'Rolul profesional selectat pentru unul dintre atestate nu este valid.',
            'attestations.*.professional_grade_id.in' => 'Treapta de specializare selectata nu este valida.',
            'attestations.*.practice_regime.in' => 'Regimul de practica selectat nu este valid.',
            'attestations.*.license_number.max' => 'Numarul certificatului este prea lung.',
            'attestations.*.license_issue_date.date' => 'Data emiterii trebuie sa fie o data valida.',
            'attestations.*.license_expiry_date.date' => 'Data expirarii trebuie sa fie o data valida.',
            'attestations.*.specialty_commission.max' => 'Comisia de specialitate este prea lunga.',
            'attestations.*.specialization.required' => 'Completeaza campul Specializare pentru fiecare atestat.',
            'attestations.*.specialization.max' => 'Campul Specializare este prea lung.',
        ]);

        $intent = $validated['intent'] ?? 'draft';

        DB::transaction(function () use ($psychologistId, $validated, $intent) {
            DB::table('psychologists')
                ->where('id', $psychologistId)
                ->update([
                    'name' => $validated['first_name'],
                    'surname' => $validated['last_name'],
                    'email' => $validated['professional_email'],
                    'phone' => $validated['phone'] ?? null,
                    'rupa_code' => $validated['rupa_code'] ?? null,
                    'supports_online' => (bool) ($validated['supports_online'] ?? false),
                ]);

            $applicationId = DB::table('psychologist_validation_applications')
                ->where('psychologist_id', $psychologistId)
                ->value('id');

            if (! $applicationId) {
                $applicationId = DB::table('psychologist_validation_applications')->insertGetId([
                    'psychologist_id' => $psychologistId,
                    'entity_type_id' => $validated['entity_type_id'] ?? null,
                    'status' => $intent === 'submit' ? 'submitted' : 'draft',
                    'submitted_at' => $intent === 'submit' ? now() : null,
                    'reviewer_notes' => null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            } else {
                DB::table('psychologist_validation_applications')
                    ->where('id', $applicationId)
                    ->update([
                        'entity_type_id' => $validated['entity_type_id'] ?? null,
                        'status' => $intent === 'submit'
                            ? 'submitted'
                            : DB::raw("CASE WHEN status = 'approved' THEN 'approved' ELSE 'draft' END"),
                        'submitted_at' => $intent === 'submit' ? now() : DB::raw('submitted_at'),
                        'reviewer_notes' => $intent === 'submit' ? null : DB::raw('reviewer_notes'),
                        'updated_at' => now(),
                    ]);
            }

            DB::table('psychologist_validation_locations')->updateOrInsert(
                ['application_id' => $applicationId],
                [
                    'supports_online' => (bool) ($validated['supports_online'] ?? false),
                    'city_mode' => $validated['city_mode'] ?? 'other',
                    'city' => $validated['city'] ?? null,
                    'county' => $validated['county'] ?? null,
                    'sector' => $validated['sector'] ?? null,
                    'updated_at' => now(),
                    'created_at' => now(),
                ]
            );

            DB::table('psychologists_address')->updateOrInsert(
                ['psychologist_id' => $psychologistId],
                [
                    'address' => $validated['address'] ?? null,
                    'city' => $validated['city'] ?? null,
                    'county' => ($validated['city_mode'] ?? 'other') === 'bucuresti'
                        ? ($validated['sector'] ?? null)
                        : ($validated['county'] ?? null),
                ]
            );

            $existingSpecialistIds = DB::table('psychologist_validation_specialists')
                ->where('application_id', $applicationId)
                ->pluck('id')
                ->all();

            foreach ($existingSpecialistIds as $specialistId) {
                DB::table('psychologist_validation_specialist_specializations')->where('specialist_id', $specialistId)->delete();
            }

            DB::table('psychologist_validation_specialists')->where('application_id', $applicationId)->delete();

            $primaryAttestation = $validated['attestations'][0];
            $syncSpecialties = [];

            foreach (array_values($validated['attestations']) as $index => $attestation) {
                $gradeCode = DB::table('professional_grades')->where('id', $attestation['professional_grade_id'])->value('code');
                $practiceRegime = in_array($gradeCode, ['specialist', 'principal'], true)
                    ? 'autonom'
                    : ($attestation['practice_regime'] ?? 'supervizare');

                $specialistId = DB::table('psychologist_validation_specialists')->insertGetId([
                    'application_id' => $applicationId,
                    'is_primary' => $index === 0,
                    'title' => null,
                    'first_name' => $validated['first_name'],
                    'last_name' => $validated['last_name'],
                    'professional_role_id' => $attestation['professional_role_id'],
                    'professional_email' => $validated['professional_email'],
                    'professional_phone' => null,
                    'cpr_code' => $validated['rupa_code'] ?? null,
                    'license_number' => $attestation['license_number'] ?? null,
                    'license_issue_date' => $attestation['license_issue_date'] ?? null,
                    'license_expiry_date' => $attestation['license_expiry_date'] ?? null,
                    'professional_grade_id' => $attestation['professional_grade_id'] ?? null,
                    'practice_regime' => $practiceRegime,
                    'specialty_commission' => $attestation['specialty_commission'] ?? null,
                    'medical_authorization_number' => null,
                    'clinical_competencies' => $validated['competencies'] ?? null,
                    'description' => $validated['public_bio'] ?? null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                $normalizedLabel = trim((string) $attestation['specialization']);
                $syncSpecialties[$normalizedLabel] = true;
                DB::table('psychologist_validation_specialist_specializations')->insert([
                    'specialist_id' => $specialistId,
                    'label' => $normalizedLabel,
                ]);
            }

            DB::table('psychologist_specialties')->where('psychologist_id', $psychologistId)->delete();
            foreach (array_keys($syncSpecialties) as $label) {
                DB::table('psychologist_specialties')->insert([
                    'psychologist_id' => $psychologistId,
                    'label' => $label,
                ]);
            }

            $gradeLabel = null;
            if (! empty($primaryAttestation['professional_grade_id'])) {
                $gradeLabel = DB::table('professional_grades')->where('id', $primaryAttestation['professional_grade_id'])->value('code');
            }

            DB::table('psychologist_individual_profiles')->updateOrInsert(
                ['psychologist_id' => $psychologistId],
                [
                    'profession' => DB::table('professional_roles')->where('id', $primaryAttestation['professional_role_id'])->value('label'),
                    'cpr_code' => $validated['rupa_code'] ?? null,
                    'professional_grade' => $gradeLabel,
                    'license_number' => $primaryAttestation['license_number'] ?? null,
                    'license_issue_date' => $primaryAttestation['license_issue_date'] ?? null,
                    'license_expiry_date' => $primaryAttestation['license_expiry_date'] ?? null,
                    'medical_authorization_number' => null,
                    'clinical_competencies' => $validated['competencies'] ?? null,
                    'public_bio' => $validated['public_bio'] ?? null,
                ]
            );

            if ($requestFiles = request()->file('documents', [])) {
                foreach ($requestFiles as $file) {
                    if (! $file) {
                        continue;
                    }

                    $path = $file->store('psychologist-validation-documents', 'public');

                    DB::table('psychologist_validation_documents')->insert([
                        'application_id' => $applicationId,
                        'disk' => 'public',
                        'path' => $path,
                        'original_name' => $file->getClientOriginalName(),
                        'mime_type' => $file->getClientMimeType(),
                        'size' => $file->getSize(),
                        'created_at' => now(),
                    ]);
                }
            }
        });

        return redirect()
            ->route('psychologists.dashboard', ['section' => 'validation'])
            ->with('status', $intent === 'submit'
                ? 'Cererea de validare a fost trimisa catre superadmin.'
                : 'Datele pentru validare au fost salvate ca draft.');
    }

    public function destroyValidationMessage(Request $request, int $messageId): RedirectResponse
    {
        $psychologist = $this->requirePsychologistSession($request);

        if ($psychologist instanceof RedirectResponse) {
            return $psychologist;
        }

        $applicationId = DB::table('psychologist_validation_applications')
            ->where('psychologist_id', $psychologist->id)
            ->value('id');

        abort_unless($applicationId, 404);

        $deleted = DB::table('psychologist_validation_messages')
            ->where('id', $messageId)
            ->where('application_id', $applicationId)
            ->delete();

        abort_unless($deleted, 404);

        return redirect()
            ->route('psychologists.dashboard', ['section' => 'validation'])
            ->with('status', 'Mesajul a fost sters.');
    }

    protected function requirePsychologistSession(Request $request, bool $requireApproved = false): mixed
    {
        $psychologist = Auth::guard('psychologist')->user();
        $mfaConfirmedAt = $request->session()->get('psychologist_mfa_confirmed_at');

        if (! $psychologist || ! $mfaConfirmedAt || now()->diffInHours($mfaConfirmedAt) >= 12) {
            Auth::guard('psychologist')->logout();
            $request->session()->forget([
                'psychologist_mfa_confirmed_at',
                'pending_psychologist_id',
                'pending_psychologist_mfa_purpose',
                'pending_psychologist_intended_url',
            ]);

            return redirect()->route('psychologists.signin')->with('status', 'Sesiunea specialistului a expirat. Autentifica-te din nou.');
        }

        if ($requireApproved) {
            $status = DB::table('psychologist_validation_applications')
                ->where('psychologist_id', $psychologist->id)
                ->value('status');

            if ($status !== 'approved') {
                return redirect()
                    ->route('psychologists.dashboard', ['section' => 'validation'])
                    ->with('status', 'Articolele și grupurile pot fi gestionate doar după aprobarea validării profesionale.');
            }
        }

        return $psychologist;
    }

    protected function sendPsychologistVerificationEmail(object $psychologist): bool
    {
        try {
            [$verificationId, $token] = $this->issueVerificationToken($psychologist->id);

            Mail::mailer(config('mail.default', 'failover'))->to($psychologist->email)->send(new PsychologistEmailVerificationMail(
                firstName: $psychologist->name ?? 'specialist',
                verificationUrl: route('psychologists.verify-email', ['verificationId' => $verificationId, 'token' => $token]),
            ));

            return true;
        } catch (\Throwable $exception) {
            Log::error('Psychologist verification email failed', [
                'psychologist_id' => $psychologist->id ?? null,
                'error' => $exception->getMessage(),
            ]);

            return false;
        }
    }

    protected function issueVerificationToken(int $psychologistId): array
    {
        DB::table('psychologist_email_verifications')
            ->where('psychologist_id', $psychologistId)
            ->whereNull('consumed_at')
            ->update(['consumed_at' => now()]);

        $token = Str::random(64);

        $verificationId = DB::table('psychologist_email_verifications')->insertGetId([
            'psychologist_id' => $psychologistId,
            'token_hash' => Hash::make($token),
            'expires_at' => now()->addDay(),
            'created_at' => now(),
        ]);

        return [$verificationId, $token];
    }

    protected function issueMfaChallenge(object $psychologist, string $purpose): bool
    {
        try {
            DB::table('psychologist_mfa_challenges')
                ->where('psychologist_id', $psychologist->id)
                ->where('purpose', $purpose)
                ->whereNull('consumed_at')
                ->update(['consumed_at' => now()]);

            $code = (string) random_int(100000, 999999);

            DB::table('psychologist_mfa_challenges')->insert([
                'psychologist_id' => $psychologist->id,
                'purpose' => $purpose,
                'code_hash' => Hash::make($code),
                'expires_at' => now()->addMinutes(10),
                'created_at' => now(),
            ]);

            Mail::mailer(config('mail.default', 'failover'))->to($psychologist->email)->send(new PsychologistMfaCodeMail(
                firstName: $psychologist->name ?? 'specialist',
                code: $code,
                purpose: $purpose,
            ));

            return true;
        } catch (\Throwable $exception) {
            Log::error('Psychologist MFA challenge failed', [
                'psychologist_id' => $psychologist->id ?? null,
                'purpose' => $purpose,
                'error' => $exception->getMessage(),
            ]);

            return false;
        }
    }

    protected function maskEmail(string $email): string
    {
        [$local, $domain] = array_pad(explode('@', $email, 2), 2, '');
        $localMask = strlen($local) <= 2 ? str_repeat('*', max(1, strlen($local))) : substr($local, 0, 2).str_repeat('*', max(1, strlen($local) - 2));

        return $localMask.'@'.$domain;
    }

    protected function communityMessageDateTime(?string $stamp, ?string $time): ?Carbon
    {
        if (! $stamp || ! preg_match('/^[^,]+,\s+(\d{1,2})\s+([[:alpha:]]+)\s+(\d{4})$/u', $stamp, $matches)) {
            return null;
        }

        $months = [
            'ianuarie' => 1,
            'februarie' => 2,
            'martie' => 3,
            'aprilie' => 4,
            'mai' => 5,
            'iunie' => 6,
            'iulie' => 7,
            'august' => 8,
            'septembrie' => 9,
            'octombrie' => 10,
            'noiembrie' => 11,
            'decembrie' => 12,
        ];

        $month = $months[mb_strtolower($matches[2])] ?? null;
        if (! $month) {
            return null;
        }

        [$hours, $minutes] = array_pad(explode(':', $time ?: '00:00', 2), 2, '00');

        return Carbon::create(
            (int) $matches[3],
            $month,
            (int) $matches[1],
            (int) $hours,
            (int) $minutes,
            0
        );
    }

    protected function communityExactElapsedLabel(?Carbon $lastMessageAt): string
    {
        if (! $lastMessageAt) {
            return 'fără mesaje';
        }

        $now = now();
        if ($lastMessageAt->greaterThan($now)) {
            return '0 minute';
        }

        $diff = $lastMessageAt->diff($now);
        $parts = [];

        if ($diff->days > 0) {
            $parts[] = $diff->days.' '.$this->communityPluralize($diff->days, 'zi', 'zile');
        }
        if ($diff->h > 0) {
            $parts[] = $diff->h.' '.$this->communityPluralize($diff->h, 'ora', 'ore');
        }
        if ($diff->i > 0) {
            $parts[] = $diff->i.' '.$this->communityPluralize($diff->i, 'minut', 'minute');
        }

        return $parts !== [] ? implode(' ', $parts) : '0 minute';
    }

    protected function communityPluralize(int $count, string $singular, string $plural): string
    {
        return $count === 1 ? $singular : $plural;
    }
}

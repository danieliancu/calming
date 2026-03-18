<?php

namespace App\Support;

use Illuminate\Support\Facades\DB;

class PsychologistValidationCatalog
{
    public static function ensureDefaults(): array
    {
        $entityTypes = [
            ['code' => 'individual', 'label' => 'Practica individuala'],
            ['code' => 'organization', 'label' => 'Organizatie / clinica'],
        ];

        $roles = [
            ['code' => 'psihologie_clinica', 'label' => 'Psihologie Clinica', 'requires_cpr' => true, 'requires_med_authorization' => false],
            ['code' => 'psihoterapie', 'label' => 'Psihoterapie', 'requires_cpr' => true, 'requires_med_authorization' => false],
            ['code' => 'psihologia_muncii', 'label' => 'Psihologia Muncii', 'requires_cpr' => true, 'requires_med_authorization' => false],
            ['code' => 'psihologie_educationala', 'label' => 'Psihologie Educationala', 'requires_cpr' => true, 'requires_med_authorization' => false],
            ['code' => 'psihologie_securitate_nationala', 'label' => 'Psihologie Aplicata in Securitate Nationala', 'requires_cpr' => true, 'requires_med_authorization' => false],
            ['code' => 'alta_specializare', 'label' => 'Alta specializare', 'requires_cpr' => true, 'requires_med_authorization' => false],
        ];

        $grades = [
            ['code' => 'practicant', 'label' => 'Practicant', 'sort_order' => 10],
            ['code' => 'specialist', 'label' => 'Specialist', 'sort_order' => 20],
            ['code' => 'principal', 'label' => 'Principal', 'sort_order' => 30],
        ];

        foreach ($entityTypes as $row) {
            DB::table('validation_entity_types')->updateOrInsert(['code' => $row['code']], $row);
        }

        foreach ($roles as $row) {
            DB::table('professional_roles')->updateOrInsert(['code' => $row['code']], $row + ['created_at' => now()]);
        }

        foreach ($grades as $row) {
            DB::table('professional_grades')->updateOrInsert(['code' => $row['code']], $row + ['created_at' => now()]);
        }

        $allowedGradeCodes = array_column($grades, 'code');

        return [
            'entityTypes' => DB::table('validation_entity_types')->orderBy('id')->get(['id', 'code', 'label'])->map(fn ($item) => (array) $item)->all(),
            'roles' => DB::table('professional_roles')->orderBy('id')->get(['id', 'code', 'label', 'requires_cpr', 'requires_med_authorization'])->map(fn ($item) => (array) $item)->all(),
            'grades' => DB::table('professional_grades')
                ->whereIn('code', $allowedGradeCodes)
                ->orderBy('sort_order')
                ->get(['id', 'code', 'label', 'sort_order'])
                ->map(fn ($item) => (array) $item)
                ->all(),
        ];
    }
}

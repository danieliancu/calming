<?php

namespace App\Support;

use Illuminate\Database\Query\Builder;
use Illuminate\Support\Facades\Schema;

class CommunityVisibilityService
{
    public function applyVisibleToPublicScope(Builder $query, ?int $activePsychologistId = null, ?int $activeSuperadminId = null): Builder
    {
        if (! Schema::hasTable('community_groups_validation')) {
            return $query;
        }

        return $query
            ->leftJoin('community_groups_validation as cgv', 'cgv.group_id', '=', 'community_groups.id')
            ->where(function ($nested) use ($activePsychologistId) {
                $nested->where('cgv.is_valid', true);

                if ($activePsychologistId > 0) {
                    $nested->orWhere('community_groups.author', $activePsychologistId);
                }

                if ($activeSuperadminId > 0) {
                    $nested->orWhere('community_groups.fallback_superadmin_id', $activeSuperadminId);
                }
            });
    }

    public function applyPendingReviewScope(Builder $query, string $groupAlias = 'community_groups'): Builder
    {
        if (! Schema::hasTable('community_groups_validation')) {
            return $query;
        }

        return $query
            ->leftJoin('community_groups_validation as cgv', 'cgv.group_id', '=', "{$groupAlias}.id")
            ->where(function ($nested) {
                $nested->whereNull('cgv.group_id')
                    ->orWhere('cgv.is_valid', false);
            });
    }

    public function isVisibleToViewer(object $group, ?int $activePsychologistId = null, ?int $activeSuperadminId = null): bool
    {
        if (! Schema::hasTable('community_groups_validation')) {
            return true;
        }

        if (($group->validation_is_valid ?? null) === null) {
            return true;
        }

        if ((bool) $group->validation_is_valid) {
            return true;
        }

        if ($activePsychologistId > 0 && $activePsychologistId === (int) ($group->author ?? 0)) {
            return true;
        }

        return $activeSuperadminId > 0 && $activeSuperadminId === (int) ($group->fallback_superadmin_id ?? 0);
    }
}

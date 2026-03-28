<?php

namespace App\Support;

use App\Models\Notification;
use App\Models\NotificationTemplate;
use Carbon\CarbonInterval;
use Carbon\CarbonInterface;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class NotificationService
{
    public function publishToUser(int $userId, string $templateKey, array $overrides = []): ?Notification
    {
        if (! $this->notificationsEnabledForUser($userId)) {
            return null;
        }

        $template = NotificationTemplate::query()->where('key', $templateKey)->where('is_active', true)->first();

        return $this->publish([
            'recipient_type' => 'user',
            'user_id' => $userId,
        ], $template, $overrides);
    }

    public function publishBroadcast(string $templateKey, array $overrides = []): ?Notification
    {
        $template = NotificationTemplate::query()->where('key', $templateKey)->where('is_active', true)->first();

        return $this->publish([
            'recipient_type' => 'guest',
            'guest_token' => null,
        ], $template, $overrides);
    }

    public function publish(array $recipient, ?NotificationTemplate $template = null, array $overrides = []): ?Notification
    {
        $payload = [
            'recipient_type' => $recipient['recipient_type'] ?? 'user',
            'user_id' => $recipient['user_id'] ?? null,
            'guest_token' => $recipient['guest_token'] ?? null,
            'template_id' => $template?->id,
            'category' => $overrides['category'] ?? $template?->category ?? 'product',
            'title' => $overrides['title'] ?? $template?->default_title ?? $template?->title,
            'body' => $overrides['body'] ?? $overrides['message'] ?? $template?->default_body ?? $template?->message,
            'icon' => $overrides['icon'] ?? $template?->icon ?? 'FiBell',
            'icon_color' => $overrides['icon_color'] ?? $overrides['accent'] ?? $template?->icon_color ?? $template?->accent ?? 'peach',
            'priority' => (int) ($overrides['priority'] ?? $template?->priority ?? 3),
            'status' => $overrides['status'] ?? 'unread',
            'segment' => $overrides['segment'] ?? null,
            'trigger_type' => $overrides['trigger_type'] ?? null,
            'trigger_id' => isset($overrides['trigger_id']) ? (string) $overrides['trigger_id'] : null,
            'cta_kind' => $overrides['cta_kind'] ?? $template?->cta_kind,
            'cta_payload' => $overrides['cta_payload'] ?? $this->defaultCtaPayload($template),
            'published_at' => $overrides['published_at'] ?? now(),
            'read_at' => $overrides['read_at'] ?? null,
            'consumed_at' => $overrides['consumed_at'] ?? null,
            'expires_at' => $overrides['expires_at'] ?? null,
            'dedupe_key' => $overrides['dedupe_key'] ?? null,
            'meta' => $overrides['meta'] ?? null,
        ];

        if (! $payload['title'] || ! $payload['body']) {
            return null;
        }

        if ($payload['dedupe_key']) {
            $existing = Notification::query()
                ->where('dedupe_key', $payload['dedupe_key'])
                ->when($payload['user_id'], fn ($query) => $query->where('user_id', $payload['user_id']))
                ->when($payload['recipient_type'] === 'guest' && ! $payload['user_id'], fn ($query) => $query->where('recipient_type', 'guest'))
                ->latest('published_at')
                ->latest('id')
                ->first();

            if ($existing && ! ($template?->is_repeatable ?? false)) {
                return $existing;
            }

            if ($existing && ($template?->is_repeatable ?? false) && ! $this->cooldownExpired($existing, $template, $payload)) {
                return $existing;
            }
        }

        return Notification::query()->create($payload);
    }

    public function feedFor(?int $userId = null): Collection
    {
        if ($userId && ! $this->notificationsEnabledForUser($userId)) {
            return collect();
        }

        $public = Notification::query()
            ->where('recipient_type', 'guest')
            ->whereNull('guest_token')
            ->where(fn ($query) => $query->whereNull('expires_at')->orWhere('expires_at', '>', now()))
            ->orderByDesc('published_at')
            ->get();

        $personal = $userId
            ? Notification::query()
                ->where('recipient_type', 'user')
                ->where('user_id', $userId)
                ->where(fn ($query) => $query->whereNull('expires_at')->orWhere('expires_at', '>', now()))
                ->orderByDesc('published_at')
                ->get()
            : collect();

        return $public
            ->concat($personal)
            ->sortByDesc(fn (Notification $notification) => optional($notification->published_at)->getTimestamp() ?? 0)
            ->values();
    }

    public function serializeFeed(Collection $notifications, array $readIds = []): array
    {
        $now = now();

        return $notifications->map(function (Notification $notification) use ($readIds, $now): array {
            $publishedAt = $notification->published_at ?? $notification->created_at ?? now();
            $isRead = in_array($notification->id, $readIds, true) || $notification->status === 'read' || ! is_null($notification->read_at);

            return [
                'id' => $notification->id,
                'title' => $notification->title,
                'body' => $notification->body,
                'message' => $notification->body,
                'icon' => $notification->icon ?: 'FiBell',
                'icon_color' => $notification->icon_color ?: 'peach',
                'accent' => $notification->icon_color ?: 'peach',
                'category' => $notification->category ?: 'product',
                'priority' => $notification->priority,
                'published_at' => $publishedAt?->toAtomString(),
                'created_at' => $publishedAt?->toAtomString(),
                'relative_time' => $this->relativeTime($publishedAt, $now),
                'is_new' => ! $isRead && $publishedAt && $publishedAt->greaterThanOrEqualTo($now->copy()->subHours(12)),
                'is_read' => $isRead,
                'cta' => $this->serializeCta($notification),
            ];
        })->all();
    }

    public function unreadCountFor(?int $userId = null): int
    {
        if ($userId && ! $this->notificationsEnabledForUser($userId)) {
            return 0;
        }

        $publicCount = Notification::query()
            ->where('recipient_type', 'guest')
            ->whereNull('guest_token')
            ->where('published_at', '>=', now()->subHours(12))
            ->where(function ($query) {
                $query->where('status', '!=', 'read')->orWhereNull('status');
            })
            ->count();

        if (! $userId) {
            return $publicCount;
        }

        $personalCount = Notification::query()
            ->where('recipient_type', 'user')
            ->where('user_id', $userId)
            ->where('published_at', '>=', now()->subHours(12))
            ->where(function ($query) {
                $query->where('status', '!=', 'read')->orWhereNull('status');
            })
            ->count();

        return $publicCount + $personalCount;
    }

    public function markRead(int $notificationId, ?int $userId = null): void
    {
        Notification::query()
            ->where('id', $notificationId)
            ->when($userId, fn ($query) => $query->where(function ($inner) use ($userId) {
                $inner->where('user_id', $userId)->orWhere('recipient_type', 'guest');
            }), fn ($query) => $query->where('recipient_type', 'guest'))
            ->update([
                'status' => 'read',
                'read_at' => now(),
                'updated_at' => now(),
            ]);
    }

    public function markUnread(int $notificationId, ?int $userId = null): void
    {
        Notification::query()
            ->where('id', $notificationId)
            ->when($userId, fn ($query) => $query->where(function ($inner) use ($userId) {
                $inner->where('user_id', $userId)->orWhere('recipient_type', 'guest');
            }), fn ($query) => $query->where('recipient_type', 'guest'))
            ->update([
                'status' => 'unread',
                'read_at' => null,
                'updated_at' => now(),
            ]);
    }

    public function markAllReadForUser(int $userId): void
    {
        Notification::query()
            ->where('recipient_type', 'user')
            ->where('user_id', $userId)
            ->where('status', '!=', 'read')
            ->update([
                'status' => 'read',
                'read_at' => now(),
                'updated_at' => now(),
            ]);
    }

    protected function defaultCtaPayload(?NotificationTemplate $template): ?array
    {
        if (! $template?->deep_link) {
            return null;
        }

        return [
            'href' => $template->deep_link,
            'label' => $template->cta_label,
        ];
    }

    protected function serializeCta(Notification $notification): ?array
    {
        $payload = $notification->cta_payload;

        if (is_string($payload)) {
            $payload = json_decode($payload, true);
        }

        if (! is_array($payload) && ! $notification->cta_kind) {
            return null;
        }

        return [
            'kind' => $notification->cta_kind,
            'label' => $payload['label'] ?? null,
            'href' => $payload['href'] ?? null,
            'article_id' => $payload['article_id'] ?? null,
            'frequency' => $payload['frequency'] ?? null,
        ];
    }

    protected function notificationsEnabledForUser(int $userId): bool
    {
        return (bool) (DB::table('users')->where('id', $userId)->value('notifications_enabled') ?? true);
    }

    protected function relativeTime(CarbonInterface $date, CarbonInterface $now): string
    {
        $diffMinutes = (int) floor($date->diffInMinutes($now));

        if ($diffMinutes <= 0) {
            return 'Acum';
        }

        if ($diffMinutes < 60) {
            return 'Acum '.$diffMinutes.' minute';
        }

        $diffHours = (int) floor($date->diffInHours($now));

        if ($diffHours < 24) {
            return 'Acum '.$diffHours.' ore';
        }

        if ($diffHours < 48) {
            return 'Ieri';
        }

        $diffDays = (int) floor($date->diffInDays($now));

        if ($diffDays < 7) {
            return 'Acum '.$diffDays.' zile';
        }

        return 'Acum '.max(1, (int) floor($diffDays / 7)).' saptamani';
    }

    protected function cooldownExpired(Notification $existing, ?NotificationTemplate $template, array $payload): bool
    {
        $cooldown = $this->cooldownFor($template, $payload);

        if (! $cooldown) {
            return true;
        }

        $anchor = $existing->read_at ?? $existing->published_at ?? $existing->created_at;

        if (! $anchor) {
            return true;
        }

        return $anchor->copy()->add($cooldown)->lessThanOrEqualTo(now());
    }

    protected function cooldownFor(?NotificationTemplate $template, array $payload): ?CarbonInterval
    {
        if (! ($template?->is_repeatable ?? false)) {
            return null;
        }

        $key = (string) ($template?->key ?? '');
        $category = (string) ($payload['category'] ?? $template?->category ?? '');
        $triggerType = (string) ($payload['trigger_type'] ?? '');

        if (str_contains($key, 'article_reminder')) {
            return CarbonInterval::days(30);
        }

        if (str_contains($key, 'appointment_reminder') || str_contains($triggerType, 'appointment_reminder')) {
            return CarbonInterval::hours(2);
        }

        if (str_contains($key, 'community') || $category === 'community') {
            return CarbonInterval::hours(12);
        }

        if (str_contains($key, 'assistant') || $category === 'assistant') {
            return CarbonInterval::hours(24);
        }

        if ($category === 'stats' || $category === 'product') {
            return CarbonInterval::days(7);
        }

        if ($category === 'article') {
            return CarbonInterval::days(7);
        }

        return CarbonInterval::hours(24);
    }
}

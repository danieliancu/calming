<!DOCTYPE html>
<html lang="ro">
<head>
    <meta charset="utf-8">
    <title>{{ $subjectLine }}</title>
</head>
<body style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6; background: #f8fafc; margin: 0; padding: 24px;">
    <div style="max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 24px; border: 1px solid #e5e7eb;">
        <h1 style="margin-top: 0; font-size: 24px;">{{ $headline }}</h1>
        <p style="white-space: pre-line;">{{ $body }}</p>

        @if ($actionUrl && $actionLabel)
            <p style="margin-top: 24px;">
                <a href="{{ $actionUrl }}" style="display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 18px; border-radius: 10px;">
                    {{ $actionLabel }}
                </a>
            </p>
        @endif

        <p style="margin-top: 24px; font-size: 13px; color: #6b7280;">
            {{ config('app.name') }}
        </p>
    </div>
</body>
</html>

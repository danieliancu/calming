<!DOCTYPE html>
<html lang="ro">
<head>
    <meta charset="utf-8">
    <title>{{ $subjectLine }}</title>
</head>
<body style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.6; background: #f8fafc; margin: 0; padding: 24px;">
    <div style="max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 24px; border: 1px solid #e5e7eb;">
        <p style="margin-top: 0;">Buna, {{ $firstName }}!</p>
        <p>{{ $introLine }}</p>

        <div style="margin: 20px 0; padding: 16px; border-radius: 12px; background: #fff7ed; border: 1px solid #fdba74; white-space: pre-line;">
            {{ $messageBody }}
        </div>

        @if ($dashboardUrl)
            <p style="margin-top: 24px;">
            <p style="margin-top: 24px;">
                <a href="{{ $dashboardUrl }}" style="display: inline-block; padding: 10px 16px; background: #2f6db3; color: #ffffff; text-decoration: none; border-radius: 8px;">
                    Deschide dashboard-ul
                </a>
            </p>
            <p style="font-size: 13px; color: #64748b;">Daca butonul nu functioneaza, deschide acest link: <a href="{{ $dashboardUrl }}">{{ $dashboardUrl }}</a></p>
        @endif

        <p style="margin-bottom: 0;">Echipa Calming</p>
    </div>
</body>
</html>

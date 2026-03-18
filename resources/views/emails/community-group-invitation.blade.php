<!DOCTYPE html>
<html lang="ro">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invitatie grup privat</title>
</head>
<body style="margin:0;padding:24px;background:#f4f7fb;font-family:Arial,sans-serif;color:#0f172a;">
    <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:18px;padding:32px;box-shadow:0 18px 40px rgba(15,23,42,0.08);">
        <div style="font-size:14px;line-height:1.5;color:#64748b;">Calming</div>
        <h1 style="margin:12px 0 16px;font-size:26px;line-height:1.2;">Ai primit o invitație într-un grup privat</h1>
        <p style="margin:0 0 16px;font-size:16px;line-height:1.7;">
            <strong>{{ $facilitatorName }}</strong> te-a invitat în grupul privat <strong>{{ $groupName }}</strong> din comunitatea Calming.
        </p>
        <p style="margin:0 0 24px;font-size:16px;line-height:1.7;">
            Poți accesa grupul și conversațiile lui din contul tău Calming.
        </p>
        <a href="{{ $groupUrl }}" style="display:inline-block;padding:12px 20px;border-radius:999px;background:#2563eb;color:#ffffff;text-decoration:none;font-weight:700;">
            Deschide grupul
        </a>
        <p style="margin:24px 0 0;font-size:14px;line-height:1.6;color:#64748b;">
            Dacă nu recunoști această invitație, o poți ignora.
        </p>
    </div>
</body>
</html>

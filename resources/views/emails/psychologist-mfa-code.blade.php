<!DOCTYPE html>
<html lang="ro">
<head>
    <meta charset="utf-8">
    <title>Cod MFA specialist</title>
</head>
<body style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.6;">
    <p>Buna, {{ $firstName }}!</p>
    <p>
        Codul tau de confirmare pentru
        {{ $purpose === 'login' ? 'autentificare' : 'confirmarea accesului' }}
        este:
    </p>
    <p style="font-size: 28px; font-weight: 700; letter-spacing: 6px;">{{ $code }}</p>
    <p>Codul expira in 10 minute si poate fi folosit o singura data.</p>
</body>
</html>

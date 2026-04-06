<!DOCTYPE html>
<html lang="ro">
<head>
    <meta charset="utf-8">
    <title>Cod Multi-Factor Authentication specialist</title>
</head>
<body style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.6;">
    <p>Buna, {{ $firstName }}!</p>
    <p>
        Codul tău de confirmare pentru
        {{ $purpose === 'login' ? 'autentificare' : 'confirmarea accesului' }}
        este:
    </p>
    <p style="font-size: 28px; font-weight: 700; letter-spacing: 6px;">{{ $code }}</p>
    <p>Codul expiră în 10 minute și poate fi folosit o singură dată.</p>
</body>
</html>

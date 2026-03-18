<!DOCTYPE html>
<html lang="ro">
<head>
    <meta charset="utf-8">
    <title>Verificare email specialist</title>
</head>
<body style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.6;">
    <p>Buna, {{ $firstName }}!</p>
    <p>Confirma adresa de email pentru contul tau de specialist Calming, apoi te vei putea autentifica in dashboard.</p>
    <p>
        <a href="{{ $verificationUrl }}" style="display: inline-block; padding: 10px 16px; background: #2f6db3; color: #ffffff; text-decoration: none; border-radius: 8px;">
            Confirma emailul
        </a>
    </p>
    <p>Daca butonul nu functioneaza, poti deschide direct acest link:</p>
    <p><a href="{{ $verificationUrl }}">{{ $verificationUrl }}</a></p>
    <p>Linkul expira in 24 de ore.</p>
</body>
</html>

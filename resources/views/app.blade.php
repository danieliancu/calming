<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">
        <meta name="description" content="Îndrumare confidențială pentru echilibrul tău. Explorează articole, instrumente și resurse pentru stare de bine emoțională.">
        <meta property="og:title" content="{{ config('app.name', 'Îndrumare confidențială pentru echilibrul tău') }}">
        <meta property="og:description" content="Îndrumare confidențială pentru echilibrul tău. Explorează articole, instrumente și resurse pentru stare de bine emoțională.">
        <meta property="og:type" content="website">
        <meta property="og:site_name" content="Calming">
        <meta property="og:locale" content="ro_RO">
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:title" content="{{ config('app.name', 'Îndrumare confidențială pentru echilibrul tău') }}">
        <meta name="twitter:description" content="Îndrumare confidențială pentru echilibrul tău. Explorează articole, instrumente și resurse pentru stare de bine emoțională.">

        <title inertia>{{ config('app.name', 'Îndrumare confidențială pentru echilibrul tău') }}</title>

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=source-sans-3:400,500,600,700&display=swap" rel="stylesheet" />

        <!-- Scripts -->
        @routes
        @viteReactRefresh
        @vite(['resources/js/app.jsx', "resources/js/Pages/{$page['component']}.jsx"])
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>

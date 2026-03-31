<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        @php
            $meta = $page['props']['meta'] ?? [];
            $metaTitle = $meta['title'] ?? config('app.name', 'Calming');
            $metaDescription = $meta['description'] ?? 'Îndrumare confidențială pentru echilibrul tău. Explorează articole, instrumente și resurse pentru stare de bine emoțională.';
            $metaType = $meta['type'] ?? 'website';
            $metaUrl = $meta['url'] ?? url()->current();
            $metaImage = $meta['image'] ?? null;
            $metaImageAlt = $meta['image_alt'] ?? $metaTitle;
            $metaSiteName = $meta['site_name'] ?? 'Calming';
            $metaLocale = $meta['locale'] ?? 'ro_RO';
            $metaCanonical = $meta['canonical'] ?? $metaUrl;
            $twitterCard = $meta['twitter_card'] ?? 'summary_large_image';
        @endphp
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">
        <meta name="description" content="{{ $metaDescription }}">
        <meta property="og:title" content="{{ $metaTitle }}">
        <meta property="og:description" content="{{ $metaDescription }}">
        <meta property="og:type" content="{{ $metaType }}">
        <meta property="og:site_name" content="{{ $metaSiteName }}">
        <meta property="og:locale" content="{{ $metaLocale }}">
        <meta property="og:url" content="{{ $metaUrl }}">
        @if ($metaImage)
        <meta property="og:image" content="{{ $metaImage }}">
        <meta property="og:image:alt" content="{{ $metaImageAlt }}">
        @endif
        <meta name="twitter:card" content="{{ $twitterCard }}">
        <meta name="twitter:title" content="{{ $metaTitle }}">
        <meta name="twitter:description" content="{{ $metaDescription }}">
        @if ($metaImage)
        <meta name="twitter:image" content="{{ $metaImage }}">
        <meta name="twitter:image:alt" content="{{ $metaImageAlt }}">
        @endif
        <link rel="canonical" href="{{ $metaCanonical }}">

        <title inertia>{{ $metaTitle }}</title>

        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=source-sans-3:400,500,600,700&display=swap" rel="stylesheet" />

        @routes
        @viteReactRefresh
        @vite(['resources/js/app.jsx', "resources/js/Pages/{$page['component']}.jsx"])
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>

#!/bin/bash
cd /c/Users/danii/Herd/calm
php artisan tinker << 'EOF'
$user = App\Models\User::find(2);
$assistant = app(App\Support\AssistantService::class);
$response = $assistant->bootstrap($user);
echo "Messages count: " . count($response['messages']) . "\n";
if (count($response['messages']) > 0) {
    echo "First message: " . substr($response['messages'][0]['content'], 0, 100) . "\n";
}
EOF

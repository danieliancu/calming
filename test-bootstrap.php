<?php

$app = require __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\Log;

// Get user 2
$user = \App\Models\User::find(2);
if (!$user) {
    echo "User 2 not found\n";
    exit(1);
}

echo "Testing assistant bootstrap  for user: " . $user->email . "\n\n";

// Call bootstrap
$assistant = app(\App\Support\AssistantService::class);
$response = $assistant->bootstrap($user);

// Dump response structure
echo "Response keys: " . implode(', ', array_keys($response)) . "\n";
echo "Guest mode: " . ($response['guest_mode'] ? 'true' : 'false') . "\n";
echo "Thread: " . ($response['thread'] ? 'present' : 'null') . "\n";
echo "Messages count: " . count($response['messages'] ?? []) . "\n";

if (!empty($response['messages'])) {
    echo "\nFirst 3 messages:\n";
    foreach (array_slice($response['messages'], 0, 3) as $msg) {
        echo "  - Role: {$msg['role']}, Content: " . substr($msg['content'], 0, 40) . "...\n";
    }
}

echo "\nLast 3 messages:\n";
$last = array_slice($response['messages'] ?? [], -3);
foreach ($last as $msg) {
    echo "  - Role: {$msg['role']}, Content: " . substr($msg['content'], 0, 40) . "...\n";
}

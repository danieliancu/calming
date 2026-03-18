<?php
require 'bootstrap/app.php';

$app = require_once 'bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

echo "=== CHECKING ASSISTANT TABLES ===\n\n";

// Check if tables exist
$tables = ['assistant_threads', 'assistant_messages', 'assistant_memories'];
foreach ($tables as $table) {
    $exists = Schema::hasTable($table);
    echo "Table '{$table}': " . ($exists ? 'EXISTS' : 'MISSING') . "\n";
}

echo "\n=== CHECKING DATA ===\n\n";

// Check assistant_threads
$threadCount = DB::table('assistant_threads')->count();
echo "Total assistant_threads: $threadCount\n";

if ($threadCount > 0) {
    $threads = DB::table('assistant_threads')->get();
    foreach ($threads as $thread) {
        $msgCount = DB::table('assistant_messages')->where('thread_id', $thread->id)->count();
        echo "  - Thread ID: {$thread->id}, User ID: {$thread->user_id}, Messages: $msgCount, Status: {$thread->status}\n";
    }
}

echo "\n=== CHECKING SESSION CONFIG ===\n\n";
$sessionDriver = config('session.driver');
echo "Session driver: $sessionDriver\n";
echo "Session lifetime: " . config('session.lifetime') . " minutes\n";
echo "Session domain: " . config('session.domain') . "\n";

echo "\n=== DONE ===\n";

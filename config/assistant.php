<?php

return [
    'provider' => env('ASSISTANT_PROVIDER', 'openai'),
    'model' => env('ASSISTANT_MODEL', 'gpt-4.1-mini'),
    'api_key' => env('OPENAI_API_KEY'),
    'max_guest_messages' => (int) env('ASSISTANT_MAX_GUEST_MESSAGES', 12),
    'recent_message_limit' => (int) env('ASSISTANT_RECENT_MESSAGE_LIMIT', 10),
    'summarize_every' => (int) env('ASSISTANT_SUMMARIZE_EVERY', 8),
    'max_message_chars' => (int) env('ASSISTANT_MAX_MESSAGE_CHARS', 1500),
    'max_output_tokens' => (int) env('ASSISTANT_MAX_OUTPUT_TOKENS', 180),
];

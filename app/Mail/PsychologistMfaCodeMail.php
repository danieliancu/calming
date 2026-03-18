<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PsychologistMfaCodeMail extends Mailable
{
    use Queueable;
    use SerializesModels;

    public function __construct(
        public string $firstName,
        public string $code,
        public string $purpose,
    ) {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Cod de confirmare Calming Partners',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.psychologist-mfa-code',
        );
    }
}

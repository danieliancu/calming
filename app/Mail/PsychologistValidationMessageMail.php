<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PsychologistValidationMessageMail extends Mailable
{
    use Queueable;
    use SerializesModels;

    public function __construct(
        public string $firstName,
        public string $messageBody,
        public ?string $dashboardUrl = null,
    ) {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Ai primit un mesaj nou legat de validarea contului',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.psychologist-validation-message',
        );
    }
}

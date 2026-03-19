<?php

namespace App\Mail;

use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

class AppointmentMessageMail extends Mailable
{
    public function __construct(
        public string $subjectLine,
        public string $headline,
        public string $body,
        public ?string $actionUrl = null,
        public ?string $actionLabel = null,
    ) {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: $this->subjectLine,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.appointment-message',
        );
    }
}

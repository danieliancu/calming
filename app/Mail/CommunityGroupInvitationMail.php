<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class CommunityGroupInvitationMail extends Mailable
{
    use Queueable;
    use SerializesModels;

    public function __construct(
        public string $groupName,
        public string $groupUrl,
        public string $facilitatorName,
    ) {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Invitatie intr-un grup privat Calming',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.community-group-invitation',
        );
    }
}

<?php

namespace App\Notifications;

use App\Models\Bid;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class BidSubmittedNotification extends Notification
{
    use Queueable;

    protected $bid;

    public function __construct(Bid $bid)
    {
        $this->bid = $bid;
    }

    public function via($notifiable)
    {
        return ['database'];
    }

    public function toDatabase($notifiable)
    {
        return [
            'bid_id' => $this->bid->id,
            'tender_id' => $this->bid->tender_id,
            'contractor_name' => $this->bid->contractor->name ?? 'Unknown',
            'tender_title' => $this->bid->tender->title ?? 'Unknown',
            'amount' => $this->bid->total_amount,
            'message' => sprintf(
                '%s submitted a bid of €%s for "%s"',
                $this->bid->contractor->name ?? 'A contractor',
                number_format($this->bid->total_amount, 2),
                $this->bid->tender->title ?? 'your tender'
            ),
        ];
    }
}

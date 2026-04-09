<?php

namespace App\Notifications;

use App\Models\Bid;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class BidAwardedNotification extends Notification
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
            'tender_title' => $this->bid->tender->title ?? 'Unknown',
            'amount' => $this->bid->total_amount,
            'message' => sprintf(
                'Congratulations! Your bid of €%s for "%s" has been awarded!',
                number_format($this->bid->total_amount, 2),
                $this->bid->tender->title ?? 'a tender'
            ),
        ];
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BidItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'bid_id',
        'boq_item_id',
        'unit_price',
        'quantity',
        'amount',
    ];

    protected $casts = [
        'unit_price' => 'decimal:2',
        'quantity' => 'decimal:2',
        'amount' => 'decimal:2',
    ];

    // Relationships
    public function bid()
    {
        return $this->belongsTo(Bid::class);
    }

    public function boqItem()
    {
        return $this->belongsTo(BoqItem::class);
    }

    // Methods
    public function calculateAmount()
    {
        $amount = $this->unit_price * $this->quantity;
        $this->update(['amount' => $amount]);
        return $amount;
    }

    protected static function boot()
    {
        parent::boot();

        // Automatically calculate amount when creating/updating
        static::saving(function ($bidItem) {
            if ($bidItem->unit_price && $bidItem->quantity) {
                $bidItem->amount = $bidItem->unit_price * $bidItem->quantity;
            }
        });
    }
}

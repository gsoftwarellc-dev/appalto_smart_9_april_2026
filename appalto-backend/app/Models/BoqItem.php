<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BoqItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'tender_id',
        'description',
        'unit',
        'quantity',
        'item_type',
        'option_group_id',
        'is_optional',
        'display_order',
    ];

    protected $casts = [
        'quantity' => 'decimal:2',
        'is_optional' => 'boolean',
    ];

    // Relationships
    public function tender()
    {
        return $this->belongsTo(Tender::class);
    }

    public function bidItems()
    {
        return $this->hasMany(BidItem::class);
    }

    // Methods
    public function calculateEstimate($unitPrice)
    {
        if ($this->item_type === 'lump_sum') {
            return $unitPrice;
        }
        return $this->quantity * $unitPrice;
    }

    public function isUnitPriced()
    {
        return $this->item_type === 'unit_priced';
    }

    public function isLumpSum()
    {
        return $this->item_type === 'lump_sum';
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Bid extends Model
{
    use HasFactory;

    protected $fillable = [
        'tender_id',
        'contractor_id',
        'status',
        'total_amount',
        'submitted_at',
        'offer_file_path',
        'offer_file_name',
        'proposal',
        'discount_type',
        'discount_value',
        'discount_amount',
        'subtotal_amount',
    ];

    protected $casts = [
        'total_amount' => 'decimal:2',
        'discount_value' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'subtotal_amount' => 'decimal:2',
        'submitted_at' => 'datetime',
    ];

    // Relationships
    public function tender()
    {
        return $this->belongsTo(Tender::class);
    }

    public function contractor()
    {
        return $this->belongsTo(User::class, 'contractor_id');
    }

    public function bidItems()
    {
        return $this->hasMany(BidItem::class);
    }

    // Scopes
    public function scopeDraft($query)
    {
        return $query->where('status', 'draft');
    }

    public function scopeSubmitted($query)
    {
        return $query->where('status', 'submitted');
    }

    public function scopeAwarded($query)
    {
        return $query->where('status', 'accepted');
    }

    // Methods
    public function submit()
    {
        $this->calculateTotal();
        $this->update([
            'status' => 'submitted',
            'submitted_at' => now(),
        ]);
    }

    public function calculateTotal(?string $discountType = null, mixed $discountValue = null)
    {
        $subtotal = (float) $this->bidItems()->sum(\DB::raw('unit_price * quantity'));

        $type = $discountType ?? $this->discount_type;
        if (!in_array($type, ['percent', 'fixed'], true)) {
            $type = null;
        }

        $valueRaw = $discountValue ?? $this->discount_value ?? 0;
        $value = is_numeric($valueRaw) ? (float) $valueRaw : 0.0;
        $value = max(0, $value);

        $discountAmount = 0.0;
        if ($type && $value > 0) {
            if ($type === 'percent') {
                $discountAmount = $subtotal * (min($value, 100) / 100);
            } else {
                $discountAmount = $value;
            }
        }

        $discountAmount = min($discountAmount, $subtotal);
        $total = max($subtotal - $discountAmount, 0);

        $this->update([
            'subtotal_amount' => round($subtotal, 2),
            'discount_type' => $type,
            'discount_value' => round($value, 2),
            'discount_amount' => round($discountAmount, 2),
            'total_amount' => round($total, 2),
        ]);

        return $total;
    }

    public function isDraft()
    {
        return $this->status === 'draft';
    }

    public function isSubmitted()
    {
        return $this->status === 'submitted';
    }

    public function isAwarded()
    {
        return $this->status === 'accepted';
    }
}

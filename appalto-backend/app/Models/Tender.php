<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Tender extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'description',
        'location',
        'deadline',
        'status',
        'budget',
        'awarded_bid_id',
        'awarded_date',
        'created_by',
        'is_urgent',
    ];

    protected $casts = [
        'deadline' => 'datetime',
        'awarded_date' => 'datetime',
        // Budget is a string range (e.g. "0-50000", "50000-100000"), so no numeric cast
        'is_urgent' => 'boolean',
    ];

    // Relationships
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function favoritedBy()
    {
        return $this->belongsToMany(User::class, 'saved_tenders', 'tender_id', 'user_id')->withTimestamps();
    }

    public function bids()
    {
        return $this->hasMany(Bid::class);
    }

    public function boqItems()
    {
        return $this->hasMany(BoqItem::class)->orderBy('display_order');
    }

    public function unlocks()
    {
        return $this->belongsToMany(User::class, 'tender_unlocks')->withPivot('credits_spent')->withTimestamps();
    }

    public function isUnlockedBy(?User $user)
    {
        if (!$user) return false;
        
        // Admins and owners (if implemented) always see everything
        if ($user->role === 'admin' || $user->role === 'owner') return true;

        return $this->unlocks()->where('user_id', $user->id)->exists();
    }

    public function documents()
    {
        return $this->hasMany(Document::class);
    }

    public function awardedBid()
    {
        return $this->belongsTo(Bid::class, 'awarded_bid_id');
    }

    // Scopes
    public function scopePublished($query)
    {
        return $query->where('status', 'published');
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'published')
                     ->where('deadline', '>', now());
    }

    public function scopeExpired($query)
    {
        return $query->where('deadline', '<', now());
    }

    // Methods
    public function publish()
    {
        $this->update(['status' => 'published']);
    }

    public function close()
    {
        $this->update(['status' => 'closed']);
    }

    public function award($bidId)
    {
        $this->update([
            'status' => 'awarded',
            'awarded_bid_id' => $bidId,
            'awarded_date' => now(),
        ]);

        // Update bid status
        $this->bids()->where('id', $bidId)->update(['status' => 'accepted']);
        $this->bids()->where('id', '!=', $bidId)->update(['status' => 'rejected']);
    }

    public function isActive()
    {
        return $this->status === 'published' && $this->deadline > now();
    }

    public function isAwarded()
    {
        return $this->status === 'awarded';
    }
}

<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'status',
        'verified',
        'admin_sub_role',
        'order_college',
        'order_province',
        'order_number',
        'company_name',
        'vat_number',
        'fiscal_code',
        'address',
        'city',
        'province',
        'phone',
        'legal_representative',
        'avatar_url',
        'bio',
        'expertise',
        'website_url',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'verified' => 'boolean',
        ];
    }

    // Relationships
    public function createdTenders()
    {
        return $this->hasMany(Tender::class, 'created_by');
    }

    public function bids()
    {
        return $this->hasMany(Bid::class, 'contractor_id');
    }

    public function savedTenders()
    {
        return $this->belongsToMany(Tender::class, 'saved_tenders', 'user_id', 'tender_id')->withTimestamps();
    }

    public function documents()
    {
        return $this->hasMany(Document::class, 'user_id');
    }

    public function credits()
    {
        return $this->hasOne(Credit::class);
    }

    public function transactions()
    {
        return $this->hasMany(Transaction::class);
    }

    public function unlockedTenders()
    {
        return $this->belongsToMany(Tender::class, 'tender_unlocks')->withPivot('credits_spent')->withTimestamps();
    }

    // Scopes
    public function scopeAdmins($query)
    {
        return $query->where('role', 'admin');
    }

    public function scopeContractors($query)
    {
        return $query->where('role', 'contractor');
    }

    // Helper methods
    public function isAdmin()
    {
        return $this->role === 'admin';
    }

    public function isContractor()
    {
        return $this->role === 'contractor';
    }

    public function isActive()
    {
        return ($this->status ?? 'active') === 'active';
    }
}

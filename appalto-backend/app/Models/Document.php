<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class Document extends Model
{
    use HasFactory;

    protected $fillable = [
        'tender_id',
        'file_name',
        'file_path',
        'file_size',
        'mime_type',
        'document_type',
        'user_id',
        'original_filename',
    ];

    protected $casts = [
        'file_size' => 'integer',
    ];

    protected $appends = ['url'];

    // Relationships
    public function tender()
    {
        return $this->belongsTo(Tender::class);
    }

    public function uploader()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    // Accessors
    public function getUrlAttribute()
    {
        return Storage::url($this->file_path);
    }

    // Methods
    public function deleteFile()
    {
        if (Storage::exists($this->file_path)) {
            Storage::delete($this->file_path);
        }
        $this->delete();
    }

    public function getHumanReadableSize()
    {
        $bytes = $this->file_size;
        $units = ['B', 'KB', 'MB', 'GB'];
        
        for ($i = 0; $bytes > 1024; $i++) {
            $bytes /= 1024;
        }
        
        return round($bytes, 2) . ' ' . $units[$i];
    }

    protected static function boot()
    {
        parent::boot();

        // Auto-delete file when document is deleted
        static::deleting(function ($document) {
            if (Storage::exists($document->file_path)) {
                Storage::delete($document->file_path);
            }
        });
    }
}

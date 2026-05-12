<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Services\TenderCreditRequirementService;

class TenderResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $boqDoc = $this->documents()->where('document_type', 'boq_pdf')->latest()->first();
        $unlockCost = app(TenderCreditRequirementService::class)->calculateForTender($this->resource);

        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'location' => $this->location,
            'deadline' => $this->deadline,
            'status' => $this->status,
            'budget' => $this->budget, // Keep as string for range display (0-50000, 50000-100000, etc.)
            'isUnlocked' => $this->isUnlockedBy($request->user()),
            'unlockCredits' => $unlockCost,
            'unlock_credits' => $unlockCost,
            'boq_file_url' => $boqDoc?->url,
            'boq_file_name' => $boqDoc?->file_name ?? $boqDoc?->original_filename,
            'boq_file_size_kb' => $boqDoc && $boqDoc->file_size ? round($boqDoc->file_size / 1024, 1) : null,
            
            // Include BOQ items if loaded
            'boqItems' => BoqItemResource::collection($this->whenLoaded('boqItems')),
            'boq_items' => BoqItemResource::collection($this->whenLoaded('boqItems')), // snake_case alias for frontend compatibility
            
            // Include bids count if available
            'bids_count' => $this->when(isset($this->bids_count), $this->bids_count ?? 0),
            
            // Award information (only if awarded)
            'awarded_bid_id' => $this->when($this->status === 'awarded', $this->awarded_bid_id),
            'awarded_date' => $this->when($this->status === 'awarded', $this->awarded_date),
            
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}

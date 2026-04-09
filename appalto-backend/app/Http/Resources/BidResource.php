<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BidResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'tender_id' => $this->tender_id,
            'contractor_id' => $this->contractor_id,
            'status' => $this->status,
            'subtotal_amount' => (float) ($this->subtotal_amount ?? 0),
            'discount_type' => $this->discount_type,
            'discount_value' => (float) ($this->discount_value ?? 0),
            'discount_amount' => (float) ($this->discount_amount ?? 0),
            'total_amount' => (float) $this->total_amount,
            'submitted_at' => $this->submitted_at,
            
            // Include contractor details if loaded
            'contractor' => new UserResource($this->whenLoaded('contractor')),
            
            // Include tender details if loaded
            'tender' => new TenderResource($this->whenLoaded('tender')),
            
            // Include bid items if loaded
            'bid_items' => BidItemResource::collection($this->whenLoaded('bidItems')),
            
            // Additional fields from joins (if present)
            'contractor_name' => $this->when(isset($this->contractor_name), $this->contractor_name),
            'contractor_company' => $this->when(isset($this->contractor_company), $this->contractor_company),
            'tender_title' => $this->when(isset($this->tender_title), $this->tender_title),
            'tender_deadline' => $this->when(isset($this->tender_deadline), $this->tender_deadline),
            'tender_status' => $this->when(isset($this->tender_status), $this->tender_status),
            
            
            'offer_file_url' => $this->offer_file_path ? \Illuminate\Support\Facades\Storage::url($this->offer_file_path) : null,
            'offer_file_name' => $this->offer_file_name,
            'proposal' => $this->proposal,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}

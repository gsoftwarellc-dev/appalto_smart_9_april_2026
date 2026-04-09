<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BidItemResource extends JsonResource
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
            'boq_item_id' => $this->boq_item_id,
            'unit_price' => (float) $this->unit_price,
            'quantity' => (float) $this->quantity,
            'total_price' => (float) ($this->amount ?? ($this->unit_price * $this->quantity)),
            'notes' => $this->notes,
            
            // Include BOQ item details if loaded
            'boq_item' => new BoqItemResource($this->whenLoaded('boqItem')),
        ];
    }
}

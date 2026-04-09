<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
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
            'name' => $this->name,
            'email' => $this->email,
            'role' => $this->role,
            'admin_sub_role' => $this->when($this->role === 'admin', $this->admin_sub_role),
            
            // Contractor-specific fields (only if contractor)
            'company_name' => $this->when($this->role === 'contractor', $this->company_name),
            'vat_number' => $this->when($this->role === 'contractor', $this->vat_number),
            'fiscal_code' => $this->when($this->role === 'contractor', $this->fiscal_code),
            'address' => $this->when($this->role === 'contractor', $this->address),
            'city' => $this->when($this->role === 'contractor', $this->city),
            'province' => $this->when($this->role === 'contractor', $this->province),
            'phone' => $this->when($this->role === 'contractor', $this->phone),
            'legal_representative' => $this->when($this->role === 'contractor', $this->legal_representative),
            
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}

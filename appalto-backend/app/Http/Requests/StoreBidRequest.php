<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreBidRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // Only contractors can create bids
        return $this->user() && $this->user()->isContractor();
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'items' => 'required|array|min:1',
            'items.*.boq_item_id' => 'required|exists:boq_items,id',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.quantity' => 'required|numeric|min:0',
            'items.*.notes' => 'nullable|string',
            'discount_type' => 'nullable|in:percent,fixed',
            'discount_value' => 'nullable|numeric|min:0',
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'items.required' => 'At least one bid item is required.',
            'items.*.boq_item_id.exists' => 'One or more BOQ items do not exist.',
            'items.*.unit_price.min' => 'Unit price must be at least 0.',
            'items.*.quantity.min' => 'Quantity must be at least 0.',
            'discount_value.min' => 'Discount must be at least 0.',
        ];
    }
}

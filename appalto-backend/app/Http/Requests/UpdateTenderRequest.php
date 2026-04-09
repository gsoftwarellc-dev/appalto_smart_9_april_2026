<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateTenderRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user() && $this->user()->isAdmin();
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'title' => 'sometimes|string|max:255',
            'description' => 'sometimes|string',
            'location' => 'sometimes|string|max:255',
            'deadline' => 'sometimes|date|after:now',
            // Budget is stored and displayed as a range string (e.g. "50000-100000")
            'budget' => 'sometimes|string|max:50',
            'is_urgent' => 'sometimes|boolean',
            'status' => 'sometimes|in:draft,published,closed,awarded',
            'boq_items' => 'sometimes|array',
            'boq_items.*.description' => 'required_with:boq_items|string',
            'boq_items.*.unit' => 'required_with:boq_items|string|max:50',
            'boq_items.*.quantity' => 'required_with:boq_items|numeric|min:0',
            'boq_items.*.item_type' => 'required_with:boq_items|in:unit_priced,lump_sum',
        ];
    }
}

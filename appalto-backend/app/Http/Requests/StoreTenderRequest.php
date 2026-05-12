<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreTenderRequest extends FormRequest
{
    private const ITALIAN_REGIONS = [
        'Abruzzo',
        'Basilicata',
        'Calabria',
        'Campania',
        'Emilia-Romagna',
        'Friuli Venezia Giulia',
        'Lazio',
        'Liguria',
        'Lombardia',
        'Marche',
        'Molise',
        'Piemonte',
        'Puglia',
        'Sardegna',
        'Sicilia',
        'Toscana',
        'Trentino-Alto Adige',
        'Umbria',
        "Valle d'Aosta",
        'Veneto',
    ];

    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // Only admins can create tenders
        return $this->user() && in_array($this->user()->role, ['admin', 'owner']);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'location' => 'required|string|max:255',
            'region' => ['required', 'string', Rule::in(self::ITALIAN_REGIONS)],
            'deadline' => 'required|date|after:now',
            // Budget is stored and displayed as a range string (e.g. "50000-100000")
            'budget' => 'required|string|max:50',
            'is_urgent' => 'sometimes|boolean',
            'boq_items' => 'sometimes|array',
            'boq_items.*.description' => 'required_with:boq_items|string',
            'boq_items.*.unit' => 'required_with:boq_items|string|max:50',
            'boq_items.*.quantity' => 'required_with:boq_items|numeric|min:0',
            'boq_items.*.item_type' => 'required_with:boq_items|in:unit_priced,lump_sum',
            'boq_document_id' => 'sometimes|nullable|integer|exists:documents,id',
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
            'deadline.after' => 'The deadline must be a date in the future.',
            'budget.min' => 'The budget must be at least 0.',
        ];
    }
}

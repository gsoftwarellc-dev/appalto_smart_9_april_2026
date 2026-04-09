<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class RegisterRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // Anyone can register
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => ['required', 'string', Password::min(8)->mixedCase()->numbers(), 'confirmed'],
            'role' => 'required|in:admin,contractor',

            // Admin / Condominium profile (required when role = admin)
            'admin_sub_role' => 'required_if:role,admin|nullable|string|in:condominium_admin,delegated_technician',
            'vat_number' => 'required_if:role,admin|nullable|string|size:11|regex:/^\d+$/',
            'address' => 'required_if:role,admin|nullable|string|max:255',
            'city' => 'required_if:role,admin|nullable|string|max:100',
            'province' => 'required_if:role,admin|nullable|string|max:10',
            'phone' => 'nullable|string|max:20',

            // Delegated technician only (required when admin_sub_role = delegated_technician)
            'order_college' => 'required_if:admin_sub_role,delegated_technician|nullable|string|max:100',
            'order_province' => 'required_if:admin_sub_role,delegated_technician|nullable|string|max:50',
            'order_number' => 'required_if:admin_sub_role,delegated_technician|nullable|string|max:50',

            // Contractor-specific fields (same as contractor profile)
            'company_name' => 'required_if:role,contractor|nullable|string|max:255',
            'fiscal_code' => 'nullable|string|max:255',
            'legal_representative' => 'nullable|string|max:255',
            'bio' => 'nullable|string|max:2000',
            'expertise' => 'nullable|string|max:255',
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
            'company_name.required_if' => 'Company name is required for contractor accounts.',
            'province.size' => 'Province must be exactly 2 characters.',
        ];
    }
}

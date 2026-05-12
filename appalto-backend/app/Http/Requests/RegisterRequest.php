<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class RegisterRequest extends FormRequest
{
    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        $optionalString = function (string $key, bool $uppercase = false): ?string {
            $value = trim((string) $this->input($key));

            if ($value === '') {
                return null;
            }

            return $uppercase ? strtoupper($value) : $value;
        };

        $vatNumber = preg_replace('/\D/', '', (string) $this->input('vat_number'));

        $this->merge([
            'name' => trim((string) $this->input('name')),
            'email' => strtolower(trim((string) $this->input('email'))),
            'role' => trim((string) $this->input('role')),
            'admin_sub_role' => $optionalString('admin_sub_role'),
            'vat_number' => $vatNumber === '' ? null : $vatNumber,
            'address' => $optionalString('address'),
            'city' => $optionalString('city'),
            'province' => $optionalString('province', true),
            'phone' => $optionalString('phone'),
            'order_college' => $optionalString('order_college'),
            'order_province' => $optionalString('order_province', true),
            'order_number' => $optionalString('order_number'),
            'company_name' => $optionalString('company_name'),
            'fiscal_code' => $optionalString('fiscal_code', true),
            'legal_representative' => $optionalString('legal_representative'),
            'bio' => $optionalString('bio'),
            'expertise' => $optionalString('expertise'),
        ]);
    }

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
        $vatRequired = Rule::requiredIf(fn () => in_array($this->input('role'), ['admin', 'contractor'], true));

        return [
            'name' => 'required_if:role,admin|nullable|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => ['required', 'string', Password::min(8)->mixedCase()->numbers(), 'confirmed'],
            'role' => 'required|in:admin,contractor',

            // Admin / Condominium profile (required when role = admin)
            'admin_sub_role' => 'required_if:role,admin|nullable|string|in:condominium_admin,delegated_technician',
            'vat_number' => [$vatRequired, 'nullable', 'string', 'size:11', 'regex:/^\d{11}$/'],
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
            'vat_number.required' => 'VAT number is required.',
            'vat_number.size' => 'VAT number must be exactly 11 digits.',
            'vat_number.regex' => 'VAT number must contain only digits.',
            'password.mixed' => 'Password must contain uppercase and lowercase letters.',
            'password.numbers' => 'Password must contain at least one number.',
        ];
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Document;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class ProfileController extends Controller
{
    /**
     * Get the authenticated user's profile
     */
    public function show(Request $request)
    {
        return response()->json([
            'data' => $request->user()->load('documents')
        ]);
    }

    /**
     * Update the authenticated user's profile
     */
    public function update(Request $request)
    {
        $user = $request->user();
        \Illuminate\Support\Facades\Log::info('Profile Update Request:', $request->all());

        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'company_name' => 'nullable|string|max:255',
                // Base rules; tightened below when user is admin
                'admin_sub_role' => 'nullable|string|in:condominium_admin,delegated_technician',
                'vat_number' => 'nullable|string|max:20',
                'fiscal_code' => 'nullable|string|max:20',
                'address' => 'nullable|string|max:255',
                'city' => 'nullable|string|max:100',
                'province' => 'nullable|string|max:10',
                'phone' => 'nullable|string|max:20',
                'order_college' => 'nullable|string|max:100',
                'order_province' => 'nullable|string|max:50',
                'order_number' => 'nullable|string|max:50',
                'legal_representative' => 'nullable|string|max:255',
                'bio' => 'nullable|string',
                'expertise' => 'nullable|string',
                'website_url' => 'nullable|url|max:255',
            ]);

            // Additional role-based constraints
            if ($user->role === 'admin') {
                $adminSubRole = $request->input('admin_sub_role', $user->admin_sub_role);
                // Admin profile must explicitly be one of the two allowed sub-roles.
                $adminRules = [
                    'admin_sub_role' => 'required|string|in:condominium_admin,delegated_technician',
                    'phone' => 'required|string|max:20',
                    'vat_number' => 'required|string|size:11|regex:/^\d+$/',
                    'address' => 'required|string|max:255',
                    'city' => 'required|string|max:100',
                    'province' => 'required|string|max:10',
                ];

                // Only technician must fill order_* fields
                if ($adminSubRole === 'delegated_technician') {
                    $adminRules = array_merge($adminRules, [
                        'order_college' => 'required|string|max:100',
                        'order_province' => 'required|string|max:50',
                        'order_number' => 'required|string|max:50',
                    ]);
                }

                $validated = array_merge(
                    $validated,
                    $request->validate($adminRules)
                );
            }

            \Illuminate\Support\Facades\Log::info('Profile Update Validated Data:', $validated);

            // Normalize empty strings to null for nullable fields so DB stores NULL
            $nullableKeys = ['company_name', 'admin_sub_role', 'vat_number', 'fiscal_code', 'address', 'city', 'province', 'phone', 'legal_representative', 'bio', 'expertise', 'website_url', 'order_college', 'order_province', 'order_number'];
            foreach ($nullableKeys as $key) {
                if (array_key_exists($key, $validated) && $validated[$key] === '') {
                    $validated[$key] = null;
                }
            }

            $user->update($validated);

            return response()->json([
                'message' => 'Profile updated successfully',
                'data' => $user->fresh()->load('documents')
            ], 200);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Profile Update Error: ' . $e->getMessage());
            return response()->json(['message' => 'Server Error: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Change authenticated user password
     */
    public function changePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required|string|current_password',
            'password' => ['required', 'string', 'confirmed', Password::min(8)->mixedCase()->numbers()],
        ]);

        $user = $request->user();
        $user->update(['password' => Hash::make($request->password)]);

        return response()->json(['message' => 'Password updated successfully'], 200);
    }

    /**
     * Upload avatar image
     */
    public function uploadAvatar(Request $request)
    {
        // Support both file upload and base64 (for environment compatibility)
        if ($request->has('avatar_base64')) {
            $base64Data = $request->input('avatar_base64');
            // Remove data:image/...;base64, prefix if present
            if (preg_match('/^data:image\/(\w+);base64,/', $base64Data, $type)) {
                $base64Data = substr($base64Data, strpos($base64Data, ',') + 1);
                $extension = strtolower($type[1]); // png, jpg, etc
            } else {
                $extension = 'png'; // default
            }

            $imageData = base64_decode($base64Data);
            if (!$imageData) {
                return response()->json(['message' => 'Invalid base64 data'], 422);
            }

            $fileName = time() . '_' . $request->user()->id . '_avatar.' . $extension;
            Storage::disk('public')->put('avatars/' . $fileName, $imageData);
            $url = Storage::url('avatars/' . $fileName);
        } else {
            $request->validate([
                'avatar' => 'required|image|max:2048', // 2MB max
            ]);

            $file = $request->file('avatar');
            $fileName = time() . '_' . $request->user()->id . '_avatar.' . $file->getClientOriginalExtension();
            $filePath = $file->storeAs('avatars', $fileName, 'public');
            $url = Storage::url($filePath);
        }

        $user = $request->user();
        
        // Delete old avatar if exists
        if ($user->avatar_url) {
            $oldPath = str_replace(url('/storage/'), '', $user->avatar_url);
            if (Storage::disk('public')->exists($oldPath)) {
                Storage::disk('public')->delete($oldPath);
            }
        }

        $user->update(['avatar_url' => $url]);

        return response()->json([
            'message' => 'Avatar updated successfully',
            'url' => $url,
            'user' => $user->fresh()
        ]);
    }

    /**
     * Upload profile document (Visura/Presentation)
     */
    public function uploadDocument(Request $request)
    {
        // Support both file upload and base64
        if ($request->has('file_base64')) {
            $base64Data = $request->input('file_base64');
            $originalName = $request->input('original_filename', 'document.pdf');
            $type = $request->document_type;

            if (preg_match('/^data:[\w\/\.\-]+;base64,/', $base64Data)) {
                $base64Data = substr($base64Data, strpos($base64Data, ',') + 1);
            }

            $fileData = base64_decode($base64Data);
            if (!$fileData) {
                return response()->json(['message' => 'Invalid base64 data'], 422);
            }

            $fileName = time() . '_' . $type . '_' . $originalName;
            $filePath = 'documents/users/' . $request->user()->id . '/' . $fileName;
            Storage::disk('public')->put($filePath, $fileData);
            
            $fileSize = strlen($fileData);
            $mimeType = 'application/pdf'; // Default or improved logic
        } else {
            $request->validate([
                'file' => 'required|file|max:10240|mimes:pdf,doc,docx', // 10MB max
                'document_type' => ['required', Rule::in(['visura_camerale', 'presentation'])],
            ]);

            $file = $request->file('file');
            $originalName = $file->getClientOriginalName();
            $type = $request->document_type;
            $fileName = time() . '_' . $type . '_' . $originalName;
            $filePath = $file->storeAs('documents/users/' . $request->user()->id, $fileName, 'public');
            $fileSize = $file->getSize();
            $mimeType = $file->getMimeType();
        }

        $user = $request->user();
        
        $existingDoc = Document::where('user_id', $user->id)
            ->where('document_type', $type)
            ->first();
            
        if ($existingDoc) {
            $existingDoc->deleteFile();
        }

        $document = Document::create([
            'user_id' => $user->id,
            'tender_id' => null,
            'document_type' => $type,
            'file_name' => $fileName,
            'file_path' => $filePath,
            'file_size' => $fileSize,
            'mime_type' => $mimeType,
        ]);

        return response()->json([
            'message' => 'Document uploaded successfully',
            'data' => $document
        ]);
    }
}

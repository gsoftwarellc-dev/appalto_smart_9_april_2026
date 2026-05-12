<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use App\Mail\ResetPasswordMail;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Register a new user
     */
    public function register(RegisterRequest $request)
    {
        $data = $request->validated();
        $role = $data['role'];

        $userAttributes = [
            'name' => $role === 'contractor' ? $data['company_name'] : $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'role' => $role,
            'vat_number' => $data['vat_number'] ?? null,
            'phone' => $data['phone'] ?? null,
            'status' => 'active',
            'verified' => $role === 'admin',
        ];

        if ($role === 'admin') {
            $userAttributes = array_merge($userAttributes, [
                'admin_sub_role' => $data['admin_sub_role'],
                'address' => $data['address'],
                'city' => $data['city'],
                'province' => $data['province'],
                'order_college' => $data['admin_sub_role'] === 'delegated_technician' ? ($data['order_college'] ?? null) : null,
                'order_province' => $data['admin_sub_role'] === 'delegated_technician' ? ($data['order_province'] ?? null) : null,
                'order_number' => $data['admin_sub_role'] === 'delegated_technician' ? ($data['order_number'] ?? null) : null,
            ]);
        }

        if ($role === 'contractor') {
            $userAttributes = array_merge($userAttributes, [
                'company_name' => $data['company_name'],
                'fiscal_code' => $data['fiscal_code'] ?? null,
                'address' => $data['address'] ?? null,
                'city' => $data['city'] ?? null,
                'province' => $data['province'] ?? null,
                'legal_representative' => $data['legal_representative'] ?? null,
                'bio' => $data['bio'] ?? null,
                'expertise' => $data['expertise'] ?? null,
            ]);
        }

        $user = User::create($userAttributes);

        return response()->json([
            'user' => new UserResource($user),
            'message' => 'Registration successful. Please log in.',
        ], 201);
    }

    /**
     * Login user
     */
    public function login(LoginRequest $request)
    {
        $credentials = $request->validated();
        $user = User::where('email', $credentials['email'])->first();

        if (! $user || ! Hash::check($credentials['password'], $user->password) || $user->role !== $credentials['role']) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        if (($user->status ?? 'active') !== 'active') {
            throw ValidationException::withMessages([
                'email' => ['This account is not active. Please contact support.'],
            ]);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'user' => new UserResource($user),
            'token' => $token,
        ]);
    }

    /**
     * Send a password reset link to the user if the email exists.
     */
    public function forgotPassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => 'required|string|email|max:255',
        ]);

        $email = strtolower(trim($data['email']));
        $user = User::where('email', $email)->first();

        if ($user) {
            $token = Str::random(64);

            DB::table('password_reset_tokens')->updateOrInsert(
                ['email' => $email],
                [
                    'token' => Hash::make($token),
                    'created_at' => now(),
                ]
            );

            $frontendUrl = rtrim(env('FRONTEND_URL', config('app.url')), '/');
            $resetUrl = "{$frontendUrl}/reset-password?token={$token}&email=" . urlencode($email);

            Mail::to($email)->send(new ResetPasswordMail($resetUrl, $email));
        }

        return response()->json([
            'message' => 'If an account exists for this email, a password reset link has been sent.',
        ]);
    }

    /**
     * Reset a user's password using a valid password reset token.
     */
    public function resetPassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => 'required|string|email|max:255',
            'token' => 'required|string',
            'password' => ['required', 'string', Password::min(8)->mixedCase()->numbers(), 'confirmed'],
        ]);

        $email = strtolower(trim($data['email']));
        $reset = DB::table('password_reset_tokens')->where('email', $email)->first();

        if (
            ! $reset ||
            ! Hash::check($data['token'], $reset->token) ||
            Carbon::parse($reset->created_at)->addMinutes(60)->isPast()
        ) {
            throw ValidationException::withMessages([
                'email' => ['This password reset link is invalid or has expired.'],
            ]);
        }

        $user = User::where('email', $email)->first();

        if (! $user) {
            throw ValidationException::withMessages([
                'email' => ['This password reset link is invalid or has expired.'],
            ]);
        }

        $user->forceFill([
            'password' => Hash::make($data['password']),
        ])->save();

        DB::table('password_reset_tokens')->where('email', $email)->delete();
        $user->tokens()->delete();

        return response()->json([
            'message' => 'Password reset successfully. Please log in with your new password.',
        ]);
    }

    /**
     * Logout user
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logged out successfully',
        ]);
    }

    /**
     * Get authenticated user
     */
    public function user(Request $request)
    {
        return new UserResource($request->user());
    }
}

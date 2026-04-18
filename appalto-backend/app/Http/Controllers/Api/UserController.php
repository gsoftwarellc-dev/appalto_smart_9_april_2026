<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class UserController extends Controller
{
    /**
     * Get all users with optional filtering
     */
    public function index(Request $request)
    {
        $query = User::query()->with('credits');

        // Filter by role
        if ($request->has('role')) {
            $query->where('role', $request->role);
        }

        if ($request->has('verified')) {
            $verified = filter_var($request->verified, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
            if ($verified !== null) {
                $query->where('verified', $verified);
            }
        }

        // Filter by status (we'll use a custom attribute or check specific fields)
        if ($request->has('status')) {
            // For now, we can add a status column later if needed
            // This is a placeholder for future status filtering
        }

        // Search by name or email
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('company_name', 'like', "%{$search}%");
            });
        }

        // Order by creation date (newest first)
        $query->orderBy('created_at', 'desc');

        // Paginate results
        $perPage = $request->get('per_page', 50);
        $users = $query->paginate($perPage);

        return response()->json($users);
    }

    /**
     * Get a specific user's details
     */
    public function show($id)
    {
        $user = User::findOrFail($id);
        return response()->json($user);
    }

    /**
     * Update user status
     */
    public function updateStatus(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'status' => 'required|in:active,suspended,pending',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = User::findOrFail($id);
        
        // Store status in a new column or use a system to track this
        // For now, we'll add a 'status' attribute
        $user->status = $request->status;
        $user->save();

        // Log action
        AuditLog::create([
            'user_id' => $request->user()->id,
            'action' => 'User Status Update',
            'details' => "Updated user status to {$request->status}: {$user->name} ({$user->role})",
            'ip_address' => $request->ip()
        ]);

        return response()->json([
            'message' => 'User status updated successfully',
            'user' => $user
        ]);
    }

    /**
     * Verify a contractor
     */
    public function verify(Request $request, $id)
    {
        $user = User::findOrFail($id);

        if ($user->role !== 'contractor') {
            return response()->json([
                'message' => 'Only contractors can be verified'
            ], 400);
        }

        $user->verified = true;
        $user->status = 'active';
        $user->save();

        // Log action
        AuditLog::create([
            'user_id' => $request->user()->id,
            'action' => 'Contractor Verification',
            'details' => "Verified contractor: {$user->name}",
            'ip_address' => $request->ip()
        ]);

        return response()->json([
            'message' => 'Contractor verified successfully',
            'user' => $user
        ]);
    }

    /**
     * Get user statistics
     */
    public function statistics()
    {
        $stats = [
            'total_users' => User::count(),
            'admins' => User::where('role', 'admin')->count(),
            'contractors' => User::where('role', 'contractor')->count(),
            'owners' => User::where('role', 'owner')->count(),
            'pending_verifications' => User::where('role', 'contractor')
                                          ->where('verified', false)
                                          ->count(),
            'suspended_users' => User::where('status', 'suspended')->count(),
        ];

        return response()->json($stats);
    }
}

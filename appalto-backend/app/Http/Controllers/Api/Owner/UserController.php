<?php

namespace App\Http\Controllers\Api\Owner;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Tender;
use App\Models\Bid;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class UserController extends Controller
{
    /**
     * Get detailed user profile with statistics, full profile fields and documents
     */
    public function show($id)
    {
        $user = User::with(['credits', 'documents'])->findOrFail($id);

        $stats = [];
        
        if ($user->role === 'admin') {
            // Client statistics
            $stats = [
                'total_tenders' => Tender::where('created_by', $user->id)->count(),
                'active_tenders' => Tender::where('created_by', $user->id)
                    ->whereIn('status', ['published', 'review'])->count(),
                'awarded_tenders' => Tender::where('created_by', $user->id)
                    ->where('status', 'awarded')->count(),
                'draft_tenders' => Tender::where('created_by', $user->id)
                    ->where('status', 'draft')->count(),
            ];
            
            // Recent tenders
            $recentActivity = Tender::where('created_by', $user->id)
                ->orderBy('created_at', 'desc')
                ->limit(10)
                ->get()
                ->map(function ($tender) {
                    return [
                        'id' => $tender->id,
                        'type' => 'tender',
                        'title' => $tender->title,
                        'status' => $tender->status,
                        'date' => $tender->created_at->toISOString(),
                        'description' => 'Created tender',
                    ];
                });
                
        } elseif ($user->role === 'contractor') {
            // Contractor statistics
            $stats = [
                'total_bids' => Bid::where('contractor_id', $user->id)->count(),
                'won_bids' => Bid::where('contractor_id', $user->id)
                    ->where('status', 'awarded')->count(),
                'pending_bids' => Bid::where('contractor_id', $user->id)
                    ->where('status', 'submitted')->count(),
                'credits_balance' => $user->credits->balance ?? 0,
            ];
            
            // Recent bids
            $recentActivity = Bid::where('contractor_id', $user->id)
                ->with('tender')
                ->orderBy('created_at', 'desc')
                ->limit(10)
                ->get()
                ->map(function ($bid) {
                    return [
                        'id' => $bid->id,
                        'type' => 'bid',
                        'title' => $bid->tender->title ?? 'Unknown',
                        'status' => $bid->status,
                        'amount' => $bid->total_amount,
                        'date' => $bid->created_at->toISOString(),
                        'description' => 'Submitted bid of €' . number_format($bid->total_amount, 2),
                    ];
                });
        } else {
            // Owner/other
            $stats = [
                'role' => $user->role,
            ];
            $recentActivity = [];
        }

        // Transaction history for all users
        $transactions = DB::table('transactions')
            ->where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->limit(20)
            ->get()
            ->map(function ($txn) {
                return [
                    'id' => $txn->id,
                    'type' => ucfirst($txn->type ?? 'unknown'),
                    'amount' => $txn->amount,
                    'cash_amount' => $txn->cash_amount,
                    'status' => ucfirst($txn->status),
                    'description' => $txn->description ?? 'No description',
                    'date' => \Carbon\Carbon::parse($txn->created_at)->toISOString(),
                ];
            });

        $stats['total_transactions'] = DB::table('transactions')
            ->where('user_id', $user->id)->count();
        $stats['total_spent'] = DB::table('transactions')
            ->where('user_id', $user->id)
            ->where('status', 'completed')
            ->sum('cash_amount') ?? 0;

        // Documents (visura camerale, presentation) for download links
        $documents = $user->documents->map(function ($doc) {
            return [
                'id' => $doc->id,
                'document_type' => $doc->document_type,
                'file_name' => $doc->file_name ?? $doc->original_filename ?? 'document.pdf',
                'file_path' => $doc->file_path,
                'url' => $doc->url,
            ];
        });

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'admin_sub_role' => $user->admin_sub_role,
                'company_name' => $user->company_name,
                'vat_number' => $user->vat_number,
                'fiscal_code' => $user->fiscal_code,
                'address' => $user->address,
                'city' => $user->city,
                'province' => $user->province,
                'phone' => $user->phone,
                'legal_representative' => $user->legal_representative,
                'bio' => $user->bio,
                'expertise' => $user->expertise,
                'order_college' => $user->order_college,
                'order_province' => $user->order_province,
                'order_number' => $user->order_number,
                'status' => $user->status ?? 'active',
                'verified' => $user->verified ?? true,
                'created_at' => $user->created_at->toISOString(),
            ],
            'documents' => $documents,
            'stats' => $stats,
            'recent_activity' => $recentActivity ?? [],
            'transactions' => $transactions,
        ]);
    }

    /**
     * Suspend a user
     */
    public function suspend($id)
    {
        $user = User::findOrFail($id);
        $user->update(['status' => 'suspended']);
        
        return response()->json(['message' => 'User suspended successfully']);
    }

    /**
     * Activate a user
     */
    public function activate($id)
    {
        $user = User::findOrFail($id);
        $user->update(['status' => 'active']);
        
        return response()->json(['message' => 'User activated successfully']);
    }
}

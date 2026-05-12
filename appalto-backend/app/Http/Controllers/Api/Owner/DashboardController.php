<?php

namespace App\Http\Controllers\Api\Owner;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Tender;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    /**
     * Get owner dashboard summary statistics
     */
    public function index()
    {
        // Calculate Total Revenue (Credits + Fees)
        $totalRevenue = DB::table('transactions')
            ->where('status', 'completed')
            ->where('amount', '>', 0)
            ->sum('cash_amount') ?? 0;
            
        $stats = [
            'total_revenue' => $totalRevenue,
            'total_contractors' => User::where('role', 'contractor')->count(),
            'active_tenders' => Tender::whereIn('status', ['published', 'review'])->count(),
            'new_contractors_this_week' => User::where('role', 'contractor')->where('created_at', '>=', now()->subDays(7))->count(),
            'waiting_approval_tenders' => Tender::where('status', 'draft')->count(),
        ];

        return response()->json($stats);
    }

    /**
     * Get paginated transaction list for the owner
     */
    public function transactions(Request $request)
    {
        $perPage = (int) $request->get('per_page', 10);
        $page    = (int) $request->get('page', 1);

        $query = DB::table('transactions')
            ->join('users', 'transactions.user_id', '=', 'users.id')
            ->select('transactions.*', 'users.name as user_name', 'users.company_name')
            ->orderBy('transactions.created_at', 'desc');

        $total   = $query->count();
        $records = $query->offset(($page - 1) * $perPage)->limit($perPage)->get();

        $data = $records->map(function ($txn) {
            return [
                'id'          => 'TXN-' . $txn->id,
                'user'        => $txn->company_name ?: $txn->user_name,
                'type'        => ucfirst($txn->type),
                'credits'     => (int) abs($txn->amount),
                'cash_amount' => (float) ($txn->cash_amount ?? 0),
                'status'      => ucfirst($txn->status),
                'date'        => \Carbon\Carbon::parse($txn->created_at)->format('Y-m-d H:i'),
            ];
        });

        return response()->json([
            'data'         => $data,
            'total'        => $total,
            'per_page'     => $perPage,
            'current_page' => $page,
            'last_page'    => (int) ceil($total / $perPage),
        ]);
    }

    /**
     * Get revenue analytics data
     */
    public function revenue()
    {
        // Calculate total revenue stats
        $totalRevenue = DB::table('transactions')
            ->where('status', 'completed')
            ->sum('cash_amount') ?? 0;

        $creditSales = DB::table('transactions')
            ->where('status', 'completed')
            ->where('type', 'purchase')
            ->sum('cash_amount') ?? 0;

        $successFees = DB::table('transactions')
            ->where('status', 'completed')
            ->where('type', 'fee')
            ->sum('cash_amount') ?? 0;

        // Count pending payments (could be invoices with status 'pending' if we had an invoices table)
        // For now, checking transactions with 'pending' status
        $pendingPayments = DB::table('transactions')
            ->where('status', 'pending')
            ->sum('cash_amount') ?? 0;
            
        $overdueCount = DB::table('transactions')
             ->where('status', 'pending')
             ->where('created_at', '<', now()->subDays(30))
             ->count();

        // Generate chart data for the last 6 months
        $revenueData = [];
        for ($i = 5; $i >= 0; $i--) {
            $date = now()->subMonths($i);
            $monthName = $date->format('M');
            $year = $date->format('Y');
            $month = $date->format('m');

            $credits = DB::table('transactions')
                ->where('status', 'completed')
                ->where('type', 'purchase')
                ->whereYear('created_at', $year)
                ->whereMonth('created_at', $month)
                ->sum('cash_amount') ?? 0;

            $fees = DB::table('transactions')
                ->where('status', 'completed')
                ->where('type', 'fee')
                ->whereYear('created_at', $year)
                ->whereMonth('created_at', $month)
                ->sum('cash_amount') ?? 0;

            $revenueData[] = [
                'month' => $monthName,
                'credits' => (float)$credits,
                'fees' => (float)$fees
            ];
        }

        // Fetch recent transactions (5 for the summary)
        $recentTransactions = DB::table('transactions')
            ->join('users', 'transactions.user_id', '=', 'users.id')
            ->select('transactions.*', 'users.name as user_name', 'users.company_name')
            ->orderBy('transactions.created_at', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($txn) {
                return [
                    'id'          => 'TXN-' . $txn->id,
                    'user'        => $txn->company_name ?: $txn->user_name,
                    'type'        => ucfirst($txn->type),
                    'credits'     => (int) abs($txn->amount),
                    'cash_amount' => (float) ($txn->cash_amount ?? 0),
                    'status'      => ucfirst($txn->status),
                    'date'        => \Carbon\Carbon::parse($txn->created_at)->format('Y-m-d H:i'),
                ];
            });

        return response()->json([
            'stats' => [
                'total_revenue'    => $totalRevenue,
                'credit_sales'     => $creditSales,
                'success_fees'     => $successFees,
                'pending_payments' => $pendingPayments,
                'overdue_count'    => $overdueCount
            ],
            'chart_data'          => $revenueData,
            'recent_transactions' => $recentTransactions,
        ]);
    }
}

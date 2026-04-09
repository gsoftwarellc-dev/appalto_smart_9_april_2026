<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Tender;
use App\Models\Bid;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    /**
     * Get admin dashboard statistics
     */
    public function index(Request $request)
    {
        $user = $request->user();
        
        // Only admin or owner can access
        if (!in_array($user->role, ['admin', 'owner'])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Get statistics
        $stats = [
            'total_tenders' => Tender::count(),
            'active_tenders' => Tender::where('status', 'published')->count(),
            'total_bids' => Bid::count(),
            'total_contractors' => User::where('role', 'contractor')->count(),
        ];

        // Recent tenders (last 5)
        $recentTenders = Tender::with('creator:id,name')
            ->select('id', 'title', 'status', 'deadline', 'created_by', 'created_at')
            ->withCount('bids')
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($tender) {
                return [
                    'id' => $tender->id,
                    'title' => $tender->title,
                    'status' => $tender->status,
                    'bids' => $tender->bids_count,
                    'deadline' => $tender->deadline ? $tender->deadline->format('Y-m-d') : null,
                    'created_at' => $tender->created_at->format('Y-m-d H:i:s'),
                ];
            });

        // Tender status distribution for pie chart
        $statusDistribution = Tender::select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->get()
            ->mapWithKeys(function ($item) {
                return [$item->status => $item->count];
            });

        $pieChartData = [
            ['name' => 'Open', 'value' => $statusDistribution['published'] ?? 0, 'color' => '#10b981'],
            ['name' => 'Draft', 'value' => $statusDistribution['draft'] ?? 0, 'color' => '#6b7280'],
            ['name' => 'Closed', 'value' => $statusDistribution['closed'] ?? 0, 'color' => '#ef4444'],
            ['name' => 'Awarded', 'value' => Bid::where('status', 'awarded')->distinct('tender_id')->count(), 'color' => '#3b82f6'],
        ];

        // Recent activity (last 10 items)
        $recentActivity = [];
        
        // Get recent bids
        $recentBids = Bid::with(['contractor:id,name', 'tender:id,title'])
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();
        
        foreach ($recentBids as $bid) {
            $recentActivity[] = [
                'id' => 'bid_' . $bid->id,
                'type' => 'bid',
                'message' => "New bid received from {$bid->contractor->name} for {$bid->tender->title}",
                'time' => $bid->created_at->diffForHumans(),
                'timestamp' => $bid->created_at->timestamp,
            ];
        }

        // Get recent tender publications
        $recentPublished = Tender::where('status', 'published')
            ->orderBy('updated_at', 'desc')
            ->limit(5)
            ->get();
        
        foreach ($recentPublished as $tender) {
            $recentActivity[] = [
                'id' => 'tender_' . $tender->id,
                'type' => 'tender',
                'message' => "{$tender->title} tender published successfully",
                'time' => $tender->updated_at->diffForHumans(),
                'timestamp' => $tender->updated_at->timestamp,
            ];
        }

        // Get recent awards
        $recentAwards = Bid::where('status', 'awarded')
            ->with(['contractor:id,name', 'tender:id,title'])
            ->orderBy('updated_at', 'desc')
            ->limit(3)
            ->get();
        
        foreach ($recentAwards as $bid) {
            $recentActivity[] = [
                'id' => 'award_' . $bid->id,
                'type' => 'award',
                'message' => "{$bid->tender->title} awarded to {$bid->contractor->name}",
                'time' => $bid->updated_at->diffForHumans(),
                'timestamp' => $bid->updated_at->timestamp,
            ];
        }

        // Sort by timestamp and limit to 10
        usort($recentActivity, function ($a, $b) {
            return $b['timestamp'] <=> $a['timestamp'];
        });
        $recentActivity = array_slice($recentActivity, 0, 10);

        // Remove timestamp field (was just for sorting)
        $recentActivity = array_map(function ($item) {
            unset($item['timestamp']);
            return $item;
        }, $recentActivity);

        return response()->json([
            'stats' => $stats,
            'recent_tenders' => $recentTenders,
            'pie_chart_data' => $pieChartData,
            'recent_activity' => $recentActivity,
        ]);
    }
}

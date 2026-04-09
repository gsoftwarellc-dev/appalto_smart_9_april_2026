<?php

namespace App\Http\Controllers\Api\Contractor;

use App\Http\Controllers\Controller;
use App\Http\Resources\TenderResource;
use App\Models\Bid;
use App\Models\Tender;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class DashboardController extends Controller
{
    /**
     * Get contractor dashboard statistics
     */
    public function index(Request $request)
    {
        $user = $request->user();
        
        // 1. Basic Stats
        $totalBids = $user->bids()->count();
        $activeBids = $user->bids()->whereHas('tender', function($q) {
            $q->active();
        })->count();
        $awardedBids = $user->bids()->awarded()->count();
        
        // 2. Chart Data (Win/Loss/Pending)
        $chartData = [
            'won' => $user->bids()->awarded()->count(),
            'pending' => $user->bids()->whereIn('status', ['submitted'])->count(),
            'lost' => $user->bids()->where('status', 'rejected')->count(), // Assuming 'rejected' status or inferred
            'draft' => $user->bids()->where('status', 'draft')->count(),
        ];
        
        // 3. Upcoming Deadlines (from active tenders user has bid on OR just all active tenders?)
        // Let's show deadlines for tenders where the user has a DRAFT or SUBMITTED bid
        $imminentDeadlines = Tender::whereHas('bids', function($q) use ($user) {
            $q->where('contractor_id', $user->id)
              ->whereIn('status', ['draft', 'submitted']);
        })
        ->where('deadline', '>', now())
        ->where('deadline', '<', now()->addDays(14)) // Next 2 weeks
        ->orderBy('deadline')
        ->limit(5)
        ->get()
        ->map(function($tender) {
            return [
                'id' => $tender->id,
                'title' => $tender->title,
                'location' => $tender->location,
                'deadline' => $tender->deadline->format('d M'),
                'days_left' => (int) now()->diffInDays($tender->deadline, false),
                'is_urgent' => now()->diffInDays($tender->deadline, false) <= 3
            ];
        });

        // 4. Recent Activity (Mocking from actual data changes)
        // In a real app, this would query a Notifications table.
        // For now, let's get the most recent 5 bids and their status
        $recentActivity = $user->bids()->with('tender')
            ->latest()
            ->limit(5)
            ->get()
            ->map(function($bid) {
                $type = 'info';
                $message = "You started a draft for '{$bid->tender->title}'";
                
                if ($bid->status === 'submitted') {
                    $type = 'warning'; // Pending
                    $message = "Bid submitted for '{$bid->tender->title}'";
                } elseif ($bid->status === 'awarded') {
                    $type = 'success';
                    $message = "Congratulations! You won the tender '{$bid->tender->title}'";
                } elseif ($bid->status === 'rejected') {
                    $type = 'alert';
                    $message = "Bid for '{$bid->tender->title}' was not selected";
                }
                
                return [
                    'id' => $bid->id,
                    'message' => $message,
                    'time' => $bid->updated_at->diffForHumans(),
                    'type' => $type
                ];
            });

        // 5. Recommended Tenders (Tenders user hasn't bid on yet)
        $recommendedTenders = Tender::active()
            ->whereDoesntHave('bids', function($q) use ($user) {
                $q->where('contractor_id', $user->id);
            })
            ->latest()
            ->limit(3)
            ->get();

        return response()->json([
            'stats' => [
                'total_bids' => $totalBids,
                'active_bids' => $activeBids,
                'awarded_bids' => $awardedBids,
                'win_rate' => $totalBids > 0 ? round(($awardedBids / $totalBids) * 100) : 0
            ],
            'chart_data' => $chartData,
            'upcoming_deadlines' => $imminentDeadlines,
            'recent_activity' => $recentActivity,
            'recommended_tenders' => TenderResource::collection($recommendedTenders)
        ]);
    }
}

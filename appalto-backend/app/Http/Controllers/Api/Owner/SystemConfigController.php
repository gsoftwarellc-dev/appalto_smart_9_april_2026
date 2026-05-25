<?php

namespace App\Http\Controllers\Api\Owner;

use App\Http\Controllers\Controller;
use App\Models\SystemConfig;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SystemConfigController extends Controller
{
    public function index()
    {
        $configs = SystemConfig::all()->mapWithKeys(function (SystemConfig $config) {
            $value = $config->value;

            if (in_array($config->key, ['budgetRangeCreditRules', 'homepageBanners'])) {
                $decoded = json_decode($value, true);
                $value = json_last_error() === JSON_ERROR_NONE ? $decoded : [];
            }

            return [$config->key => $value];
        });

        return response()->json($configs);
    }

    public function update(Request $request)
    {
        $data = $request->all();

        foreach ($data as $key => $value) {
            SystemConfig::updateOrCreate(
                ['key' => $key],
                ['value' => is_array($value) ? json_encode($value) : $value]
            );
        }

        // Sync welcome credits for all contractors whenever the value changes
        if (array_key_exists('welcomeCredits', $data)) {
            $newTotal = (int) $data['welcomeCredits'];
            if ($newTotal > 0) {
                $this->syncWelcomeCredits($newTotal);
            }
        }

        AuditLog::create([
            'user_id'    => $request->user()->id,
            'action'     => 'System Config Update',
            'details'    => 'Updated system configurations',
            'ip_address' => $request->ip(),
        ]);

        return response()->json(['message' => 'Configuration updated successfully']);
    }

    private function syncWelcomeCredits(int $newTotal): void
    {
        $contractors = User::where('role', 'contractor')->with('credits')->get();

        foreach ($contractors as $user) {
            DB::transaction(function () use ($user, $newTotal) {
                // Sum of all welcome credits already granted to this user
                $alreadyGranted = $user->transactions()
                    ->where('type', 'welcome')
                    ->sum('amount');

                $diff = $newTotal - $alreadyGranted;

                if ($diff === 0) return;

                $user->credits()->firstOrCreate(['user_id' => $user->id], ['balance' => 0]);

                if ($diff > 0) {
                    // Top up
                    $user->credits()->increment('balance', $diff);
                    $user->transactions()->create([
                        'type'        => 'welcome',
                        'amount'      => $diff,
                        'description' => "Welcome bonus adjustment (+{$diff} credits)",
                        'status'      => 'completed',
                    ]);
                } else {
                    // Reduce — deduct the excess but never go below 0
                    $excess = abs($diff);
                    $currentBalance = $user->credits->balance ?? 0;
                    $deduct = min($excess, $currentBalance);
                    if ($deduct > 0) {
                        $user->credits()->decrement('balance', $deduct);
                    }
                    $user->transactions()->create([
                        'type'        => 'welcome',
                        'amount'      => -$excess,
                        'description' => "Welcome bonus adjustment (-{$excess} credits)",
                        'status'      => 'completed',
                    ]);
                }
            });
        }
    }
}

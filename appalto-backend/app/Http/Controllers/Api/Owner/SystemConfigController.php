<?php

namespace App\Http\Controllers\Api\Owner;

use App\Http\Controllers\Controller;
use App\Models\SystemConfig;
use App\Models\AuditLog;
use Illuminate\Http\Request;

class SystemConfigController extends Controller
{
    public function index()
    {
        $configs = SystemConfig::all()->mapWithKeys(function (SystemConfig $config) {
            $value = $config->value;

            if ($config->key === 'budgetRangeCreditRules') {
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

        // Log action
        AuditLog::create([
            'user_id' => $request->user()->id,
            'action' => 'System Config Update',
            'details' => 'Updated system configurations',
            'ip_address' => $request->ip()
        ]);

        return response()->json(['message' => 'Configuration updated successfully']);
    }
}

<?php

namespace App\Http\Controllers\Api\Owner;

use App\Http\Controllers\Controller;
use App\Models\NotificationTemplate;
use App\Models\AuditLog;
use Illuminate\Http\Request;

class NotificationTemplateController extends Controller
{
    public function index()
    {
        return response()->json(NotificationTemplate::all());
    }

    public function update(Request $request, $id)
    {
        $template = NotificationTemplate::findOrFail($id);
        
        $template->update([
            'subject' => $request->subject,
            'body' => $request->body,
            'status' => $request->status,
            'last_updated_at' => now()
        ]);

        // Log action
        AuditLog::create([
            'user_id' => $request->user()->id,
            'action' => 'Notification Template Update',
            'details' => "Updated template: {$template->name}",
            'ip_address' => $request->ip()
        ]);

        return response()->json($template);
    }
}

<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class OwnerPanelSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // System Configuration
        \App\Models\SystemConfig::upsert([
            ['key' => 'creditPriceBasic', 'value' => '50', 'type' => 'integer'],
            ['key' => 'creditPricePro', 'value' => '120', 'type' => 'integer'],
            ['key' => 'creditPriceEnterprise', 'value' => '300', 'type' => 'integer'],
            ['key' => 'successFeePercent', 'value' => '3.0', 'type' => 'float'],
            ['key' => 'tenderDurationDays', 'value' => '15', 'type' => 'integer'],
            ['key' => 'autoApproveClients', 'value' => 'false', 'type' => 'boolean'],
        ], ['key'], ['value', 'type']);

        // Notification Templates
        $templates = [
            [
                'name' => 'Welcome Email (Contractor)',
                'subject' => 'Welcome to Appalto Smart!',
                'body' => 'Dear [Name], Welcome to Appalto Smart...',
                'status' => 'active'
            ],
            [
                'name' => 'Tender Invitation',
                'subject' => 'New Tender Opportunity in [Area]',
                'body' => 'Hello, A new tender matching your skills...',
                'status' => 'active'
            ],
            [
                'name' => 'Payment Reminder',
                'subject' => 'Action Required: Pending Success Fee',
                'body' => 'Your payment is due...',
                'status' => 'active'
            ],
            [
                'name' => 'Award Notification',
                'subject' => 'Congratulations! You have been awarded [Project]',
                'body' => 'You have been selected...',
                'status' => 'active'
            ],
            [
                'name' => 'Account Suspension',
                'subject' => 'Important Notice Regarding Your Account',
                'body' => 'Your account has been suspended...',
                'status' => 'inactive'
            ],
        ];

        foreach ($templates as $template) {
            \App\Models\NotificationTemplate::updateOrCreate(
                ['name' => $template['name']],
                $template
            );
        }
    }
}

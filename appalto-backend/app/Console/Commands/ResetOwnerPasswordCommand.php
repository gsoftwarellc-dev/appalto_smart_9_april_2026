<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

class ResetOwnerPasswordCommand extends Command
{
    protected $signature = 'appalto:reset-owner-password
                            {--email=owner@example.com : Owner email}
                            {--password=password123 : New password}';

    protected $description = 'Reset the platform owner password (e.g. after double-hash issue).';

    public function handle(): int
    {
        $email = $this->option('email');
        $password = $this->option('password');

        $user = User::where('email', $email)->where('role', 'owner')->first();

        if (!$user) {
            $this->error("No owner user found with email: {$email}");
            $this->info('Run: php artisan db:seed to create demo users (including owner).');
            return 1;
        }

        $user->password = $password; // Model cast will hash it
        $user->save();

        $this->info("Owner password reset for: {$email}");
        return 0;
    }
}

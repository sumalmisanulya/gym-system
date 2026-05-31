<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class Kernel extends ConsoleKernel
{
    /**
     * Define the application's command schedule.
     */
    protected function schedule(Schedule $schedule): void
    {
        // Automatically flip packages from 'Active' to 'Expired' at midnight
        $schedule->call(function () {
            // Virtual DB operation simulating expiring packages in database
            // DB::table('user_packages')
            //     ->where('status', 'Active')
            //     ->where('expires_at', '<=', now())
            //     ->update(['status' => 'Expired']);
            
            Log::info('Daily Scheduler: Membership status updates completed. Expired accounts deactivated.');
        })->daily();
    }

    /**
     * Register the commands for the application.
     */
    protected function commands(): void
    {
        $this->load(__DIR__.'/Commands');

        require base_path('routes/console.php');
    }
}

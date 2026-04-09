<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ImportSqliteToMysqlCommand extends Command
{
    protected $signature = 'app:import-sqlite-to-mysql
                            {--sqlite= : Path to SQLite file (default: database/database.sqlite)}';

    protected $description = 'Import existing data from SQLite into MySQL (preserves users and all data). Run after: migrate';

    /** Tables to copy in FK-safe order. Skip migrations, cache, sessions, jobs. */
    private array $tableOrder = [
        'users',
        'tenders',
        'boq_items',
        'bids',
        'bid_items',
        'saved_tenders',
        'documents',
        'credits',
        'transactions',
        'tender_unlocks',
        'notifications',
        'audit_logs',
        'notification_templates',
        'system_configs',
        'pdf_extractions',
        'personal_access_tokens',
        'password_reset_tokens',
    ];

    public function handle(): int
    {
        if (config('database.default') !== 'mysql') {
            $this->error('Default database must be MySQL. Set DB_CONNECTION=mysql in .env');
            return self::FAILURE;
        }

        $sqlitePath = $this->option('sqlite') ?? database_path('database.sqlite');
        if (!is_file($sqlitePath)) {
            $this->warn('SQLite file not found: ' . $sqlitePath);
            $this->info('Run: php artisan migrate && php artisan db:seed (for fresh demo data instead).');
            return self::FAILURE;
        }

        config(['database.connections.sqlite_legacy.database' => $sqlitePath]);

        $this->info('Importing from SQLite to MySQL...');

        DB::connection('mysql')->getPdo()->exec('SET FOREIGN_KEY_CHECKS=0');

        try {
            foreach ($this->tableOrder as $table) {
                if (!Schema::connection('sqlite_legacy')->hasTable($table)) {
                    continue;
                }
                if (!Schema::connection('mysql')->hasTable($table)) {
                    $this->warn("  [skip] {$table} (not in MySQL)");
                    continue;
                }

                $rows = DB::connection('sqlite_legacy')->table($table)->get();
                if ($rows->isEmpty()) {
                    $this->line("  [ok] {$table} (0 rows)");
                    continue;
                }

                // Special handling: SQLite bid_items may have total_price instead of quantity+amount
                if ($table === 'bid_items') {
                    $this->copyBidItems();
                } else {
                    $this->copyTable($table, $rows);
                }
            }

            $this->newLine();
            $this->info('Import finished. Users and data preserved.');
        } finally {
            DB::connection('mysql')->getPdo()->exec('SET FOREIGN_KEY_CHECKS=1');
        }

        return self::SUCCESS;
    }

    private function copyTable(string $table, $rows): void
    {
        $columns = array_keys((array) $rows->first());
        $mysqlColumns = Schema::connection('mysql')->getColumnListing($table);
        $columns = array_values(array_intersect($columns, $mysqlColumns));
        if (empty($columns)) {
            $this->warn("  [skip] {$table} (no matching columns)");
            return;
        }

        DB::connection('mysql')->table($table)->truncate();
        $chunk = 100;
        $inserted = 0;
        foreach ($rows->chunk($chunk) as $chunkRows) {
            $values = $chunkRows->map(function ($row) use ($columns) {
                $arr = (array) $row;
                return array_intersect_key($arr, array_flip($columns));
            })->toArray();
            DB::connection('mysql')->table($table)->insert($values);
            $inserted += $chunkRows->count();
        }
        $this->line("  [ok] {$table} ({$inserted} rows)");
    }

    private function copyBidItems(): void
    {
        $rows = DB::connection('sqlite_legacy')->table('bid_items')->get();
        if ($rows->isEmpty()) {
            $this->line('  [ok] bid_items (0 rows)');
            return;
        }

        $mysqlHasQuantity = in_array('quantity', Schema::connection('mysql')->getColumnListing('bid_items'), true);
        $sqliteHasTotalPrice = property_exists($rows->first(), 'total_price');

        DB::connection('mysql')->table('bid_items')->truncate();

        foreach ($rows as $row) {
            $data = (array) $row;
            if ($mysqlHasQuantity && $sqliteHasTotalPrice && !isset($data['quantity'])) {
                $data['quantity'] = 1;
                $data['amount'] = $data['total_price'] ?? 0;
                unset($data['total_price']);
            }
            $allowed = array_intersect_key($data, array_flip(Schema::connection('mysql')->getColumnListing('bid_items')));
            if (!empty($allowed)) {
                DB::connection('mysql')->table('bid_items')->insert($allowed);
            }
        }
        $this->line('  [ok] bid_items (' . $rows->count() . ' rows)');
    }
}

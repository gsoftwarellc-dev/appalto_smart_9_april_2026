<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('tenders', function (Blueprint $table) {
            $table->dropColumn('budget');
        });

        Schema::table('tenders', function (Blueprint $table) {
            $table->string('budget')->nullable()->after('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tenders', function (Blueprint $table) {
             $table->dropColumn('budget');
        });

        Schema::table('tenders', function (Blueprint $table) {
            $table->decimal('budget', 12, 2)->nullable()->after('status');
        });
    }
};

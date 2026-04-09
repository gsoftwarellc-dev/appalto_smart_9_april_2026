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
        Schema::table('users', function (Blueprint $table) {
            $table->enum('role', ['admin', 'contractor', 'owner'])->default('contractor')->after('password');
            $table->string('company_name')->nullable()->after('role');
            $table->string('vat_number')->nullable()->after('company_name');
            $table->string('fiscal_code')->nullable()->after('vat_number');
            $table->text('address')->nullable()->after('fiscal_code');
            $table->string('city')->nullable()->after('address');
            $table->string('province', 2)->nullable()->after('city');
            $table->string('phone')->nullable()->after('province');
            $table->string('legal_representative')->nullable()->after('phone');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'role', 'company_name', 'vat_number', 'fiscal_code', 
                'address', 'city', 'province', 'phone', 'legal_representative'
            ]);
        });
    }
};

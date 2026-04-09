<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('order_college', 100)->nullable()->after('admin_sub_role');
            $table->string('order_province', 50)->nullable()->after('order_college');
            $table->string('order_number', 50)->nullable()->after('order_province');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['order_college', 'order_province', 'order_number']);
        });
    }
};

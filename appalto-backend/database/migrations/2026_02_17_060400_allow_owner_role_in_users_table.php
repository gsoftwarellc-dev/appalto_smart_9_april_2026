<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * SQLite: recreate users table so role check includes 'owner'.
     */
    public function up(): void
    {
        if (DB::connection()->getDriverName() !== 'sqlite') {
            return;
        }

        Schema::create('users_new', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->rememberToken();
            $table->timestamps();
            $table->string('role')->default('contractor');
            $table->string('company_name')->nullable();
            $table->string('vat_number')->nullable();
            $table->string('fiscal_code')->nullable();
            $table->text('address')->nullable();
            $table->string('city')->nullable();
            $table->string('province', 2)->nullable();
            $table->string('phone')->nullable();
            $table->string('legal_representative')->nullable();
            $table->string('avatar_url')->nullable();
            $table->text('bio')->nullable();
            $table->text('expertise')->nullable();
            $table->string('website_url')->nullable();
            $table->string('status')->default('active');
            $table->boolean('verified')->default(false);
        });

        DB::statement('INSERT INTO users_new (id, name, email, email_verified_at, password, remember_token, created_at, updated_at, role, company_name, vat_number, fiscal_code, address, city, province, phone, legal_representative, avatar_url, bio, expertise, website_url, status, verified) SELECT id, name, email, email_verified_at, password, remember_token, created_at, updated_at, role, company_name, vat_number, fiscal_code, address, city, province, phone, legal_representative, avatar_url, bio, expertise, website_url, status, verified FROM users');

        Schema::drop('users');
        Schema::rename('users_new', 'users');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No-op: restoring previous check would require recreating again
    }
};

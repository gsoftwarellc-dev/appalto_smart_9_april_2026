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
        Schema::create('boq_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tender_id')->constrained()->onDelete('cascade');
            $table->text('description');
            $table->string('unit', 50);
            $table->decimal('quantity', 10, 2);
            $table->enum('item_type', ['unit_priced', 'lump_sum'])->default('unit_priced');
            $table->integer('option_group_id')->nullable();
            $table->boolean('is_optional')->default(false);
            $table->integer('display_order')->default(0);
            $table->timestamps();
            
            $table->index(['tender_id', 'display_order']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('boq_items');
    }
};

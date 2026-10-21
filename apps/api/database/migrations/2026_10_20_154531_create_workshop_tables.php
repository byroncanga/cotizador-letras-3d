<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->boolean('is_owner')->default(false);
        });
        Schema::create('suppliers', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('contact')->nullable();
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
        Schema::create('material_variants', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('family');
            $table->string('color');
            $table->decimal('thickness_mm', 14, 6);
            $table->boolean('directional')->default(false);
            $table->timestamps();
        });
        Schema::create('stock_presentations', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('material_variant_id')->constrained()->restrictOnDelete();
            $table->foreignUuid('supplier_id')->nullable()->constrained()->restrictOnDelete();
            $table->decimal('width_mm', 14, 6);
            $table->decimal('height_mm', 14, 6);
            $table->decimal('margin_mm', 14, 6)->nullable();
            $table->decimal('purchase_price', 18, 4)->nullable();
            $table->timestamps();
        });
        Schema::create('supplier_prices', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('stock_presentation_id')->constrained()->restrictOnDelete();
            $table->foreignUuid('supplier_id')->nullable()->constrained()->restrictOnDelete();
            $table->decimal('price', 18, 4);
            $table->timestamp('effective_at');
            $table->timestamps();
        });
        Schema::create('machines', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('name')->unique();
            $table->string('type')->nullable();
            $table->timestamps();
        });
        Schema::create('cut_profiles', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->foreignUuid('machine_id')->constrained()->restrictOnDelete();
            $table->foreignUuid('material_variant_id')->nullable()->constrained()->restrictOnDelete();
            $table->decimal('kerf_mm', 14, 6)->nullable();
            $table->decimal('spacing_mm', 14, 6)->nullable();
            $table->decimal('rate_per_meter', 18, 4)->nullable();
            $table->decimal('setup_cost', 18, 4)->nullable();
            $table->decimal('minimum_cost', 18, 4)->nullable();
            $table->date('calibrated_on')->nullable();
            $table->timestamps();
        });
        Schema::create('design_analyses', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->constrained()->restrictOnDelete();
            $table->char('source_hash', 64)->index();
            $table->string('file_name');
            $table->string('source_path');
            $table->json('normalized');
            $table->timestamps();
        });
        Schema::create('quote_drafts', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->constrained()->restrictOnDelete();
            $table->string('number')->unique();
            $table->string('title');
            $table->string('customer_name')->nullable();
            $table->decimal('depth_mm', 14, 6);
            $table->foreignUuid('front_material_id')->nullable()->constrained('material_variants')->restrictOnDelete();
            $table->foreignUuid('back_material_id')->nullable()->constrained('material_variants')->restrictOnDelete();
            $table->foreignUuid('edge_material_id')->nullable()->constrained('material_variants')->restrictOnDelete();
            $table->foreignUuid('design_analysis_id')->nullable()->constrained()->restrictOnDelete();
            $table->string('billing_mode');
            $table->text('notes')->nullable();
            $table->string('status')->default('draft');
            $table->timestamps();
        });
        Schema::create('quote_revisions', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('quote_draft_id')->constrained()->restrictOnDelete();
            $table->unsignedInteger('revision');
            $table->json('snapshot');
            $table->timestamp('created_at');
            $table->unique(['quote_draft_id', 'revision']);
        });
        Schema::create('audit_events', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->constrained()->restrictOnDelete();
            $table->string('action');
            $table->string('entity_type');
            $table->string('entity_id');
            $table->json('changes');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        foreach (['audit_events', 'quote_revisions', 'quote_drafts', 'design_analyses', 'cut_profiles', 'machines', 'supplier_prices', 'stock_presentations', 'material_variants', 'suppliers'] as $name) {
            Schema::dropIfExists($name);
        }
        Schema::table('users', function (Blueprint $table): void {
            $table->dropColumn('is_owner');
        });
    }
};

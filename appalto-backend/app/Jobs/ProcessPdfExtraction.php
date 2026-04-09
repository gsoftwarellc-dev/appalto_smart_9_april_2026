<?php

namespace App\Jobs;

use App\Services\PdfExtractionService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ProcessPdfExtraction implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * The number of times the job may be attempted.
     *
     * @var int
     */
    public $tries = 3;
    
    /**
     * The number of seconds the job can run before timing out.
     *
     * @var int
     */
    public $timeout = 300; // 5 minutes
    
    protected int $extractionId;
    protected string $filePath;

    /**
     * Create a new job instance.
     */
    public function __construct(int $extractionId, string $filePath)
    {
        $this->extractionId = $extractionId;
        $this->filePath = $filePath;
    }

    /**
     * Execute the job.
     */
    public function handle(PdfExtractionService $service): void
    {
        Log::info("Processing PDF extraction job", [
            'extraction_id' => $this->extractionId,
            'file_path' => $this->filePath,
            'attempt' => $this->attempts(),
        ]);
        
        try {
            $service->processExtraction($this->extractionId, $this->filePath);
        } catch (\Exception $e) {
            Log::error("PDF extraction job failed", [
                'extraction_id' => $this->extractionId,
                'attempt' => $this->attempts(),
                'error' => $e->getMessage(),
            ]);
            
            // Re-throw to trigger retry mechanism
            throw $e;
        }
    }
    
    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error("PDF extraction job permanently failed", [
            'extraction_id' => $this->extractionId,
            'error' => $exception->getMessage(),
        ]);
        
        // Could send notification to admin here
    }
}

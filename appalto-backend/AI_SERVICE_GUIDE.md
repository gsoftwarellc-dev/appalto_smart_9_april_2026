# AI Service Integration - Complete Guide

## ✅ What Was Implemented

Successfully integrated a flexible AI service architecture for extracting BOQ (Bill of Quantities) data from PDF documents.

---

## 🏗️ Architecture Overview

### Components Created

1. **[AIProviderInterface](file:///Users/riyadulislamriyadh/Desktop/Appalto%20Smart/appalto-backend/app/Services/AIProviderInterface.php)** - Contract for AI providers
2. **[MockAIProvider](file:///Users/riyadulislamriyadh/Desktop/Appalto%20Smart/appalto-backend/app/Services/MockAIProvider.php)** - Testing implementation
3. **[PdfExtractionService](file:///Users/riyadulislamriyadh/Desktop/Appalto%20Smart/appalto-backend/app/Services/PdfExtractionService.php)** - Main extraction orchestrator
4. **[ProcessPdfExtraction](file:///Users/riyadulislamriyadh/Desktop/Appalto%20Smart/appalto-backend/app/Jobs/ProcessPdfExtraction.php)** - Background job
5. **[PdfExtractionController](file:///Users/riyadulislamriyadh/Desktop/Appalto%20Smart/appalto-backend/app/Http/Controllers/Api/PdfExtractionController.php)** - API endpoints

---

## 📡 API Endpoints

### Upload PDF and Start Extraction
```http
POST /api/tenders/{id}/extract-pdf
Content-Type: multipart/form-data
Authorization: Bearer {token}

Fields:
  pdf_file: (file) PDF document
  extraction_type: (optional) "standard"|"detailed"|"quick"

Response (202 Accepted):
{
  "message": "PDF uploaded successfully. Extraction started.",
  "extraction_id": 1,
  "document_id": 1
}
```

### Check Extraction Status
```http
GET /api/extractions/{id}
Authorization: Bearer {token}

Response (Processing):
{
  "id": 1,
  "status": "processing",
  "extraction_type": "standard",
  "created_at": "2026-02-09T01:58:00Z"
}

Response (Completed):
{
  "id": 1,
  "status": "completed",
  "extraction_type": "standard",
  "confidence_score": 0.95,
  "data": {
    "tender_info": {...},
    "boq_items": [...]
  },
  "processed_at": "2026-02-09T01:58:05Z"
}

Response (Failed):
{
  "id": 1,
  "status": "failed",
  "error": "Error message here",
  "processed_at": "2026-02-09T01:58:05Z"
}
```

### Get All Extractions for a Tender
```http
GET /api/tenders/{id}/extractions
Authorization: Bearer {token}

Response:
{
  "data": [...]
}
```

---

## 🔄 Workflow

### 1. PDF Upload
Admin uploads PDF via API endpoint → File stored in `storage/app/public/pdfs/`

### 2. Extraction Initiated
- Document record created in `documents` table
- Extraction record created in `pdf_extractions` table (status: processing)
- Background job dispatched to queue

### 3. Background Processing
- Job picks up extraction request
- Calls AI provider to analyze PDF
- Extracts tender info and BOQ items

### 4. Auto-Creation of BOQ Items
If extraction succeeds:
- BOQ items automatically created in `boq_items` table
- Linked to tender
- Ready for contractor bidding

### 5. Status Updates
- Status changes to "completed" or "failed"
- Frontend can poll for status updates

---

## 🤖 AI Provider System

### Current: MockAIProvider
For testing without API costs. Returns realistic mock data:
```php
{
  "tender_info": {
    "title": "Extracted: Construction Project",
    "location": "Extracted Location",
    "estimated_budget": 100000
  },
  "boq_items": [
    {
      "description": "Excavation works",
      "unit": "mc",
      "quantity": 150.0,
      "item_type": "unit_priced"
    },
    ...
  ]
}
```

### Adding Real AI Provider

#### Option 1: OpenAI GPT-4 Vision
Create `OpenAIProvider.php`:
```php
class OpenAIProvider implements AIProviderInterface
{
    public function extractBoqFromPdf(string $filePath, string $extractionType): array
    {
        $client = OpenAI::client(config('services.openai.key'));
        
        // Convert PDF to images or text
        // Send to GPT-4 Vision API
        // Parse structured response
        
        return ['success' => true, 'data' => $extracted, 'confidence' => 0.92];
    }
}
```

#### Option 2: Claude (Anthropic)
```php
class ClaudeProvider implements AIProviderInterface
{
    // Similar implementation using Anthropic API
}
```

#### Configuration
Add to `.env`:
```env
AI_PROVIDER=mock  # or openai, claude, etc.
OPENAI_API_KEY=your_key_here
ANTHROPIC_API_KEY=your_key_here
```

---

## ⚙️ Queue Configuration

### Database Queue (Current - Development)
Configured in `.env`:
```env
QUEUE_CONNECTION=database
```

**Run queue worker**:
```bash
php artisan queue:work
```

### Redis Queue (Recommended - Production)
Update `.env`:
```env
QUEUE_CONNECTION=redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
```

**Run queue worker**:
```bash
php artisan queue:work redis --tries=3 --timeout=300
```

For production, use Supervisor to keep queue worker running:
```ini
[program:appalto-queue]
command=php /path/to/artisan queue:work redis --sleep=3 --tries=3
autostart=true
autorestart=true
user=www-data
```

---

## 🧪 Testing the Integration

### 1. Start Queue Worker
```bash
cd appalto-backend
php artisan queue:work
```

### 2. Upload a PDF
```bash
curl -X POST http://localhost:8000/api/tenders/1/extract-pdf \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "pdf_file=@/path/to/tender.pdf" \
  -F "extraction_type=standard"
```

### 3. Check Status
```bash
curl http://localhost:8000/api/extractions/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. Verify BOQ Items Created
Check database or call:
```bash
curl http://localhost:8000/api/tenders/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📊 Database Tables Used

### pdf_extractions
- Tracks extraction jobs
- Stores AI response JSON
- Records confidence scores
- Maintains error logs

### documents
- Stores uploaded PDF metadata
- File path references
- Linked to tenders

### boq_items
- Auto-created from extraction
- Ready for contractor bidding

---

## 🎯 Key Features

✅ **Asynchronous Processing** - Background jobs don't block API  
✅ **Retry Logic** - 3 automatic retries on failure  
✅ **Timeout Protection** - 5-minute timeout per job  
✅ **Status Tracking** - Real-time status updates  
✅ **Auto BOQ Creation** - Extracted items automatically added  
✅ **Error Handling** - Comprehensive logging  
✅ **Flexible Providers** - Easy to swap AI services  
✅ **Mock Testing** - Test without API costs  

---

## 🔮 Next Steps

### Immediate
- Run queue worker: `php artisan queue:work`
- Test with mock provider

### Production Ready
1. Choose AI provider (OpenAI, Claude, Gemini)
2. Implement provider class
3. Add API credentials to `.env`
4. Switch from mock to real provider
5. Setup Redis for queue
6. Configure Supervisor for worker management
7. Add frontend UI for PDF upload

---

## 💡 Tips

- **Development**: Use MockAIProvider to avoid API costs
- **Testing**: Monitor logs with `tail -f storage/logs/laravel.log`
- **Queue**: Check job status in `jobs` table
- **Failed Jobs**: Check `failed_jobs` table for debugging

---

## 📝 Summary

Phase 3 AI Service Integration is **complete** with:
- ✅ Flexible provider architecture
- ✅ Background job processing
- ✅ Automatic BOQ item creation
- ✅ Complete API endpoints
- ✅ Mock provider for testing

**Ready to integrate with any AI service!** 🎉

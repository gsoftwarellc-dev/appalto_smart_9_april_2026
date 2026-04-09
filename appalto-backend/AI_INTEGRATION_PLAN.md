# AI Service Integration Plan

## Overview
Create a flexible AI service integration for extracting BOQ (Bill of Quantities) data from PDF documents.

## AI Provider Options

### Recommended Providers
1. **OpenAI GPT-4 Vision** - Best for document analysis, supports images
2. **Claude (Anthropic)** - Excellent for structured data extraction
3. **Google Gemini** - Good vision capabilities, competitive pricing
4. **Custom/Self-hosted** - For privacy-sensitive applications

## Architecture Design

### Service Layer
- `PdfExtractionService` - Main service interface
- `AIProviderInterface` - Abstract provider interface
- Concrete providers: `OpenAIProvider`, `ClaudeProvider`, etc.

### Queue System
- Background job: `ProcessPdfExtraction`
- Queue: `database` (for development) or `redis` (for production)
- Job timeout: 5 minutes
- Retry: 3 attempts

### Database Integration
- Uses existing `pdf_extractions` table
- Status tracking: processing → completed/failed
- Stores AI response and confidence score

## Implementation Steps

1. ✅ Create service contracts/interfaces
2. ✅ Create PdfExtractionService
3. ✅ Create ProcessPdfExtraction job
4. ✅ Add configuration
5. ⏳ Choose and implement AI provider
6. ⏳ Test extraction workflow

## Next Decision Required

**Which AI provider would you like to use?**
- OpenAI (requires API key)
- Claude/Anthropic (requires API key)
- Google Gemini (requires API key)
- Mock service (for testing without API)

For now, I'll create a mock implementation that can be easily replaced with a real provider.

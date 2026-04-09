<?php

namespace App\Services;

interface AIProviderInterface
{
    /**
     * Extract BOQ data from PDF file
     *
     * @param string $filePath Absolute path to PDF file
     * @param string $extractionType Type of extraction (type_a, type_b, etc.)
     * @return array ['success' => bool, 'data' => array, 'confidence' => float, 'error' => string|null]
     */
    public function extractBoqFromPdf(string $filePath, string $extractionType): array;
    
    /**
     * Check if the provider is properly configured
     *
     * @return bool
     */
    public function isConfigured(): bool;
}

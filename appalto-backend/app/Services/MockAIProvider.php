<?php

namespace App\Services;

use Smalot\PdfParser\Parser;

/**
 * Built-in BOQ extractor: parses PDF text with rules only (no OpenAI/Gemini).
 * Use AI_PROVIDER=mock for free, unlimited extraction – no API keys or rate limits.
 */
class MockAIProvider implements AIProviderInterface
{
    protected Parser $pdfParser;

    public function __construct()
    {
        $this->pdfParser = new Parser();
    }
    /**
     * Extract BOQ data from PDF file (Mock implementation)
     *
     * @param string $filePath
     * @param string $extractionType
     * @return array
     */
    public function extractBoqFromPdf(string $filePath, string $extractionType): array
    {
        // Lightweight, rule-based extractor that DOES look at the PDF text.
        // No external AI calls, so it works even without OpenAI/Gemini quota.

        try {
            $pdf = $this->pdfParser->parseFile($filePath);
            $text = $pdf->getText();
        } catch (\Exception $e) {
            // Fall back to synthetic data if parsing fails
            $mockBoqItems = $this->getMockBoqData($extractionType);
            return [
                'success' => true,
                'data' => $mockBoqItems,
                'confidence' => 0.5,
                'error' => null,
            ];
        }

        $items = $this->extractItemsFromText($text);

        // If we failed to extract anything, fall back to synthetic data
        if (count($items) === 0) {
            $mockBoqItems = $this->getMockBoqData($extractionType);
            return [
                'success' => true,
                'data' => $mockBoqItems,
                'confidence' => 0.5,
                'error' => null,
            ];
        }

        return [
            'success' => true,
            'data' => [
                'tender_info' => [
                    'title' => 'PDF Upload (mock extractor)',
                    'location' => null,
                ],
                'boq_items' => $items,
            ],
            'confidence' => 0.6,
            'error' => null,
        ];
    }
    
    /**
     * Check if provider is configured (always true for mock)
     *
     * @return bool
     */
    public function isConfigured(): bool
    {
        return true;
    }
    
    /**
     * Get mock BOQ data based on extraction type
     *
     * @param string $type
     * @return array
     */
    private function getMockBoqData(string $type): array
    {
        // Simple fallback: a single generic line item
        return [
            'tender_info' => [
                'title' => 'BOQ mock fallback',
                'location' => null,
                'estimated_budget' => null,
            ],
            'boq_items' => [
                [
                    'description' => 'Lavori generici – mock item (fallback)',
                    'unit' => 'mq',
                    'quantity' => 1.0,
                    'item_type' => 'unit_priced',
                ],
            ],
        ];
    }

    /**
     * Extract BOQ items: quantity ONLY from "(unit)(space)(number)" or "(number)(space)(unit)".
     * Allowed units: mq, m², ml, mc, kg, cad, a corpo. Block-based; ignores mm, mesi, SP, D.Lgs, etc.
     */
    private function extractItemsFromText(string $text): array
    {
        $lines = preg_split("/\r\n|\r|\n/", $text);
        $blocks = $this->splitIntoItemBlocks($lines);
        $items = [];

        foreach ($blocks as $block) {
            $description = $block['description'];
            $blockText = $block['text'];
            $unit = null;
            $quantity = 0.0;

            if (preg_match('/\ba\s*corpo\b/iu', $blockText)) {
                $unit = 'a corpo';
                $quantity = 1.0;
            }

            $candidates = [];
            // Pairs: number then unit, or unit then number (allow newlines via \s). Include ton for computo metrico.
            if (preg_match_all('/(\d[\d\s\.\,\'\´]*)\s*(m²|mq|ml|mc|kg|cad|ton)/iu', $blockText, $all, PREG_SET_ORDER)) {
                foreach ($all as $m) {
                    $q = $this->parseQuantity($m[1]);
                    if ($q <= 0 || $q >= 1000000) continue;
                    if ($this->isQuantityInBlacklistedContext($blockText, $m[1])) continue;
                    $candidates[] = ['q' => $q, 'unit' => $this->normaliseUnit($m[2])];
                }
            }
            if (preg_match_all('/(m²|mq|ml|mc|kg|cad|ton)\s*(\d[\d\s\.\,\'\´]*)/iu', $blockText, $all, PREG_SET_ORDER)) {
                foreach ($all as $m) {
                    $q = $this->parseQuantity($m[2]);
                    if ($q <= 0 || $q >= 1000000) continue;
                    if ($this->isQuantityInBlacklistedContext($blockText, $m[2])) continue;
                    $candidates[] = ['q' => $q, 'unit' => $this->normaliseUnit($m[1])];
                }
            }

            // Italian computo: "20,00 SOMMANO cad" or "SOMMANO mq 42,00" (quantity before or after SOMMANO + unit)
            if (preg_match('/([\d\s\.\,\'\´]+)\s+SOMMANO\s+(cad|mq|m²|mc|kg|ml|ton|a\s*corpo)/iu', $blockText, $m)) {
                $q = $this->parseQuantity($m[1]);
                if ($q > 0 && $q < 1000000 && !$this->isQuantityInBlacklistedContext($blockText, trim($m[1]))) {
                    $candidates[] = ['q' => $q, 'unit' => $this->normaliseUnit($m[2])];
                }
            }
            if (preg_match('/SOMMANO\s+(cad|mq|m²|mc|kg|ml|ton|a\s*corpo)\s+([\d\s\.\,\'\´]+)/iu', $blockText, $m)) {
                $q = $this->parseQuantity($m[2]);
                if ($q > 0 && $q < 1000000 && !$this->isQuantityInBlacklistedContext($blockText, trim($m[2]))) {
                    $candidates[] = ['q' => $q, 'unit' => $this->normaliseUnit($m[1])];
                }
            }
            // Orphan: "Quantità: 115,00" / "Q.ta 950" on one line, "U.m. mq" / "Unità di misura: mq" on another – pair them
            $orphanQty = null;
            if (preg_match('/(?:Quantit[aà]|Q\.?t[aà]?)\s*:?\s*([\d\s\.\,\'\´]+)/iu', $blockText, $m)) {
                $q = $this->parseQuantity($m[1]);
                if ($q > 0 && $q < 1000000 && !$this->isQuantityInBlacklistedContext($blockText, $m[1])) {
                    $orphanQty = $q;
                }
            }
            $orphanUnit = null;
            if (preg_match('/(?:Unit[aà]\s*(?:di misura)?|U\.?\s*m\.?|SOMMANO)\s*:?\s*(m²|mq|ml|mc|kg|cad|ton|a\s*corpo)/iu', $blockText, $m)) {
                $orphanUnit = $this->normaliseUnit($m[1]);
            }
            if ($orphanQty !== null && $orphanUnit !== null && $orphanUnit !== '') {
                $candidates[] = ['q' => $orphanQty, 'unit' => $orphanUnit];
            }

            if (!empty($candidates)) {
                $best = $candidates[0];
                foreach ($candidates as $c) {
                    if ($c['q'] > $best['q']) {
                        $best = $c;
                    }
                }
                $quantity = $best['q'];
                $unit = $best['unit'];
            }

            $items[] = [
                'description' => $description,
                'unit' => $unit ?? '',
                'quantity' => $quantity,
                'item_type' => ($unit && $this->isLumpSumUnit($unit)) ? 'lump_sum' : 'unit_priced',
            ];
        }

        $normalised = [];
        foreach ($items as $item) {
            $normalised[] = [
                'description' => $item['description'],
                'unit' => $item['unit'] ?? '',
                'quantity' => (float) ($item['quantity'] ?? 0),
                'item_type' => $item['item_type'] ?? 'unit_priced',
            ];
            if (count($normalised) >= 100) break;
        }
        return $normalised;
    }

    /**
     * Split lines into item blocks. Each block has 'description' (first line) and 'text' (full block for qty/unit).
     */
    private function splitIntoItemBlocks(array $lines): array
    {
        $blocks = [];
        $current = null;

        foreach ($lines as $rawLine) {
            $line = trim($rawLine);
            if (preg_match('/^(Riepilogo|Totale|Summary|Total|Subtotal|IVA|VAT|Oneri|Spese generali)/iu', $line)) {
                continue;
            }
            if ($line === '') {
                if ($current !== null) {
                    $current['text'] .= "\n";
                }
                continue;
            }

            // Italian computo: "1 / 1", "7 / 61" (Num.Ord.) or "1.1 Description" or "1) Long description"
            $isNewItem = preg_match('/^(\d+\.\d+)\s+(.+)$/u', $line)
                || (preg_match('/^(\d+)[\.\)]\s+(.+)$/u', $line) && strlen($line) > 50)
                || preg_match('/^\d+\s*\/\s*\d+(\s|$)/u', $line);

            if ($isNewItem && $current !== null && !empty(trim($current['description']))) {
                $blocks[] = $current;
                $current = null;
            }

            if ($isNewItem) {
                // For "N / N rest of line" use full line as description start
                $current = ['description' => $line, 'text' => $line . "\n"];
            } elseif (preg_match('/^SOMMANO\s+/iu', $line) && $current !== null) {
                $current['text'] .= $line . "\n";
            } elseif ($current !== null) {
                $current['text'] .= $line . "\n";
            }
        }
        if ($current !== null && !empty(trim($current['description']))) {
            $blocks[] = $current;
        }
        return $blocks;
    }

    /**
     * True if this number in the block is from descriptive context (mm, mesi, SP, D.Lgs, peso specifico, etc.).
     */
    private function isQuantityInBlacklistedContext(string $blockText, string $numStr): bool
    {
        $numEsc = preg_quote(trim($numStr), '/');
        $block = ' ' . $blockText . ' ';
        if (preg_match('/\bmm\s*' . $numEsc . '\b|\b' . $numEsc . '\s*mm\b/iu', $block)) return true;
        if (preg_match('/\bcm\s*' . $numEsc . '\b|\b' . $numEsc . '\s*cm\b/iu', $block)) return true;
        if (preg_match('/\bmesi\s*' . $numEsc . '\b|\b' . $numEsc . '\s*mesi\b/iu', $block)) return true;
        if (preg_match('/\bdurata\b.*' . $numEsc . '|' . $numEsc . '.*\bdurata\b/iu', $block)) return true;
        if (preg_match('/\bsp\s*' . $numEsc . '\b|\b' . $numEsc . '\s*sp\b/iu', $block)) return true;
        if (preg_match('/\bD\.?\s*L\.?\s*g\.?s\.?/iu', $block) && preg_match('/\b81\b/', $block)) return true;
        if (preg_match('/81\s*\/\s*08/iu', $block)) return true;
        if (preg_match('/\bpeso\s+specifico\b.*' . $numEsc . '|' . $numEsc . '.*\bpeso\s+specifico\b/iu', $block)) return true;
        if (preg_match('/\bdensit[aà]\b.*' . $numEsc . '|' . $numEsc . '.*\bdensit[aà]\b/iu', $block)) return true;
        if (preg_match('/\bspessore\b.*' . $numEsc . '|' . $numEsc . '.*\bspessore\b/iu', $block)) return true;
        if (preg_match('/\bvia\b.*' . $numEsc . '\b|\b' . $numEsc . '.*\bvia\b/iu', $block)) return true;
        if (preg_match('/\bcod\.?\s*' . $numEsc . '\b|\b' . $numEsc . '\s*cod\.?/iu', $block)) return true;
        return false;
    }

    private function normaliseUnit(string $unit): string
    {
        $u = trim($unit);
        $map = [
            'sq m' => 'mq', 'sqm' => 'mq', 'm2' => 'm²', 'm²' => 'm²',
            'cubic m' => 'mc', 'm3' => 'mc', 'cum' => 'mc',
            'ml' => 'ml', 'metri lineari' => 'ml',
            'each' => 'cad', 'ea' => 'cad', 'lot' => 'a corpo',
            'ton' => 'ton', 'tonnellate' => 'ton',
        ];
        foreach ($map as $from => $to) {
            if (stripos($u, $from) !== false) {
                return $to;
            }
        }
        return $u;
    }

    private function isLumpSumUnit(string $unit): bool
    {
        return (bool) preg_match('/a\s*corpo|cad|lot|each|ea\b/i', $unit);
    }

    private function parseQuantity(string $raw): float
    {
        // Normalize thousand separators (apostrophe, space) and decimal comma
        $raw = str_replace(["'", '´', '`'], '', trim($raw));
        $raw = preg_replace('/\s+/', '', $raw);
        if (!preg_match('/[\d\.\,]+/', $raw, $m)) {
            return 0.0;
        }
        $num = $m[0];
        // European: 35,00 = 35.0 (decimal); 1,250 or 1.250 = 1250 (thousand)
        if (preg_match('/,\d{3}/', $num)) {
            $num = str_replace(',', '', $num);
        } elseif (preg_match('/,\d{1,2}(?:\D|$)/', $num)) {
            $num = str_replace(',', '.', $num);
        } else {
            $num = str_replace(',', '', $num);
        }
        $num = preg_replace('/\.(?=\d{3})/', '', $num);
        return (float) $num;
    }
}

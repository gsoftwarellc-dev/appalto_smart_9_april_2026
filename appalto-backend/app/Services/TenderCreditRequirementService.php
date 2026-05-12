<?php

namespace App\Services;

use App\Models\SystemConfig;
use App\Models\Tender;

class TenderCreditRequirementService
{
    private const DEFAULT_FIXED_CREDITS = 50;

    private const DEFAULT_RANGE_RULES = [
        ['budgetRange' => '0-50000', 'credits' => 10],
        ['budgetRange' => '50000-100000', 'credits' => 15],
        ['budgetRange' => '100000-250000', 'credits' => 25],
        ['budgetRange' => '250000+', 'credits' => 40],
    ];

    public function calculateForTender(Tender $tender): int
    {
        $mode = $this->getConfigValue('creditRequirementMode', 'fixed');

        if ($mode === 'budget_range') {
            return $this->calculateRangeCost($tender);
        }

        return max(0, (int) $this->getConfigValue('fixedTenderUnlockCredits', self::DEFAULT_FIXED_CREDITS));
    }

    private function calculateRangeCost(Tender $tender): int
    {
        $rules = $this->getRangeRules();
        $budgetRange = $this->normalizeBudgetRange($tender->budget);

        foreach ($rules as $rule) {
            if (($rule['budgetRange'] ?? null) === $budgetRange) {
                return max(0, (int) ($rule['credits'] ?? 0));
            }
        }

        return max(0, (int) $this->getConfigValue('fixedTenderUnlockCredits', self::DEFAULT_FIXED_CREDITS));
    }

    private function getRangeRules(): array
    {
        $raw = $this->getConfigValue('budgetRangeCreditRules', self::DEFAULT_RANGE_RULES);

        if (is_string($raw)) {
            $decoded = json_decode($raw, true);
            $raw = json_last_error() === JSON_ERROR_NONE ? $decoded : self::DEFAULT_RANGE_RULES;
        }

        return is_array($raw) ? $raw : self::DEFAULT_RANGE_RULES;
    }

    private function getConfigValue(string $key, mixed $default): mixed
    {
        $value = SystemConfig::where('key', $key)->value('value');

        if ($value === null || $value === '') {
            return $default;
        }

        return $value;
    }

    private function normalizeBudgetRange(?string $budget): string
    {
        $value = trim((string) $budget);

        if (in_array($value, ['0-50000', '50000-100000', '100000-250000', '250000+'], true)) {
            return $value;
        }

        if (is_numeric($value)) {
            $amount = (float) $value;
            if ($amount <= 50000) return '0-50000';
            if ($amount <= 100000) return '50000-100000';
            if ($amount <= 250000) return '100000-250000';
        }

        return '250000+';
    }
}

export const formatEuro = (value, options = {}) => {
    const {
        minimumFractionDigits = 2,
        maximumFractionDigits = 2,
        currencySymbol = true,
    } = options;

    if (value === null || value === undefined || value === '') {
        return currencySymbol ? '€0,00' : '0,00';
    }

    const num = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^\d.-]/g, ''));
    if (Number.isNaN(num)) {
        return String(value);
    }

    const formatted = num.toLocaleString('it-IT', {
        minimumFractionDigits,
        maximumFractionDigits,
    });

    return currencySymbol ? `€${formatted}` : formatted;
};


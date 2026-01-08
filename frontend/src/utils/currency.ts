/**
 * Currency conversion and formatting utilities
 * Base currency: USD (all costs stored in USD in database)
 */

export type SupportedLanguage = 'en' | 'no';
export type CurrencyCode = 'USD' | 'NOK';

interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  locale: string;
}

// Map languages to their respective currencies
const LANGUAGE_TO_CURRENCY: Record<SupportedLanguage, CurrencyConfig> = {
  en: {
    code: 'USD',
    symbol: '$',
    locale: 'en-US',
  },
  no: {
    code: 'NOK',
    symbol: 'kr',
    locale: 'nb-NO',
  },
};

// Exchange rates relative to USD (1 USD = X currency)
const EXCHANGE_RATES: Record<CurrencyCode, number> = {
  USD: 1,
  NOK: 11.0, // 1 USD ≈ 11 NOK (approximate rate)
};

/**
 * Get currency configuration for a given language
 */
export function getCurrencyConfig(language: SupportedLanguage): CurrencyConfig {
  return LANGUAGE_TO_CURRENCY[language] || LANGUAGE_TO_CURRENCY.en;
}

/**
 * Convert from local currency to USD (for storing in database)
 */
export function convertToUSD(amount: number, language: SupportedLanguage): number {
  const currencyConfig = getCurrencyConfig(language);
  const rate = EXCHANGE_RATES[currencyConfig.code];

  // Convert to USD
  const usdAmount = amount / rate;

  // Round to 2 decimal places to avoid precision issues
  return Math.round(usdAmount * 100) / 100;
}

/**
 * Convert from USD to local currency (for display)
 */
export function convertFromUSD(usdAmount: number, language: SupportedLanguage): number {
  const currencyConfig = getCurrencyConfig(language);
  const rate = EXCHANGE_RATES[currencyConfig.code];

  // Convert from USD
  const localAmount = usdAmount * rate;

  // Round to 2 decimal places
  return Math.round(localAmount * 100) / 100;
}

/**
 * Format currency amount with proper locale-specific formatting
 */
export function formatCurrency(amount: number, language: SupportedLanguage): string {
  const currencyConfig = getCurrencyConfig(language);

  const formatter = new Intl.NumberFormat(currencyConfig.locale, {
    style: 'currency',
    currency: currencyConfig.code,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return formatter.format(amount);
}

/**
 * Format USD amount as local currency with proper formatting
 * This is the main function to use for displaying costs
 */
export function formatUSDAsLocalCurrency(usdAmount: number, language: SupportedLanguage): string {
  const localAmount = convertFromUSD(usdAmount, language);
  return formatCurrency(localAmount, language);
}

/**
 * Get currency symbol for a given language
 */
export function getCurrencySymbol(language: SupportedLanguage): string {
  return getCurrencyConfig(language).symbol;
}

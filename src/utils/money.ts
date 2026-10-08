const AMOUNT_PATTERN = /^([+-]?)(\d+|\d{1,3}(?:\.\d{3})+)(?:[,.](\d{1,2}))?$/

export function stripCurrencyPrefix(raw: string): string {
  return raw.replace(/^€[\s\u00a0]*/, '').trim()
}

export function parseAmountToCents(raw: string): number | null {
  const match = AMOUNT_PATTERN.exec(stripCurrencyPrefix(raw))
  if (!match) return null

  const [, sign, integerPart, fractionPart] = match

  if (integerPart.includes('.') && fractionPart === undefined) return null

  const whole = Number(integerPart.replaceAll('.', ''))
  const fraction = fractionPart === undefined ? 0 : Number(fractionPart.padEnd(2, '0'))
  const cents = whole * 100 + fraction

  return sign === '-' ? -cents : cents
}

const euroFormatter = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' })

const ZERO_EURO = '€' + String.fromCharCode(160) + '0,00'

export function formatCents(cents: number): string {
  if (!Number.isFinite(cents)) return ZERO_EURO
  return euroFormatter.format(cents / 100)
}

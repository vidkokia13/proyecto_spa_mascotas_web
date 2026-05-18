export function truncate(str: string, max = 60): string {
  return str.length > max ? str.slice(0, max) + '…' : str
}

export function capitalize(str: string): string {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

export function formatCurrency(amount: number | null | undefined): string {
  if (amount == null) return '—'
  return new Intl.NumberFormat('es-UY', {
    style:    'currency',
    currency: 'UYU',
  }).format(amount)
}

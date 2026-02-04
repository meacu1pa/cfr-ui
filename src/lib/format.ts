const percentFormat = new Intl.NumberFormat("en-US", {
  style: "percent",
  maximumFractionDigits: 2,
})

const numberFormat = new Intl.NumberFormat("en-US")

export function formatPercent(value: number) {
  return percentFormat.format(value)
}

export function formatNumber(value: number) {
  return numberFormat.format(value)
}

export function formatDate(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleString()
}

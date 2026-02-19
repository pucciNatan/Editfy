// src/lib/formatters.ts
export function formatBRL(value: number | string): string {
  const n = typeof value === "string" ? Number(value) : value;
  if (!isFinite(n)) return "-";
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function portfolioPriceDisplay(
  price_display: string | null,
  fixed_price: string | null,
  min_price: string | null,
  max_price: string | null
): string {
  // prioridade ao que vem pronto do backend
  if (price_display && price_display.trim()) return price_display;

  if (fixed_price) return formatBRL(fixed_price);

  if (min_price && max_price) return `${formatBRL(min_price)} – ${formatBRL(max_price)}`;
  if (min_price) return `A partir de ${formatBRL(min_price)}`;
  if (max_price) return `Até ${formatBRL(max_price)}`;

  return "Preço sob consulta";
}

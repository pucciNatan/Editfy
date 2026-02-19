export function parseBRLToDecimalString(v: string | number | null | undefined): string | null {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "number") return v.toFixed(2);
  // remove "R$" e espaços
  let s = v.replace(/\s+/g, "").replace(/^R\$/, "");
  // normaliza milhar/ponto e vírgula decimal: "1.234.567,89" -> "1234567.89"
  s = s.replace(/\./g, "").replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) ? n.toFixed(2) : null;
}

export function formatToBRL(v: string | number | null | undefined): string {
  if (v === null || v === undefined || v === "") return "";
  const n = typeof v === "string" ? Number(v) : v;
  if (!Number.isFinite(n)) return "";
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });
}
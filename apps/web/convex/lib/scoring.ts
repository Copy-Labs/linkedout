export function toxicityIndex(weightedTotal: number, total: number): number {
  if (total === 0) return 0;
  return Math.min(100, Math.round((weightedTotal / (total * 6)) * 100));
}

export function confidenceFor(
  total: number,
): "low" | "medium" | "high" {
  return total < 3 ? "low" : total < 10 ? "medium" : "high";
}

// Label batch serial reseller: BATCH-YYYY-MM-DD (lihat CONTEXT.md Batch).

export function todayBatchLabel(date: Date = new Date()): string {
  return `BATCH-${date.toISOString().slice(0, 10)}`;
}

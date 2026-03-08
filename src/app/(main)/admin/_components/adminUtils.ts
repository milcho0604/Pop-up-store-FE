export function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

export function toDatetimeLocal(dateStr?: string) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 16);
}

export function fromDatetimeLocal(value: string) {
  if (!value) return '';
  return value.replace('T', ' ') + ':00';
}

export const statusLabel: Record<string, { text: string; color: string }> = {
  PENDING:  { text: '대기중', color: 'bg-yellow-100 text-yellow-700' },
  APPROVED: { text: '승인됨', color: 'bg-green-100 text-green-700' },
  REJECTED: { text: '반려됨', color: 'bg-red-100 text-red-700' },
};

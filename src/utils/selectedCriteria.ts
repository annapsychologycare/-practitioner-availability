// Shared by filtering and the staff-only result explanation. Preserve the
// existing comparators exactly; a missing listing is not a treatment exclusion.
export function matchesPresentation(value: unknown, selected: string): boolean {
  const text = (value == null ? '' : typeof value === 'string' ? value : Array.isArray(value) ? value.join(' ') : String(value)).toLowerCase();
  return text.includes(selected.toLowerCase());
}

export function matchesModality(value: unknown, selected: string): boolean {
  const entries: string[] = Array.isArray(value) ? value : typeof value === 'string' ? value.split(/[,\n]/).map(s => s.trim()).filter(Boolean) : [];
  if (entries.some(m => m.toLowerCase() === selected.toLowerCase())) return true;
  const key = selected.toLowerCase()
    .replace(/^emdr.*/, 'eye movement')
    .replace(/^humanistic.*/, 'humanistic')
    .replace(/^trauma-informed.*/, 'trauma')
    .replace(/^internal family systems.*/, 'internal family systems')
    .replace(/^intensive short.term dynamic.*/, 'intensive short');
  return key.length > 15 && entries.join(' ').toLowerCase().includes(key);
}

export function selectedCriteriaBreakdown(value: unknown, selected: string[], matches: (value: unknown, selected: string) => boolean) {
  return {
    matched: selected.filter(item => matches(value, item)),
    notListed: selected.filter(item => !matches(value, item)),
    total: selected.length,
  };
}

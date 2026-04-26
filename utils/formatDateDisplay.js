export function formatDateDisplay(value) {
  const text = String(value ?? '').trim();
  if (text === '') return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return text.replace(/-/g, '/');
  }
  return text;
}
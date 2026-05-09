import dayjs from 'dayjs';

export function formatDateTime(value?: string | null) {
  if (!value) {
    return '-';
  }

  return dayjs(value).format('YYYY-MM-DD HH:mm:ss');
}

export function stringifyMetadata(value: unknown) {
  if (value === null || value === undefined) {
    return '-';
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

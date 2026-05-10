/**
 * Shared utility functions used across the ExamForge client.
 */

/**
 * Format a date string into a readable format.
 * e.g. "Jan 15, 2026 · 10:00 AM"
 * @param {string|Date} dateString
 * @returns {string}
 */
export function formatDate(dateString) {
  if (!dateString) return '—';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '—';

  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).replace(',', ' ·');
}

/**
 * Format duration in minutes to human-readable string.
 * e.g. 90 → "1h 30m", 30 → "30m"
 * @param {number} minutes
 * @returns {string}
 */
export function formatDuration(minutes) {
  if (!minutes || minutes <= 0) return '—';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/**
 * Generate a random 6-character uppercase alphanumeric access code.
 * (Mirrors server utility for client-side preview purposes)
 * @returns {string}
 */
export function generateAccessCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

/**
 * Calculate violation severity level.
 * @param {number} count
 * @returns {'none' | 'low' | 'medium' | 'high'}
 */
export function calculateViolationSeverity(count) {
  if (!count || count === 0) return 'none';
  if (count <= 2) return 'low';
  if (count <= 5) return 'medium';
  return 'high';
}

/**
 * Extract a user-friendly error message from an Axios error.
 * @param {Error} error - Axios error object
 * @param {string} fallback - Fallback message
 * @returns {string}
 */
export function getErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  if (!error) return fallback;
  if (error.response?.data?.message) return error.response.data.message;
  if (error.message) return error.message;
  return fallback;
}

/**
 * Export data as a CSV file download.
 * @param {string[][]} rows - 2D array of data (first row = headers)
 * @param {string} filename
 */
export function exportCSV(rows, filename = 'export.csv') {
  const csvContent = rows
    .map((row) =>
      row.map((cell) => {
        const str = String(cell ?? '');
        return str.includes(',') || str.includes('"') || str.includes('\n')
          ? `"${str.replace(/"/g, '""')}"`
          : str;
      }).join(',')
    )
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

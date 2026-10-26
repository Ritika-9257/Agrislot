/**
 * AgriSlot CSV Formatter & Sanitizer
 * Implements RFC 4180 escaping and mitigates CSV Formula Injection (CWE-1236).
 */

/**
 * Sanitize a cell value to prevent spreadsheet formula injection.
 * Prepend a single quote if string starts with dangerous formula prefixes (=, +, -, @, \t, \r).
 */
function sanitizeCell(val) {
  if (val === null || val === undefined) {
    return '';
  }

  let str = String(val);

  // Prevent formula injection in spreadsheet applications (Excel, Google Sheets, LibreOffice)
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }

  // If contains commas, double quotes, or newlines, quote the field and double internal quotes
  if (/[",\n\r]/.test(str)) {
    str = `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

/**
 * Convert an array of record objects to a valid CSV string.
 * @param {Array<Object>} records - Array of data rows
 * @param {Array<{ key: string, label: string }>} columns - Ordered column definitions
 * @returns {string} Safe CSV content
 */
function toCsv(records = [], columns = null) {
  if (!records || records.length === 0) {
    if (columns && columns.length > 0) {
      return columns.map(c => sanitizeCell(c.label)).join(',') + '\r\n';
    }
    return '';
  }

  // Derive columns if not provided
  const cols = columns || Object.keys(records[0]).map(k => ({ key: k, label: k }));

  // Header line
  const header = cols.map(c => sanitizeCell(c.label)).join(',');

  // Data lines
  const rows = records.map(record => {
    return cols.map(c => sanitizeCell(record[c.key])).join(',');
  });

  return [header, ...rows].join('\r\n') + '\r\n';
}

module.exports = {
  sanitizeCell,
  toCsv
};

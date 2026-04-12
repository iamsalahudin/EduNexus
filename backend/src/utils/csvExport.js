/**
 * Utility functions for exporting data to CSV format
 */

/**
 * Convert array of objects to CSV string
 * @param {Array} data - Array of objects
 * @param {Array} headers - Array of header objects: { key: 'fieldName', label: 'Display Name' }
 * @returns {string} CSV string
 */
function arrayToCSV(data, headers) {
  if (!Array.isArray(data) || data.length === 0) {
    return headers.map(h => h.label).join(',');
  }

  // Header row
  const headerRow = headers.map(h => escapeCSVField(h.label)).join(',');

  // Data rows
  const dataRows = data.map(row => {
    return headers.map(h => {
      const value = getNestedValue(row, h.key);
      return escapeCSVField(value);
    }).join(',');
  });

  return [headerRow, ...dataRows].join('\n');
}

/**
 * Get nested value from object using dot notation
 * @param {Object} obj - Object to extract value from
 * @param {string} path - Dot notation path (e.g., 'user.name')
 * @returns {*} Value at path or empty string
 */
function getNestedValue(obj, path) {
  if (!path) return '';
  
  const keys = path.split('.');
  let value = obj;
  
  for (const key of keys) {
    if (value == null) return '';
    value = value[key];
  }
  
  if (value == null) return '';
  if (value instanceof Date) return value.toISOString().split('T')[0];
  if (typeof value === 'object') return JSON.stringify(value);
  
  return String(value);
}

/**
 * Escape CSV field to handle commas, quotes, and newlines
 * @param {*} field - Field value
 * @returns {string} Escaped field
 */
function escapeCSVField(field) {
  if (field == null) return '';
  
  const str = String(field);
  
  // If field contains comma, quote, or newline, wrap in quotes and escape quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  
  return str;
}

/**
 * Set CSV response headers
 * @param {Object} res - Express response object
 * @param {string} filename - Filename for download
 */
function setCSVHeaders(res, filename) {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
}

module.exports = {
  arrayToCSV,
  getNestedValue,
  escapeCSVField,
  setCSVHeaders
};

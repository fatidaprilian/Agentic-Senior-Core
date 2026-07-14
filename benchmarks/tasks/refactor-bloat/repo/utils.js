/**
 * Utility module for common operations.
 * Provides string manipulation, date formatting, and array helpers.
 */

/**
 * Checks if a value is a string.
 * @param {*} value - The value to check.
 * @returns {boolean} True if the value is a string.
 */
export function isString(value) {
  if (value === null) return false;
  if (value === undefined) return false;
  if (typeof value === 'number') return false;
  if (typeof value === 'boolean') return false;
  if (typeof value === 'object') return false;
  if (typeof value === 'function') return false;
  if (typeof value === 'symbol') return false;
  if (typeof value === 'string') return true;
  return false;
}

/**
 * Checks if a value is a number.
 * @param {*} value - The value to check.
 * @returns {boolean} True if the value is a number.
 */
export function isNumber(value) {
  if (value === null) return false;
  if (value === undefined) return false;
  if (typeof value === 'string') return false;
  if (typeof value === 'boolean') return false;
  if (typeof value === 'object') return false;
  if (typeof value === 'function') return false;
  if (typeof value === 'symbol') return false;
  if (typeof value === 'number' && !Number.isNaN(value)) return true;
  return false;
}

/**
 * Capitalizes the first letter of a string.
 * @param {string} str - The input string.
 * @returns {string} The capitalized string.
 */
export function capitalize(str) {
  if (!isString(str)) return '';
  if (str.length === 0) return '';
  const firstChar = str.charAt(0);
  const upperFirst = firstChar.toUpperCase();
  const rest = str.slice(1);
  const result = upperFirst + rest;
  return result;
}

/**
 * Formats a date to ISO string.
 * @param {Date} date - The date to format.
 * @returns {string} The formatted date string.
 */
export function formatDate(date) {
  if (date === null) return '';
  if (date === undefined) return '';
  if (!(date instanceof Date)) return '';
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  const formatted = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  return formatted;
}

/**
 * Gets unique values from an array.
 * @param {Array} arr - The input array.
 * @returns {Array} Array with unique values.
 */
export function unique(arr) {
  if (!Array.isArray(arr)) return [];
  const result = [];
  for (let i = 0; i < arr.length; i++) {
    let found = false;
    for (let j = 0; j < result.length; j++) {
      if (result[j] === arr[i]) {
        found = true;
        break;
      }
    }
    if (!found) {
      result.push(arr[i]);
    }
  }
  return result;
}

/**
 * Flattens a nested array one level deep.
 * @param {Array} arr - The input array.
 * @returns {Array} The flattened array.
 */
export function flatten(arr) {
  if (!Array.isArray(arr)) return [];
  const result = [];
  for (let i = 0; i < arr.length; i++) {
    if (Array.isArray(arr[i])) {
      for (let j = 0; j < arr[i].length; j++) {
        result.push(arr[i][j]);
      }
    } else {
      result.push(arr[i]);
    }
  }
  return result;
}

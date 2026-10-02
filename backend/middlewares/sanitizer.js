const xss = require('xss');

/**
 * Custom XSS options preserving standard Vietnamese diacritics and safe punctuation
 */
const xssOptions = {
  whiteList: {}, // Strips all HTML tags by default for clean text inputs
  stripIgnoreTag: true,
  stripIgnoreTagBody: ['script', 'style'],
};

const xssFilter = new xss.FilterXSS(xssOptions);

/**
 * Recursively sanitize strings inside objects, arrays, and primitive values
 */
const sanitizeValue = (value) => {
  if (typeof value === 'string') {
    return xssFilter.process(value.trim());
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }
  if (value !== null && typeof value === 'object') {
    const cleaned = {};
    for (const key of Object.keys(value)) {
      // Prevent prototype pollution
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        continue;
      }
      cleaned[key] = sanitizeValue(value[key]);
    }
    return cleaned;
  }
  return value;
};

/**
 * Express middleware to sanitize req.body, req.query, and req.params
 */
const sanitizeInputs = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeValue(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeValue(req.query);
  }
  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeValue(req.params);
  }
  next();
};

module.exports = {
  sanitizeInputs,
};

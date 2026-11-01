/**
 * Utility to convert JSON objects or arrays into well-formed XML
 * Formats database query results as well-formed XML for export and integration.
 */

function escapeXml(unsafe) {
  if (unsafe === null || unsafe === undefined) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function objectToXml(obj, nodeName = 'item') {
  if (obj === null || obj === undefined) {
    return `<${nodeName}></${nodeName}>`;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => objectToXml(item, nodeName)).join('\n');
  }

  if (typeof obj === 'object') {
    let xml = `  <${nodeName}>\n`;
    for (const [key, value] of Object.entries(obj)) {
      const sanitizedKey = key.replace(/[^a-zA-Z0-9_]/g, '_');
      if (typeof value === 'object' && value !== null) {
        xml += `    ${objectToXml(value, sanitizedKey)}\n`;
      } else {
        xml += `    <${sanitizedKey}>${escapeXml(value)}</${sanitizedKey}>\n`;
      }
    }
    xml += `  </${nodeName}>`;
    return xml;
  }

  return `<${nodeName}>${escapeXml(obj)}</${nodeName}>`;
}

function toXmlDocument(data, rootElement = 'AgriSlotData', itemName = 'Record') {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += `<${rootElement}>\n`;
  if (Array.isArray(data)) {
    xml += objectToXml(data, itemName) + '\n';
  } else {
    xml += objectToXml(data, itemName) + '\n';
  }
  xml += `</${rootElement}>`;
  return xml;
}

module.exports = {
  escapeXml,
  objectToXml,
  toXmlDocument
};

const fs = require('fs');
const path = require('path');

function validateFile(filePath) {
  const src = fs.readFileSync(filePath, 'utf8');
  let inString = false;
  let stringChar = '';
  let braceDepth = 0;
  let i = 0;
  const tagStack = [];

  while (i < src.length) {
    const c = src[i];

    if (inString) {
      if (c === '\\') { i += 2; continue; }
      if (c === stringChar) { inString = false; }
      i++;
      continue;
    }

    if (c === '"' || c === "'" || c === '`') {
      inString = true;
      stringChar = c;
      i++;
      continue;
    }

    if (c === '{') {
      braceDepth++;
      i++;
      continue;
    }

    if (c === '}') {
      braceDepth--;
      i++;
      continue;
    }

    if (braceDepth === 0 && c === '<') {
      if (src.slice(i, i + 4) === '<!--') {
        i = src.indexOf('-->', i) + 3;
        continue;
      }
      if (src[i + 1] === '/') {
        const closeEnd = src.indexOf('>', i);
        const tagName = src.slice(i + 2, closeEnd).trim().split(/\s+/)[0];
        const last = tagStack.pop();
        if (last !== tagName) {
          const line = src.slice(0, i).split('\n').length;
          console.error(`MISMATCH at line ${line} in ${filePath}: expected </${last}> but got </${tagName}>`);
          return false;
        }
        i = closeEnd + 1;
        continue;
      }

      let j = i + 1;
      let innerBraces = 0;
      let inInnerStr = false;
      let innerStrChar = '';
      while (j < src.length) {
        const jc = src[j];
        if (inInnerStr) {
          if (jc === '\\') { j += 2; continue; }
          if (jc === innerStrChar) inInnerStr = false;
          j++;
          continue;
        }
        if (jc === '"' || jc === "'" || jc === '`') {
          inInnerStr = true;
          innerStrChar = jc;
          j++;
          continue;
        }
        if (jc === '{') { innerBraces++; j++; continue; }
        if (jc === '}') { innerBraces--; j++; continue; }
        if (innerBraces === 0 && jc === '>') {
          break;
        }
        j++;
      }

      const tagContent = src.slice(i + 1, j).trim();
      const tagName = tagContent.split(/[\s>/]+/)[0];
      const isSelfClosing = tagContent.endsWith('/') || ['img', 'input', 'br', 'hr'].includes(tagName);

      if (!isSelfClosing && tagName && /^[A-Za-z0-9_\-\.]+$/.test(tagName)) {
        tagStack.push(tagName);
      }
      i = j + 1;
      continue;
    }

    i++;
  }

  if (tagStack.length > 0) {
    console.error(`Unclosed tags in ${filePath}:`, tagStack);
    return false;
  }
  console.log(`✓ ${filePath} JSX tags are 100% matched!`);
  return true;
}

const allValid = [
  'frontend/src/app/page.jsx',
  'frontend/src/app/farmer/page.jsx',
  'frontend/src/app/admin/page.jsx',
  'frontend/src/app/verify/page.jsx',
  'frontend/src/app/analytics/page.jsx',
  'frontend/src/app/layout.jsx',
  'frontend/src/components/Sidebar.jsx',
  'frontend/src/components/Header.jsx',
  'frontend/src/components/AuthModal.jsx',
  'frontend/src/components/GatePassModal.jsx',
  'frontend/src/components/SmsNotificationModal.jsx'
].every(validateFile);

process.exit(allValid ? 0 : 1);

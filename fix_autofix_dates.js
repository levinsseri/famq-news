const fs = require('fs');
let code = fs.readFileSync('lib/assistant-inspector.ts', 'utf8');

const fixDates = `
  // Fix dates in spoilers: remove year if present. _||11.08.2026||_ -> _||11.08||_
  fixed = fixed.replace(/_\\|\\|(\\d{2}\\.\\d{2})\\.(?:\\d{2}|\\d{4})\\|\\|_/g, '_||$1||_');
`;

const insertIndex = code.indexOf('// Restore Discord mentions safely');
if (insertIndex !== -1) {
  code = code.substring(0, insertIndex) + fixDates + '\n  ' + code.substring(insertIndex);
}

fs.writeFileSync('lib/assistant-inspector.ts', code);

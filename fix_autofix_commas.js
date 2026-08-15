const fs = require('fs');
let code = fs.readFileSync('lib/assistant-inspector.ts', 'utf8');

const fixBoldCommas = `
  // Fix commas at the end of bold tags: **text,** -> **text**,
  fixed = fixed.replace(/\\*\\*([^\\*]+?),\\s*\\*\\*/g, '**$1**, ');
  // Clean up potential double spaces we might have introduced
  fixed = fixed.replace(/\\s{2,}/g, ' ');
`;

const insertIndex = code.indexOf('// Restore Discord mentions safely');
if (insertIndex !== -1) {
  code = code.substring(0, insertIndex) + fixBoldCommas + '\n  ' + code.substring(insertIndex);
}

fs.writeFileSync('lib/assistant-inspector.ts', code);

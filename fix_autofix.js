const fs = require('fs');
let code = fs.readFileSync('lib/assistant-inspector.ts', 'utf8');

// Remove time format autofix
code = code.replace(/\/\/ 10e\. Fix time format[\s\S]*?(?=\/\/ 10f)/, '');

fs.writeFileSync('lib/assistant-inspector.ts', code);

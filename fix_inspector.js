const fs = require('fs');
let code = fs.readFileSync('lib/assistant-inspector.ts', 'utf8');

// 1. Remove time_format issue
code = code.replace(/\/\/ 22\. Time format check[\s\S]*?(?=\/\/ 23\. Number \+ word)/, '');

// 2. Add checking for commas in bold
const commaBoldCheck = `
  // Запятые внутри bold
  if (/\\*\\*[^*]+?,[^*]*?\\*\\*/.test(text)) {
    score -= 10;
    issues.push({
      id: 'comma_in_bold',
      type: 'warning',
      title: 'Запятая внутри выделения жирным',
      description: 'Согласно регламенту, запятые не должны находиться внутри жирного выделения (**текст,**). Запятую следует выносить наружу (**текст**,).',
      fixable: false,
    });
  }
`;

// 3. Add checking for GOS verbs
const gosVerbsCheck = `
  // ГОС Фракции: окончание "И"
  if (/(?:LSPD|EMS|LSCSD|SANG|GOV|WN|FIB)[^.!?\\n]{0,30}\\b(отбила|напала|выиграла|забрала|удержала|сделала|собрала|запушила|перекрыла)\\b/i.test(text)) {
    score -= 15;
    issues.push({
      id: 'gos_verb_ending',
      type: 'critical',
      title: 'Ошибка окончания у Гос. структуры',
      description: 'Гос. организации (LSPD, EMS, SANG и т.д.) ВСЕГДА пишутся с глаголом на «И» (даже если фракция одна: «отбилИ», «напалИ»), а не «отбила» / «напала».',
      fixable: false,
    });
  }
`;

// 4. Add checking for year in date
const dateYearCheck = `
  // Даты и ссылки: Год в дате
  if (/_\\|\\|\\d{2}\\.\\d{2}\\.\\d{2,4}\\|\\|_/.test(text)) {
    score -= 15;
    issues.push({
      id: 'date_has_year',
      type: 'critical',
      title: 'Год в дате под спойлером',
      description: 'Дата под спойлером всегда пишется без года (например, _||02.09||_).',
      fixable: false,
    });
  }
`;

// 5. Add Crime ending info
const crimeEndingInfo = `
  // Крайм окончания
  if (/(?:перекрыл[аи]|убил[аи]|забрал[аи]|напал[аи]|отбил[аи])/i.test(text) && !/(?:LSPD|EMS|LSCSD|SANG|GOV|WN|FIB)/i.test(text)) {
    issues.push({
      id: 'crime_verb_ending_info',
      type: 'info',
      title: 'Проверьте окончания у Крайм/Семей',
      description: 'Крайм и Семьи: В соло действие пишется с окончанием «А» («перекрылА», «убилА»). Если был союз (2+ фракции/семьи) — с окончанием «И» («перекрылИ»). Убедитесь, что окончание верное.',
      fixable: false,
    });
  }
`;

// Insert these checks before "// Success state if no issues found"
const index = code.indexOf('// Success state if no issues found');
if (index !== -1) {
  code = code.substring(0, index) + commaBoldCheck + gosVerbsCheck + dateYearCheck + crimeEndingInfo + '\n  ' + code.substring(index);
}

fs.writeFileSync('lib/assistant-inspector.ts', code);

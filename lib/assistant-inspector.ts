export interface AuditIssue {
  id: string;
  type: 'critical' | 'warning' | 'info' | 'success';
  title: string;
  description: string;
  fixable: boolean;
}

function damerauLevenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      const cost = b.charAt(i - 1) === a.charAt(j - 1) ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
      if (i > 1 && j > 1 && b.charAt(i - 1) === a.charAt(j - 2) && b.charAt(i - 2) === a.charAt(j - 1)) {
        matrix[i][j] = Math.min(matrix[i][j], matrix[i - 2][j - 2] + cost); // transposition
      }
    }
  }
  return matrix[b.length][a.length];
}

const EN_LAYOUT = "qwertyuiop[]asdfghjkl;'zxcvbnm,./";
const RU_LAYOUT = "йцукенгшщзхъфывапролджэячсмитьбю.";

function translateKeyboard(text: string): string {
  let result = '';
  for (const char of text) {
    const isUpper = char === char.toUpperCase();
    const c = char.toLowerCase();
    let idx = EN_LAYOUT.indexOf(c);
    if (idx !== -1) {
      result += isUpper ? RU_LAYOUT[idx].toUpperCase() : RU_LAYOUT[idx];
      continue;
    }
    idx = RU_LAYOUT.indexOf(c);
    if (idx !== -1) {
      result += isUpper ? EN_LAYOUT[idx].toUpperCase() : EN_LAYOUT[idx];
      continue;
    }
    result += char;
  }
  return result;
}

export function fuzzyIncludes(text: string, phrase: string): boolean {
  if (!text || !phrase) return false;

  const rawText = text.toLowerCase().trim();
  const rawPhrase = phrase.toLowerCase().trim();
  if (!rawPhrase) return true;

  // 1. Direct substring match
  if (rawText.includes(rawPhrase)) return true;

  // 2. Keyboard layout translation (EN <-> RU misclicks e.g. "ghbdtn" -> "привет")
  const transText = translateKeyboard(rawText);
  const transPhrase = translateKeyboard(rawPhrase);

  if (transText.includes(rawPhrase) || rawText.includes(transPhrase) || transText.includes(transPhrase)) {
    return true;
  }

  // Clean strings for tokenization
  const cleanText = rawText.replace(/[^a-zа-яё0-9\s]/gi, ' ');
  const cleanPhrase = rawPhrase.replace(/[^a-zа-яё0-9\s]/gi, ' ');

  const textWords = cleanText.split(/\s+/).filter(Boolean);
  const transTextWords = transText.replace(/[^a-zа-яё0-9\s]/gi, ' ').split(/\s+/).filter(Boolean);
  const phraseWords = cleanPhrase.split(/\s+/).filter(Boolean);
  const transPhraseWords = transPhrase.replace(/[^a-zа-яё0-9\s]/gi, ' ').split(/\s+/).filter(Boolean);

  if (phraseWords.length === 0) return false;

  // Dynamic tolerance based on query word length
  const getTolerance = (len: number) => {
    if (len <= 3) return 0; // Exact match required for <= 3 chars
    return 1; // Strictly 1 typo max for 4+ char words to prevent "нападение" matching "наказани"
  };

  const isWordMatch = (tw: string, pw: string) => {
    if (!tw || !pw) return false;
    if (tw === pw) return true;

    // Stemming / prefix match
    if (tw.length >= pw.length && pw.length >= 3 && tw.startsWith(pw)) return true;
    if (pw.length >= 4 && tw.length >= 4 && pw.startsWith(tw)) return true;

    // First letter MUST match unless keyboard layout changed
    if (tw[0] !== pw[0] && tw[0] !== transPhrase[0]) return false;

    const tolerance = getTolerance(pw.length);
    if (tolerance === 0) return false;

    // Length boundary filter
    if (Math.abs(tw.length - pw.length) > tolerance + 1) return false;

    // Damerau-Levenshtein distance
    if (damerauLevenshteinDistance(tw, pw) <= tolerance) return true;

    // Compare prefix with tolerance for stemming with typos
    if (tw.length >= pw.length && pw.length >= 4) {
      const sub = tw.substring(0, pw.length);
      if (damerauLevenshteinDistance(sub, pw) <= tolerance) return true;
    }

    return false;
  };

  const isCandidateMatch = (tw: string, pw: string, tpw: string) => {
    return isWordMatch(tw, pw) || isWordMatch(tw, tpw);
  };

  const allTextWords = [...textWords, ...transTextWords];

  const phraseToTest = phraseWords.map((pw, i) => ({
    pw,
    tpw: transPhraseWords[i] || pw,
  }));

  // All query words must match at least one word in target text
  const allWordsMatched = phraseToTest.every(({ pw, tpw }) => {
    return allTextWords.some((tw) => isCandidateMatch(tw, pw, tpw));
  });

  if (allWordsMatched) return true;

  // Fallback sliding window for phrase level typos on longer strings
  if (rawPhrase.length > 5) {
    const margin = 2;
    const len = rawPhrase.length;
    for (let i = 0; i <= rawText.length - len + margin; i++) {
      const windowStr = rawText.substring(i, i + len + margin).trim();
      if (windowStr.length >= 3) {
        if (damerauLevenshteinDistance(windowStr, rawPhrase) <= getTolerance(rawPhrase.length)) {
          return true;
        }
      }
    }
  }

  return false;
}

export interface CategoryCheckItem {
  label: string;
  present: boolean;
}

export interface AuditResult {
  categoryLabel: string;
  categoryIcon: string;
  matchConfidence: number;
  matchedKeywords: string[];
  requiredFields: CategoryCheckItem[];
  score: number;
  issues: AuditIssue[];
  stats: {
    length: number;
    words: number;
    lines: number;
    emojisCount: number;
    hasSourceLink: boolean;
    hasDateSpoiler: boolean;
    unbalancedTags: boolean;
  };
}

/**
  Checks balance of Discord Markdown formatting tags:
  - Code blocks ```
  - Inline code `
  - Spoilers ||
  - Bold **
  - Italics _ and *
 */
export function checkDiscordMarkdownBalance(text: string): { isUnbalanced: boolean; details?: string } {
  if (!text || !text.trim()) return { isUnbalanced: false };

  // 1. Strip Custom Discord Emojis: <:name:id> or <a:name:id>
  let clean = text.replace(/<a?:[a-zA-Z0-9_]+:\d+>/g, ' ');

  // 2. Strip Discord Mention tags: <@1234>, <@!1234>, <@&1234>, <#1234>
  clean = clean.replace(/<@[!&]?\d+>/g, ' ').replace(/<#\d+>/g, ' ');

  // 3. Strip URLs: https://t.me/... or <https://t.me/...>
  clean = clean.replace(/<?https?:\/\/[^\s|<>]+>?/g, ' ');

  // 4. Strip Date Spoilers: _||08.08||_ or _||08.08.2026||_ or ||08.08||
  clean = clean.replace(/_?\|\|\d{2}\.\d{2}(\.\d{2,4})?\|\|_?/g, ' ');

  // 5. Check Code blocks ```
  const codeBlocks = (clean.match(/```/g) || []).length;
  if (codeBlocks % 2 !== 0) {
    return { isUnbalanced: true, details: 'Не закрыт блок кода ``` (найден непарный элемент ```)' };
  }
  clean = clean.replace(/```[\s\S]*?```/g, ' ');

  // 6. Check Inline code `
  const inlineCode = (clean.match(/`/g) || []).length;
  if (inlineCode % 2 !== 0) {
    return { isUnbalanced: true, details: 'Не закрыт однострочный код ` (найден непарный символ `)' };
  }
  clean = clean.replace(/`.*?`/g, ' ');

  // 7. Check Spoilers ||
  const spoilers = (clean.match(/\|\|/g) || []).length;
  if (spoilers % 2 !== 0) {
    return { isUnbalanced: true, details: 'Не закрыт спойлер || (найден непарный символ ||)' };
  }
  clean = clean.replace(/\|\|.*?\|\|/g, ' ');

  // 8. Check Bold **
  const boldCount = (clean.match(/\*\*/g) || []).length;
  if (boldCount % 2 !== 0) {
    return { isUnbalanced: true, details: 'Нарушена парность жирного шрифта ** (пропущен открывающий или закрывающий маркер **)' };
  }

  // 9. Check Italics _ (after replacing bold ** to avoid confusing underscore near asterisks)
  const textWithoutBold = clean.replace(/\*\*/g, ' ');
  const underscoreCount = (textWithoutBold.match(/_/g) || []).length;
  if (underscoreCount % 2 !== 0) {
    return { isUnbalanced: true, details: 'Нарушена парность курсива _ (пропущен открывающий или закрывающий символ _)' };
  }

  // 10. Check Single Asterisk Italics * (excluding **)
  const singleAsterisks = (textWithoutBold.match(/\*/g) || []).length;
  if (singleAsterisks % 2 !== 0) {
    return { isUnbalanced: true, details: 'Нарушена парность курсива * (найден непарный символ *)' };
  }

  return { isUnbalanced: false };
}

/**
  Audit assistant v1.8.0 for news posts formatting, grammar and style rules
 */
export function runAssistantAudit(text: string): AuditResult {
  if (!text || !text.trim()) {
    return {
      categoryLabel: 'Черновик',
      categoryIcon: '📝',
      matchConfidence: 100,
      matchedKeywords: [],
      requiredFields: [],
      score: 100,
      issues: [],
      stats: {
        length: 0,
        words: 0,
        lines: 0,
        emojisCount: 0,
        hasSourceLink: false,
        hasDateSpoiler: false,
        unbalancedTags: false,
      },
    };
  }

  const lower = text.toLowerCase();
  const issues: AuditIssue[] = [];
  let score = 100;

  // Category classification definitions with phrases and keywords
  interface CategoryScoreDef {
    label: string;
    icon: string;
    phrases: string[];
    keywords: string[];
  }

  const categoryScoreDefs: CategoryScoreDef[] = [
    {
      label: 'Поставки и Крафт',
      icon: '📦',
      phrases: [
        'нападение на поставку',
        'отбила нападение',
        'отбил нападение',
        'перекрыла поставку',
        'перекрыл поставку',
        'отбитие поставки',
        'перехват поставки',
        'поставка от',
        'нападение от',
        'отбила от',
        'перекрыла от',
        'совершила нападение',
        'успешно отбила',
        'успешно перекрыла',
        'материалы для крафта',
        'крафт матов',
        'нападение на колонну',
      ],
      keywords: [
        'поставк',
        'поставку',
        'поставки',
        'поставкой',
        'крафт',
        'крафты',
        'матовозк',
        'перекрыт',
        'перекрыл',
        'перекрыла',
        'отбил',
        'отбила',
        'отбитие',
        'перехват',
        'снабжение',
        'колонна',
      ],
    },
    {
      label: 'Новости Лидеров',
      icon: '👑',
      phrases: [
        'назначен на пост',
        'покинул пост',
        'снят с поста',
        'успешный срок',
        'лидер фракции',
        'новый лидер',
        'врио лидер',
        'губернатор штата',
        'встал на лидерку',
        'ушел с лидерки',
      ],
      keywords: [
        'назначен',
        'покинул',
        'снят',
        'лидерки',
        'лидерку',
        'лидерка',
        'губернатор',
        'врио',
      ],
    },
    {
      label: 'Состав Модерации',
      icon: '👥',
      phrases: [
        'состав модерации',
        'главный куратор',
        'gl.curator',
        'gl curator',
        'куратор фракции',
        'помощник куратора',
        'назначен на модератора',
        'покинул состав модерации',
      ],
      keywords: [
        'модерации',
        'модератор',
        'куратор',
        'gl.curator',
        'кураторы',
      ],
    },
    {
      label: 'Заморозка семьи',
      icon: '🧊',
      phrases: [
        'заморозка семьи',
        'разморозка семьи',
        'получает заморозку',
        'снятие заморозки',
        'выходит из заморозки',
      ],
      keywords: [
        'заморозк',
        'заморож',
        'разморозк',
        'разморож',
      ],
    },
    {
      label: 'Войны семей / Территории',
      icon: '⚔️',
      phrases: [
        'война семей',
        'войны семей',
        'союз семей',
        'расторжение союза',
        'перекрас территорий',
        'дипломатические отношения',
        'пакт о ненападении',
        'объявление войны',
      ],
      keywords: [
        'перекрас',
        'перекраш',
        'нейтрал',
        'дипломати',
        'союз',
        'расторжен',
        'пакт',
      ],
    },
    {
      label: 'Правила и Выговоры',
      icon: '📜',
      phrases: [
        'строгий выговор',
        'устный выговор',
        'ситуация по выговорам',
        'получает выговор',
        'снятие выговора',
        'штрафные санкции',
        'нарушение правил сервера',
        'выговор за',
      ],
      keywords: [
        'выговор',
        'строгий',
        'устный',
        'штраф',
        'наказани',
        'наказание',
        'нарушени',
      ],
    },
    {
      label: 'Ограбление Банка',
      icon: '🏦',
      phrases: [
        'ограбление банка',
        'ограбили банк',
        'взлом ячеек',
        'взлом сейфа',
        'сейф банка',
        'банк пасифик',
        'банк fleeca',
      ],
      keywords: [
        'ограблен',
        'ограблени',
        'ограбили',
        'пасифик',
        'fleeca',
        'флейка',
        'сейф',
        'ячеек',
      ],
    },
    {
      label: 'Дропы и Цеха',
      icon: '🏆',
      phrases: [
        'захват аирдропа',
        'оружейный цех',
        'забрали цех',
        'аирдроп упал',
      ],
      keywords: [
        'аирдроп',
        'airdrop',
        'дроп',
        'цех',
        'цеха',
        'дилер',
        'супостат',
      ],
    },
    {
      label: 'Капты и Турниры',
      icon: '⚔️',
      phrases: [
        'победа в капте',
        'забил капт',
        'турнир семей',
        'забивает стрелу',
        'champions league',
      ],
      keywords: [
        'капт',
        'капты',
        'турнир',
        'champions',
        'особняк',
        'стрела',
      ],
    },
    {
      label: 'Интервью',
      icon: '🎙️',
      phrases: [
        'взяли интервью',
        'интервью с',
        'вопрос от редакции',
        'благодарим за интервью',
      ],
      keywords: [
        'интервью',
      ],
    },
  ];

  let categoryLabel = 'Свободная новость';
  let categoryIcon = '📰';
  let matchConfidence = 60;
  const matchedKeywords: string[] = [];

  let bestCategoryScore = 0;

  for (const cat of categoryScoreDefs) {
    let currentScore = 0;
    const currentMatched: string[] = [];

    // Check high-priority multi-word phrases (+80 pts each)
    for (const phrase of cat.phrases) {
      if (lower.includes(phrase) || fuzzyIncludes(lower, phrase)) {
        currentScore += 80;
        currentMatched.push(phrase);
      }
    }

    // Check single word stems (+30 pts each)
    for (const kw of cat.keywords) {
      if (lower.includes(kw) || fuzzyIncludes(lower, kw)) {
        currentScore += 30;
        currentMatched.push(kw);
      }
    }

    if (currentScore > bestCategoryScore) {
      bestCategoryScore = currentScore;
      categoryLabel = cat.label;
      categoryIcon = cat.icon;
      matchConfidence = Math.min(99, Math.max(75, Math.round(60 + currentScore / 3)));
      matchedKeywords.length = 0;
      matchedKeywords.push(...Array.from(new Set(currentMatched)));
    }
  }

  // Text Stats
  const length = text.length;
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const lines = text.split('\n').length;
  const emojiMatches = text.match(/<a?:[a-zA-Z0-9_]+:[0-9]+>/g) || [];
  const emojisCount = emojiMatches.length;
  const hasSourceLink = text.includes('https://t.me/famq_news') || fuzzyIncludes(lower, 'famq_news');
  const hasDateSpoiler = /_\|\|\d{2}\.\d{2}(\.\d{2,4})?\|\|_/.test(text) || /\|\|\d{2}\.\d{2}(\.\d{2,4})?\|\|/.test(text);

  // Field checklist per category
  const requiredFields: CategoryCheckItem[] = [];

  if (categoryLabel === 'Поставки и Крафт') {
    requiredFields.push(
      { label: 'Кастомный эмодзи заголовка (<:emoji...>)', present: emojisCount > 0 },
      { label: 'Строка статуса поставки (_**...**_)', present: /_?\*\*.*(нападение|отбила|перекрыла|поставк).*\*\*_?/.test(text) || /отбила|перекрыла|поставку/i.test(text) },
      { label: 'Указание фракции / семьи', present: /sang|fib|lspd|bcso|gov|sasp|wn|ems|usss|vagos|ballas|bloods|marabunta|families|rifa|famq|family|семь|фракци/i.test(text) },
      { label: 'Подпись с ссылкой (https://t.me/famq_news)', present: hasSourceLink }
    );
  } else if (categoryLabel === 'Новости Лидеров') {
    requiredFields.push(
      { label: 'Указание Лидера фракции', present: /лидер фракции|губернатор/i.test(lower) },
      { label: 'Статический ID', present: /статический id|статик/i.test(lower) },
      { label: 'Discord логин', present: /discord/i.test(lower) },
      { label: 'Подпись с ссылкой (https://t.me/famq_news)', present: hasSourceLink }
    );
  } else if (categoryLabel === 'Заморозка семьи') {
    requiredFields.push(
      { label: 'Название семьи (Famq/Family)', present: /семь|family|famq|фамк|фама/i.test(lower) },
      { label: 'Срок заморозки', present: /часов|часа|час|ч|дней|дня|день|д|разморож/i.test(lower) },
      { label: 'Причина / Жалоба', present: /жалоб|\d+\.\d+|нарушени|разморож/i.test(lower) },
      { label: 'Подпись с ссылкой (https://t.me/famq_news)', present: hasSourceLink }
    );
  } else if (categoryLabel === 'Ограбление Банка') {
    requiredFields.push(
      { label: 'Указание Организации / Семьи', present: /организация|семь|famq|family/i.test(lower) },
      { label: 'Результат / Взлом сейфов', present: /взлом|сейф|ячеек|куш|пасифик|fleeca|ограбил/i.test(lower) },
      { label: 'Подпись с ссылкой (https://t.me/famq_news)', present: hasSourceLink }
    );
  } else if (categoryLabel === 'Правила и Выговоры') {
    requiredFields.push(
      { label: 'Лидер фракции / Наказание', present: /лидер|выговор|строгий|устный|штраф/i.test(lower) },
      { label: 'Статический ID', present: /статический id|статик/i.test(lower) },
      { label: 'Discord логин', present: /discord/i.test(lower) },
      { label: 'Ситуация по выговорам', present: /ситуация по выговорам/i.test(lower) },
      { label: 'Подпись с ссылкой (https://t.me/famq_news)', present: hasSourceLink }
    );
  } else if (categoryLabel === 'Состав Модерации') {
    requiredFields.push(
      { label: 'Модератор / Куратор', present: /модератор|куратор/i.test(lower) },
      { label: 'Статический ID', present: /статический id|статик/i.test(lower) },
      { label: 'Discord логин', present: /discord/i.test(lower) },
      { label: 'Подпись с ссылкой (https://t.me/famq_news)', present: hasSourceLink }
    );
  } else if (categoryLabel === 'Войны семей / Территории') {
    requiredFields.push(
      { label: 'Участники / Название семьи', present: /семь|famq|family|нейтрал|союз/i.test(lower) },
      { label: 'Инициатор / Причина', present: /инициатор|причина|дипломати/i.test(lower) },
      { label: 'Подпись с ссылкой (https://t.me/famq_news)', present: hasSourceLink }
    );
  } else {
    requiredFields.push(
      { label: 'Кастомный эмодзи Discord', present: emojisCount > 0 },
      { label: 'Синтаксис и разметка Discord', present: !checkDiscordMarkdownBalance(text).isUnbalanced },
      { label: 'Подпись с ссылкой (https://t.me/famq_news)', present: hasSourceLink }
    );
  }

  // 1. Character Limit Check (Discord 2000 limit)
  if (length > 2000) {
    score -= 30;
    issues.push({
      id: 'length_exceeded',
      type: 'critical',
      title: 'Превышен лимит 2000 символов Discord',
      description: `Текущая длина ${length} символов. Сообщение не поместится в одно отправление Discord.`,
      fixable: false,
    });
  }

  // 2. Markdown Tag Balance Check
  const tagBalance = checkDiscordMarkdownBalance(text);
  if (tagBalance.isUnbalanced) {
    score -= 25;
    issues.push({
      id: 'tags_unbalanced',
      type: 'critical',
      title: 'Нарушена симметрия разметки Discord',
      description: tagBalance.details
        ? `Ошибка: ${tagBalance.details}`
        : 'Обнаружены незакрытые теги (жирный **...**, курсив _..._, спойлер ||...|| или блок кода ```).',
      fixable: true,
    });
  }

  // 3. Punctuation inside bold formatting check e.g. **Текст,**
  if (/\*\*[^*]+[,;:!?\.]\*\*/.test(text)) {
    score -= 10;
    issues.push({
      id: 'bold_punct_inside',
      type: 'warning',
      title: 'Знак препинания внутри жирного шрифта (**Слово,**)',
      description: 'По правилам типографики Famq News знак препинания выносится за пределы жирного текста: **Слово**,',
      fixable: true,
    });
  }

  // 5. Year in spoiler date check (e.g. _||09.08.2026||_)
  if (/_?\|\|\d{2}\.\d{2}\.\d{2,4}\|\|_?/.test(text)) {
    score -= 10;
    issues.push({
      id: 'year_in_spoiler',
      type: 'warning',
      title: 'В дате за спойлером указан год',
      description: 'В дате за спойлером НЕ нужно писать год. По стандарту Famq News указывается только день и месяц: _||09.08||_.',
      fixable: true,
    });
  }

  // 6. Judicial branch leaders check
  if (categoryLabel === 'Новости Лидеров' && (fuzzyIncludes(lower, 'председатель верховного суда') || fuzzyIncludes(lower, 'верховный судья'))) {
    score -= 15;
    issues.push({
      id: 'judicial_branch_warning',
      type: 'critical',
      title: 'Лидер судебной власти в новости лидеров',
      description: 'ВНИМАНИЕ! Лидеров судебной власти (Председатель верховного суда) НЕ отписывают в категории новостей лидеров!',
      fixable: false,
    });
  }

  // --- CATEGORY STRICT FORMATTING CHECKS ---
  
  if (categoryLabel === 'Новости Лидеров') {
    if (!fuzzyIncludes(lower, 'лидер фракции') || !fuzzyIncludes(lower, 'статический id') || !fuzzyIncludes(lower, 'discord')) {
      score -= 20;
      issues.push({
        id: 'leaders_format',
        type: 'critical',
        title: 'Нарушен формат "Новости Лидеров"',
        description: 'Обязательные поля для поста лидеров: "Лидер фракции", "Статический ID - **...**", "Discord - **...**". Проверьте наличие всех пунктов по шаблону.',
        fixable: true,
      });
    }
  } else if (categoryLabel === 'Правила и Выговоры') {
    if (!fuzzyIncludes(lower, 'ситуация по выговорам')) {
      score -= 20;
      issues.push({
        id: 'rules_format',
        type: 'critical',
        title: 'Нарушен формат "Правила и Выговоры"',
        description: 'Обязательные поля: "Лидер фракции ... получает выговор", "Статический ID - **...**", "Discord - **...**", "Ситуация по выговорам - **...**".',
        fixable: true,
      });
    }
  } else if (categoryLabel === 'Ограбление Банка') {
    if (!fuzzyIncludes(lower, 'организация')) {
      score -= 15;
      issues.push({
        id: 'bank_format',
        type: 'warning',
        title: 'Нарушен формат "Ограбление Банка"',
        description: 'Не указана "Организация" или статус ограбления. Должно быть: "- Организация - **...**".',
        fixable: true,
      });
    }
  } else if (categoryLabel === 'Заморозка семьи') {
    if (!/семь/i.test(lower) && !/family/i.test(lower) && !/фама/i.test(lower) && !/фамк/i.test(lower)) {
      score -= 15;
      issues.push({
        id: 'freeze_no_family',
        type: 'critical',
        title: 'Не указана семья',
        description: 'Отсутствует ключевое слово (Семья / Famq / Family) или название семьи для заморозки.',
        fixable: true,
      });
    }
    if (!/разморож/i.test(lower) && !/часов|часа|час|ч|дней|дня|день|д/i.test(lower)) {
      score -= 15;
      issues.push({
        id: 'freeze_no_duration',
        type: 'critical',
        title: 'Не указан срок заморозки',
        description: 'При заморозке обязательно указывать срок (например: 6 часов, 1 день).',
        fixable: true,
      });
    }
    if (!/разморож/i.test(lower) && !/жалоб/i.test(lower) && !/\d+\.\d+/.test(lower) && !/нарушени/i.test(lower)) {
      score -= 10;
      issues.push({
        id: 'freeze_no_reason',
        type: 'warning',
        title: 'Не указана причина (пункт правила или жалоба)',
        description: 'Укажите пункт нарушения (например, п. 2.5 ПОиП) или упомяните, что заморозка выдана по жалобе.',
        fixable: true,
      });
    }
  } else if (categoryLabel === 'Поставки и Крафт') {
    const isActionPost = /(?:перекрыла|перекрыл|перекрыли|отбила|отбил|отбили|перехватила|нападение)/i.test(lower) || /_?\*\*\[[^\]]+\]\*\*_/i.test(text);

    if (isActionPost) {
      // Check state org vs supply wording rule
      if (/(?:перекрыла|перекрыл|перекрыли|нападение\s+на)\s+поставку\s+от\s+(?:лспд|фиб|бксо|гов|сасп|емс|lspd|fib|bcso|gov|sasp|ems)/i.test(lower)) {
        score -= 10;
        issues.push({
          id: 'supply_state_craft_rule',
          type: 'warning',
          title: 'Гос. организации везут Крафт, а не Поставку',
          description: 'Перекрытие гос. фракций (LSPD/FIB/BCSO/GOV/SASP) является Крафтом. При нажатии Автофикс заголовок изменится на «перекрыла крафт».',
          fixable: true,
        });
      }
    } else {
      if (!fuzzyIncludes(lower, 'организация') || !fuzzyIncludes(lower, 'материалы')) {
        score -= 15;
        issues.push({
          id: 'supplies_format',
          type: 'warning',
          title: 'Нарушен формат "Поставки и Крафт"',
          description: 'Для отчетов по материалам укажите "- Организация - **...**" и "- Полученные материалы - **...**".',
          fixable: true,
        });
      }
    }
  } else if (categoryLabel === 'Войны семей / Территории') {
    if (!fuzzyIncludes(lower, 'инициатор')) {
      score -= 15;
      issues.push({
        id: 'wars_format',
        type: 'warning',
        title: 'Нарушен формат "Войны семей / Территории"',
        description: 'Требуется указывать "- Инициатор - **...**" по шаблону.',
        fixable: true,
      });
    }
  }

  // 7. Channel Signature Link Check
  if (!hasSourceLink) {
    score -= 15;
    issues.push({
      id: 'missing_link',
      type: 'warning',
      title: 'Отсутствует подпись https://t.me/famq_news',
      description: 'В конце новости должна присутствовать прямая гиперссылка на телеграм-канал.',
      fixable: true,
    });
  }

  // 8. Date spoiler formatting check (italics missing)
  if (hasDateSpoiler && /\|\|\d{2}\.\d{2}\|\|/.test(text) && !/_\|\|\d{2}\.\d{2}\|\|_/.test(text)) {
    score -= 5;
    issues.push({
      id: 'date_italic_missing',
      type: 'info',
      title: 'Дата за спойлером не оформлена курсивом',
      description: 'Рекомендуется использовать формат _||ДД.ММ||_ (с внешними подчеркиваниями _).',
      fixable: true,
    });
  }

  // 9. Quotes in Gang/Family names
  const quoteMatches = text.match(/[«"“][^"»”\n]+[»"”]/g) || [];
  if (quoteMatches.length > 0) {
    score -= 10;
    issues.push({
      id: 'quotes_in_names',
      type: 'warning',
      title: 'Кавычки в названии фракции / семьи',
      description: 'В стандарте Famq News кавычки «...» не используются. Выделяйте названия жирным шрифтом **Название**.',
      fixable: true,
    });
  }

  // 10. Discord Emojis
  if (emojisCount === 0) {
    score -= 5;
    issues.push({
      id: 'no_emoji',
      type: 'info',
      title: 'Нет кастомных эмодзи Discord',
      description: 'Заголовки постов Famq News рекомендуется стилизовать фирменным эмодзи (например <:emoji_246:1346569081322471434>).',
      fixable: false,
    });
  }

  // 11. Informal Gang Names
  const informalGangs = [
    { pattern: /\bвагос\b/i, correct: 'Los Santos Vagos' },
    { pattern: /\bгрув\b/i, correct: 'The Families' },
    { pattern: /\bбаллас\b/i, correct: 'The Ballas Gang' },
    { pattern: /\bбладс\b/i, correct: 'The Bloods Gang' },
    { pattern: /\bмарабунта\b/i, correct: 'Marabunta Grande' },
    { pattern: /\bрифа\b/i, correct: 'Los Santos Rifa' },
  ];

  const foundInformal = informalGangs.filter((g) => g.pattern.test(text));
  if (foundInformal.length > 0) {
    score -= 10;
    issues.push({
      id: 'informal_names',
      type: 'warning',
      title: 'Разговорные названия банд',
      description: `Найдено сленговое наименование (${foundInformal.map((f) => f.correct).join(', ')}). Рекомендуется заменять на каноничные названия.`,
      fixable: true,
    });
  }

  // 12. Spacing / Typography Check
  if (/\n{3,}/.test(text) || /  /.test(text) || /\s+[,\.!?:;]/.test(text)) {
    score -= 5;
    issues.push({
      id: 'formatting_spacing',
      type: 'info',
      title: 'Огрехи пробелов и знаков препинания',
      description: 'Обнаружены двойные пробелы, лишние пустые строки или пробел перед запятой/точкой.',
      fixable: true,
    });
  }

  // 14. Missing space after punctuation
  if (/([а-яА-Яa-zA-ZёЁ]+)[,;:!?\.]([а-яА-Яa-zA-ZёЁ]+)/.test(text.replace(/https?:\/\/[^\s]+/g, ''))) {
    score -= 10;
    issues.push({
      id: 'missing_space_punct',
      type: 'warning',
      title: 'Пропущен пробел после знака препинания',
      description: 'Найден текст со слипшимися словами (например: "Слово,слово" или "Текст.Новый").',
      fixable: true,
    });
  }

  // 15. Capitalization after sentence
  if (/([.!?])\s+([а-яёa-z])/u.test(text.replace(/https?:\/\/[^\s]+/g, ''))) {
    score -= 5;
    issues.push({
      id: 'lowercase_after_dot',
      type: 'warning',
      title: 'Строчная буква после точки',
      description: 'После точки, восклицательного или вопросительного знака предложение должно начинаться с заглавной буквы.',
      fixable: true,
    });
  }

  // 16. Invalid date check
  const dateMatch = text.match(/\|\|(\d{2})\.(\d{2})(?:\.\d{2,4})?\|\|/);
  if (dateMatch) {
    const day = parseInt(dateMatch[1], 10);
    const month = parseInt(dateMatch[2], 10);
    if (day === 0 || day > 31 || month === 0 || month > 12) {
      score -= 20;
      issues.push({
        id: 'invalid_date_logic',
        type: 'critical',
        title: 'Несуществующая дата в спойлере',
        description: `Указана некорректная дата: ${dateMatch[1]}.${dateMatch[2]}. Пожалуйста, проверьте день (не более 31) и месяц (не более 12).`,
        fixable: false,
      });
    }
  }

  // 17. Redundant punctuation
  if (/(,,|(?<!\.)\.\.(?!\.))/.test(text)) {
    score -= 5;
    issues.push({
      id: 'redundant_punctuation',
      type: 'info',
      title: 'Излишняя пунктуация',
      description: 'Обнаружены двойные запятые (,,) или двойные точки (..).',
      fixable: true,
    });
  }

  // 18. Em-dash typography
  if (/ - /.test(text)) {
    score -= 5;
    issues.push({
      id: 'em_dash',
      type: 'info',
      title: 'Использование дефиса вместо тире',
      description: 'Между словами с пробелами рекомендуется использовать длинное тире (—) вместо дефиса (-).',
      fixable: true,
    });
  }

  // 19. Unformatted Discord Link
  if (text.includes('https://t.me/famq_news') && !text.includes('<https://t.me/famq_news>')) {
    score -= 5;
    issues.push({
      id: 'unformatted_link',
      type: 'warning',
      title: 'Ссылка не скрыта в Discord (нет < >)',
      description: 'Ссылка на канал должна быть обернута в угловые скобки < >, чтобы Discord не создавал для нее огромное превью.',
      fixable: true,
    });
  }

  // 20. Empty tags check
  if (/\*\*\*\*|(?<!_)__(?!_)/.test(text)) {
    score -= 10;
    issues.push({
      id: 'empty_tags',
      type: 'warning',
      title: 'Пустые теги форматирования',
      description: 'Найдены пустые теги жирного шрифта (****) или курсива (__).',
      fixable: true,
    });
  }

  // 21. Spaces inside bold tags
  if (/\*\*\s+[^*]+?\*\*|\*\*[^*]+?\s+\*\*/.test(text)) {
    score -= 5;
    issues.push({
      id: 'spaces_inside_tags',
      type: 'info',
      title: 'Пробелы внутри тегов',
      description: 'Лишние пробелы внутри жирного выделения (** текст **). Пробелы должны быть снаружи.',
      fixable: true,
    });
  }

  // 22. Time format check (e.g. "в 15.00" -> "в 15:00", and forbid "мск")
  if (/\bв\s+([0-1]?[0-9]|2[0-3])[\.\-]([0-5][0-9])\b/i.test(text) || /\b([0-1]?[0-9]|2[0-3])[\.\-:]([0-5][0-9])\s*мск\b/i.test(text) || /\bмск\b/i.test(text)) {
    score -= 10;
    issues.push({
      id: 'time_format',
      type: 'warning',
      title: 'Формат времени и запрет "мск"',
      description: 'В стандартах Famq News "мск" НИГДЕ НЕ ПИШЕТСЯ! Время пишется строго без "мск" (например, "в 18:00" или "18:00"). При автофиксе "мск" удалится автоматически.',
      fixable: true,
    });
  }

  // 23. Number + word without space
  if (/(?:^|\s)(\d+)([а-яА-ЯёЁa-zA-Z]{3,})(?=\s|[.,!?]|$)/.test(text.replace(/https?:\/\/[^\s]+/g, ''))) {
    score -= 5;
    issues.push({
      id: 'number_word_no_space',
      type: 'warning',
      title: 'Слипшееся число и слово',
      description: 'Обнаружено число и слово без пробела (например: "100аптечек" или "50матов").',
      fixable: true,
    });
  }

  // 24. Multiple punctuation
  if (/[!?]{2,}/.test(text.replace(/https?:\/\/[^\s]+/g, ''))) {
    score -= 5;
    issues.push({
      id: 'multiple_punctuation',
      type: 'warning',
      title: 'Избыточная пунктуация',
      description: 'Используется слишком много знаков препинания подряд (например, "!!" или "??"). Согласно стандартам, рекомендуется использовать только один знак (или многоточие "...").',
      fixable: true,
    });
  }

  // 25. Bracket spaces
  if (/([а-яА-ЯёЁa-zA-Z0-9])\(|\)(?=[а-яА-ЯёЁa-zA-Z0-9])/.test(text.replace(/https?:\/\/[^\s]+/g, ''))) {
    score -= 5;
    issues.push({
      id: 'bracket_spaces',
      type: 'warning',
      title: 'Отсутствуют пробелы у скобок',
      description: 'Текст прилипает к скобкам без пробелов: "слово(текст)слово".',
      fixable: true,
    });
  }

  // 26. Missing space after dash
  if (/^\s*-[^\s-]/m.test(text)) {
    score -= 5;
    issues.push({
      id: 'missing_dash_space',
      type: 'info',
      title: 'Отсутствует пробел после дефиса',
      description: 'После дефиса в списках должен быть пробел (например, "- текст", а не "-текст").',
      fixable: true,
    });
  }

  // 27. Space before percentage
  if (/\d+\s+%/m.test(text)) {
    score -= 2;
    issues.push({
      id: 'space_before_percent',
      type: 'info',
      title: 'Пробел перед знаком процента',
      description: 'Знак процента пишется слитно с числом (10%, а не 10 %).',
      fixable: true,
    });
  }

  // 13. State organization in crime / supply intercept action check
  const isInterceptOrCrimeAction = /(перекрыл|перекрыли|перехват|ограбил|ограбили|взлом)/i.test(text);

  if (isInterceptOrCrimeAction) {
    const matchStateCrime = text.match(/\b(SANG|FIB|LSPD|GOV|LSCSD|SASP|WN|EMS|USSS)\b[\s\S]{0,50}(перекрыли|перекрыл|ограбили|ограбил)/i);
    if (matchStateCrime) {
      score -= 30;
      issues.push({
        id: 'gos_in_crime_action',
        type: 'critical',
        title: 'Гос. структура в перекрытии или крайм действии',
        description: `Гос. организации (${matchStateCrime[1].toUpperCase()}) НЕ МОГУТ перекрывать поставки/крафты или совершать крайм действия (ограбления банка и др.)! Перекрытия и ограбления выполняют только криминальные фракции/семьи.`,
        fixable: true,
      });
    }
  }

  // Success state if no issues found
  if (issues.length === 0) {
    issues.push({
      id: 'perfect',
      type: 'success',
      title: 'Пост идеально оформлен!',
      description: 'Текст полностью соответствует стандартам Famq News, синтаксис Discord и разметка безупречны.',
      fixable: false,
    });
  }

  return {
    categoryLabel,
    categoryIcon,
    matchConfidence,
    matchedKeywords,
    requiredFields,
    score: Math.max(0, score),
    issues,
    stats: {
      length,
      words,
      lines,
      emojisCount,
      hasSourceLink,
      hasDateSpoiler,
      unbalancedTags: tagBalance.isUnbalanced,
    },
  };
}

/**
  Smart helper: Fixes missing trailing tag placed before closing underscore or whitespace
 */
function fixTrailingMissingTag(text: string, tag: string): string {
  if (text.endsWith('_')) {
    return text.slice(0, -1) + tag + '_';
  }
  return text + tag;
}

/**
  Smart helper: Repair unbalanced bold ** tags
 */
function fixUnbalancedBold(text: string): string {
  const boldMatches = Array.from(text.matchAll(/\*\*/g));
  if (boldMatches.length % 2 === 0) return text;

  const lastMatch = boldMatches[boldMatches.length - 1];
  const lastIndex = lastMatch.index!;

  const charBefore = lastIndex > 0 ? text[lastIndex - 1] : '';
  const charAfter = lastIndex + 2 < text.length ? text[lastIndex + 2] : '';

  const isClosingTag =
    Boolean(charBefore) &&
    !/\s/.test(charBefore) &&
    (!charAfter || charAfter === '_' || charAfter === '\n' || charAfter === '|');

  if (isClosingTag) {
    const lastPairIndex = boldMatches.length > 1 ? boldMatches[boldMatches.length - 2].index! + 2 : 0;
    const prevText = text.substring(0, lastIndex);
    const segment = prevText.substring(lastPairIndex);

    const digitMatch = segment.match(/\b(\d+[\d\.]*)/);
    if (digitMatch && digitMatch.index !== undefined) {
      const insertOffset = lastPairIndex + digitMatch.index;
      return text.substring(0, insertOffset) + '**' + text.substring(insertOffset);
    }

    const keywordMatch = segment.match(/(правила|пункта|статьи|жалобе|жалоба)\s+/i);
    if (keywordMatch && keywordMatch.index !== undefined) {
      const insertOffset = lastPairIndex + keywordMatch.index + keywordMatch[0].length;
      return text.substring(0, insertOffset) + '**' + text.substring(insertOffset);
    }

    let insertOffset = lastPairIndex;
    if (segment.startsWith('_')) insertOffset += 1;
    while (insertOffset < lastIndex && /\s/.test(text[insertOffset])) {
      insertOffset++;
    }
    return text.substring(0, insertOffset) + '**' + text.substring(insertOffset);
  } else {
    if (text.endsWith('_')) {
      return text.slice(0, -1) + '**_';
    }
    return text + '**';
  }
}

/**
  Smart helper: Repair unbalanced italic _ tags
 */
function fixUnbalancedUnderscore(text: string): string {
  // Strip emojis, URLs, and non-printable tokens so their internal underscores don't skew markdown parity!
  const cleanForCheck = text
    .replace(/<a?:[a-zA-Z0-9_]+:\d+>/g, '  ')
    .replace(/(<https?:\/\/[^\s>]+>|https?:\/\/[^\s]+)/ig, '  ')
    .replace(/\u0001[^\u0002]+\u0002/g, '  ')
    .replace(/\*\*/g, '  ');

  const underscoreCount = (cleanForCheck.match(/_/g) || []).length;
  if (underscoreCount % 2 === 0) {
    return text; // Underscores are balanced when ignoring emojis and links!
  }

  const firstUnderscore = cleanForCheck.indexOf('_');
  const lastUnderscore = cleanForCheck.lastIndexOf('_');

  if (firstUnderscore !== -1 && firstUnderscore === lastUnderscore) {
    if (firstUnderscore < 100) {
      if (text.endsWith('\n')) {
        return text.trimEnd() + '_\n';
      }
      return text + '_';
    }
  }

  if (!text.endsWith('_')) {
    return text + '_';
  } else {
    const emojiMatch = text.match(/^<a?:[a-zA-Z0-9_]+:\d+>\s*/);
    if (emojiMatch) {
      const offset = emojiMatch[0].length;
      return text.substring(0, offset) + '_' + text.substring(offset);
    }
    return '_' + text;
  }
}

/**
  Normalizes family names from raw text (e.g. "кака фамк" -> "Kaka Famq", "китсуне" -> "Kitsune")
 */
export function normalizeFamilyName(rawName: string, customDictMap?: Record<string, string>): string {
  if (!rawName) return '';
  let name = rawName.trim().replace(/[«"”’'"]/g, '');

  // Strip leading/trailing brackets, quotes, etc.
  name = name.replace(/^[\[\(\{"'\s]+|[\]\)\}"'\s]+$/g, '');

  const lower = name.toLowerCase();
  if (customDictMap && customDictMap[lower]) {
    return customDictMap[lower];
  }

  // Check direct alias match in SMART_ENTITIES
  for (const entity of SMART_ENTITIES) {
    if (entity.category === 'crime' || entity.category === 'faction') {
      if (lower === entity.target.toLowerCase()) return entity.target;
      for (const alias of entity.aliases) {
        if (lower === alias) return entity.target;
      }
    }
  }

  // Check state factions first (State orgs should NEVER have "Famq" appended!)
  const stateFactionsMap: Record<string, string> = {
    lspd: 'LSPD',
    лспд: 'LSPD',
    лспдшники: 'LSPD',
    полиция: 'LSPD',
    fib: 'FIB',
    фиб: 'FIB',
    фибы: 'FIB',
    фбр: 'FIB',
    bcso: 'BCSO',
    бксо: 'BCSO',
    шерифы: 'BCSO',
    sang: 'SANG',
    санг: 'SANG',
    армия: 'SANG',
    занкудо: 'SANG',
    gov: 'GOV',
    гов: 'GOV',
    мэрия: 'GOV',
    sasp: 'SASP',
    сасп: 'SASP',
    wn: 'Weazel News',
    визели: 'Weazel News',
    ems: 'EMS',
    емс: 'EMS',
  };

  const lowerClean = lower.replace(/\b(фамк|фама|семья|family|famq|famk|фракция)\b/gi, '').trim();
  if (stateFactionsMap[lowerClean]) {
    return stateFactionsMap[lowerClean];
  }

  // Check gangs
  const gangsMap: Record<string, string> = {
    vagos: 'Vagos',
    вагос: 'Vagos',
    ballas: 'Ballas',
    баллас: 'Ballas',
    bloods: 'Bloods',
    бладс: 'Bloods',
    grove: 'Grove',
    грув: 'Grove',
    rifa: 'Rifa',
    рифа: 'Rifa',
    marabunta: 'Marabunta',
    марабонта: 'Marabunta',
    марабунта: 'Marabunta',
    families: 'Families',
    фэмы: 'Families',
  };

  if (gangsMap[lowerClean]) {
    return gangsMap[lowerClean];
  }

  // Clean family suffixes to prevent duplication like "Allegri Famq Famk"
  name = name.replace(/\b(фамк|фама|семья|family|famq|famk)\b/gi, '').trim();
  if (!name) return 'Famq';

  // Known family name transliteration dictionary
  const knownDict: Record<string, string> = {
    аллегри: 'Allegri',
    алегри: 'Allegri',
    кортез: 'Cortez',
    кортес: 'Cortez',
    кортезз: 'Cortez',
    кортесс: 'Cortez',
    кака: 'Kaka',
    каке: 'Kaka',
    чикен: 'Chicken',
    чикан: 'Chicken',
    чекин: 'Chicken',
    блейз: 'Blaze',
    блейс: 'Blaze',
    китсуне: 'Kitsune',
    кицуне: 'Kitsune',
    мориарти: 'Moriarty',
    монтана: 'Montana',
    шелби: 'Shelby',
    дельта: 'Delta',
    драгон: 'Dragon',
    феникс: 'Phoenix',
    самурай: 'Samurai',
    немезида: 'Nemesis',
    альварес: 'Alvarez',
    капоне: 'Capone',
    гранд: 'Grand',
    диаз: 'Diaz',
    торрес: 'Torres',
    санчез: 'Sanchez',
    варгас: 'Vargas',
    ...(customDictMap || {}),
  };

  const cyrToLatMap: Record<string, string> = {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'zh',
    з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o',
    п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts',
    ч: 'ch', ш: 'sh', щ: 'shch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya'
  };

  const words = name.split(/\s+/).map((word) => {
    const wLower = word.toLowerCase();
    if (knownDict[wLower]) return knownDict[wLower];
    if (stateFactionsMap[wLower]) return stateFactionsMap[wLower];
    if (gangsMap[wLower]) return gangsMap[wLower];
    if (/^[a-zA-Z0-9_]+$/.test(word)) {
      return word.charAt(0).toUpperCase() + word.slice(1);
    }
    // Transliterate Cyrillic word
    let transliterated = '';
    for (let i = 0; i < word.length; i++) {
      const char = word[i].toLowerCase();
      const lat = cyrToLatMap[char] !== undefined ? cyrToLatMap[char] : char;
      transliterated += lat;
    }
    return transliterated.charAt(0).toUpperCase() + transliterated.slice(1);
  });

  let result = words.join(' ');
  const factionKeywords = ['vagos', 'ballas', 'bloods', 'grove', 'rifa', 'marabunta', 'lspd', 'fib', 'sapa', 'sangg', 'wn', 'bcso', 'sang', 'gov', 'sasp', 'ems'];
  const resLower = result.toLowerCase();
  
  // If it doesn't already have Famq/Family/faction keyword, append Famq
  if (!/\b(famq|family)\b/i.test(result) && !factionKeywords.some(f => resLower.includes(f))) {
    result += ' Famq';
  }

  return result;
}

/**
  Formats rule citation to canonical form: "п. 2.5 правил ограблений и похищений"
 */
export function formatRuleCitation(rawRuleText: string, fullContextText?: string): string {
  const textToSearch = `${rawRuleText} ${fullContextText || ''}`;
  const ruleNumMatch = textToSearch.match(/(\d+\.\d+(?:\.\d+)?)/);
  if (!ruleNumMatch) return rawRuleText;

  const num = ruleNumMatch[1];
  let ruleName = '';

  if (/ограблений|похищений|поио|поип/i.test(textToSearch)) {
    ruleName = 'правил ограблений и похищений';
  } else if (/государственных|пго/i.test(textToSearch)) {
    ruleName = 'правил государственных организаций';
  } else if (/предприятия|предприятий|взп/i.test(textToSearch)) {
    ruleName = 'правил завоевания предприятий';
  } else if (/криминальных|пко/i.test(textToSearch)) {
    ruleName = 'правил криминальных организаций';
  } else if (/сервера|опс/i.test(textToSearch)) {
    ruleName = 'общих правил сервера';
  } else if (/лидеров|пл/i.test(textToSearch)) {
    ruleName = 'правил лидеров';
  }

  if (ruleName) {
    return `п. ${num} ${ruleName}`;
  }
  return `п. ${num}`;
}

/**
  Smart Structural Reformatter for Raw Unstructured Input
  Parses raw penalty descriptions, family freezes, rules, leaders, and supplies text,
  extracting entity names, durations, rule abbreviations, and links, and formatting them into standard Famq News Discord post format.
 */
export function smartReformatAssistantPost(text: string, customDictMap?: Record<string, string>): string {
  if (!text || !text.trim()) return text;
  let clean = text.trim();

  // 1. FAMILY FREEZE & UNFREEZE PARSER
  // Example: "Семья Kitsune получает 6 часов заморозки за нарушение правил сервера (2.5 Правил ограблений и похищений)."
  if (/заморозк|заморож|разморозк|разморож/i.test(clean) && /семь|family|капт/i.test(clean)) {
    const isUnfreeze = /разморозк|разморож|разморожена/i.test(clean);
    const isCapt = /капт/i.test(clean);

    // Extract Family Name
    let familyName = '';
    const famMatch = 
        clean.match(/(?:семья|семьи|family)\s+([a-zA-Z0-9_А-Яа-яЁё]+(?:\s+(?:фамк|фама|family|famq))?)/i) ||
        clean.match(/^([a-zA-Z0-9_А-Яа-яЁё]+(?:\s+(?:фамк|фама|family|famq))?)\s+(?:получ|заморож|разморож)/i) ||
        clean.match(/^([a-zA-Z0-9_А-Яа-яЁё]+)\s+(?:получ|заморож|разморож)/i);

    if (famMatch) {
      familyName = famMatch[1].trim();
    } else {
      const firstCap = clean.match(/\b([A-ZА-Я][a-zа-яA-ZА-Я0-9_]+)\b/);
      if (firstCap) familyName = firstCap[1];
    }

    if (familyName) {
      familyName = normalizeFamilyName(familyName, customDictMap);
    }

    // Extract Duration
    let duration = '';
    const durMatch = clean.match(/(\d+)\s*(часов|часа|час|ч|дней|дня|день|д)(?:\s|[^а-яёa-z]|$)/i);
    if (durMatch) {
      const num = durMatch[1];
      let unit = durMatch[2].toLowerCase();
      
      if (unit.startsWith('ч')) {
        unit = num === '1'
          ? 'час'
          : parseInt(num, 10) >= 2 && parseInt(num, 10) <= 4
          ? 'часа'
          : 'часов';
      } else if (unit.startsWith('д')) {
        unit = num === '1'
          ? 'день'
          : parseInt(num, 10) >= 2 && parseInt(num, 10) <= 4
          ? 'дня'
          : 'дней';
      }
      duration = `${num} ${unit}`;
    }

    // Extract Complaint Link or Rule
    let complaintLink = '';
    const linkMatch = clean.match(/(https?:\/\/[^\s\)]+)/i);
    if (linkMatch) complaintLink = linkMatch[1];

    let ruleText = '';
    const ruleNumMatch = clean.match(/(\d+\.\d+(?:\.\d+)?)/);
    if (ruleNumMatch) {
      ruleText = formatRuleCitation(ruleNumMatch[0], clean);
    } else {
      const parenMatch = clean.match(/\(([^)]+)\)/);
      if (parenMatch) {
        ruleText = formatRuleCitation(parenMatch[1].trim(), clean);
      }
    }

    if (familyName) {
      const freezeEmoji = isUnfreeze
        ? '<:a08db92a1bef4603881536b6807eb30d:1346294668308250685>'
        : '<:3c82390ed0514e65810db243c5ad1832:1346294142732472521>';

      let mainLine = '';
      if (isUnfreeze) {
        if (isCapt) {
          mainLine = `${freezeEmoji} _Семья **${familyName}** разморожена по каптам_`;
        } else {
          mainLine = `${freezeEmoji} _Семья **${familyName}** полностью разморожена_`;
        }
      } else {
        const freezeTypeStr = isCapt ? 'заморозку каптов' : 'заморозку';
        const durStr = duration ? ` на **${duration}**` : '';

        if (complaintLink) {
          mainLine = `${freezeEmoji} _Семья **${familyName}** получает ${freezeTypeStr}${durStr} по жалобе - ||${complaintLink}||_`;
        } else if (/по\s+жалобе/i.test(clean)) {
          mainLine = `${freezeEmoji} _Семья **${familyName}** получает ${freezeTypeStr}${durStr} по жалобе - ||ссылка на жалобу||_`;
        } else if (ruleText) {
          mainLine = `${freezeEmoji} _Семья **${familyName}** получает ${freezeTypeStr}${durStr} за нарушение **${ruleText}**_`;
        } else {
          mainLine = `${freezeEmoji} _Семья **${familyName}** получает ${freezeTypeStr}${durStr}_`;
        }
      }

      return `${mainLine}\n<https://t.me/famq_news>`;
    }
  }

  // 2. RECOLOR / TERRITORY PARSER
  // Example: "Квадрат A1 перекрашен в сторону Kitsune за нарушение 1.4 ВЗП"
  if (/квадрат|перекрашен|перекрас|откачен/i.test(clean)) {
    const squareMatch = clean.match(/(?:квадрат|квадрата|кв)\s*([a-zA-Z0-9]+)/i);
    const sq = squareMatch ? squareMatch[1].toUpperCase() : '';

    const famMatch = clean.match(/(?:сторону|семьи|семью)\s+([a-zA-Z0-9_А-Яа-яЁё]+)/i);
    const targetFam = famMatch ? normalizeFamilyName(famMatch[1], customDictMap) : '';

    const ruleMatch = clean.match(/(\d+\.\d+)/);
    let ruleText = ruleMatch ? formatRuleCitation(ruleMatch[0], clean) : '';

    if (sq) {
      const pinEmoji = '<:pin5:1346458830334197780>';
      if (/нейтрал/i.test(clean)) {
        return `${pinEmoji} _Квадрат **${sq}** перекрашен в **нейтрал**${ruleText ? ` в связи с нарушением **${ruleText}**` : ''}_\n<https://t.me/famq_news>`;
      }
      if (targetFam) {
        return `${pinEmoji} _Квадрат **${sq}** перекрашен в сторону **${targetFam}**${ruleText ? ` в связи с нарушением **${ruleText}**` : ''}_\n<https://t.me/famq_news>`;
      }
    }
  }

  // 3. SUPPLY & CRAFTING PARSER (Поставки и Крафт)
  // Example: "Аллегри фамк отбила нпадение на поставку от Кортез фамк"
  // Example: "АЛЛЕГРИ ПЕРЕКРЫЛА ПОСТАВКУ ОТ ЛСПД НА 1 ХЭВИК МК 2"
  if (/поставк|крафт|перекрыт|перекрыл|перекрыла|перекрыли|отбил|отбила|отбили|отбитие|перехват|матовозк/i.test(clean) || (/нападение|нпадение/i.test(clean) && /(поставк|крафт|лспд|фиб|бксо|санг|гов|сасп)/i.test(clean))) {
    const supplyEmoji = '<:emoji_246:1346569081322471434>';

    // Extract loot / weapon details
    let lootText = '';
    const heavySniperMatch = clean.match(/(\d+)?\s*(?:x|\*|шт\.?)?\s*(?:тяжелая\s+снайперская\s+винтовка(?:\s*мк\s*2|\s*mk\s*2)?|хэви\s*снайпер\s*(?:мк\s*2|mk\s*2)?|хэвик\s*(?:мк\s*2|mk\s*2)?|хэвик|хэви|heavy\s*sniper(?:\s*mk\s*2|\s*mk2)?|снапа|снайперка)/i);
    if (heavySniperMatch) {
      const qty = heavySniperMatch[1] || '1';
      lootText = `${qty}x Heavy Sniper Mk2`;
    } else {
      const mgMatch = clean.match(/(\d+)?\s*(?:x|\*|шт\.?)?\s*(?:пулемет|сотка|combat\s*mg(?:\s*mk\s*2|\s*mk2)?)/i);
      if (mgMatch) {
        const qty = mgMatch[1] || '1';
        lootText = `${qty}x Combat MG Mk2`;
      }
    }

    // Clean loot mentions out of text so they do not pollute faction name parsing
    let textNoLoot = clean
      .replace(/(?:на|с\s+лутом|лут)?\s*(\d+)?\s*(?:x|\*|шт\.?)?\s*(?:тяжелая\s+снайперская\s+винтовка(?:\s*мк\s*2|\s*mk\s*2)?|хэви\s*снайпер\s*(?:мк\s*2|mk\s*2)?|хэвик\s*(?:мк\s*2|mk\s*2)?|хэвик|хэви|heavy\s*sniper(?:\s*mk\s*2|\s*mk2)?|снапа|снайперка|пулемет|сотка)/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

    const isDefense = /(?:отбила|отбил|отбили|успешно\s+отбила|успешно\s+отбил|отбитие)/i.test(textNoLoot);

    let winnerRaw = '';
    let loserRaw = '';

    const matchWithOt = textNoLoot.match(/(?:семья\s+|семьи\s+)?([a-zA-Z0-9_А-Яа-яЁё\s]+?)\s+(?:перекрыла|перекрыл|перекрыли|перехватила|отбила|отбил|отбили|успешно\s+перекрыла|успешно\s+отбила)\s+(?:нападение\s+на\s+)?(?:поставку|крафт|колонну|снабжение)?\s*(?:от\s+|фракции\s+)?([a-zA-Z0-9_А-Яа-яЁё\s]+)/i);

    if (matchWithOt) {
      winnerRaw = matchWithOt[1].trim();
      loserRaw = matchWithOt[2].trim();
    } else {
      const simpleMatch = textNoLoot.match(/(?:семья\s+|семьи\s+)?([a-zA-Z0-9_А-Яа-яЁё\s]+?)\s+(?:перекрыли|перекрыла|перекрыл|отбили|отбила|отбил)\s+([a-zA-Z0-9_А-Яа-яЁё\s]+)/i);
      if (simpleMatch) {
        winnerRaw = simpleMatch[1].trim();
        loserRaw = simpleMatch[2].trim();
      }
    }

    if (winnerRaw && loserRaw) {
      const winner = normalizeFamilyName(winnerRaw, customDictMap);
      const loser = normalizeFamilyName(loserRaw, customDictMap);

      const isStateNotSang = /^(lspd|fib|bcso|gov|sasp|wn|ems|usss|лспд|фиб|бксо|гов|сасп|емс|полиция|шерифы)/i.test(loserRaw);
      const isSang = /^(sang|санг|армия|форт\s*занкудо|занкудо)/i.test(loserRaw);

      let targetType = 'поставку';

      if (isStateNotSang) {
        // Intercepting state org except SANG is ALWAYS CRAFT
        targetType = 'крафт';
      } else if (isSang) {
        // SANG: if technical or medical materials are specified -> supply, otherwise -> craft
        if (/техн|тех\.\s*мат|техи|техмат/i.test(clean)) {
          targetType = 'поставку технических материалов';
        } else if (/мед|медикамент|мед\.\s*мат|меды|медмат/i.test(clean)) {
          targetType = 'поставку медицинских материалов';
        } else {
          targetType = 'крафт';
        }
      } else {
        if (/крафт/i.test(clean)) {
          targetType = 'крафт';
        } else {
          targetType = 'поставку';
        }
      }

      const actionPhrase = isDefense
        ? `успешно отбила нападение на ${targetType}`
        : `успешно перекрыла ${targetType}`;

      let resultStr = `${supplyEmoji} _**${winner}** ${actionPhrase} от **${loser}**_`;
      if (lootText) {
        resultStr += `\n- Выбитое вооружение - **${lootText}**`;
      }
      resultStr += `\n<https://t.me/famq_news>`;
      return resultStr;
    }
  }

  // 4. LEADER NEWS PARSER (Новости Лидеров)
  // Standard template:
  // <:1057697181244600320:1346493963544170557> _Добрый день! _
  //
  // _ Лидер фракции **[Faction]**_
  // - _**[Nickname]** - [Action]_
  // - _Статический ID - **#...**_
  // - _Discord - **@...**_
  // _Пожелаем удачи в дальнейших начинаниях!_
  // <https://t.me/famq_news>
  if (/лидер|лидерку|лидерка|назначен|покинул|снят|отстоял|псж|по\s+сж|врио|лидерский/i.test(clean)) {
    const leaderEmoji = '<:1057697181244600320:1346493963544170557>';

    const staticMatch = clean.match(/(?:статический\s*id|статик\s*id|статик|айди|id)[:\-]?\s*\*?([#№]?\s*\d+)\*?/i);
    const staticId = staticMatch ? `#${staticMatch[1].replace(/[^\d]/g, '')}` : '#...';

    const discordMatch = clean.match(/(?:discord|дискорд)[:\-]?\s*\*?@?([a-zA-Z0-9_.]+)\*?/i);
    const discordTag = discordMatch ? `@${discordMatch[1].replace(/^@/, '')}` : '@...';

    let termNum = '1-й';
    if (/2\s*срок|второй\s*срок/i.test(clean)) termNum = '2-й';
    if (/3\s*срок|третий\s*срок/i.test(clean)) termNum = '3-й';

    // Faction extraction
    let factionStr = '';
    const factionMatch = clean.match(/(?:фракции|фракцию|лидер|лидерку|лидера)\s+([a-zA-Z0-9_А-Яа-яЁё]+(?:\s+[a-zA-Z0-9_А-Яа-яЁё]+)?)/i) ||
      clean.match(/\b(вагос|вагосы|баллас|бладс|грув|рифа|марабунта|лспд|фиб|бксо|санг|гов|сасп|емс|vagos|ballas|bloods|grove|rifa|marabunta|lspd|fib|bcso|sang|gov|sasp|ems|usss|wn)\b/i);

    if (factionMatch) {
      factionStr = normalizeFamilyName(factionMatch[1], customDictMap);
    } else {
      factionStr = 'Фракция';
    }

    // Person's name extraction
    let personName = 'Никнейм';
    const nameMatch = clean.match(/([A-ZА-Я][a-zа-я]+(?:\s+[A-ZА-Я][a-zа-я]+|_Text)+)/);
    if (nameMatch) {
      const candidate = nameMatch[1].trim();
      if (!/лидер|вагос|баллас|бладс|грув|рифа|лспд|фиб|бксо|санг|гов|сасп|емс|покинул|назначен|отстоял|срок|псж|сж/i.test(candidate)) {
        personName = candidate;
      }
    }

    const isPsg = /псж|по\s+сж|собственному/i.test(clean);
    const isStood = /отстоял/i.test(clean);
    const isLeft = /покинул|ушел|снялся/i.test(clean);
    const isRemoved = /снят/i.test(clean);
    const isAppointed = /назначен/i.test(clean);

    let actionLine = '';
    let wishLine = '_Пожелаем удачи в дальнейших начинаниях!_';

    if (isStood && (isPsg || isLeft)) {
      actionLine = `- _**${personName}** - успешно отстоял ${termNum} лидерский срок и уходит с поста по СЖ_`;
    } else if (isStood) {
      actionLine = `- _**${personName}** - успешно отстоял ${termNum} лидерский срок и уходит с поста_`;
    } else if (isPsg || isLeft) {
      actionLine = `- _**${personName}** - покидает пост лидера по собственному желанию_`;
    } else if (isRemoved) {
      actionLine = `- _**${personName}** - снят с поста лидера по совокупности выговоров_`;
    } else if (isAppointed) {
      actionLine = `- **${personName}** - новый лидер **${factionStr}**`;
      wishLine = '_Пожелаем удачи и терпения на лидерском посту!_';
    } else {
      actionLine = `- _**${personName}** - покинул пост лидера_`;
    }

    return `${leaderEmoji} _Добрый день! _\n\n_ Лидер фракции **${factionStr}**_\n${actionLine}\n- _Статический ID - **${staticId}**_\n- _Discord - **${discordTag}**_\n${wishLine}\n<https://t.me/famq_news>`;
  }

  // 5. REPRIMANDS & RULES PARSER (Правила и Выговоры)
  // Standard template:
  // <:1057697181244600320:1346493963544170557> _Добрый день! _
  //
  // _Лидер фракции **[Faction]**_
  // - _**[Nickname]** - получает **выговор** за **[Rule]**._
  // - _Статический ID - **#...**_
  // - _Discord - **@...**_
  // - _Ситуация по выговорам - **[1/5]**_
  // <https://t.me/famq_news>
  if (/выговор|выговора|строгий|устный|снят\s+выговор/i.test(clean)) {
    const leaderEmoji = '<:1057697181244600320:1346493963544170557>';

    const staticMatch = clean.match(/(?:статический\s*id|статик\s*id|статик|айди|id)[:\-]?\s*\*?([#№]?\s*\d+)\*?/i);
    const staticId = staticMatch ? `#${staticMatch[1].replace(/[^\d]/g, '')}` : '#...';

    const discordMatch = clean.match(/(?:discord|дискорд)[:\-]?\s*\*?@?([a-zA-Z0-9_.]+)\*?/i);
    const discordTag = discordMatch ? `@${discordMatch[1].replace(/^@/, '')}` : '@...';

    const warnsMatch = clean.match(/\[?(\d\/\d)\]?/);
    const warnsStatus = warnsMatch ? `[${warnsMatch[1]}]` : '[1/5]';

    const ruleMatch = clean.match(/(\d+\.\d+(?:\.\d+)?)/);
    let ruleText = ruleMatch ? formatRuleCitation(ruleMatch[0], clean) : '';

    let complaintLink = '';
    const linkMatch = clean.match(/(https?:\/\/[^\s\)]+)/i);
    if (linkMatch) complaintLink = linkMatch[1];

    const targetMatch = clean.match(/(?:семья|семьи|фракция|фракции)\s+([a-zA-Z0-9_А-Яа-яЁё]+)/i) || clean.match(/^([a-zA-Z0-9_А-Яа-яЁё]+)\s+(?:получ|снима)/i);
    let factionStr = targetMatch ? normalizeFamilyName(targetMatch[1], customDictMap) : 'Фракция';

    let reasonPart = '';
    if (complaintLink) {
      reasonPart = `по жалобе: || ${complaintLink} ||`;
    } else if (ruleText) {
      reasonPart = `за **${ruleText}**`;
    } else {
      reasonPart = `за нарушение правил`;
    }

    return `${leaderEmoji} _Добрый день! _\n\n_Лидер фракции **${factionStr}**_\n- _**Никнейм** - получает **выговор** ${reasonPart}._\n- _Статический ID - **${staticId}**_\n- _Discord - **${discordTag}**_\n- _Ситуация по выговорам - **${warnsStatus}**_\n<https://t.me/famq_news>`;
  }

  // 6. BANK ROBBERY PARSER (Ограбление Банков)
  if (/ограблен|ограбил|ограбила|пасифик|флейка/i.test(clean)) {
    const isPacific = /пасифик|pacific/i.test(clean);
    const isFleeca = /флейка|флика|fleeca/i.test(clean);
    const bankName = isPacific ? 'Pacific Standard' : isFleeca ? 'Fleeca Bank' : 'Банк';

    const famMatch = clean.match(/(?:семья|семьи|банда|фракция)\s+([a-zA-Z0-9_А-Яа-яЁё]+)/i) || clean.match(/^([a-zA-Z0-9_А-Яа-яЁё]+)\s+(?:успешно\s+)?ограбил/i);
    const target = famMatch ? normalizeFamilyName(famMatch[1], customDictMap) : 'Семья';

    return `<:3c82390ed0514e65810db243c5ad1832:1346294142732472521> _**${target}** успешно ограбила **${bankName}**_\n<https://t.me/famq_news>`;
  }

  // 7. AIRDROPS & WORKSHOPS PARSER (Дропы и Цеха)
  if (/аирдроп|дроп|цех|оружейный\s+цех|завод/i.test(clean)) {
    const isDrop = /аирдроп|дроп/i.test(clean);
    const isWorkshop = /цех|оружейный/i.test(clean);
    const objName = isDrop ? 'Аирдроп' : isWorkshop ? 'Оружейный цех' : 'Объект';

    const famMatch = clean.match(/(?:семья|семьи)\s+([a-zA-Z0-9_А-Яа-яЁё]+)/i) || clean.match(/^([a-zA-Z0-9_А-Яа-яЁё]+)\s+(?:забрала|залутала|выиграла)/i);
    const target = famMatch ? normalizeFamilyName(famMatch[1], customDictMap) : 'Семья';

    return `<:a7e0ff67324d437c850002273542ec65:1346294629997482106> _Семья **${target}** успешно забрала **${objName}**_\n<https://t.me/famq_news>`;
  }

  return clean;
}

/**
  Auto-fix formatting and style errors in post text (1-Click AutoFix)
 */
export function autoFixPostText(text: string, customDictMap?: Record<string, string>): string {
  if (!text || !text.trim()) return '';

  // 0. Perform Smart Structural Reformat first if matching raw sentences
  let fixed = smartReformatAssistantPost(text, customDictMap);

  // Protect custom emojis using non-printable tokens to prevent regex mutation & underscore corruption
  const emojis: string[] = [];
  fixed = fixed.replace(/<a?:[a-zA-Z0-9_]+:\d+>/g, (match) => {
    emojis.push(match);
    return `\u0001EMOJI_${emojis.length - 1}\u0002`;
  });

  // Protect Discord role/user/channel mentions to prevent regex corruption
  const mentions: string[] = [];
  fixed = fixed.replace(/<@&?\d+>|<#\d+>/g, (match) => {
    mentions.push(match);
    return `\u0001MENTION_${mentions.length - 1}\u0002`;
  });

  // Protect URLs using non-printable tokens to prevent regex mutation
  const urls: string[] = [];
  fixed = fixed.replace(/(<https?:\/\/[^\s>]+>|https?:\/\/[^\s]+)/ig, (match) => {
    urls.push(match);
    return `\u0001URL_${urls.length - 1}\u0002`;
  });

  // Common typos in RP news input
  fixed = fixed.replace(/\bнпадение\b/gi, 'нападение');
  fixed = fixed.replace(/\bнпадении\b/gi, 'нападении');
  fixed = fixed.replace(/\bотбитте\b|\bотбитее\b/gi, 'отбитие');
  fixed = fixed.replace(/\bперекрытии\b|\bперекрытиее\b/gi, 'перекрытие');
  fixed = fixed.replace(/\bпокиуло\b|\bпокинулa\b/gi, 'покинул');
  fixed = fixed.replace(/\bсрогого\b|\bстрогй\b/gi, 'строгий');
  fixed = fixed.replace(/\bустны\b/gi, 'устный');
  fixed = fixed.replace(/\bвыгвор\b|\bвыговар\b/gi, 'выговор');
  fixed = fixed.replace(/\bограблениие\b/gi, 'ограбление');
  fixed = fixed.replace(/\bпасифик\b/gi, 'Pacific Standard');
  fixed = fixed.replace(/\bфлейка\b|\bфлика\b/gi, 'Fleeca Bank');

  // Category specific common normalizations
  // Fix "статик id" / "айди" / etc to "- Статический ID - **...**"
  fixed = fixed.replace(/^[-\s]*(статик\s*айди|статик\s*id|статик|айди|id)[:\-]?\s*\*?([#№]?\s*\d+)\*?/gim, (match, p1, p2) => {
    return `- Статический ID - **${p2.replace(/[^\d]/g, '')}**`;
  });
  // Fix "дискорд"
  fixed = fixed.replace(/^[-\s]*дискорд[:\-]?\s*\*?([a-z0-9_.]+)\*?/gim, '- Discord - **$1**');
  
  // 0. Fix state organization performing intercept or crime action
  fixed = fixed.replace(
    /(\*\*|\b)(SANG|FIB|LSPD|GOV|LSCSD|SASP|WN|EMS|USSS)(\*\*|\b)([\s\S]{0,30}?)(перекрыли|перекрыл|ограбили|ограбил)/gi,
    '**[Фракция/Семья]**$4$5'
  );

  // 1. Move punctuation outside of bold formatting: **слово,** -> **слово**,
  fixed = fixed.replace(/\*\*([^*]+?)([,.!?:;]+)\*\*/g, '**$1**$2');

  // 2. Strip year from date spoilers: _||09.08.2026||_ or ||09.08.2026|| -> _||09.08||_
  fixed = fixed.replace(/_?\|\|(\d{2}\.\d{2})\.\d{2,4}\|\|_?/g, '_||$1||_');

  // 3. Ensure date spoiler has outer italic underscores: ||09.08|| -> _||09.08||_
  fixed = fixed.replace(/(?<!_)\|\|(\d{2}\.\d{2})\|\|(?!_)/g, '_||$1||_');

  // 4. Remove quotation marks «...», "...", “...” from gang/family names and titles
  fixed = fixed.replace(/[«"“](.*?)[»"”]/g, '$1');

  // 5. Replace informal gang names with canonical names
  fixed = fixed.replace(/\bвагос\b/gi, 'Los Santos Vagos');
  fixed = fixed.replace(/\bгрув\b/gi, 'The Families');
  fixed = fixed.replace(/\bбаллас\b/gi, 'The Ballas Gang');
  fixed = fixed.replace(/\bбладс\b/gi, 'The Bloods Gang');
  fixed = fixed.replace(/\bмарабунта\b/gi, 'Marabunta Grande');
  fixed = fixed.replace(/\bрифа\b/gi, 'Los Santos Rifa');

  // 6. Auto-capitalize state faction abbreviations when written lowercase
  fixed = fixed.replace(/\bgov\b/g, 'GOV');
  fixed = fixed.replace(/\bfib\b/g, 'FIB');
  fixed = fixed.replace(/\blspd\b/g, 'LSPD');
  fixed = fixed.replace(/\bbcso\b/g, 'BCSO');
  fixed = fixed.replace(/\bsasp\b/g, 'SASP');
  fixed = fixed.replace(/\bsang\b/g, 'SANG');
  fixed = fixed.replace(/\busss\b/g, 'USSS');
  fixed = fixed.replace(/\bwn\b/g, 'WN');

  // 7. Fix missing spaces after punctuation
  fixed = fixed.replace(/([а-яА-Яa-zA-ZёЁ]+)([,;:!?\.])([а-яА-Яa-zA-ZёЁ]+)/g, '$1$2 $3');

  // 8. Fix spaces before punctuation (e.g. "текст ," -> "текст,")
  fixed = fixed.replace(/\s+([,\.!?:;])/g, '$1');

  // 9. Fix redundant punctuation
  fixed = fixed.replace(/,,+/g, ',');
  fixed = fixed.replace(/(?<!\.)\.\.(?!\.)/g, '.');

  // 10. Capitalization after dot/exclamation/question or newline
  fixed = fixed.replace(/(^\s*|[.!?]\s+|\n+)([а-яёa-z])/gu, (match, p1, p2) => `${p1}${p2.toUpperCase()}`);

  // 10b. Fix em-dash
  fixed = fixed.replace(/ - /g, ' — ');

  // 10c. Fix empty tags
  fixed = fixed.replace(/\*\*\*\*/g, '');
  fixed = fixed.replace(/(?<!_)__(?!_)/g, '');

  // 10d. Fix spaces inside bold
  fixed = fixed.replace(/\*\*(\s+)([^*]+?)\*\*/g, '$1**$2**');
  fixed = fixed.replace(/\*\*([^*]+?)(\s+)\*\*/g, '**$1**$2');

  // 10e. Fix time format and remove мск completely (Famq News standard: "18:00" or "в 18:00", never "мск")
  fixed = fixed.replace(/\bв\s+([0-1]?[0-9]|2[0-3])[\.\-]([0-5][0-9])\b/gi, 'в $1:$2');
  fixed = fixed.replace(/\b([0-1]?[0-9]|2[0-3])[\.\-:]([0-5][0-9])\s*мск\.?/gi, '$1:$2');
  fixed = fixed.replace(/\b(\d{1,2}:\d{2})\s*мск\.?/gi, '$1');
  fixed = fixed.replace(/\s+мск\b/gi, '');

  // 10f. Fix number + word without space
  fixed = fixed.replace(/(^|\s)(\d+)([а-яА-ЯёЁa-zA-Z]{3,})(?=\s|[.,!?]|$)/g, '$1$2 $3');

  // 10g. Fix multiple punctuation
  fixed = fixed.replace(/([!?])[!?]+/g, '$1');

  // 10h. Fix bracket spaces
  fixed = fixed.replace(/([а-яА-ЯёЁa-zA-Z0-9])\(/g, '$1 (');
  fixed = fixed.replace(/\)([а-яА-ЯёЁa-zA-Z0-9])/g, ') $1');

  // 10i. Fix missing space after dash
  fixed = fixed.replace(/(^\s*-)([^\s\-])/gm, '$1 $2');

  // 10j. Fix space before percentage
  fixed = fixed.replace(/(\d+)\s+%/g, '$1%');

  // 11. Normalize duplicate spaces and excess line breaks
  fixed = fixed.replace(/ {2,}/g, ' ');
  fixed = fixed.replace(/\n{3,}/g, '\n\n');

  // Restore URLs safely
  urls.forEach((url, index) => {
    let restoredUrl = url;
    if (url.includes('t.me/famq_news')) {
      restoredUrl = '<https://t.me/famq_news>';
    } else {
      const pureUrl = url.replace(/^[<|]+|[>|]+$/g, '');
      restoredUrl = `||${pureUrl}||`;
    }
    
    // Check if it's already inside || ||
    const token = `\u0001URL_${index}\u0002`;
    const escapedToken = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const hasSpoilersRegex = new RegExp(`\\|\\|\\s*${escapedToken}\\s*\\|\\|`);
    
    if (hasSpoilersRegex.test(fixed)) {
      fixed = fixed.replace(hasSpoilersRegex, restoredUrl);
    } else {
      fixed = fixed.replace(token, restoredUrl);
    }
  });

  // 12. Smart Link & Separator Extraction (Preserves user's exact \n or \n\n)
  const linkRegex = /(<https:\/\/t\.me\/famq_news>|https:\/\/t\.me\/famq_news)/i;
  let linkPart = '<https://t.me/famq_news>';
  let separator = '\n';

  if (linkRegex.test(fixed)) {
    const match = fixed.match(linkRegex);
    if (match) {
      linkPart = match[0];
      const linkIndex = fixed.indexOf(match[0]);
      const textBeforeLink = fixed.substring(0, linkIndex);

      if (textBeforeLink.endsWith('\n\n')) {
        separator = '\n\n';
      } else if (textBeforeLink.endsWith('\n')) {
        separator = '\n';
      } else {
        separator = '\n';
      }

      fixed = textBeforeLink.trimEnd();
    }
  }

  // 10. Fix unbalanced tags in body
  let body = fixed;

  // A. Code blocks ```
  const codeCount = (body.match(/```/g) || []).length;
  if (codeCount % 2 !== 0) {
    body = body + '\n```';
  }

  // B. Inline code `
  const inlineCodeCount = (body.match(/`/g) || []).length;
  if (inlineCodeCount % 2 !== 0) {
    body = fixTrailingMissingTag(body, '`');
  }

  // C. Spoilers ||
  const spoilerCount = (body.match(/\|\|/g) || []).length;
  if (spoilerCount % 2 !== 0) {
    body = fixTrailingMissingTag(body, '||');
  }

  // D. Bold **
  const boldCount = (body.match(/\*\*/g) || []).length;
  if (boldCount % 2 !== 0) {
    body = fixUnbalancedBold(body);
  }

  // E. Italics _
  const textNoBold = body.replace(/\*\*/g, '  ');
  const underscoreCount = (textNoBold.match(/_/g) || []).length;
  if (underscoreCount % 2 !== 0) {
    body = fixUnbalancedUnderscore(body);
  }

  // F. Single asterisk *
  const singleAsterisks = (textNoBold.match(/\*/g) || []).length;
  if (singleAsterisks % 2 !== 0) {
    body = fixTrailingMissingTag(body, '*');
  }

  // 11. Reassemble body + link
  fixed = `${body.trimEnd()}${separator}${linkPart}`;

  // Restore custom emojis safely
  emojis.forEach((emoji, index) => {
    fixed = fixed.replace(`\u0001EMOJI_${index}\u0002`, emoji);
  });

  // Restore Discord mentions safely
  mentions.forEach((mention, index) => {
    fixed = fixed.replace(`\u0001MENTION_${index}\u0002`, mention);
  });

  return fixed;
}

export interface SmartSuggestionResult {
  originalMatched: string;
  replacement: string;
  suggestedValue: string;
  category: string;
  isViolation?: boolean;
  violationMessage?: string;
}

export interface SmartSuggestionOptions {
  allowedCategories?: ('faction' | 'crime' | 'location' | 'reason' | 'item')[];
  disallowedCategories?: ('faction' | 'crime' | 'location' | 'reason' | 'item')[];
  allowedType?: 'crime_only' | 'gos_only' | 'all';
}

export interface SmartEntity {
  target: string;
  aliases: string[];
  category: 'faction' | 'crime' | 'location' | 'reason' | 'item';
  keywords: string[];
}

export const SMART_ENTITIES: SmartEntity[] = [
  // GOS FACTIONS
  { target: 'FIB', aliases: ['фиб', 'фбр', 'агенты', 'fbi', 'fib'], category: 'faction', keywords: ['фиб', 'фбр'] },
  { target: 'LSPD', aliases: ['лспд', 'полиция', 'копы', 'police', 'lspd', 'лспд копы'], category: 'faction', keywords: ['лспд', 'полиция'] },
  { target: 'LSCSD', aliases: ['лсксд', 'шерифы', 'департамент шерифа', 'шериф', 'областная полиция', 'lscsd', 'sd'], category: 'faction', keywords: ['лсксд', 'шерифы'] },
  { target: 'SANG', aliases: ['санг', 'армия', 'форт занкудо', 'форт', 'военные', 'нацгвардия', 'sang', 'армейцы'], category: 'faction', keywords: ['санг', 'армия', 'форт'] },
  { target: 'GOV', aliases: ['гов', 'правительство', 'мэрия', 'губернатор', 'капитолий', 'gov'], category: 'faction', keywords: ['гов', 'правительство'] },
  { target: 'EMS', aliases: ['емс', 'медики', 'больница', 'врачи', 'скорая', 'ems'], category: 'faction', keywords: ['емс', 'больница'] },
  { target: 'WN', aliases: ['wn', 'weazel news', 'визл', 'визл ньюз', 'новости', 'сми'], category: 'faction', keywords: ['визл', 'новости'] },

  // CRIME ORGANIZATIONS
  { target: 'Marabunta Grande', aliases: ['марабунта', 'марабунта гранде', 'марабонта', 'синие', 'мара', 'marabunta', 'marabunta grande'], category: 'crime', keywords: ['марабунта', 'синие'] },
  { target: 'Los Santos Vagos', aliases: ['вагос', 'вагосы', 'желтые', 'los santos vagos', 'vagos', 'вагос латино'], category: 'crime', keywords: ['вагос', 'желтые'] },
  { target: 'Blood Street Gang', aliases: ['бладс', 'бладсы', 'красные', 'bloods', 'blood street gang', 'блад стрит'], category: 'crime', keywords: ['бладс', 'красные'] },
  { target: 'The Ballas Gang', aliases: ['баллас', 'балласы', 'фиолетовые', 'ballas', 'the ballas gang', 'балас'], category: 'crime', keywords: ['баллас', 'фиолетовые'] },
  { target: 'The Families', aliases: ['фамилис', 'грув', 'грув стрит', 'зеленые', 'фамы', 'families', 'the families'], category: 'crime', keywords: ['грув', 'зеленые'] },
  { target: 'MCL', aliases: ['мкл', 'mcl', 'мориарти', 'moriarty', 'moriarty club'], category: 'crime', keywords: ['мкл', 'мориарти'] },
  { target: 'Yakuza', aliases: ['якудза', 'яки', 'японцы', 'yakuza'], category: 'crime', keywords: ['якудза'] },
  { target: 'Armenian Mafia', aliases: ['армяне', 'армянская мафия', 'армянская', 'armenian', 'armenian mafia'], category: 'crime', keywords: ['армяне', 'армянская мафия'] },
  { target: 'Russian Mafia', aliases: ['русские', 'русская мафия', 'рм', 'rm', 'russian mafia'], category: 'crime', keywords: ['русская мафия', 'рм'] },
  { target: 'La Cosa Nostra', aliases: ['итальянцы', 'лкн', 'lcn', 'la cosa nostra', 'коза ностра'], category: 'crime', keywords: ['лкн', 'коза ностра'] },
  { target: 'Triads', aliases: ['триады', 'китайцы', 'триада', 'triads'], category: 'crime', keywords: ['триады'] },

  // LOCATIONS & EVENTS
  { target: 'Остров Кайо-Перико', aliases: ['остров', 'кайо', 'кайо перико', 'кайо-перико', 'cayo perico', 'остров фз'], category: 'location', keywords: ['остров', 'кайо перико'] },
  { target: 'Форт Занкудо', aliases: ['фз', 'форт занкудо', 'fort zancudo', 'форт'], category: 'location', keywords: ['форт занкудо', 'фз'] },
  { target: 'Авианосец', aliases: ['авик', 'авианосец', 'carrier'], category: 'location', keywords: ['авианосец', 'авик'] },
  { target: 'Поставка', aliases: ['поставка', 'поставки', 'матовозка', 'матовозки'], category: 'location', keywords: ['поставка', 'матовозка'] },
  { target: 'Рейд', aliases: ['рейд', 'облава'], category: 'location', keywords: ['рейд'] },
  { target: 'Теракт', aliases: ['теракт', 'тект', 'захват'], category: 'location', keywords: ['теракт'] },
  { target: 'Airdrop', aliases: ['аирдроп', 'дроп', 'airdrop'], category: 'location', keywords: ['дроп', 'аирдроп'] },

  // REASONS & STATUSES
  { target: 'по собственному желанию', aliases: ['псж', 'по псж', 'по собственному', 'собственное желание'], category: 'reason', keywords: ['псж'] },
  { target: '3/3 выговоров', aliases: ['3/3', '3/3 выговоров', 'три выговора', 'максимум выговоров'], category: 'reason', keywords: ['3/3'] },
  { target: 'расформирование', aliases: ['расформ', 'расформирование', 'расформирован'], category: 'reason', keywords: ['расформ'] },
  { target: 'по результатам обзвона', aliases: ['обзвон', 'по обзвону', 'прошел обзвон'], category: 'reason', keywords: ['обзвон'] },
  { target: 'по жалобе', aliases: ['жб', 'по жб', 'по жалобе', 'жалоба'], category: 'reason', keywords: ['жб', 'жалоба'] },
];

export function getSmartInputSuggestion(
  inputValue: string,
  options?: SmartSuggestionOptions
): SmartSuggestionResult | null {
  if (!inputValue || typeof inputValue !== 'string') return null;
  const trimmed = inputValue.trim();
  if (!trimmed || trimmed.length < 2) return null;

  const lower = trimmed.toLowerCase();

  // Determine allowed and disallowed categories
  let allowed = options?.allowedCategories;
  let disallowed = options?.disallowedCategories || [];

  if (options?.allowedType === 'crime_only') {
    allowed = ['crime', 'location', 'reason', 'item'];
    disallowed = ['faction'];
  } else if (options?.allowedType === 'gos_only') {
    allowed = ['faction', 'location', 'reason', 'item'];
    disallowed = ['crime'];
  }

  // 1. Violation Check: Did user type a disallowed category (e.g. Gos in crime field)?
  if (disallowed.includes('faction') || options?.allowedType === 'crime_only') {
    // Check if user typed a Gos faction alias
    const gosEntities = SMART_ENTITIES.filter((e) => e.category === 'faction');
    for (const entity of gosEntities) {
      for (const alias of entity.aliases) {
        if (alias.length < 2) continue;
        const wordRegex = new RegExp(`(?:^|\\s|[^a-zа-яё0-9])${alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:$|\\s|[^a-zа-яё0-9])`, 'i');
        if (lower === alias || translateKeyboard(lower) === alias || wordRegex.test(lower)) {
          return {
            originalMatched: entity.target,
            replacement: '',
            suggestedValue: '',
            category: 'faction',
            isViolation: true,
            violationMessage: `⚠️ Гос. организации (${entity.target}) не могут перекрывать поставки или указываться в Крайм-полях!`,
          };
        }
      }
    }
  }

  if (disallowed.includes('crime') || options?.allowedType === 'gos_only') {
    // Check if user typed a Crime alias
    const crimeEntities = SMART_ENTITIES.filter((e) => e.category === 'crime');
    for (const entity of crimeEntities) {
      for (const alias of entity.aliases) {
        if (alias.length < 2) continue;
        const wordRegex = new RegExp(`(?:^|\\s|[^a-zа-яё0-9])${alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:$|\\s|[^a-zа-яё0-9])`, 'i');
        if (lower === alias || translateKeyboard(lower) === alias || wordRegex.test(lower)) {
          return {
            originalMatched: entity.target,
            replacement: '',
            suggestedValue: '',
            category: 'crime',
            isViolation: true,
            violationMessage: `⚠️ Крайм фракции (${entity.target}) не могут быть указаны в Гос. поле!`,
          };
        }
      }
    }
  }

  // Filter entities according to allowed / disallowed
  const candidates = SMART_ENTITIES.filter((e) => {
    if (allowed && !allowed.includes(e.category)) return false;
    if (disallowed.includes(e.category)) return false;
    return true;
  });

  // If input is ALREADY the exact target of any candidate, no suggestion needed
  for (const entity of candidates) {
    if (trimmed === entity.target) return null;
  }

  // Direct exact alias or translated alias match
  const translated = translateKeyboard(lower);

  for (const entity of candidates) {
    if (trimmed === entity.target) continue;

    for (const alias of entity.aliases) {
      if (lower === alias || translated === alias) {
        return {
          originalMatched: trimmed,
          replacement: entity.target,
          suggestedValue: entity.target,
          category: entity.category,
        };
      }
    }
  }

  // Substring match
  for (const entity of candidates) {
    for (const alias of entity.aliases) {
      if (alias.length < 2) continue;

      const regex = new RegExp(`\\b${alias}\\b`, 'gi');
      if (regex.test(trimmed)) {
        const newText = trimmed.replace(regex, entity.target);
        if (newText !== trimmed) {
          return {
            originalMatched: alias,
            replacement: entity.target,
            suggestedValue: newText,
            category: entity.category,
          };
        }
      }
    }
  }

  // Fuzzy matching for typos
  const words = trimmed.split(/\s+/);
  for (const entity of candidates) {
    for (const alias of entity.aliases) {
      if (alias.length < 3) continue;

      for (const word of words) {
        const cleanWord = word.toLowerCase().replace(/[^a-zа-яё0-9]/gi, '');
        if (cleanWord.length < 3) continue;

        if (fuzzyIncludes(cleanWord, alias) || fuzzyIncludes(alias, cleanWord)) {
          const distance = damerauLevenshteinDistance(cleanWord, alias);
          if (distance <= 2 || cleanWord.startsWith(alias.substring(0, 3))) {
            const suggestedValue = trimmed.replace(new RegExp(word, 'gi'), entity.target);
            if (suggestedValue !== trimmed) {
              return {
                originalMatched: word,
                replacement: entity.target,
                suggestedValue,
                category: entity.category,
              };
            }
          }
        }
      }
    }
  }

  return null;
}


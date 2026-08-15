'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Copy,
  Check,
  ShieldAlert,
  FileText,
  Swords,
  Crown,
  MessageSquare,
  Flame,
  AlertTriangle,
  Plus,
  Trash2,
  Sparkles,
  BookOpen,
  Code,
  Calendar,
  AlertCircle,
  Eye,
  Building,
  Award,
  Home,
  Crosshair,
  MapPin,
  Bomb,
  Trophy,
  Users,
  Star,
  Search,
  Clock,
  RotateCcw,
  History,
  X,
  Bot,
  Wand2,
  ShieldCheck,
  CheckCircle2,
  Zap,
  BarChart3,
  Lightbulb,
  FileCheck,
  ArrowRight,
  Edit3,
  AlertOctagon,
  TriangleAlert,
  Brain,
  Database,
  GraduationCap,
  Save,
  RefreshCw,
  Sliders,
  MessageCircle,
} from 'lucide-react';

import { DiscordMarkdown } from '@/lib/discord-markdown';
import {
  runAssistantAudit,
  autoFixPostText,
  checkDiscordMarkdownBalance,
  fuzzyIncludes,
  getSmartInputSuggestion,
  type AuditIssue,
  type AuditResult,
} from '@/lib/assistant-inspector';

import {
  fetchTrainingRules,
  addTrainingRule,
  toggleTrainingRule,
  deleteTrainingRule,
  fetchCustomDictionary,
  saveCustomDictItem,
  deleteCustomDictItem,
  saveCorrectionExample,
  fetchCorrectionsHistory,
  deleteCorrectionExample,
  extractLearnedPatternsFromDiff,
  autoProcessCorrectionAndLearn,
  type TrainingRule,
  type CustomDictItem,
  type CorrectionExample,
} from '@/lib/assistant-learning';

// Standard footer link
const FOOTER_LINK = '<https://t.me/famq_news>';

/**
 * Format date spoiler to canonical _||DD.MM||_ without year
 */
function formatDateSpoiler(rawDate: string): string {
  if (!rawDate) return '';
  const clean = rawDate.trim().replace(/^[_~*|]+|[_~*|]+$/g, '');
  // Extract DD.MM from DD.MM.YYYY, DD.MM.YY or DD.MM
  const match = clean.match(/^(\d{1,2}\.\d{1,2})(?:\.\d{2,4})?/);
  if (match) {
    const parts = match[1].split('.');
    const dd = parts[0].padStart(2, '0');
    const mm = parts[1].padStart(2, '0');
    return `_||${dd}.${mm}||_`;
  }
  return `_||${clean}||_`;
}

// ----------------------------------------------------
// SMART ALGORITHM AUTO-SUGGESTION COMPONENTS
// ----------------------------------------------------
const SmartAlgorithmNoticeBanner: React.FC = () => (
  <motion.div
    initial={{ opacity: 0, y: -6 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    className="mb-5 bg-[#141622] border border-slate-700/70 rounded-2xl p-3.5 flex items-start gap-3 shadow-xl relative overflow-hidden group hover:border-slate-600 transition-all"
  >
    <div className="p-2 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 shrink-0 mt-0.5">
      <Bot className="w-5 h-5 animate-pulse" />
    </div>
    <div className="space-y-1 text-xs">
      <div className="flex items-center gap-2 font-bold text-slate-100">
        <span>💡 Умный алгоритм автоопределения фракций и терминов</span>
        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30 font-mono font-bold">
          AUTO-SMART
        </span>
      </div>
      <p className="text-slate-300 leading-relaxed">
        Пишите по-русски или с опечатками (<code className="text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded font-mono">марабунта</code>, <code className="text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded font-mono">фиб</code>, <code className="text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded font-mono">вагос</code>, <code className="text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded font-mono">санг</code>, <code className="text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded font-mono">шерифы</code>, <code className="text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded font-mono">псж</code>) — алгоритм сам определит правильное официальное форматирование и предложит заменить в 1 клик!
      </p>
    </div>
  </motion.div>
);

const SmartInput: React.FC<{
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
  type?: string;
  rows?: number;
  isTextArea?: boolean;
  allowedType?: 'crime_only' | 'gos_only' | 'all';
  allowedCategories?: ('faction' | 'crime' | 'location' | 'reason' | 'item')[];
  disallowedCategories?: ('faction' | 'crime' | 'location' | 'reason' | 'item')[];
}> = ({
  value,
  onChange,
  placeholder,
  className,
  type = 'text',
  rows = 3,
  isTextArea = false,
  allowedType = 'all',
  allowedCategories,
  disallowedCategories,
}) => {
  const suggestion = getSmartInputSuggestion(value, {
    allowedType,
    allowedCategories,
    disallowedCategories,
  });

  return (
    <div className="relative w-full space-y-1.5">
      {isTextArea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          placeholder={placeholder}
          className={className}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={className}
        />
      )}
      <AnimatePresence>
        {suggestion && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 500, damping: 28 }}
            className={`flex flex-wrap items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-xl text-xs shadow-2xl border ${
              suggestion.isViolation
                ? 'bg-rose-950/80 border-rose-500/60 text-rose-200 shadow-rose-900/20'
                : 'bg-[#121420] border-slate-700/80 text-slate-200'
            }`}
          >
            <div className="flex items-center gap-2 text-slate-200 flex-wrap">
              {suggestion.isViolation ? (
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 animate-pulse" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-pulse" />
              )}
              <span className="leading-snug">
                {suggestion.isViolation ? (
                  <strong className="text-rose-300 font-semibold">{suggestion.violationMessage}</strong>
                ) : (
                  <>
                    Алгоритм предлагает: <code className="bg-slate-800/90 text-rose-300 px-1.5 py-0.5 rounded font-mono font-semibold border border-slate-700">{suggestion.originalMatched}</code> ➔ <strong className="text-emerald-300 font-bold bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-500/40 inline-block">{suggestion.replacement}</strong>
                  </>
                )}
              </span>
            </div>
            {!suggestion.isViolation && (
              <motion.button
                type="button"
                whileHover={{ scale: 1.05, y: -1 }}
                whileTap={{ scale: 0.94 }}
                onClick={() => onChange(suggestion.suggestedValue)}
                className="btn-premium shrink-0 px-2.5 py-1 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-[11px] shadow-md shadow-emerald-600/30 cursor-pointer flex items-center gap-1 border border-emerald-400/30"
              >
                <Wand2 className="w-3 h-3" />
                Заменить (1 клик)
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ----------------------------------------------------
// CUSTOM ANIMATED UI CONTROLS (CHECKBOX, RADIO, CHECK)
// ----------------------------------------------------
const AnimatedCheckIcon: React.FC<{ className?: string }> = ({
  className = 'w-4 h-4 text-emerald-400',
}) => {
  return (
    <motion.svg
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.5, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
      className={`${className} stroke-current shrink-0`}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <motion.path
        d="M20 6L9 17L4 12"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.28, ease: 'easeOut' }}
      />
    </motion.svg>
  );
};

interface AnimatedCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: React.ReactNode;
  className?: string;
}

const AnimatedCheckbox: React.FC<AnimatedCheckboxProps> = ({
  checked,
  onChange,
  label,
  className = '',
}) => {
  return (
    <label
      className={`inline-flex items-center gap-3 cursor-pointer select-none group ${className}`}
      onClick={(e) => {
        e.preventDefault();
        onChange(!checked);
      }}
    >
      <motion.div
        whileTap={{ scale: 0.88 }}
        animate={{
          scale: checked ? 1 : 1,
          borderColor: checked ? '#f43f5e' : 'rgba(71, 85, 105, 0.7)',
          backgroundColor: checked ? 'rgba(225, 29, 72, 0.25)' : 'rgba(15, 23, 42, 0.9)',
          boxShadow: checked
            ? '0 0 14px rgba(244, 63, 94, 0.45)'
            : '0 0 0px rgba(0,0,0,0)',
        }}
        transition={{ duration: 0.2, type: 'spring', stiffness: 500, damping: 22 }}
        className="w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors group-hover:border-rose-400"
      >
        <motion.svg
          className="w-3.5 h-3.5 text-rose-400 stroke-current"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <motion.path
            d="M3.5 8.5L6.5 11.5L12.5 4.5"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={false}
            animate={{
              pathLength: checked ? 1 : 0,
              opacity: checked ? 1 : 0,
            }}
            transition={{
              duration: 0.22,
              type: 'spring',
              stiffness: 450,
              damping: 24,
            }}
          />
        </motion.svg>
      </motion.div>
      {label && (
        <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">
          {label}
        </span>
      )}
    </label>
  );
};

interface AnimatedRadioProps {
  checked: boolean;
  onChange: () => void;
  label?: React.ReactNode;
  className?: string;
}

const AnimatedRadio: React.FC<AnimatedRadioProps> = ({
  checked,
  onChange,
  label,
  className = '',
}) => {
  return (
    <label
      className={`inline-flex items-center gap-2.5 cursor-pointer select-none group ${className}`}
      onClick={(e) => {
        e.preventDefault();
        onChange();
      }}
    >
      <motion.div
        whileTap={{ scale: 0.88 }}
        animate={{
          scale: checked ? 1 : 1,
          borderColor: checked ? '#f43f5e' : 'rgba(71, 85, 105, 0.7)',
          backgroundColor: checked ? 'rgba(225, 29, 72, 0.2)' : 'rgba(15, 23, 42, 0.9)',
          boxShadow: checked
            ? '0 0 12px rgba(244, 63, 94, 0.4)'
            : '0 0 0px rgba(0,0,0,0)',
        }}
        transition={{ duration: 0.2, type: 'spring', stiffness: 500, damping: 22 }}
        className="w-4.5 h-4.5 rounded-full border flex items-center justify-center shrink-0 transition-colors group-hover:border-rose-400"
      >
        <motion.div
          initial={false}
          animate={{
            scale: checked ? 1 : 0,
            opacity: checked ? 1 : 0,
          }}
          transition={{ duration: 0.2, type: 'spring', stiffness: 500, damping: 25 }}
          className="w-2 h-2 rounded-full bg-rose-400 shadow-sm shadow-rose-400/60"
        />
      </motion.div>
      {label && (
        <span className="text-xs sm:text-sm font-medium text-slate-200 group-hover:text-white transition-colors">
          {label}
        </span>
      )}
    </label>
  );
};

// ----------------------------------------------------
// WEBSITE UPDATES / CHANGELOG DATA & MODAL
// ----------------------------------------------------
const UPDATES_HISTORY = [
  {
    version: '2.6.0',
    date: '11 августа 2026 г.',
    title: 'Визуальный режим «ДО / ПОСЛЕ» & Сортировка ошибок по приоритетам v2.6.0',
    content: `Новые возможности в Ассистенте редактора для максимального удобства проверки:

• Визуальное сравнение «ДО / ПОСЛЕ»: Добавлен интерактивный виджет двухколоночного сравнения текстов. В колонке «ДО» подсвечиваются все исходные ошибки красным цветом, а в колонке «ПОСЛЕ» — исправленный каноничный результат зеленым цветом.
• Сортировка ошибок по приоритетам: Все обнаруженные замечания в списке аудита и инспекторе теперь автоматически сортируются — критические ошибки всегда выводятся в самом верху.
• Переключатель под-вкладок в ассистенте: Быстрый доступ в 1 клик к под-вкладкам «Сравнение ДО / ПОСЛЕ», «Ошибки (счетчик)» и «Discord Предпросмотр».
• Улучшенные подсказки: Визуальные индикаторы автофикса и подсвеченные статусы (Ошибка / Замечание / Норма).`,
    signoff: 'С уважением, команда Famq Assistant',
  },
  {
    version: '2.5.0',
    date: '11 августа 2026 г.',
    title: 'Интеллектуальный алгоритм V2.5.0 & Полный фикс багов',
    content: `Грандиозное масштабное обновление алгоритмов ассистента и исправление найденных недочетов:

• Автоматический отсек года в датах (_||ДД.ММ||_): Все даты под спойлерами в генераторах и автофиксе автоматически очищаются от года (например, 08.08.2026 ➔ _||08.08||_).
• Безопасная обработка интервью и перекрасов: Исправлены вызовы при пустом списке вопросов в Интервью и пустых территориях в Перекрасах — больше никаких ошибок и лишних отступов.
• Расширенная фоновая транслитерация фамок: Добавлена продвинутая фонетическая адаптация фоновых имен (чикан/чикен/чекин ➔ Chicken Famq, каке/кака ➔ Kaka Famq, алегри/аллегри ➔ Allegri Famq, шелби ➔ Shelby Famq и др.).
• Пассивное самообучение в реальном времени: Алгоритм считывает паузы при вводе и автоматически извлекает новые термины в словари без кликов.
• Настройка сохранности Onboarding: Флаг скрытия окна сохранения запоминается надежно во всех режимах.`,
    signoff: 'С уважением, команда Famq Assistant',
  },
  {
    version: '2.4.0',
    date: '10 августа 2026 г.',
    title: 'Автоматическая транслитерация фамок и фоновое незаметное обучение алгоритмов v2.4.0',
    content: `Глобальное обновление алгоритмов ассистента без внешних API и лишних вкладок:

• Авто-перевод названий семей: Любые названия семей на кириллице (например: "чикен", "аллегри", "кака") теперь автоматически транслитерируются и приводятся к единому формату с суффиксом Famq ("Chicken Famq", "Allegri Famq", "Kaka Famq").
• Бесшовное фоновое обучение: Удалены словарные вкладки и формы. Алгоритмы автоматически самообучаются в фоне при каждой вашей правке и скопированном результате в Инспекторе.
• Мгновенная скорость без задержек: Полный отказ от сторонних API в пользу быстрой локальной работы.
• Приветственное уведомление с таймером: Добавлено всплывающее окно о фоновом обучении алгоритмов с 3-секундной задержкой и возможностью отключения.`,
    signoff: 'С уважением, команда Famq Assistant',
  },
  {
    version: '2.3.0',
    date: '10 августа 2026 г.',
    title: 'Умное авто-обучение на правках и приветственный интерфейс Ассистента v2.3.0',
    content: `Глобальный апдейт логики обучения искусственного интеллекта и интеграции с Firebase:

• Авто-обучение на правках в Инспекторе: Теперь, если ИИ ошибся в форматировании или не распознал семью, вам больше не нужно вручную заполнять словари. Просто исправьте текст руками прямо в окне Инспектора и нажмите "Обучить ассистента"! ИИ запомнит ваш фикс для будущих проверок (работает на базе AI Gemini + Firebase Firestore).
• Система Онбординга: Добавлено приветственное модальное окно при первом заходе во вкладку Ассистента с просьбой помочь в обучении алгоритмов.
• Устранение костылей: Полностью переработан и упрощен интерфейс взаимодействия между вкладкой Инспектора и базой знаний — они стали единым бесшовным механизмом.`,
    signoff: 'С уважением, команда Famq Assistant',
  },
  {
    version: '2.2.0',
    date: '10 августа 2026 г.',
    title: 'Каноническая нормализация правил, транслитерация фамок и фикс ссылок v2.2.0',
    content: `Глобальное улучшение алгоритма форматирования публикаций и распознавания текста:

• Канонические ссылки на правила: Все упоминания правил сервера теперь автоматически форматируются согласно официальному стандарту Famq News (например: "п. 2.5 правил ограблений и похищений", "п. 1.4 правил завоевания предприятий", "п. 3.1 правил государственных организаций").
• Авто-транслитерация и нормализация фамок: Названия семей из русского ввода (например, "кака фамк" ➔ "Kaka Famq", "китсуне фама" ➔ "Kitsune Famq") автоматически приводятся к каноническому виду с правильным капсом и суффиксами.
• Устранение артефактов URL: Исправлена редкая ошибка с появлением служебных токенов <URL_0_ при обработке ссылок. Все ссылки защищены изолированными символами.`,
    signoff: 'С уважением, команда Famq Assistant',
  },
  {
    version: '2.1.0',
    date: '10 августа 2026 г.',
    title: 'Интеллектуальный разбор текста & Валидатор Гос/Крайм контекста v2.1.0',
    content: `Глобальное обновление алгоритма Ассистента и умного автозаполнения категорий:

• Умный разбор сырого текста: Ассистент теперь автоматически извлекает ключевые сущности из описаний наказаний (например: "Семья Kitsune получает 6 часов заморозки за нарушение правил сервера (2.5 Правил ограблений и похищений)") и преобразует их в идеальный канонический формат Famq News с правильными эмодзи, жирным текстом, курсивом, авто-аббревиатурой правил (2.5 ПОиО) и ссылкой!
• Валидация Гос/Крайм контекста: В полях ввода подкатегорий (перекрытие поставок, грабежи, крайм-заморозки) алгоритм мгновенно определяет нелегитимный ввод Гос. организаций (FIB, SANG, LSPD и др.) и выводит анимированное предупреждение о запрете действий.
• Автоматическая нормализация правил: Сокращения правил и названий фракций автоматически приводятся к единому стандарту Famq News.`,
    signoff: 'С уважением, команда Famq Assistant',
  },
  {
    version: '2.0.0',
    date: '9 августа 2026 г.',
    title: 'Умный нечеткий поиск, ультра-анимации и статус Alpha Ассистента v2.0.0',
    content: `Глобальное обновление поискового движка, анимаций и интерфейса приложения:

• Продвинутый умный поиск: Алгоритм теперь понимает опечатки, перестановки букв, пропуски и миссклики по соседним клавишам (расстояние Дамерау-Левенштейна). Работает с любой раскладкой клавиатуры (EN <-> RU).
• Премиальные анимации и микроинтерактивность: Каждая кнопка и переключатель получили плавный отклик, эффект стеклянного блика и физику пружинного сжатия при нажатии.
• Устранение ошибок: Полный фикс всех вызовов ключевых кадров анимаций Motion для исключения любых сбоев и зависаний.
• Статус Ассистента проверки: Внедрены предупреждающие баннеры и плашки ALPHA/Experimental Concept, разъясняющие, что алгоритм находится в процессе прототипирования и требует ручного контроля.`,
    signoff: 'С уважением, команда Famq Assistant',
  },
  {
    version: '1.8.0',
    date: '9 августа 2026 г.',
    title: 'Улучшение алгоритма Ассистента v1.8.0',
    content: `Продолжение улучшения алгоритмов. Добавлена проверка на наличие пробела после дефиса и перед знаком процента.`,
    signoff: 'С уважением, команда Famq Assistant',
  },
  {
    version: '1.7.0',
    date: '9 августа 2026 г.',
    title: 'Максимальная прокачка алгоритмов Ассистента v1.7.0',
    content: `Продолжение глобального улучшения алгоритмов Ассистента (обновление 3).
Улучшена логика обработки скобок и оптимизировано удаление избыточной пунктуации. Алгоритмы проверки работают еще точнее.`,
    signoff: 'С уважением, команда Famq Assistant',
  },
  {
    version: '1.6.0',
    date: '9 августа 2026 г.',
    title: 'Расширение алгоритмов и автоисправлений v1.6.0',
    content: `Продолжение глобального улучшения алгоритмов Ассистента.
Добавлены умные исправления форматов времени, очистка пустых тегов и разделение слипшихся цифр и букв. Улучшена общая стабильность.`,
    signoff: 'С уважением, команда Famq Assistant',
  },
  {
    version: '1.5.0',
    date: '9 августа 2026 г.',
    title: 'Глобальное улучшение алгоритмов Ассистента v1.5.0',
    content: `Масштабное расширение интеллектуальных проверок и авто-исправлений.
Значительно улучшена проверка орфографии, капитализации и пунктуации. Добавлена продвинутая валидация дат и надежная защита ссылок при автоисправлении.`,
    signoff: 'С уважением, команда Famq Assistant',
  },
  {
    version: '1.4.1',
    date: '9 августа 2026 г.',
    title: 'Ревизия правил Гос. фракций и алгоритма Ассистента v1.4.1',
    content: `Полная очистка примеров и обновление правил перекрытий для гос. фракций.
В алгоритм Ассистента добавлена критическая проверка запрета гос. структурам перекрывать поставки и выполнять крайм действия.`,
    signoff: 'С уважением, команда Famq Assistant',
  },
  {
    version: '1.4.0',
    date: '9 августа 2026 г.',
    title: 'Полное обновление алгоритма Ассистента v1.4.0',
    content: `Грандиозный релиз и масштабное обновление Ассистента проверки постов:

• Синхронизированы версии во всех частях приложения — версия 1.4.0 установлена повсеместно.
• Интеллектуальное исправление знаков препинания: запятые, точки и двоеточия автоматически выносятся за пределы жирного текста (**Слово**,).
• Автоматическая очистка года в дате за спойлером: удаление 2026/2025 года с приведением к стандарту _||ДД.ММ||_.
• Удаление кавычек «...» и "..." из названий фракций и семей с автоматическим выделением жирным шрифтом.
• Новые категории распознавания: новости Лидеров, Состав Модерации, Правила, Заморозки, Войны, Банки и Поставки.
• Автоматическая замена сленговых названий фракций на каноничные (вагос → Los Santos Vagos, грув → The Families и др.).
• Авто-капитализация гос. фракций (gov → GOV, fib → FIB, lspd → LSPD, sang → SANG и др.).
• Специальное предупреждение при попытке опубликовать Председателя верховного суда в новостях лидеров.
• Сняты все ограничения и предупреждения — Ассистент готов к работе на 100%!`,
    signoff: 'С уважением, команда Famq Assistant',
  },
  {
    version: '1.3.1',
    date: '8 августа 2026 г.',
    title: 'Улучшение алгоритма Ассистента проверки',
    content: `Обновлен алгоритм проверки постов:
• Добавлена проверка использования кавычек («...» или "...") в названиях семей — по правилам Famq News названия семей пишутся без кавычек.
• Исправлена проверка симметрии тегов Discord (устранены ложные предупреждения о непарных символах).
• Дата за спойлером сделана опциональной — она не запрашивается для сегодняшних новостей.
• Улучшен механизм автоматического исправления в 1 клик (Auto-Fix).`,
    signoff: 'С уважением, команда Famq Assistant',
  },
  {
    version: '1.3.0',
    date: '8 августа 2026 г.',
    title: 'Релиз Умного Ассистента проверки постов',
    content: `Представляем встроенный интеллектуальный Ассистент проверки новостей:

• Отдельная вкладка «Ассистент проверки» с собственным алгоритмом оценки качества текста без использования Gemini API.
• Автоматическое определение тематики новости (поставки, банки, перекрасы, дропы, правила и др.).
• Глубокий анализ форматирования Discord, парности парсеров, кастомных дискорд-эмодзи и разметки.
• Оценка качества поста (от 0 до 100 баллов) с выводом списка критических ошибок и рекомендаций.
• Функция «Исправить автоматически» (Auto-Fix) в 1 клик — мгновенное устранение опечаток, незакрытых тэгов и добавление ссылки источника.
• Быстрая загрузка текущего поста из Генератора в 1 клик.`,
    signoff: 'С уважением, команда Famq Assistant',
  },
  {
    version: '1.2.7',
    date: '8 августа 2026 г.',
    title: 'Автоматическая подстановка вчерашней даты',
    content: `Улучшено удобство публикации постов: в поле даты за спойлером теперь автоматически устанавливается вчерашняя дата.`,
    signoff: 'С уважением, команда Famq Assistant',
  },
  {
    version: '1.2.6',
    date: '8 августа 2026 г.',
    title: 'Обновленный векторный логотип',
    content: `Обновлен фирменный визуальный стиль и векторный логотип FAMQ NEWS в шапке приложения.`,
    signoff: 'С уважением, команда Famq Assistant',
  },
  {
    version: '1.2.5',
    date: '8 августа 2026 г.',
    title: 'Повышение стабильности и оптимизация работы форм',
    content: `Проведены плановые технические улучшения и оптимизация внутренних алгоритмов:

• Повышена надежность обработки пользовательского ввода и спецсимволов.
• Оптимизирована производительность реактивных состояний генератора постов.
• Устранены интерфейсные недочеты и улучшено быстродействие при работе с формами.`,
    signoff: 'С уважением, команда Famq Assistant',
  },
  {
    version: '1.2.4',
    date: '8 августа 2026 г.',
    title: 'Умная подстановка, чистые формы и быстрая запись',
    content: `Заходите в ассистент — а там только идеальные формы и ни одного лишнего примера. Это не совпадение, это новое обновление!

• Полностью очищены примерные теги семей из полей ввода — теперь везде чистые строки без мусорного контекста.
• Внедрены многострочные поля для убитых семей и фракций с кнопками быстрого выбора банды (The Families, The Bloods Gang, Marabunta Grande, Los Santos Vagos, The Ballas Gang) и государственных структур.
• Автоматический подсчет и подстановка союза «и» при генерации итогового текста поста.
• Оптимизирован интерфейс и ускорен рендеринг предпросмотра постов.`,
    signoff: 'С уважением, команда Famq Assistant',
  },
  {
    version: '1.2.0',
    date: '4 августа 2026 г.',
    title: 'Обновление войн и перекрасов территорий',
    content: `Масштабное обновление раздела войн, перекрасов и заморозок:

• Доработана генерация постов для нейтралов, технических откатов и заморозок каптов.
• Оптимизированы формы с быстрым выбором сроков и причин жалоб.
• Улучшена мобильная верстка и обработка ошибок ввода.`,
    signoff: 'Приятного пользования, команда Famq Assistant',
  },
  {
    version: '1.1.0',
    date: '28 июля 2026 г.',
    title: 'Умная грамматика и автосогласование',
    content: `Улучшена система контекстной грамматики для всех видов поставок, перекрытий и отбитий банкоматов.

• Автоматическое определение окончания глаголов («убила» / «убили», «перекрыла» / «перекрыли») в зависимости от типа инициатора.
• Удобный предпросмотр постов с копированием в один клик.`,
    signoff: 'Всё лучшее для вас, команда Famq Assistant',
  },
  {
    version: '1.0.0',
    date: '15 июля 2026 г.',
    title: 'Официальный релиз Famq Assistant',
    content: `Первый официальный запуск единого ассистента модерации и генератора постов!

• Полный набор инструментов для поставок, банков, острова Кайо-Перико, Форта-Занкудо, контрактов, семейных войн и отчетов модерации.
• Готовые стилизованные шаблоны с дискорд-эмодзи и гиперссылками.`,
    signoff: 'Команда Famq Assistant',
  },
];

interface UpdatesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function UpdatesModal({ isOpen, onClose }: UpdatesModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#12131a] border border-slate-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[85vh] flex flex-col overflow-hidden text-slate-200 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between shrink-0 bg-[#151722]/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Что нового?</h2>
              <p className="text-[11px] text-slate-400 font-medium">История обновлений Famq Assistant</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Закрыть"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content list */}
        <div className="p-5 overflow-y-auto space-y-6 divide-y divide-slate-800/80">
          {UPDATES_HISTORY.map((upd, idx) => (
            <div key={upd.version} className={idx > 0 ? 'pt-6' : ''}>
              <div className="flex items-baseline justify-between mb-1">
                <span className="text-lg font-black text-white tracking-tight font-mono">
                  {upd.version}
                </span>
                <span className="text-xs text-slate-400 font-medium">{upd.date}</span>
              </div>
              <h3 className="text-xs font-semibold text-rose-400 mb-2">{upd.title}</h3>
              <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-line mb-3">
                {upd.content}
              </div>
              <div className="text-[11px] text-slate-500 italic font-medium">
                {upd.signoff}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// FAMQ NEWS Logo Component
const FamqNewsLogo = ({ className = '' }: { className?: string }) => (
  <svg
    viewBox="35 35 340 215"
    xmlns="http://www.w3.org/2000/svg"
    className={`h-11 sm:h-12 w-auto select-none shrink-0 ${className}`}
  >
    <rect x="40" y="40" width="330" height="110" fill="#EE1D7A" />
    <text
      x="205"
      y="122"
      fontFamily="Arial, Helvetica, sans-serif"
      fontWeight="900"
      fontSize="80"
      fill="#FFFFFF"
      textAnchor="middle"
      letterSpacing="2"
    >
      FAMQ
    </text>

    <rect x="70" y="150" width="270" height="90" fill="#FFFFFF" />
    <text
      x="205"
      y="217"
      fontFamily="Arial, Helvetica, sans-serif"
      fontWeight="900"
      fontSize="62"
      fill="#1A1A1A"
      textAnchor="middle"
      letterSpacing="2"
    >
      NEWS
    </text>
  </svg>
);

// Helper to get today's date formatted as DD.MM.YY
const getTodayFormatted = () => {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = String(d.getFullYear()).slice(-2);
  return `${day}.${month}.${year}`;
};

// Standardized footer appender: appends date spoiler (_||DD.MM||_) at end of last text line separated by 1 space
const appendFooter = (
  mainText: string,
  includeDate: boolean,
  customDate: string,
  hidePreviewCard?: boolean,
  disableDate?: boolean
) => {
  const trimmed = mainText.trimEnd();
  const link = hidePreviewCard ? `<${FOOTER_LINK}>` : FOOTER_LINK;

  if (!disableDate && includeDate && customDate) {
    const formattedDate = formatDateSpoiler(customDate);
    return `${trimmed} ${formattedDate}\n${link}`;
  }
  return `${trimmed}\n${link}`;
};

// ----------------------------------------------------
// GOS ABBREVIATIONS & UTILS
// ----------------------------------------------------

// GOS Abbreviations map
const GOS_ABBREVIATIONS: Record<string, string> = {
  'los santos police department': 'LSPD',
  'emergency medical services': 'EMS',
  'los santos county sheriff department': 'LSCSD',
  'san andreas national guard': 'SANG',
  'government': 'GOV',
  'weazel news': 'WN',
  'federal investigation bureau': 'FIB',
};

// GOS list uppercase
const GOS_FACTIONS = ['LSPD', 'EMS', 'LSCSD', 'SANG', 'GOV', 'WN', 'FIB'];

// Helper to auto-abbreviate GOS names if typed in full
const formatGosName = (name: string): string => {
  if (!name) return name;
  const lower = name.trim().toLowerCase();
  if (GOS_ABBREVIATIONS[lower]) {
    return GOS_ABBREVIATIONS[lower];
  }
  return name.trim();
};

// Grammar helper: GOS uses 'и' ending always; solo crime/famq uses 'а'; joint uses 'и'
const getGrammarVerb = (
  action: 'перекрыли' | 'отбили' | 'напали' | 'убили',
  isGos: boolean,
  isJoint: boolean
): string => {
  if (isGos || isJoint) {
    // Plural ending -и
    switch (action) {
      case 'перекрыли': return 'перекрыли';
      case 'отбили': return 'отбили';
      case 'напали': return 'напали';
      case 'убили': return 'убили';
    }
  } else {
    // Feminine/Singular ending -а
    switch (action) {
      case 'перекрыли': return 'перекрыла';
      case 'отбили': return 'отбила';
      case 'напали': return 'напала';
      case 'убили': return 'убила';
    }
  }
};

// Helper to append Famq if single word and not GOS/gang exception
const formatFamqName = (name: string, autoFamq: boolean) => {
  if (!name.trim()) return '';
  const trimmed = formatGosName(name.trim());
  if (!autoFamq) return trimmed;
  
  const words = trimmed.split(/\s+/);
  const lower = trimmed.toLowerCase();
  
  const isGos = GOS_FACTIONS.some((g) => g.toLowerCase() === lower);
  const isGang = ['the bloods gang', 'bloods', 'marabunta grande', 'marabunta', 'los santos vagos', 'vagos', 'the ballas gang', 'ballas', 'the families', 'families'].some(
    (ex) => lower.includes(ex)
  );

  if (
    words.length === 1 &&
    !lower.includes('famq') &&
    !isGos &&
    !isGang
  ) {
    return `${trimmed} Famq`;
  }
  return trimmed;
};

// Helper to format materials/items in supplies/kraft messages:
// e.g. "60.000 бинтов и 2.000 аптечек" -> "**60.000 бинтов** и **2.000 аптечек**"
const formatMaterialsList = (rawInput: string): string => {
  if (!rawInput || !rawInput.trim()) return '';
  const trimmed = rawInput.trim();

  // If user already entered custom bold asterisks, leave as is
  if (trimmed.includes('**')) return trimmed;

  const parts = trimmed.split(/\s+и\s+/i);
  if (parts.length > 1) {
    return parts.map((p) => `**${p.trim()}**`).join(' и ');
  }

  return `**${trimmed}**`;
};

// Helper to auto-format list of killed families/factions:
// 1 item: "Lalok Famq" or "**Lalok Famq**"
// 2 items: "Lalok Famq и Bomjiki Famq" or "**Lalok Famq** и **Bomjiki Famq**"
// 3+ items: "Lalok Famq, Bomjiki Famq и Durak Famq"
const formatKilledList = (
  rawInput: string,
  autoFamqSuffix: boolean = false,
  addBold: boolean = false
): string => {
  if (!rawInput || !rawInput.trim()) return '';

  // Standardize delimiters: replace " и " or newlines with comma
  const cleanInput = rawInput
    .replace(/\s+и\s+/gi, ', ')
    .replace(/[\n\r]+/g, ', ');

  let items = cleanInput
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  if (items.length === 0) return '';

  items = items.map((item) => {
    const formatted = autoFamqSuffix ? formatFamqName(item, true) : item;
    if (addBold) {
      return formatted.includes('**') ? formatted : `**${formatted}**`;
    }
    return formatted;
  });

  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} и ${items[1]}`;

  // 3 or more: "Item 1, Item 2, Item 3 и Item 4"
  const allButLast = items.slice(0, -1).join(', ');
  const last = items[items.length - 1];
  return `${allButLast} и ${last}`;
};

// Helper to append item to comma-separated list string
const appendToCommaList = (currentText: string, newItem: string): string => {
  if (!currentText || !currentText.trim()) return newItem;
  const trimmed = currentText.trim();
  if (trimmed.endsWith(',')) return `${trimmed} ${newItem}`;
  return `${trimmed}, ${newItem}`;
};

const QUICK_KILL_FACTIONS = [
  'FIB',
  'LSPD',
  'LSCSD',
  'SANG',
  'The Families',
  'The Bloods Gang',
  'Marabunta Grande',
  'Los Santos Vagos',
  'The Ballas Gang',
];

interface CasualtiesListInputProps {
  value: string;
  onChange: (val: string) => void;
  autoFamqSuffix?: boolean;
  placeholder?: string;
}

function CasualtiesListInput({
  value,
  onChange,
  autoFamqSuffix = false,
  placeholder = 'Например: Lalok, FIB или The Families',
}: CasualtiesListInputProps) {
  const items = value ? value.split(',').map((s) => s.trimStart()) : [''];

  const handleRowChange = (index: number, newText: string) => {
    const updated = [...items];
    updated[index] = newText;
    onChange(updated.join(', '));
  };

  const handleAddRow = () => {
    if (!value.trim()) {
      onChange('');
      return;
    }
    const cleanVal = value.trim().replace(/,$/, '');
    onChange(`${cleanVal}, `);
  };

  const handleRemoveRow = (index: number) => {
    if (items.length <= 1) {
      onChange('');
    } else {
      const updated = items.filter((_, i) => i !== index);
      onChange(updated.join(', '));
    }
  };

  const handleQuickAdd = (factionName: string) => {
    const lastItem = items[items.length - 1];
    if (items.length > 0 && lastItem.trim() === '') {
      const updated = [...items];
      updated[updated.length - 1] = factionName;
      onChange(updated.join(', '));
    } else {
      if (!value.trim()) {
        onChange(factionName);
      } else {
        const cleanVal = value.trim().replace(/,$/, '');
        onChange(`${cleanVal}, ${factionName}`);
      }
    }
  };

  return (
    <div className="space-y-2.5">
      <div className="space-y-2">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-slate-500 w-4 text-right shrink-0 font-mono">
              {idx + 1}.
            </span>
            <input
              type="text"
              value={item}
              onChange={(e) => handleRowChange(idx, e.target.value)}
              className="flex-1 bg-[#0d0e14] border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-rose-500 transition-all"
              placeholder={idx === 0 ? placeholder : 'Семья или фракция'}
            />
            {items.length > 1 && (
              <button
                type="button"
                onClick={() => handleRemoveRow(idx)}
                className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors shrink-0 cursor-pointer"
                title="Удалить строку"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Add Row Button */}
      <button
        type="button"
        onClick={handleAddRow}
        className="w-full py-2 px-3 bg-[#141722] hover:bg-[#1a1e2d] text-rose-400 hover:text-rose-300 border border-slate-800 hover:border-rose-500/50 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>Добавить ещё одну семью / фракцию</span>
      </button>

      {/* Quick Selection Badges */}
      <div className="pt-1">
        <div className="text-[11px] text-slate-400 mb-1.5 font-medium">Быстрый выбор:</div>
        <div className="flex flex-wrap items-center gap-1.5">
          {QUICK_KILL_FACTIONS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => handleQuickAdd(f)}
              className="px-2.5 py-1 rounded-lg bg-[#141722] text-slate-300 border border-slate-800 text-[11px] hover:border-rose-500 hover:text-white transition-all cursor-pointer font-medium"
            >
              + {f}
            </button>
          ))}
        </div>
      </div>

      {/* Live Formatting Preview */}
      {value.trim() && (
        <div className="text-[11px] text-rose-400 font-semibold bg-rose-500/10 px-3 py-2 rounded-xl border border-rose-500/20 space-y-0.5">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">В посте будет указано:</div>
          <div className="text-white font-bold text-xs">
            {formatKilledList(value, autoFamqSuffix)}
          </div>
        </div>
      )}
    </div>
  );
}

const getTimeBasedGreeting = (): 'Доброе утро' | 'Добрый день' | 'Добрый вечер' | 'Доброй ночи' => {
  if (typeof window === 'undefined') return 'Добрый день';
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Доброе утро';
  if (hour >= 12 && hour < 17) return 'Добрый день';
  if (hour >= 17 && hour < 23) return 'Добрый вечер';
  return 'Доброй ночи';
};

interface DiffHighlightViewProps {
  beforeText: string;
  afterText: string;
}

function highlightWordDiff(bLine: string, aLine: string, mode: 'before' | 'after'): React.ReactNode {
  if (!bLine && mode === 'before') {
    return <span className="italic opacity-50">(пусто)</span>;
  }
  if (!aLine && mode === 'after') {
    return <span className="italic opacity-50">(удалено)</span>;
  }
  if (!bLine) {
    return <span className="bg-emerald-500/25 text-emerald-200 font-bold px-1 rounded border border-emerald-500/30">{aLine}</span>;
  }
  if (!aLine) {
    return <span className="bg-rose-500/25 text-rose-200 line-through px-1 rounded border border-rose-500/30">{bLine}</span>;
  }

  const bWords = bLine.split(/(\s+)/);
  const aWords = aLine.split(/(\s+)/);

  if (mode === 'before') {
    return bWords.map((word, idx) => {
      if (/^\s+$/.test(word) || word.length === 0) return word;
      const cleanW = word.toLowerCase().replace(/[^a-zа-яё0-9]/gi, '');
      const lowerA = aLine.toLowerCase();
      const isMissing = cleanW.length >= 2 && !lowerA.includes(cleanW);

      if (isMissing) {
        return (
          <span key={idx} className="bg-rose-500/30 text-rose-200 font-bold px-1 rounded border border-rose-500/40 mx-0.5 inline-block">
            {word}
          </span>
        );
      }
      return <span key={idx}>{word}</span>;
    });
  } else {
    return aWords.map((word, idx) => {
      if (/^\s+$/.test(word) || word.length === 0) return word;
      const cleanW = word.toLowerCase().replace(/[^a-zа-яё0-9]/gi, '');
      const lowerB = bLine.toLowerCase();
      const isNew = cleanW.length >= 2 && !lowerB.includes(cleanW);

      if (isNew) {
        return (
          <span key={idx} className="bg-emerald-500/30 text-emerald-200 font-bold px-1 rounded border border-emerald-500/40 mx-0.5 inline-block">
            {word}
          </span>
        );
      }
      return <span key={idx}>{word}</span>;
    });
  }
}

const DiffHighlightView: React.FC<DiffHighlightViewProps> = ({ beforeText, afterText }) => {
  if (!beforeText && !afterText) {
    return (
      <div className="text-center p-6 text-slate-500 text-xs italic bg-[#0d0e15] rounded-xl border border-slate-800">
        Введите или вставьте текст и нажмите «Быстрый Автофикс (1 клик)» для просмотра изменений ДО и ПОСЛЕ...
      </div>
    );
  }

  const beforeLines = beforeText.split('\n');
  const afterLines = afterText.split('\n');
  const maxLines = Math.max(beforeLines.length, afterLines.length);

  return (
    <div className="space-y-3 font-mono text-xs">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Column 1: Before (ДО) */}
        <div className="bg-[#0b0c13] rounded-xl p-3.5 border border-rose-500/30 space-y-2.5">
          <div className="flex items-center justify-between pb-2 border-b border-rose-500/20 text-[11px] font-bold text-rose-400 uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span>ДО (Исходный текст)</span>
            </span>
            <span className="text-[10px] bg-rose-500/20 text-rose-300 font-mono px-2 py-0.5 rounded border border-rose-500/30 font-bold">
              С ОШИБКАМИ
            </span>
          </div>
          <div className="space-y-1.5 leading-relaxed break-words whitespace-pre-wrap text-slate-300 min-h-[140px] text-xs">
            {Array.from({ length: maxLines }).map((_, i) => {
              const bLine = beforeLines[i] ?? '';
              const aLine = afterLines[i] ?? '';
              const isDifferent = bLine !== aLine;

              if (!isDifferent) {
                return (
                  <div key={i} className="text-slate-400 opacity-80 px-2 py-0.5">
                    {bLine || <span className="opacity-20">&nbsp;</span>}
                  </div>
                );
              }

              return (
                <div key={i} className="bg-rose-500/10 border-l-2 border-rose-500 pl-2 pr-1 py-1 my-0.5 rounded-r text-rose-200">
                  <span className="text-rose-400 font-bold mr-1 text-[10px]">❌ ДО:</span>
                  {highlightWordDiff(bLine, aLine, 'before')}
                </div>
              );
            })}
          </div>
        </div>

        {/* Column 2: After (ПОСЛЕ) */}
        <div className="bg-[#0b0c13] rounded-xl p-3.5 border border-emerald-500/30 space-y-2.5">
          <div className="flex items-center justify-between pb-2 border-b border-emerald-500/20 text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>ПОСЛЕ (Автофикс Famq)</span>
            </span>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-mono px-2 py-0.5 rounded border border-emerald-500/30 font-bold">
              КАНОНИЧНЫЙ
            </span>
          </div>
          <div className="space-y-1.5 leading-relaxed break-words whitespace-pre-wrap text-slate-200 min-h-[140px] text-xs">
            {Array.from({ length: maxLines }).map((_, i) => {
              const bLine = beforeLines[i] ?? '';
              const aLine = afterLines[i] ?? '';
              const isDifferent = bLine !== aLine;

              if (!isDifferent) {
                return (
                  <div key={i} className="text-slate-300 px-2 py-0.5">
                    {aLine || <span className="opacity-20">&nbsp;</span>}
                  </div>
                );
              }

              return (
                <div key={i} className="bg-emerald-500/10 border-l-2 border-emerald-500 pl-2 pr-1 py-1 my-0.5 rounded-r text-emerald-200">
                  <span className="text-emerald-400 font-bold mr-1 text-[10px]">✅ ПОСЛЕ:</span>
                  {highlightWordDiff(bLine, aLine, 'after')}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function FamqAssistantPage() {
  const [activeTab, setActiveTab] = useState<
    | 'supplies'
    | 'bank'
    | 'tier'
    | 'mansions'
    | 'arrows'
    | 'islandFz'
    | 'teraktRaid'
    | 'pubgWarzone'
    | 'dealers'
    | 'drops'
    | 'rpArrows'
    | 'weeklyCup'
    | 'modTeam'
    | 'achievements'
    | 'leaders'
    | 'capt'
    | 'interview'
    | 'mcl'
    | 'wars'
    | 'custom'
    | 'rules'
  >('supplies');

  const [categorySearch, setCategorySearch] = useState('');
  const [copied, setCopied] = useState(false);
  const [mainViewMode, setMainViewMode] = useState<'generator' | 'assistant'>('generator');
  const [assistantInputText, setAssistantInputText] = useState<string>('');
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditPhase, setAuditPhase] = useState(0);
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [lastFixedDiff, setLastFixedDiff] = useState<{ before: string; after: string } | null>(null);
  const [assistantViewSubTab, setAssistantViewSubTab] = useState<'errors' | 'diff' | 'preview'>('diff');

  // --- FIREBASE SILENT BACKGROUND LEARNING STATE ---
  const [customDict, setCustomDict] = useState<CustomDictItem[]>([]);
  const [correctionsHistory, setCorrectionsHistory] = useState<CorrectionExample[]>([]);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string>('');
  const [originalInputTextForTraining, setOriginalInputTextForTraining] = useState<string>('');

  // Onboarding Modal State
  const [showAssistantOnboarding, setShowAssistantOnboarding] = useState(false);
  const [onboardingCountdown, setOnboardingCountdown] = useState(3);
  const [dontShowOnboardingAgain, setDontShowOnboardingAgain] = useState(false);

  useEffect(() => {
    if (mainViewMode === 'assistant') {
      const hiddenLocal = localStorage.getItem('hideAssistantOnboarding');
      const hiddenSession = sessionStorage.getItem('hideAssistantOnboarding');
      if (hiddenLocal !== 'true' && hiddenSession !== 'true') {
        const timer = setTimeout(() => {
          setShowAssistantOnboarding(true);
          setOnboardingCountdown(3);
        }, 0);
        return () => clearTimeout(timer);
      }
    }
  }, [mainViewMode]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showAssistantOnboarding && onboardingCountdown > 0) {
      timer = setTimeout(() => {
        setOnboardingCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [showAssistantOnboarding, onboardingCountdown]);

  const handleCloseOnboarding = () => {
    if (dontShowOnboardingAgain) {
      localStorage.setItem('hideAssistantOnboarding', 'true');
    }
    sessionStorage.setItem('hideAssistantOnboarding', 'true');
    setShowAssistantOnboarding(false);
  };

  // Derived custom dictionary map (combines static dict + learned history + token diff alignment)
  const customDictMap = React.useMemo(() => {
    const map: Record<string, string> = {};
    customDict.forEach((item) => {
      const key = item.cyrillic || (item as any).key;
      const val = item.formattedName || (item as any).value;
      if (key && val) {
        map[key.toLowerCase().trim()] = val;
      }
    });

    // Auto-extract multi-word and word replacements learned from corrections history using token sequence diff
    correctionsHistory.forEach((item) => {
      if (item.originalText && item.fixedText && item.originalText !== item.fixedText) {
        const extracted = extractLearnedPatternsFromDiff(item.originalText, item.fixedText);
        extracted.forEach(({ cyrillic, formattedName }) => {
          if (cyrillic && formattedName) {
            map[cyrillic.toLowerCase().trim()] = formattedName;
          }
        });
      }
    });

    return map;
  }, [customDict, correctionsHistory]);

  // Load Firestore Data
  const reloadFirestoreData = useCallback(async () => {
    try {
      const [dict, history] = await Promise.all([
        fetchCustomDictionary(),
        fetchCorrectionsHistory(),
      ]);
      setCustomDict(dict);
      setCorrectionsHistory(history);
    } catch (err) {
      console.error('Error fetching Firestore data:', err);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      reloadFirestoreData();
    }, 0);
    return () => clearTimeout(timer);
  }, [reloadFirestoreData]);

  // Debounced Passive Real-Time Learning as user types/edits in Assistant Inspector
  const passiveLearningTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!assistantInputText.trim()) {
      const timer = setTimeout(() => {
        setOriginalInputTextForTraining('');
      }, 0);
      return () => clearTimeout(timer);
    }

    if (!originalInputTextForTraining) {
      const timer = setTimeout(() => {
        setOriginalInputTextForTraining(assistantInputText);
      }, 0);
      return () => clearTimeout(timer);
    }

    if (passiveLearningTimerRef.current) {
      clearTimeout(passiveLearningTimerRef.current);
    }

    // After user pauses typing for 2.5 seconds, auto-extract and learn diff patterns!
    passiveLearningTimerRef.current = setTimeout(() => {
      if (
        originalInputTextForTraining &&
        assistantInputText &&
        originalInputTextForTraining !== assistantInputText
      ) {
        autoProcessCorrectionAndLearn(
          originalInputTextForTraining,
          assistantInputText,
          'Фоновое пассивное обучение алгоритма (редактирование текста)'
        ).then(({ learnedPatternsCount }) => {
          if (learnedPatternsCount > 0) {
            reloadFirestoreData();
            setSaveSuccessMessage(`Алгоритм освоил ${learnedPatternsCount} новое правило/термин!`);
            setTimeout(() => setSaveSuccessMessage(''), 3000);
          }
        }).catch(() => {});
      }
    }, 2500);

    return () => {
      if (passiveLearningTimerRef.current) clearTimeout(passiveLearningTimerRef.current);
    };
  }, [assistantInputText, originalInputTextForTraining, reloadFirestoreData]);

  // Silent Auto-Learning when user copies formatted or edited text
  const handleCopyAssistantResult = async (textToCopy: string) => {
    if (!textToCopy.trim()) return;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);

      if (originalInputTextForTraining && originalInputTextForTraining !== textToCopy) {
        autoProcessCorrectionAndLearn(
          originalInputTextForTraining,
          textToCopy,
          'Авто-обучение алгоритма на основе скопированных правок'
        ).then(({ learnedPatternsCount }) => {
          reloadFirestoreData();
          setSaveSuccessMessage(
            learnedPatternsCount > 0
              ? `Алгоритмы ассистента выучили ${learnedPatternsCount} новых паттерна!`
              : 'Алгоритмы ассистента автоматически учли ваши правки!'
          );
          setTimeout(() => setSaveSuccessMessage(''), 3000);
        }).catch(() => {});
      }
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const auditTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (auditTimeoutRef.current) {
      clearTimeout(auditTimeoutRef.current);
    }

    if (!assistantInputText.trim()) {
      auditTimeoutRef.current = setTimeout(() => {
        setAuditResult(null);
        setIsAuditing(false);
        setAuditPhase(0);
      }, 0);
      return;
    }

    auditTimeoutRef.current = setTimeout(() => {
      setIsAuditing(true);
      setAuditPhase(1); 
      
      setTimeout(() => setAuditPhase(2), 350); 
      setTimeout(() => setAuditPhase(3), 850); 
      setTimeout(() => setAuditPhase(4), 1350); 
      setTimeout(() => {
        setAuditResult(runAssistantAudit(assistantInputText));
        setIsAuditing(false);
        setAuditPhase(0);
      }, 1750);
      
    }, 400); 

    return () => {
      if (auditTimeoutRef.current) clearTimeout(auditTimeoutRef.current);
    };
  }, [assistantInputText]);

  const CATEGORIES = [
    { id: 'supplies', label: 'Поставки / Крафт', keywords: ['материалы', 'матовозка', 'перехват', 'отбили'], icon: FileText, badge: '' },
    { id: 'bank', label: 'Банк', keywords: ['ограбление', 'сейф', 'флейка', 'пасифик'], icon: Building, badge: '' },
    { id: 'tier', label: 'Тир / Рейтинг', keywords: ['тир лист', 'баллы', 'топ семей'], icon: Award, badge: '' },
    { id: 'mansions', label: 'Особняки', keywords: ['особняк', 'аукцион', 'слет', 'покупка'], icon: Home, badge: '' },
    { id: 'arrows', label: 'Стрелы (Family)', keywords: ['бизвар', 'территория', 'забив', 'отбив'], icon: Crosshair, badge: '' },
    { id: 'islandFz', label: 'Остров / ФЗ', keywords: ['форт занкудо', 'кайо перико', 'нападение'], icon: MapPin, badge: '' },
    { id: 'teraktRaid', label: 'Теракт / Рейд', keywords: ['захват', 'штурм', 'заложники'], icon: Bomb, badge: '' },
    { id: 'pubgWarzone', label: 'PUBG / Warzone', keywords: ['пабг', 'варзон', 'королевская битва'], icon: Trophy, badge: '' },
    { id: 'dealers', label: 'Дилеры и цеха', keywords: ['цех', 'наркотики', 'оружие', 'дилер'], icon: Flame, badge: '' },
    { id: 'drops', label: 'ДРОП / ВЗА', keywords: ['аирдроп', 'война за аирдроп', 'ящик'], icon: Code, badge: '' },
    { id: 'rpArrows', label: 'РП Стрелы', keywords: ['рп стрела', 'забив', 'итог стрелы'], icon: Crosshair, badge: '' },
    { id: 'weeklyCup', label: 'Weekly Cup', keywords: ['викли кап', 'турнир', 'кубок'], icon: Trophy, badge: '' },
    { id: 'achievements', label: 'Достижения (100%)', keywords: ['ачивки', 'выполнили', 'награды'], icon: Star, badge: '' },
    { id: 'modTeam', label: 'Состав модерации', keywords: ['модератор', 'куратор', 'назначен', 'снят'], icon: Users, badge: '' },
    { id: 'leaders', label: 'Лидеры', keywords: ['лидер', 'губернатор', 'покинул пост', 'успешный срок'], icon: Crown, badge: '' },
    { id: 'capt', label: 'Капты / Champions', keywords: ['капт', 'территория', 'чемпионс кап'], icon: Swords, badge: '' },
    { id: 'interview', label: 'Интервью', keywords: ['вопросы', 'ответы', 'лидер', 'семья'], icon: MessageSquare, badge: '' },
    { id: 'mcl', label: 'MCL / ВЗЗ', keywords: ['мкл', 'турнир', 'взз', 'заводы'], icon: Flame, badge: '' },
    { id: 'wars', label: 'Войны / Союзы / Территории', keywords: ['дипломатия', 'союз', 'нейтрал', 'заморозка'], icon: ShieldAlert, badge: '' },
    { id: 'custom', label: 'Свободный редактор', keywords: ['свой текст', 'любой'], icon: Sparkles, badge: '' },
    { id: 'rules', label: 'Правила и Выговоры', keywords: ['выговор', 'устный', 'строгий', 'штраф'], icon: BookOpen, badge: 'Штрафы' },
  ];

  // Global Date & Spoiler Option (Rule: _||DD.MM||_)
  const [includeDate, setIncludeDate] = useState(false);
  const [customDate, setCustomDate] = useState('');
  const [formattedTime, setFormattedTime] = useState('');
  const [showUpdatesModal, setShowUpdatesModal] = useState(false);

  // ----------------------------------------------------
  // 1. POSTAVKI / KRAFT STATE
  // ----------------------------------------------------
  const [suppliesState, setSuppliesState] = useState({
    typeAction: 'Отбили' as 'Перекрыли' | 'Отбили',
    typeTarget: 'Поставка' as 'Поставка' | 'Крафт',
    hidePreviewCard: false,
    whoIntercepted: '',
    jointWith: '',
    whoseDelivery: '',
    whatIntercepted: '',
    hadKills: false,
    killsDetailText: '', // Extra casualty string
    thirdPartyKilledText: '', // In case stolen/third-party killed
    autoFamqSuffix: true,
  });

  const generateSuppliesText = () => {
    const {
      typeAction,
      typeTarget,
      hidePreviewCard,
      whoIntercepted,
      jointWith,
      whoseDelivery,
      whatIntercepted,
      hadKills,
      killsDetailText,
      thirdPartyKilledText,
      autoFamqSuffix,
    } = suppliesState;

    const rawWho = whoIntercepted.trim();
    const formattedWho = rawWho ? formatFamqName(rawWho, autoFamqSuffix) : '[Фракция/Семья]';
    const formattedJoint = jointWith.trim() ? formatFamqName(jointWith.trim(), autoFamqSuffix) : '';
    const rawWhose = whoseDelivery.trim();
    const formattedWhose = rawWhose ? formatGosName(rawWhose) : '[Фракция/Семья]';

    const isGosInitiator = GOS_FACTIONS.some((g) => g.toLowerCase() === formattedWho.toLowerCase());
    const isJoint = !!formattedJoint;

    let text = `<:emoji_246:1346569081322471434> _**${formattedWho}**`;
    if (formattedJoint) {
      text += ` совместно с **${formattedJoint}**`;
    }

    if (typeAction === 'Перекрыли') {
      const verb = getGrammarVerb('перекрыли', isGosInitiator, isJoint);
      const rawMat = whatIntercepted.trim() || '[Материалы]';
      const formattedMat = rawMat === '[Материалы]' ? '[Материалы]' : formatMaterialsList(rawMat);
      text += ` ${verb} ${typeTarget === 'Поставка' ? 'поставку' : 'крафт'} **${formattedWhose}** на ${formattedMat}`;
    } else {
      const verb = getGrammarVerb('отбили', isGosInitiator, isJoint);
      text += ` успешно ${verb} нападение на ${typeTarget === 'Поставка' ? 'поставку' : 'крафт'} от **${formattedWhose}**`;
      if (whatIntercepted.trim()) {
        const formattedMat = formatMaterialsList(whatIntercepted.trim());
        text += ` (${formattedMat})`;
      }
    }
    text += `_`;

    // Casualty line if present
    if (hadKills && killsDetailText.trim()) {
      const verbKilled = getGrammarVerb('убили', isGosInitiator, isJoint);
      const formattedKills = formatKilledList(killsDetailText, autoFamqSuffix, true);
      text += `\n\n_*в процессе перекрытия **${formattedWho}** также ${verbKilled} ${formattedKills}_`;
    }

    if (thirdPartyKilledText.trim()) {
      text += `\n\n_*в процессе перекрытия ${thirdPartyKilledText.trim()}_*`;
    }

    return appendFooter(text, includeDate, customDate, hidePreviewCard);
  };

  // ----------------------------------------------------
  // BANK STATE & GENERATOR
  // ----------------------------------------------------
  const [bankState, setBankState] = useState({
    type: 'robbery' as 'robbery' | 'repelled' | 'joint_robbery',
    bankNumber: '',
    who: '',
    jointWith: '',
    defenderGos: '',
    targetFamq: '',
    hadKills: false,
    killsText: '',
    thirdPartyKillText: '',
    hidePreviewCard: false,
  });

  const generateBankText = () => {
    const { type, bankNumber, who, jointWith, targetFamq, hadKills, killsText, hidePreviewCard } = bankState;
    const icon = `<:1057686428978524190:1346392807149142018>`;

    const rawBank = bankNumber.trim() || '[Номер банка]';
    const rawWho = who.trim() || '[Фракция/Семья]';
    const rawTarget = targetFamq.trim() || '[Фракция/Семья]';

    let body = '';
    if (type === 'robbery') {
      body = `${icon} _**${rawWho}** успешно ограбила **${rawBank}**_`;
    } else if (type === 'repelled') {
      const jointPart = jointWith.trim() ? ` совместно с **${jointWith.trim()}**` : '';
      body = `${icon} _**${rawWho}**${jointPart} успешно отбили ограбление **${rawBank}** от **${rawTarget}**_`;
    } else if (type === 'joint_robbery') {
      const jointPart = jointWith.trim() ? ` совместно с **${jointWith.trim()}**` : '';
      body = `${icon} _**${rawWho}**${jointPart} успешно ограбили **${rawBank}**_`;
    }

    if (hadKills && killsText.trim()) {
      const formattedKills = formatKilledList(killsText, false);
      body += `\n\n_*в процессе ограбления ${formattedKills}_*`;
    }

    return appendFooter(body, includeDate, customDate, hidePreviewCard);
  };

  // ----------------------------------------------------
  // TIER / RATING STATE & GENERATOR
  // ----------------------------------------------------
  const [tierSubTab, setTierSubTab] = useState<'weekly' | 'tier_list' | 'period' | 'points_rules'>('weekly');
  const [tierState, setTierState] = useState({
    timeGreeting: 'Добрый день',
    startDate: '',
    endDate: '',
  });

  const generateTierText = () => {
    const { timeGreeting, startDate, endDate } = tierState;
    const emojiHead = `<:1057697181244600320:1346493963544170557>`;
    const emojiBody = `<:emoji_246:1346569081322471434>`;
    const emojiPin = `<:18ad796f4e71439d86e1639735e33907:1346293750946726010>`;

    const start = startDate.trim() || 'xx.xx.26';
    const end = endDate.trim() || 'xx.xx.26';

    let text = '';
    if (tierSubTab === 'weekly') {
      text = `${emojiHead} _${timeGreeting}, @server_\n\n${emojiBody} _**Готовы предоставить вам еженедельный рейтинг семей с ${start} - ${end}**_`;
    } else if (tierSubTab === 'tier_list') {
      text = `${emojiHead} _${timeGreeting}, @server_\n\n${emojiBody} _**Готовы предоставить вам тир семей и фракций ${start} - ${end}**_\n${emojiPin} _С системой подсчета баллов можете ознакомиться в закрепленном сообщении_\n\n_Если есть несостыковки по данному тиру **СЕМЕЙ** и **ФРАКЦИЙ**, вы можете написать мне в ЛС! Всем желаю удачной новой недели._`;
    } else if (tierSubTab === 'period') {
      text = `${emojiHead} _${timeGreeting}, @server_\n\n${emojiBody} _**Готовы предоставить вам период рейтинга семей с ${start} - ${end}**_`;
    } else if (tierSubTab === 'points_rules') {
      text = `<:3a0bc8c5a39945a59121340b196c7077:1346294116123676692> *** Система начисления баллов для семей и крайм фракций***
\`\`\`ВЗА                         | 05 баллов
Перекрытая поставка/крафт | 15 баллов
Отбитая поставка/крафт    | 15 баллов
Отбитие рейда             | 25 баллов
Теракт                    | 25 баллов
Банк                      | 10 баллов
Вербовка Дилеров          | 10 баллов
Захват цехов              | 10 баллов
Стрела                    | 15 баллов
ВЗМ                       | 20 баллов
Форт-Занкудо              | 10 баллов
Остров Кайо-Перико        | 10 баллов
MCL                       | 25 баллов
ВЗЗ                       | 25 баллов
Стрелы                    | 25 баллов
Мп от администрации       | 20 баллов
Def/Win квадрата          | 05 баллов\`\`\`
<:pin5:1346458830334197780> ***Система начисления баллов для государственных фракций***
\`\`\`ВЗА                         | 05 баллов
Отбитая поставка/крафт    | 15 баллов
Проведение рейда          | 25 баллов
Отбитие теракта           | 25 баллов
Вербовка Дилеров          | 10 баллов
Захват цехов              | 10 баллов
Отбитый банк              | 10 баллов
ВЗМ                       | 25 баллов
ФЗ/Кайо-Перико            | 10 баллов
MCL                       | 25 баллов
Мп от администрации       | 20 баллов\`\`\``;
    }

    return appendFooter(text, includeDate, customDate);
  };

  // ----------------------------------------------------
  // MANSIONS STATE & GENERATOR
  // ----------------------------------------------------
  const [mansionsList, setMansionsList] = useState([
    { name: 'Russian Mafia', owner: '', link: '' },
    { name: 'La Cosa Nostra', owner: '', link: '' },
    { name: 'Yakuza Mafia', owner: '', link: '' },
    { name: 'Irish Mafia', owner: '', link: '' },
    { name: 'Mexican Cartel', owner: '', link: '' },
    { name: 'Angel of Death', owner: '', link: '' },
    { name: 'The Lost MC', owner: '', link: '' },
    { name: 'Armenian Mafia', owner: '', link: '' },
  ]);

  const generateMansionsText = () => {
    const emojiHeader = `<:a08db92a1bef4603881536b6807eb30d:1346294668308250685>`;
    const emojiSection = `<:18ad796f4e71439d86e1639735e33907:1346293750946726010>`;
    const emojiOwner = `<:518cdbc0cac6473f844e99b9fd36b5b2:1346294430306406510>`;

    const bbIcons: Record<string, string> = {
      'Russian Mafia': '<:bb0:1346240208148103278>',
      'La Cosa Nostra': '<:bb1:1346240225676103762>',
      'Yakuza Mafia': '<:bb2:1346240240649633832>',
      'Irish Mafia': '<:bb3:1346240254020943986>',
      'Mexican Cartel': '<:bb4:1346240276770848908>',
      'Angel of Death': '<:bb5:1346240292160016425>',
      'The Lost MC': '<:bb6:1346240307968086017>',
      'Armenian Mafia': '<:bb7:1346240322946207774>',
    };

    const lines = mansionsList.map((m) => {
      const icon = bbIcons[m.name] || '<:bb0:1346240208148103278>';
      const linkFormatted = m.link ? `[Ссылка на Discord семьи](${m.link})` : '[Ссылка на Discord семьи]';
      return `${icon} **${m.name}** – ${emojiOwner} ${m.owner || '[Discord-ник овнера]'} – ${linkFormatted}`;
    }).join('\n');

    const mainText = `_${emojiHeader} **Здесь собрана информация о 8 особняках сервера, их владельцах и семейных Discord-серверах.**

 ${emojiSection}**Список особняков и владельцев:**
${lines}

 ${emojiSection}**Дополнительная информация:**
- Овнеры особняков получают уникальную роль с названием их особняка.
- Эти роли отображаются отдельно и выше других участников.
- Обновление списка происходит при смене владельцев._`;

    return appendFooter(mainText, includeDate, customDate);
  };

  // ----------------------------------------------------
  // FAMILY ARROWS STATE & GENERATOR
  // ----------------------------------------------------
  const [arrowsState, setArrowsState] = useState({
    winnerFamq: '',
    squadComment: '',
    matches: [
      { team1: '', team2: '', winner: '' },
    ],
  });

  const addArrowMatch = () => {
    setArrowsState((prev) => ({
      ...prev,
      matches: [...prev.matches, { team1: '', team2: '', winner: '' }],
    }));
  };

  const removeArrowMatch = (index: number) => {
    setArrowsState((prev) => ({
      ...prev,
      matches: prev.matches.filter((_, i) => i !== index),
    }));
  };

  const updateArrowMatch = (index: number, field: 'team1' | 'team2' | 'winner', value: string) => {
    setArrowsState((prev) => {
      const updated = [...prev.matches];
      updated[index][field] = value;
      return { ...prev, matches: updated };
    });
  };

  const generateArrowsText = () => {
    const { winnerFamq, squadComment, matches } = arrowsState;
    const emoji = `<:3710493da42548998922a7a10dda1029:1346294056581337109>`;

    const rawWinner = winnerFamq.trim() || '[Победитель]';
    const matchesFormatted = matches
      .map(
        (m) =>
          `**${m.team1.trim() || '[Команда 1]'}** vs **${m.team2.trim() || '[Команда 2]'}**\n\n- Итог: **${m.winner.trim() || '[Победитель]'}** win`
      )
      .join('\n\n');

    const commentPart = squadComment.trim() ? `\n- Комментарий от состава: ||${squadComment.trim()}||` : '';

    const mainText = `${emoji} _Итоги мероприятия **Family Arrows**

Победителем мероприятия **Family Arrows** становится семья **${rawWinner}**${commentPart}

${matchesFormatted}_`;

    return appendFooter(mainText, includeDate, customDate);
  };

  // ----------------------------------------------------
  // ISLAND / FORT ZANCUDO STATE & GENERATOR
  // ----------------------------------------------------
  const [islandFzState, setIslandFzState] = useState({
    type: 'cayo_attack' as 'cayo_attack' | 'cayo_repelled' | 'fz_attack',
    who: '',
    jointWith: '',
    targetGos: '',
    jointGos: '',
    lootedMaterials: '',
    defenderFamq: '',
    hadKills: false,
    killedFamqs: '',
    hidePreviewCard: false,
  });

  const generateIslandFzText = () => {
    const { type, who, targetGos, jointGos, lootedMaterials, defenderFamq, hadKills, killedFamqs, hidePreviewCard } = islandFzState;
    const emoji = `<:emoji_246:1346569081322471434>`;

    const rawWho = who.trim() || '[Семья/Фракция]';
    const rawMat = lootedMaterials.trim() || '[Материалы]';
    const rawTargetGos = targetGos.trim() || '[ГОС Фракция]';
    const rawDefender = defenderFamq.trim() || '[Семья/Фракция]';

    let body = '';
    if (type === 'cayo_attack') {
      body = `${emoji} _**${rawWho}** успешно напала на остров **Кайо-Перико** и вывезла:_\n- _**${rawMat}**_`;
      if (hadKills && killedFamqs.trim()) {
        const formattedKills = formatKilledList(killedFamqs, true);
        body += `\n\n*_в процессе нападения **${rawWho}** также убила **${formattedKills}**_`;
      }
    } else if (type === 'cayo_repelled') {
      const jointPart = jointGos.trim() ? ` совместно с **${jointGos.trim()}**` : '';
      body = `${emoji} _**${rawTargetGos}**${jointPart} успешно отбили нападение на остров **Кайо-Перико** от **${rawDefender}**_`;
    } else if (type === 'fz_attack') {
      body = `${emoji} _**${rawWho}** успешно напала на **Форт-Занкудо** и вывезла:_\n- _**${rawMat}**_`;
      if (hadKills && killedFamqs.trim()) {
        const formattedKills = formatKilledList(killedFamqs, true);
        body += `\n\n*_в процессе нападения **${rawWho}** также убила **${formattedKills}**_`;
      }
    }

    return appendFooter(body, includeDate, customDate, hidePreviewCard);
  };

  // ----------------------------------------------------
  // TERAKT & RAID STATE & GENERATOR
  // ----------------------------------------------------
  const [teraktRaidState, setTeraktRaidState] = useState({
    category: 'terakt' as 'terakt' | 'raid',
    actionType: 'conducted' as 'conducted' | 'repelled',
    who: '',
    jointWith: '',
    target: '',
    fromWho: '',
  });

  const generateTeraktRaidText = () => {
    const { category, actionType, who, jointWith, target, fromWho } = teraktRaidState;
    const emoji = `<:11b7b73fc4004fcfa3b49806916cce41:1346293718914830407>`;

    const rawWho = who.trim() || '[Фракция/Семья]';
    const rawTarget = target.trim() || '[Цель]';
    const rawFromWho = fromWho.trim() || '[Фракция/Семья]';

    let body = '';
    if (category === 'terakt') {
      if (actionType === 'conducted') {
        body = `${emoji} _**${rawWho}** успешно **провела теракт** на **${rawTarget}**_`;
      } else {
        const jointPart = jointWith.trim() ? ` совместно с **${jointWith.trim()}**` : '';
        body = `${emoji} _**${rawWho}**${jointPart} успешно **отбили теракт** на **${rawTarget}** от **${rawFromWho}**_`;
      }
    } else {
      // Raid
      if (actionType === 'repelled') {
        body = `${emoji} _**${rawWho}** успешно **отбила рейд** от **${rawFromWho}**_`;
      } else {
        const jointPart = jointWith.trim() ? ` совместно с **${jointWith.trim()}**` : '';
        body = `${emoji} _**${rawWho}**${jointPart} успешно **провели рейд** на **${rawFromWho}**_`;
      }
    }

    return appendFooter(body, includeDate, customDate);
  };

  // ----------------------------------------------------
  // PUBG / WARZONE STATE & GENERATOR
  // ----------------------------------------------------
  const [pubgWarzoneState, setPubgWarzoneState] = useState({
    gameMode: 'pubg' as 'pubg' | 'warzone',
    winnerTeam: 'tuler',
    squadComment: 'bibubip',
  });

  const generatePubgWarzoneText = () => {
    const { gameMode, winnerTeam, squadComment } = pubgWarzoneState;
    const emoji = `<:3710493da42548998922a7a10dda1029:1346294056581337109>`;

    const modeTitle = gameMode === 'pubg' ? 'PUBG 2x2' : 'Warzone 2x2';
    const commentPart = squadComment ? `\n- _Комментарий состава: ||${squadComment}||_` : '';

    const body = `${emoji} _Итоги турнира **${modeTitle}**_\n\n_Победителем турнира **${modeTitle}** становится команда **${winnerTeam}**_${commentPart}`;

    return appendFooter(body, includeDate, customDate);
  };

  // ----------------------------------------------------
  // DEALERS & WORKSHOPS STATE & GENERATOR
  // ----------------------------------------------------
  const [dealersState, setDealersState] = useState({
    date: getTodayFormatted(),
    slots: [
      { time: '10:45', winner: 'Yeyo Famq' },
      { time: '14:45', winner: 'Vampire Famq' },
      { time: '18:45', winner: 'LSPD, LSCSD, FIB' },
      { time: '22:45', winner: 'Heyho Famq' },
    ],
  });

  const addDealersSlot = () => {
    setDealersState((prev) => ({
      ...prev,
      slots: [...prev.slots, { time: '00:00', winner: '' }],
    }));
  };

  const removeDealersSlot = (index: number) => {
    setDealersState((prev) => ({
      ...prev,
      slots: prev.slots.filter((_, i) => i !== index),
    }));
  };

  const updateDealersSlot = (index: number, field: 'time' | 'winner', value: string) => {
    setDealersState((prev) => {
      const updated = [...prev.slots];
      updated[index][field] = value;
      return { ...prev, slots: updated };
    });
  };

  const generateDealersText = () => {
    const { date, slots } = dealersState;
    const emoji = `<:a7e0ff67324d437c850002273542ec65:1346294629997482106>`;
    const subheader = `${emoji} _Итоги **Дилеров и Цехов** за **${date}**_ ${emoji}`;
    const codeBlock = `\`\`\`${slots.map((s) => `${s.time} - ${s.winner}`).join('\n')}\`\`\``;

    const mainText = `${subheader}\n${codeBlock}`;
    return appendFooter(mainText, includeDate, customDate, false, true);
  };

  // ----------------------------------------------------
  // DROPS / ВЗА STATE & GENERATOR
  // ----------------------------------------------------
  const [dropsVzaState, setDropsVzaState] = useState({
    date: getTodayFormatted(),
    slots: [
      { time: '00:00', winner: 'Wave Famq' },
      { time: '04:00', winner: 'Wave Famq' },
      { time: '08:00', winner: 'Wave Famq' },
      { time: '12:00', winner: 'Wave Famq' },
      { time: '16:00', winner: 'Wave Famq' },
      { time: '20:00', winner: 'Wave Famq' },
    ],
  });

  const addDropsVzaSlot = () => {
    setDropsVzaState((prev) => ({
      ...prev,
      slots: [...prev.slots, { time: '00:00', winner: '' }],
    }));
  };

  const removeDropsVzaSlot = (index: number) => {
    setDropsVzaState((prev) => ({
      ...prev,
      slots: prev.slots.filter((_, i) => i !== index),
    }));
  };

  const updateDropsVzaSlot = (index: number, field: 'time' | 'winner', value: string) => {
    setDropsVzaState((prev) => {
      const updated = [...prev.slots];
      updated[index][field] = value;
      return { ...prev, slots: updated };
    });
  };

  const generateDropsVzaText = () => {
    const { date, slots } = dropsVzaState;
    const emoji = `<:a7e0ff67324d437c850002273542ec65:1346294629997482106>`;
    const subheader = `${emoji} _Итоги **ВЗА** за **${date}**_ ${emoji}`;
    const codeBlock = `\`\`\`${slots.map((s) => `${s.time} - ${s.winner}`).join('\n')}\`\`\``;

    const mainText = `${subheader}\n${codeBlock}`;
    return appendFooter(mainText, includeDate, customDate, false, true);
  };

  // ----------------------------------------------------
  // RP ARROWS STATE & GENERATOR
  // ----------------------------------------------------
  const [rpArrowsState, setRpArrowsState] = useState({
    famq1: 'Uzi Famq',
    famq2: 'Allegri Famq',
    winner: 'Uzi Famq win',
    comment: '123',
  });

  const generateRpArrowsText = () => {
    const { famq1, famq2, winner, comment } = rpArrowsState;
    const emoji = `<:1b6f30f384d844a0ac03a051ba9a38a8:1346293819662139422>`;
    const commentPart = comment
      ? `\n\n- Итог: **${winner}**\n- Комментарий состава: ||${comment}||_`
      : `\n\n- Итог: **${winner}**_`;

    const body = `${emoji} _**${famq1}** забила стрелу **${famq2}**${commentPart}`;

    return appendFooter(body, includeDate, customDate);
  };

  // ----------------------------------------------------
  // MODERATION TEAM STATE & GENERATOR
  // ----------------------------------------------------
  const [modTeamState, setModTeamState] = useState({
    chiefMod: '',
    deputyChiefMod: '',
    seniorMods: [
      { name: '', note: '(formatting)' },
      { name: '', note: '(tier)' },
      { name: '', note: '(interview)' },
    ],
    moderators: ['', '', '', '', '', ''],
    helpers: ['', '', '', ''],
  });

  const generateModTeamText = () => {
    const { chiefMod, deputyChiefMod, seniorMods, moderators, helpers } = modTeamState;
    const modEmoji = `<:1057697181244600320:1346493963544170557>`;
    const chiefEmoji = `<:518cdbc0cac6473f844e99b9fd36b5b2:1346294430306406510>`;
    const depEmoji = `<:a08db92a1bef4603881536b6807eb30d:1346294668308250685>`;
    const snrEmoji = `<:3710493da42548998922a7a10dda1029:1346294056581337109>`;
    const modItemEmoji = `<:5af470b375554811b10918a04ff3d720:1346294462501883974>`;
    const helperEmoji = `<:a83c71ff5c8c401ab57870f89a532f9d:1346294688415748106>`;

    const snrFormatted = seniorMods
      .map((item) => `-  ${item.name} ${item.note} `)
      .join('\n');

    const modFormatted = moderators
      .map((item) => `-  ${item}`)
      .join('\n');

    const helpFormatted = helpers
      .map((item) => `- ${item}`)
      .join('\n');

    let text = `${modEmoji} _**Состав модерации ${modEmoji} 

${chiefEmoji}  Chief Moderator -  ${chiefMod}

${depEmoji}  Deputy Chief Mod -  ${deputyChiefMod}

${snrEmoji}  Senior Moderator
${snrFormatted}

${modItemEmoji}  Moderator
${modFormatted}

${helperEmoji}  Helper**
${helpFormatted} _`;

    if (includeDate && customDate) {
      text += `\n_||${customDate}||_`;
    }
    text += `\n${FOOTER_LINK}`;
    return text;
  };

  // ----------------------------------------------------
  // WEEKLY CUP STATE & GENERATOR
  // ----------------------------------------------------
  const [weeklyCupState, setWeeklyCupState] = useState({
    winner: '999',
    commentatorDiscordId: '334878444141805568',
    commentText: 'выебал как витчблейд после рехаба ',
    matches: [
      { team1: 'zazashmockers', team2: '17', winner: 'zazashmockers' },
      { team1: 'wave', team2: 'raze', winner: 'wave' },
      { team1: '999', team2: '812', winner: '999' },
      { team1: '999', team2: 'zazashmockers', winner: '999' },
      { team1: 'wave', team2: '999', winner: '999' },
      { team1: 'zazashmockers', team2: '999', winner: '999' },
    ],
  });

  const addWeeklyCupMatch = () => {
    setWeeklyCupState((prev) => ({
      ...prev,
      matches: [...prev.matches, { team1: '', team2: '', winner: '' }],
    }));
  };

  const removeWeeklyCupMatch = (index: number) => {
    setWeeklyCupState((prev) => ({
      ...prev,
      matches: prev.matches.filter((_, i) => i !== index),
    }));
  };

  const updateWeeklyCupMatch = (index: number, field: 'team1' | 'team2' | 'winner', value: string) => {
    setWeeklyCupState((prev) => {
      const next = [...prev.matches];
      next[index][field] = value;
      return { ...prev, matches: next };
    });
  };

  const generateWeeklyCupText = () => {
    const { winner, commentatorDiscordId, commentText, matches } = weeklyCupState;
    const emoji = `<:3710493da42548998922a7a10dda1029:1346294056581337109>`;

    const commentPart = commentatorDiscordId
      ? `\n- Комментарий от <@${commentatorDiscordId}>: ||${commentText}||`
      : '';

    const matchesFormatted = matches
      .map((m) => `**${m.team1}** vs **${m.team2}**\n\n- Итог: **${m.winner}** win`)
      .join('\n\n');

    let body = `${emoji} _Итоги мероприятия **Weekly Cup**\n\nПобедителем мероприятия **Weekly Cup** становится команда **${winner}**${commentPart}\n\n${matchesFormatted}_`;

    let text = `${body}`;
    if (includeDate && customDate) {
      text += `\n_||${customDate}||_`;
    }
    text += `\n${FOOTER_LINK}`;
    return text;
  };

  // ----------------------------------------------------
  // ACHIEVEMENTS / 100% GHETTO STATE & GENERATOR
  // ----------------------------------------------------
  const [achievementsState, setAchievementsState] = useState({
    serverName: 'Houston',
    leaderFractionAndName: 'Marabunta Grande - Sistim Allegri',
    captSquad: 'Destroy',
    controlTarget: '100% территорий Ghetto',
  });

  const generateAchievementsText = () => {
    const { serverName, leaderFractionAndName, captSquad, controlTarget } = achievementsState;
    const emoji = `<:1057697181244600320:1346493963544170557>`;

    let body = `_${emoji} **Доброго времени суток, ${serverName}**\n\nЛидер фракции **${leaderFractionAndName}**, совместно со своим капт-составом **${captSquad}** взяли под свой контроль **${controlTarget}**\n\nПоздравим их и пожелаем удачи в дальнейших начинаниях! _`;

    let text = `${body}`;
    if (includeDate && customDate) {
      text += `\n_||${customDate}||_`;
    }
    text += `\n${FOOTER_LINK}`;
    return text;
  };

  // ----------------------------------------------------
  // 2. LEADERS STATE
  // ----------------------------------------------------
  const [leaderSubTab, setLeaderSubTab] = useState<
    | 'warn_complaint'
    | 'warn_pdlf'
    | 'new_leader'
    | 'remove_leader'
    | 'next_term'
    | 'term_2_3'
    | 'leave_success'
    | 'leave_pszh'
  >('warn_complaint');

  const [leaderState, setLeaderState] = useState({
    timeGreeting: 'Добрый день',
    faction: 'FIB',
    nickname: 'Mister Business',
    staticId: '#5555',
    discordTag: '@MisterBusiness',
    complaintLink: 'https://forum.majestic-rp.ru/threads/example',
    pdlfRule: '1.7 ПДЛФ',
    warnsStatus: '[1/5]',
    termNumber: '1-й',
    nextTermNumber: '2-й',
    removalReasonType: 'general' as 'general' | 'specific',
    specificReasonText: 'отказ от проверки',
  });

  const generateLeadersText = () => {
    const {
      timeGreeting,
      faction,
      nickname,
      staticId,
      discordTag,
      complaintLink,
      pdlfRule,
      warnsStatus,
      termNumber,
      nextTermNumber,
      removalReasonType,
      specificReasonText,
    } = leaderState;
    const emoji = `<:1057697181244600320:1346493963544170557>`;
    const formattedFaction = formatGosName(faction);

    let mainText = '';

    if (leaderSubTab === 'warn_complaint') {
      mainText = `${emoji} _${timeGreeting}_\n\n_Лидер фракции **${formattedFaction}**_\n- _**${nickname}** - получает **выговор** по жалобе: || ${complaintLink} ||_\n- _Статический ID - **${staticId}**_\n- _Discord - **${discordTag}**_\n- _Ситуация по выговорам - **${warnsStatus}**_`;
    } else if (leaderSubTab === 'warn_pdlf') {
      mainText = `${emoji} _${timeGreeting}_\n\n_Лидер фракции **${formattedFaction}**_\n- _**${nickname}** - получает **выговор** за **${pdlfRule}**._\n- _Статический ID - **${staticId}**_\n- _Discord - **${discordTag}**_\n- _Ситуация по выговорам - **${warnsStatus}**_`;
    } else if (leaderSubTab === 'new_leader') {
      mainText = `${emoji} _${timeGreeting}_\n\n_По результатам обзвона:\n- **${nickname}** - новый лидер **${formattedFaction}**\n- Статический ID - **${staticId}**\n- Discord - **${discordTag}**\nПожелаем удачи и терпения на лидерском посту!_`;
    } else if (leaderSubTab === 'remove_leader') {
      let reasonString = 'по совокупности выговоров';
      if (removalReasonType === 'specific' && specificReasonText.trim()) {
        reasonString = `**${specificReasonText.trim()}**`;
      }
      mainText = `${emoji} _${timeGreeting}_\n\n_Лидер фракции **${formattedFaction}**_\n- _**${nickname}** - снят с поста лидера ${reasonString}._\n- _Статический ID - **${staticId}**_\n- _Discord - **${discordTag}**_\n_Пожелаем удачи в дальнейших начинаниях!_`;
    } else if (leaderSubTab === 'next_term') {
      mainText = `${emoji} _${timeGreeting}! _\n\n_ Лидер фракции **${formattedFaction}**_\n- _**${nickname}** - успешно отстоял ${termNumber} лидерский срок и заступает на ${nextTermNumber} срок_\n- _Статический ID - **${staticId}**_\n- _Discord - **${discordTag}**_\n_Пожелаем удачи в дальнейших начинаниях!_`;
    } else if (leaderSubTab === 'term_2_3') {
      mainText = `${emoji} _${timeGreeting}! _\n\n_ Лидер фракции **${formattedFaction}**_\n- _**${nickname}** - успешно отстоял 2-й лидерский срок и заступает на 3-й срок_\n- _Статический ID - **${staticId}**_\n- _Discord - **${discordTag}**_\n_Пожелаем удачи в дальнейших начинаниях!_`;
    } else if (leaderSubTab === 'leave_success') {
      mainText = `${emoji} _${timeGreeting}! _\n\n_ Лидер фракции **${formattedFaction}**_\n- _**${nickname}** - успешно отстоял ${termNumber} лидерский срок и уходит с поста_\n- _Статический ID - **${staticId}**_\n- _Discord - **${discordTag}**_\n_Пожелаем удачи в дальнейших начинаниях!_`;
    } else if (leaderSubTab === 'leave_pszh') {
      mainText = `${emoji} _${timeGreeting}! _\n\n_ Лидер фракции **${formattedFaction}**_\n- _**${nickname}** - покидает пост лидера по собственному желанию_\n- _Статический ID - **${staticId}**_\n- _Discord - **${discordTag}**_\n_Пожелаем удачи в дальнейших начинаниях!_`;
    }

    return appendFooter(mainText, includeDate, customDate);
  };

  // ----------------------------------------------------
  // 3. CAPT & CHAMPIONS STATE
  // ----------------------------------------------------
  const [captSubTab, setCaptSubTab] = useState<
    'simple' | 'champions_group' | 'mansion' | 'free_building' | 'champions_stage'
  >('simple');

  const [captState, setCaptState] = useState({
    team1: 'Spaze Famq',
    team2: 'Allegri Famq',
    score1: '1',
    score2: '0',
    winner: 'Spaze Famq',
    groupNumber: '№ 1',
    stageName: 'Матч за финал группы',
    mansionCaptured: 'Angel of Death',
    mansionFrom: 'Yoka Famq',
    dayNumber: '1',
    stageTitle: '1 раунд',
  });

  const generateCaptText = () => {
    const {
      team1,
      team2,
      score1,
      score2,
      winner,
      groupNumber,
      stageName,
      mansionCaptured,
      mansionFrom,
      dayNumber,
      stageTitle,
    } = captState;

    let mainText = '';

    if (captSubTab === 'simple') {
      mainText = `<:11b7b73fc4004fcfa3b49806916cce41:1346293718914830407>_ **${team1}** vs **${team2}**_`;
    } else if (captSubTab === 'champions_group') {
      mainText = `<:1057697181244600320:1346493963544170557> _${stageName} - **${groupNumber}**\n\n<:tc:1383214036006600704>**${team1} ${score1} - ${score2} ${team2}**\n\n<:18ad796f4e71439d86e1639735e33907:1346293750946726010> win **${winner}**_`;
    } else if (captSubTab === 'mansion') {
      mainText = `<:20d771138449479eb29cecc8d114d997:1346293856970211438> _**${winner}** захватила особняк **${mansionCaptured}** у **${mansionFrom}**_`;
    } else if (captSubTab === 'free_building') {
      mainText = `<:20d771138449479eb29cecc8d114d997:1346293856970211438> _**${winner}** захватила **свободное помещение** у **${mansionFrom}**_`;
    } else if (captSubTab === 'champions_stage') {
      mainText = `<:1057697181244600320:1346493963544170557> _ ${dayNumber} день **Champions Cup** - **${stageTitle}**\n\n<:tc:1383214036006600704>**${team1} ${score1} - ${score2} ${team2}**\n\n<:18ad796f4e71439d86e1639735e33907:1346293750946726010> win **${winner}**_`;
    }

    return appendFooter(mainText, includeDate, customDate);
  };

  // ----------------------------------------------------
  // 4. INTERVIEW STATE
  // ----------------------------------------------------
  const [interviewState, setInterviewState] = useState({
    serverTag: '||@tag server||',
    roleTarget: 'лидером',
    entityName: 'Name Fame',
    userTag: '@tag',
    questions: [
      { q: 'Как настрой на этот сезон?', a: 'Настрой боевой, идем за победой.' },
      { q: 'Планируете ли союзы?', a: 'Пока играем соло.' },
    ],
  });

  const addInterviewQuestion = () => {
    setInterviewState((prev) => ({
      ...prev,
      questions: [...prev.questions, { q: 'Новый вопрос.', a: 'Новый ответ.' }],
    }));
  };

  const removeInterviewQuestion = (index: number) => {
    setInterviewState((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index),
    }));
  };

  const updateInterviewQuestion = (index: number, field: 'q' | 'a', value: string) => {
    setInterviewState((prev) => {
      const updated = [...prev.questions];
      updated[index][field] = value;
      return { ...prev, questions: updated };
    });
  };

  const generateInterviewText = () => {
    const { serverTag, roleTarget, entityName, userTag, questions } = interviewState;
    let text = `<:flow8:1346309712374665256> _Приветствуем, ${serverTag} _\n_Сегодня у нас интервью с ${roleTarget} семьи/фракции ${entityName} - ${userTag} _\n\n`;

    if (!questions || questions.length === 0) {
      text += `_[Добавьте хотя бы один вопрос в конструкторе ниже]_\n\n`;
    } else {
      questions.forEach((item) => {
        const qText = item.q ? item.q.trim() : 'Вопрос...';
        const aText = item.a ? item.a.trim() : 'Ответ...';
        text += `<:3c82390ed0514e65810db243c5ad1832:1346294142732472521>  _**Вопрос:** **${qText}**_\n`;
        text += `<:18ad796f4e71439d86e1639735e33907:1346293750946726010> _**Ответ:** ${aText}_\n\n`;
      });
    }

    text += `_-# Команда Famq & News благодарит (${entityName}) за уделенное нам время. До встречи на новом интересном интервью!_`;
    return text;
  };

  // ----------------------------------------------------
  // 5. MCL / VZZ STATE
  // ----------------------------------------------------
  const [mclSubTab, setMclSubTab] = useState<'mcl' | 'king_mcl'>('mcl');
  const [mclState, setMclState] = useState({
    tournamentType: 'MCL' as 'MCL' | 'ВЗЗ',
    winnerFamily: '',
    leaderComment: '',
    squadComment: '',
    participants: '',
    dayNumber: '1',
    hideLinkCard: false,
  });

  const generateMclText = () => {
    const { tournamentType, winnerFamily, leaderComment, squadComment, participants, dayNumber, hideLinkCard } = mclState;
    const link = hideLinkCard ? `<${FOOTER_LINK}>` : FOOTER_LINK;

    let mainText = '';
    if (mclSubTab === 'mcl') {
      mainText = `<:3710493da42548998922a7a10dda1029:1346294056581337109> _Итоги семейного турнира **${tournamentType}**_\n\n_Победителем турнира **${tournamentType}** становится семья **${winnerFamily}**_\n- _Комментарий от лидера: ||${leaderComment}||_\n- _Комментарий состава: ||${squadComment}||_\n- _Участники мероприятия: **${participants}**_`;
    } else {
      mainText = `<:3710493da42548998922a7a10dda1029:1346294056581337109> _Итоги семейного турнира **King MCL** - **день ${dayNumber}**_\n\n_Победителем турнира **${tournamentType}** становится семья **${winnerFamily}**_\n- _Участники мероприятия: **${participants}**_`;
    }

    return appendFooter(mainText, includeDate, customDate, hideLinkCard);
  };

  // Helper for freeze duration Russian pluralization
  const formatFreezeDuration = (valueStr: string, unit: 'days' | 'hours' | 'custom', customVal?: string) => {
    if (unit === 'custom' && customVal && customVal.trim()) return customVal.trim();
    const num = parseInt(valueStr, 10);
    if (isNaN(num) || num <= 0) {
      return `${valueStr} ${unit === 'hours' ? 'часов' : 'дней'}`;
    }

    const mod10 = num % 10;
    const mod100 = num % 100;

    if (unit === 'hours') {
      if (mod100 >= 11 && mod100 <= 19) return `${num} часов`;
      if (mod10 === 1) return `${num} час`;
      if (mod10 >= 2 && mod10 <= 4) return `${num} часа`;
      return `${num} часов`;
    } else {
      if (mod100 >= 11 && mod100 <= 19) return `${num} дней`;
      if (mod10 === 1) return `${num} день`;
      if (mod10 >= 2 && mod10 <= 4) return `${num} дня`;
      return `${num} дней`;
    }
  };

  // ----------------------------------------------------
  // 6. WARS & ALLIANCES / TERRITORIES STATE
  // ----------------------------------------------------
  const [warSubTab, setWarSubTab] = useState<
    | 'freeze_capt_family'
    | 'unfreeze_capt_family'
    | 'freeze_family'
    | 'unfreeze_family'
    | 'recolor_multi'
    | 'recolor_single'
    | 'rollback_tech'
    | 'neutral_recolor'
    | 'fz_freeze'
    | 'fz_unfreeze'
    | 'war_freeze'
    | 'war_unfreeze'
  >('freeze_capt_family');

  const [warState, setWarState] = useState({
    familyRoleTag: '',
    freezeDays: '7',
    freezeUnit: 'days' as 'days' | 'hours' | 'custom',
    freezeCustomText: '',
    freezeReasonType: 'complaint' as 'complaint' | 'rule',
    recolorReasonType: 'rule' as 'complaint' | 'rule',
    multiReasonType: 'check' as 'check' | 'complaint' | 'rule',
    rollbackReasonType: 'tech' as 'tech' | 'complaint' | 'rule',
    neutralReasonType: 'rule' as 'complaint' | 'rule',
    complaintLink: '',
    reasonMg: '',
    bannedUserFamily: '',
    territoriesList: [
      { count: '1 территория', to: '' },
    ],
    squareCode: 'CD39',
    violatingRule: '2.4 ОПСО',
    targetFamily: '',
    neutralReason: 'нарушение 1.12',
  });

  const addTerritoryRow = () => {
    setWarState((prev) => ({
      ...prev,
      territoriesList: [...prev.territoriesList, { count: '1 территория', to: '' }],
    }));
  };

  const removeTerritoryRow = (index: number) => {
    setWarState((prev) => ({
      ...prev,
      territoriesList: prev.territoriesList.filter((_, i) => i !== index),
    }));
  };

  const updateTerritoryRow = (index: number, field: 'count' | 'to', value: string) => {
    setWarState((prev) => {
      const list = [...prev.territoriesList];
      list[index][field] = value;
      return { ...prev, territoriesList: list };
    });
  };

  const generateWarText = () => {
    const {
      familyRoleTag,
      freezeDays,
      freezeUnit,
      freezeCustomText,
      freezeReasonType,
      recolorReasonType,
      multiReasonType,
      rollbackReasonType,
      neutralReasonType,
      complaintLink,
      reasonMg,
      bannedUserFamily,
      territoriesList,
      squareCode,
      violatingRule,
      targetFamily,
      neutralReason,
    } = warState;

    let mainText = '';
    const formattedDuration = formatFreezeDuration(freezeDays, freezeUnit, freezeCustomText);

    if (warSubTab === 'freeze_capt_family') {
      if (freezeReasonType === 'complaint') {
        mainText = `<:3c82390ed0514e65810db243c5ad1832:1346294142732472521> _Семья **${familyRoleTag}** получает заморозку каптов на **${formattedDuration}** по жалобе - ||${complaintLink}||_`;
      } else {
        mainText = `<:3c82390ed0514e65810db243c5ad1832:1346294142732472521> _Семья **${familyRoleTag}** получает заморозку каптов на **${formattedDuration}** за нарушение правила **${reasonMg}**_`;
      }
    } else if (warSubTab === 'unfreeze_capt_family') {
      mainText = `<:a08db92a1bef4603881536b6807eb30d:1346294668308250685> _Семья **${familyRoleTag}** разморожена по каптам_`;
    } else if (warSubTab === 'freeze_family') {
      if (freezeReasonType === 'complaint') {
        mainText = `<:3c82390ed0514e65810db243c5ad1832:1346294142732472521> _Семья **${familyRoleTag}** получает заморозку на **${formattedDuration}** по жалобе - ||${complaintLink}||_`;
      } else {
        mainText = `<:3c82390ed0514e65810db243c5ad1832:1346294142732472521> _Семья **${familyRoleTag}** получает заморозку на **${formattedDuration}** за нарушение правила **${reasonMg}**_`;
      }
    } else if (warSubTab === 'unfreeze_family') {
      mainText = `<:a08db92a1bef4603881536b6807eb30d:1346294668308250685> _Семья **${familyRoleTag}** полностью разморожена_`;
    } else if (warSubTab === 'recolor_multi') {
      const validTerritories = territoriesList.filter((item) => item.to.trim() || item.count.trim());
      const listFormatted = validTerritories.length > 0
        ? validTerritories.map((item) => `- _**${item.count || '1 территория'}** в сторону **${item.to || '[Семья]'}**_`).join('\n')
        : '- _**1 территория** в сторону **[Семья]**_';
      if (multiReasonType === 'check') {
        mainText = `<:a08db92a1bef4603881536b6807eb30d:1346294668308250685> _Перекрас в связи с игроком из **${bannedUserFamily}** который был заблокирован по итогам проверки, следующие территории будут перекрашены:\n${listFormatted}_`;
      } else if (multiReasonType === 'complaint') {
        mainText = `<:a08db92a1bef4603881536b6807eb30d:1346294668308250685> _Перекрас в связи с жалобой на игрока из **${bannedUserFamily}** - ||${complaintLink}||, следующие территории будут перекрашены:\n${listFormatted}_`;
      } else {
        mainText = `<:a08db92a1bef4603881536b6807eb30d:1346294668308250685> _Перекрас в связи с нарушением **${violatingRule}** от **${bannedUserFamily}**, следующие территории будут перекрашены:\n${listFormatted}_`;
      }
    } else if (warSubTab === 'recolor_single') {
      if (recolorReasonType === 'complaint') {
        mainText = `<:pin5:1346458830334197780> _Квадрат **${squareCode}** перекрашен в сторону **${familyRoleTag}** по жалобе - ||${complaintLink}||_`;
      } else {
        mainText = `<:pin5:1346458830334197780> _Квадрат **${squareCode}** перекрашен в сторону **${familyRoleTag}** в связи с нарушением **${violatingRule}**_`;
      }
    } else if (warSubTab === 'rollback_tech') {
      if (rollbackReasonType === 'tech') {
        mainText = `<:pin5:1346458830334197780> _Квадрат **${squareCode}** будет откачен в сторону семьи **${targetFamily}** по тех. причинам_`;
      } else if (rollbackReasonType === 'complaint') {
        mainText = `<:pin5:1346458830334197780> _Квадрат **${squareCode}** будет откачен в сторону семьи **${targetFamily}** по жалобе - ||${complaintLink}||_`;
      } else {
        mainText = `<:pin5:1346458830334197780> _Квадрат **${squareCode}** будет откачен в сторону семьи **${targetFamily}** в связи с нарушением **${violatingRule}**_`;
      }
    } else if (warSubTab === 'neutral_recolor') {
      if (neutralReasonType === 'complaint') {
        mainText = `<:pin5:1346458830334197780> _Квадрат **${squareCode}** перекрашен в **нейтрал** по жалобе - ||${complaintLink}||_`;
      } else {
        mainText = `<:pin5:1346458830334197780> _Квадрат **${squareCode}** перекрашен в **нейтрал** в связи с нарушением **${neutralReason}** от **${familyRoleTag}**_`;
      }
    } else if (warSubTab === 'fz_freeze') {
      mainText = `<:3c82390ed0514e65810db243c5ad1832:1346294142732472521> _Нападения на **Форт-Занкудо** и **Остров Кайо-Перико** временно заморожены до появления нового лидера **SANG**_`;
    } else if (warSubTab === 'fz_unfreeze') {
      mainText = `<:a08db92a1bef4603881536b6807eb30d:1346294668308250685> _Нападения на **Форт-Занкудо** и **Остров Кайо-Перико** разморожены_`;
    } else if (warSubTab === 'war_freeze') {
      mainText = `<:3c82390ed0514e65810db243c5ad1832:1346294142732472521> _**Война семей** временно заморожена по тех. причинам_`;
    } else if (warSubTab === 'war_unfreeze') {
      mainText = `<:a08db92a1bef4603881536b6807eb30d:1346294668308250685> _**Война семей** разморожена_`;
    }

    return appendFooter(mainText, includeDate, customDate);
  };

  // ----------------------------------------------------
  // 7. DROPS & WORKSHOPS / DEALERS STATE (Code block format)
  // ----------------------------------------------------
  const [dropState, setDropState] = useState({
    type: 'drop' as 'drop' | 'workshop' | 'dealer',
    winner: 'Proper Famq',
    itemsList: '100 медицинских материалов\n2.000 патронов 5.56',
  });

  const generateDropText = () => {
    const { type, winner, itemsList } = dropState;
    const title = type === 'drop' ? 'Итоги Аирдропа' : type === 'workshop' ? 'Итоги Захвата Цеха' : 'Итоги Дилера';
    let blockText = `\`\`\`${title}\nПобедитель: ${winner}\n\nВывезено:\n${itemsList}\`\`\``;

    return appendFooter(blockText, includeDate, customDate);
  };

  // ----------------------------------------------------
  // 8. CUSTOM FREE EDITOR
  // ----------------------------------------------------
  const [customText, setCustomText] = useState(
    `<:emoji_246:1346569081322471434> _**Текст новости** с выделением **жирным** и _курсивом__\n<https://t.me/famq_news>`
  );

  // ----------------------------------------------------
  // ACTIVE OUTPUT TEXT CALCULATOR
  // ----------------------------------------------------
  const getActiveGeneratedText = () => {
    switch (activeTab) {
      case 'supplies':
        return generateSuppliesText();
      case 'bank':
        return generateBankText();
      case 'tier':
        return generateTierText();
      case 'mansions':
        return generateMansionsText();
      case 'arrows':
        return generateArrowsText();
      case 'islandFz':
        return generateIslandFzText();
      case 'teraktRaid':
        return generateTeraktRaidText();
      case 'pubgWarzone':
        return generatePubgWarzoneText();
      case 'dealers':
        return generateDealersText();
      case 'drops':
        return generateDropsVzaText();
      case 'rpArrows':
        return generateRpArrowsText();
      case 'weeklyCup':
        return generateWeeklyCupText();
      case 'modTeam':
        return generateModTeamText();
      case 'achievements':
        return generateAchievementsText();
      case 'leaders':
        return generateLeadersText();
      case 'capt':
        return generateCaptText();
      case 'interview':
        return generateInterviewText();
      case 'mcl':
        return generateMclText();
      case 'wars':
        return generateWarText();
      case 'custom':
        return customText;
      default:
        return '';
    }
  };

  const activeText = getActiveGeneratedText();

  // Automatic Formatting Validation / Warning Engine
  const getFormattingWarnings = (text: string) => {
    const warnings: string[] = [];
    if (!text) return warnings;

    // Check for bold commas e.g. **Text,**
    if (/\*\*[^*]+,\*\*/.test(text)) {
      warnings.push('Замечена запятая внутри жирного шрифта (**Слово,**). Вынесите запятую наружу (**Слово**,).');
    }

    // Check for Judicial branch leader reference
    if (activeTab === 'leaders' && /председатель верховного суда|судебн/i.test(text)) {
      warnings.push('ВНИМАНИЕ! Лидеров судебной власти (Председатель верховного суда) НЕ отписывают в новости лидеров!');
    }

    // Check year in spoiler date
    if (includeDate && /\d{2}\.\d{2}\.\d{4}/.test(text)) {
      warnings.push('В дате за спойлером НЕ пишется год! Только день и месяц (например: _||02.09||_).');
    }

    return warnings;
  };

  const currentWarnings = getFormattingWarnings(activeText);

  const [copyHistory, setCopyHistory] = useState<
    Array<{ id: string; text: string; categoryLabel: string; timestamp: string }>
  >([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const greeting = getTimeBasedGreeting();
      setTierState((prev) => ({ ...prev, timeGreeting: greeting }));
      setLeaderState((prev) => ({ ...prev, timeGreeting: greeting }));

      try {
        const saved = localStorage.getItem('famq_copy_history');
        if (saved) {
          setCopyHistory(JSON.parse(saved));
        }
      } catch {
        // ignore
      }

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const day = String(yesterday.getDate()).padStart(2, '0');
      const month = String(yesterday.getMonth() + 1).padStart(2, '0');
      setCustomDate(`${day}.${month}`);
      setFormattedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleCopy = () => {
    if (!activeText || activeText.length > 2000) return;
    navigator.clipboard.writeText(activeText);
    setCopied(true);

    const currentCategory = CATEGORIES.find((c) => c.id === activeTab)?.label || 'Пост';
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setCopyHistory((prev) => {
      const filtered = prev.filter((item) => item.text !== activeText);
      const updated = [
        { id: String(Date.now()), text: activeText, categoryLabel: currentCategory, timestamp: timeStr },
        ...filtered,
      ].slice(0, 5);
      try {
        localStorage.setItem('famq_copy_history', JSON.stringify(updated));
      } catch (e) {
        // ignore
      }
      return updated;
    });

    setTimeout(() => {
      setCopied(false);
    }, 2500);
  };

  return (
    <div className="min-h-screen bg-[#08090d] text-slate-100 font-sans relative selection:bg-rose-500 selection:text-white overflow-x-hidden">
      {/* Ambient background glows for luxury dark theme */}
      <div className="pointer-events-none fixed top-0 left-1/4 w-96 h-96 bg-rose-600/10 rounded-full blur-[120px] -z-10" />
      <div className="pointer-events-none fixed bottom-10 right-10 w-96 h-96 bg-indigo-600/10 rounded-full blur-[140px] -z-10" />

      {/* Top Header */}
      <header className="border-b border-slate-800/80 bg-[#10131d]/95 backdrop-blur-md sticky top-0 z-50 shadow-2xl shadow-black/50">
        <div className="h-[2px] w-full bg-gradient-to-r from-rose-600 via-pink-500 to-rose-600" />
        <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <FamqNewsLogo className="transition-transform hover:scale-105" />
          </div>

          <div className="flex items-center gap-3">
            {/* Global Date Toggle */}
            {activeTab === 'dealers' || activeTab === 'drops' ? (
              <div className="hidden md:flex items-center gap-2 bg-[#0c0d14] px-3.5 py-1.5 rounded-xl border border-rose-500/30 text-xs shadow-inner">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-slate-400 font-medium">
                  Добавить дату: <span className="text-rose-400 font-bold bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">нельзя</span>
                </span>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2.5 bg-[#0c0d14] px-3.5 py-1.5 rounded-xl border border-slate-800/90 text-xs">
                <Calendar className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <AnimatedCheckbox
                  checked={includeDate}
                  onChange={(val) => setIncludeDate(val)}
                  label={<span className="text-slate-300 font-medium">Добавить дату (_||ДД.ММ||_)</span>}
                />
                {includeDate && (
                  <input
                    type="text"
                    value={customDate}
                    onChange={(e) => setCustomDate(e.target.value)}
                    className="w-16 bg-[#141722] border border-slate-700 text-center rounded-lg px-1.5 py-0.5 text-xs text-rose-300 font-mono focus:outline-none focus:border-rose-500"
                    placeholder="02.09"
                  />
                )}
              </div>
            )}

            <motion.button
              whileTap={{ scale: 0.95 }}
              animate={copied ? { scale: 1.03 } : { scale: 1 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              onClick={handleCopy}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-lg border cursor-pointer ${
                copied
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-emerald-600/30 border-emerald-400/40'
                  : 'bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white shadow-rose-600/25 border-rose-400/30'
              }`}
            >
              {copied ? <AnimatedCheckIcon className="w-4 h-4 text-emerald-100" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Скопировано!' : 'Копировать пост'}
            </motion.button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Top View Mode Switcher (Generator vs Assistant Release v1.8.0) */}
        <div className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#12141f] p-2 sm:p-2.5 rounded-2xl border border-slate-800 shadow-xl">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <motion.button
              type="button"
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 450, damping: 25 }}
              onClick={() => setMainViewMode('generator')}
              className={`btn-premium flex-1 sm:flex-none flex items-center justify-center gap-2.5 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                mainViewMode === 'generator'
                  ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-lg shadow-rose-600/30 ring-1 ring-rose-400/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Генератор постов</span>
            </motion.button>

            <motion.button
              type="button"
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 450, damping: 25 }}
              onClick={() => {
                setMainViewMode('assistant');
                if (!assistantInputText) {
                  setAssistantInputText(getActiveGeneratedText());
                }
              }}
              className={`btn-premium flex-1 sm:flex-none flex items-center justify-center gap-2.5 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all relative cursor-pointer ${
                mainViewMode === 'assistant'
                  ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-lg shadow-rose-600/30 ring-1 ring-rose-400/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Bot className="w-4 h-4 text-rose-400" />
              <span>Ассистент проверки</span>
              <span className="bg-amber-500/20 text-amber-300 text-[10px] font-mono px-1.5 py-0.5 rounded border border-amber-500/30 font-bold flex items-center gap-1 animate-pulse">
                ALPHA
              </span>
            </motion.button>
          </div>

          <div className="hidden md:flex items-center gap-3 text-xs text-slate-400 px-3">
            {mainViewMode === 'generator' ? (
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                Создавайте стилизованные посты для Famq News
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-amber-400 font-medium">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                Экспериментальный концепт (не использовать всерьёз)
              </span>
            )}
          </div>
        </div>

        {mainViewMode === 'assistant' ? (
          /* ASSISTANT INSPECTOR WORKSPACE */
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* ALPHA / UNFINISHED WARNING BANNER */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              className="bg-gradient-to-r from-amber-950/40 via-amber-900/30 to-rose-950/40 border border-amber-500/40 rounded-2xl p-4 sm:p-5 flex gap-4 items-start shadow-xl relative overflow-hidden"
            >
              <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 shrink-0 mt-0.5 animate-pulse">
                <TriangleAlert className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-bold text-amber-300 uppercase tracking-wider">
                    Экспериментальный прототип — Инспектор не готов к работе!
                  </h3>
                  <span className="bg-rose-500/20 text-rose-300 text-[10px] font-mono px-2 py-0.5 rounded border border-rose-500/30 font-bold">
                    PRE-ALPHA CONCEPT
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-amber-200/90 leading-relaxed font-normal">
                  Ассистент находится на стадии <strong>ранней разработки (Alpha)</strong> и еще не готов к полноценному использованию. Алгоритмы анализа и автофикса являются демонстрацией концепта. <strong>Не полагайтесь на результаты проверки</strong> для реальных публикаций — обязательно перепроверяйте посты вручную.
                </p>
              </div>
            </motion.div>

            {/* Assistant Header Banner */}
            <div className="bg-gradient-to-r from-[#141724] via-[#1a1d2e] to-[#141724] border border-rose-500/20 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="p-3.5 rounded-2xl bg-gradient-to-br from-rose-500/20 to-pink-500/10 border border-rose-500/30 text-rose-400 shadow-lg">
                    <Bot className="w-8 h-8" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                        Famq Assistant Inspector & Auto-Fix
                      </h1>
                      <span className="bg-emerald-500/20 text-emerald-300 text-xs font-mono px-2.5 py-0.5 rounded-md border border-emerald-500/40 font-bold flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                        АВТОМАШИННОЕ ОБУЧЕНИЕ
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
                      Умный инспектор публикаций. Автоматически переводит названия семей на латиницу с добавлением Famq (например: <code className="text-amber-300 font-mono">чикен</code> ➔ <code className="text-emerald-300 font-mono">Chicken Famq</code>). Алгоритмы автоматически самообучаются на ваших правках.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                  <motion.button
                    whileHover={{ scale: 1.04, y: -1 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 450, damping: 25 }}
                    onClick={() => {
                      const text = getActiveGeneratedText();
                      setOriginalInputTextForTraining(text);
                      setAssistantInputText(text);
                    }}
                    className="btn-premium flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 hover:text-white text-xs font-semibold transition-all cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    Загрузить из Генератора
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.04, y: -1 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 450, damping: 25 }}
                    onClick={() => {
                      const demoText = `<:3c82390ed0514e65810db243c5ad1832:1346294142732472521> _Семья **чикен** получает заморозку каптов на **7 дней** по жалобе - ||https://forum.majestic-rp.ru/threads/123456||_`;
                      setOriginalInputTextForTraining(demoText);
                      setAssistantInputText(demoText);
                    }}
                    className="btn-premium flex-1 md:flex-none flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-300 text-xs font-semibold transition-all cursor-pointer"
                  >
                    <Zap className="w-4 h-4 text-amber-400" />
                    Тест «чикен»
                  </motion.button>
                </div>
              </div>
            </div>

            {/* Notification Toast */}
            {saveSuccessMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 p-4 rounded-xl flex items-center justify-between text-xs font-bold"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>{saveSuccessMessage}</span>
                </div>
                <button type="button" onClick={() => setSaveSuccessMessage('')} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            )}

            {/* MAIN INSPECTOR VIEW */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Text Area & Auto Fix */}
              <div className="lg:col-span-7 space-y-4">
                <div className="bg-[#141722] rounded-2xl border border-slate-800 p-5 shadow-xl space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                    <div className="flex items-center gap-2">
                      <Edit3 className="w-4 h-4 text-rose-400" />
                      <h2 className="text-sm font-bold text-white uppercase tracking-wider">Текст для проверки</h2>
                    </div>
                    <div className="flex items-center gap-2">
                      {assistantInputText && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.92 }}
                          onClick={() => {
                            setAssistantInputText('');
                            setOriginalInputTextForTraining('');
                          }}
                          className="text-xs text-slate-400 hover:text-rose-400 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Очистить
                        </motion.button>
                      )}
                    </div>
                  </div>

                  <div className="relative">
                    <textarea
                      value={assistantInputText}
                      onChange={(e) => {
                        if (!originalInputTextForTraining && assistantInputText) {
                          setOriginalInputTextForTraining(assistantInputText);
                        }
                        setAssistantInputText(e.target.value);
                      }}
                      placeholder="Вставьте сюда текст поста или нажмите «Загрузить из Генератора»..."
                      rows={10}
                      className="w-full bg-[#0c0e15] border border-slate-800 focus:border-rose-500 rounded-xl p-4 text-xs sm:text-sm font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-rose-500/50 resize-y transition-all leading-relaxed"
                    />
                    <div className="mt-2.5 bg-slate-900/60 border border-slate-800/80 p-3 rounded-xl flex items-start gap-2.5 text-[11px] text-slate-300">
                      <GraduationCap className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>
                        <strong>Алгоритмы непрерывно обучаются:</strong> Каждые ваши правки текста и нажатие кнопки скопировать скрыто обучают локальный словарь и правила ассистента!
                      </span>
                    </div>
                  </div>

                  {/* Assistant Actions Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <motion.button
                      whileHover={{ scale: 1.03, y: -1 }}
                      whileTap={{ scale: 0.96 }}
                      transition={{ type: 'spring', stiffness: 450, damping: 25 }}
                      onClick={() => {
                        const beforeText = assistantInputText;
                        if (!originalInputTextForTraining) {
                          setOriginalInputTextForTraining(beforeText);
                        }
                        const fixed = autoFixPostText(beforeText, customDictMap);
                        setAssistantInputText(fixed);
                        setLastFixedDiff({ before: beforeText, after: fixed });
                        setAssistantViewSubTab('diff');
                        setSaveSuccessMessage('✨ Пост успешно исправлен! Посмотрите сравнение ДО и ПОСЛЕ ниже.');
                        setTimeout(() => setSaveSuccessMessage(''), 4000);
                      }}
                      disabled={!assistantInputText.trim()}
                      className="btn-premium flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50 cursor-pointer"
                    >
                      <Wand2 className="w-4 h-4" />
                      Быстрый Автофикс (1 клик)
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.03, y: -1 }}
                      whileTap={{ scale: 0.96 }}
                      transition={{ type: 'spring', stiffness: 450, damping: 25 }}
                      onClick={() => handleCopyAssistantResult(assistantInputText)}
                      disabled={!assistantInputText.trim()}
                      className="btn-premium flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-lg shadow-rose-600/20 disabled:opacity-50 cursor-pointer"
                    >
                      <Copy className="w-4 h-4" />
                      {copied ? 'Скопировано!' : 'Скопировать результат'}
                    </motion.button>
                  </div>
                </div>

                {/* Sub-Tab Navigation & Visualizer Box */}
                <div className="bg-[#141722] rounded-2xl border border-slate-800 p-5 shadow-xl space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
                    <div className="flex items-center gap-1.5 p-1 bg-[#0c0e15] rounded-xl border border-slate-800/80">
                      <button
                        type="button"
                        onClick={() => setAssistantViewSubTab('diff')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                          assistantViewSubTab === 'diff'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <Sliders className="w-3.5 h-3.5" />
                        <span>Сравнение ДО / ПОСЛЕ</span>
                        {lastFixedDiff && (
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setAssistantViewSubTab('errors')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                          assistantViewSubTab === 'errors'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                        <span>
                          Ошибки (
                          {auditResult?.issues.filter((i) => i.type === 'critical' || i.type === 'warning').length || 0})
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setAssistantViewSubTab('preview')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                          assistantViewSubTab === 'preview'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <Eye className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Discord Предпросмотр</span>
                      </button>
                    </div>

                    {lastFixedDiff && (
                      <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-emerald-400" /> Автофикс применен
                      </span>
                    )}
                  </div>

                  {/* Sub-Tab View 1: Before / After Diff */}
                  {assistantViewSubTab === 'diff' && (
                    <DiffHighlightView
                      beforeText={lastFixedDiff?.before || originalInputTextForTraining || assistantInputText}
                      afterText={assistantInputText}
                    />
                  )}

                  {/* Sub-Tab View 2: Errors List First */}
                  {assistantViewSubTab === 'errors' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                        <span>Обнаруженные ошибки и несоблюдения стандартов:</span>
                        <span className="text-[11px] text-slate-500 font-mono">Сначала критические</span>
                      </div>

                      {auditResult?.issues && auditResult.issues.length > 0 ? (
                        <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                          {[...auditResult.issues]
                            .sort((a, b) => {
                              const priority = { critical: 1, warning: 2, info: 3, success: 4 };
                              return (priority[a.type] || 5) - (priority[b.type] || 5);
                            })
                            .map((issue) => (
                              <div
                                key={issue.id}
                                className={`p-3 rounded-xl border text-xs space-y-1.5 transition-all ${
                                  issue.type === 'critical'
                                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-200'
                                    : issue.type === 'warning'
                                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                                    : issue.type === 'success'
                                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-200'
                                    : 'bg-slate-800/50 border-slate-700/80 text-slate-300'
                                }`}
                              >
                                <div className="flex items-center justify-between font-bold">
                                  <span className="flex items-center gap-1.5">
                                    {issue.type === 'critical' && <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0" />}
                                    {issue.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />}
                                    {issue.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                                    {issue.type === 'info' && <Lightbulb className="w-4 h-4 text-blue-400 shrink-0" />}
                                    <span>{issue.title}</span>
                                  </span>
                                  <span
                                    className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                                      issue.type === 'critical'
                                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                        : issue.type === 'warning'
                                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                    }`}
                                  >
                                    {issue.type === 'critical' ? 'Ошибка' : issue.type === 'warning' ? 'Замечание' : 'Норма'}
                                  </span>
                                </div>
                                <p className="text-[11px] opacity-90 leading-relaxed pl-5.5">{issue.description}</p>
                              </div>
                            ))}
                        </div>
                      ) : (
                        <div className="p-6 text-center text-emerald-400 text-xs font-bold bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                          ✨ В тексте не найдено критических ошибок или нарушений правил!
                        </div>
                      )}
                    </div>
                  )}

                  {/* Sub-Tab View 3: Discord Markdown Preview */}
                  {assistantViewSubTab === 'preview' && (
                    <div className="bg-[#313338] rounded-xl p-4 border border-[#2b2d31] text-slate-200 font-sans text-xs sm:text-sm leading-relaxed whitespace-pre-wrap min-h-[120px] shadow-inner break-words overflow-hidden">
                      {assistantInputText.trim() ? (
                        <DiscordMarkdown content={assistantInputText} />
                      ) : (
                        <span className="text-slate-500 italic">Здесь будет отображен готовый текст...</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

                {/* Right Column: Audit Results & Metrics */}
                <div className="lg:col-span-5 space-y-4">
                  {(() => {
                    if (isAuditing || !auditResult) {
                      return (
                        <div className="bg-[#141722] rounded-2xl border border-slate-800 p-6 shadow-xl flex flex-col items-center justify-center min-h-[340px] space-y-6">
                          {isAuditing ? (
                            <div className="flex flex-col items-center gap-5 text-center max-w-sm">
                              <div className="relative">
                                <div className="w-16 h-16 border-4 border-slate-700/60 border-t-rose-500 border-r-teal-500 rounded-full animate-spin"></div>
                                <Brain className="w-7 h-7 text-rose-400 absolute inset-0 m-auto animate-pulse" />
                              </div>
                              <div className="space-y-1">
                                <div className="text-xs font-bold text-rose-400 uppercase tracking-widest flex items-center justify-center gap-1.5">
                                  <Sparkles className="w-3.5 h-3.5" />
                                  <span>Фаза {auditPhase} из 4</span>
                                </div>
                                <div className="text-sm font-bold text-white leading-tight">
                                  {auditPhase === 1 && '1. Сканирование структуры текста и синтаксиса Discord...'}
                                  {auditPhase === 2 && '2. Умный поиск совпадения среди 21 категорий Famq News...'}
                                  {auditPhase === 3 && '3. Сверка обязательных полей и правил категории...'}
                                  {auditPhase === 4 && '4. Поиск ошибок и подготовка 1-click Автофикса...'}
                                </div>
                                <p className="text-[11px] text-slate-400">
                                  {auditPhase === 1 && 'Проверка парности тегов, кастомных эмодзи и ссылок...'}
                                  {auditPhase === 2 && 'Сопоставление ключевых словарей и фразовых патернов...'}
                                  {auditPhase === 3 && 'Проверка структуры заголовка, фракций и подписи...'}
                                  {auditPhase === 4 && 'Финализация результатов и расчет точности...'}
                                </p>
                              </div>
                              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
                                <motion.div
                                  initial={{ width: '0%' }}
                                  animate={{ width: `${(auditPhase / 4) * 100}%` }}
                                  transition={{ ease: 'easeOut', duration: 0.3 }}
                                  className="h-full bg-gradient-to-r from-rose-500 via-teal-400 to-emerald-400 rounded-full"
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="text-center space-y-3 p-4">
                              <div className="w-16 h-16 bg-slate-800/60 border border-slate-700/50 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                                <Brain className="w-8 h-8 text-rose-400 opacity-80" />
                              </div>
                              <h3 className="text-sm font-bold text-slate-200">Умный аудитор Famq News</h3>
                              <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                                Начните вводить или вставьте текст поста. Алгоритм автоматически определит категорию и проверит формат.
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    }

                    const currentScore = auditResult?.score || 100;
                    const isExcellent = currentScore >= 90;
                    const isWarning = currentScore >= 70 && currentScore < 90;

                    return (
                      <div className="bg-[#141722] rounded-2xl border border-slate-800 p-5 shadow-xl space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                          <div className="flex items-center gap-2">
                            <BarChart3 className="w-4 h-4 text-rose-400" />
                            <h2 className="text-xs font-bold text-white uppercase tracking-wider">Результат анализа</h2>
                          </div>
                          {auditResult && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs px-2.5 py-1 rounded-lg font-bold bg-slate-800 text-slate-200 border border-slate-700 flex items-center gap-1.5 shadow-sm">
                                <span>{auditResult.categoryIcon}</span>
                                <span>{auditResult.categoryLabel}</span>
                              </span>
                              {auditResult.matchConfidence && (
                                <span className="text-[10px] px-2 py-1 rounded-lg font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                                  {auditResult.matchConfidence}%
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Score gauge & status */}
                        <div className="flex items-center justify-between gap-4 bg-[#0d0e15] p-4 rounded-xl border border-slate-800">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-lg border ${
                                isExcellent
                                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                  : isWarning
                                  ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                                  : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                              }`}
                            >
                              {currentScore}
                            </div>
                            <div>
                              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Оценка поста</div>
                              <div className="text-sm font-bold text-white mt-0.5">
                                {isExcellent ? '🟢 Отличный пост' : isWarning ? '🟡 Требует внимания' : '🔴 Найдены ошибки'}
                              </div>
                            </div>
                          </div>

                          {auditResult && (
                            <div className="text-right font-mono text-xs text-slate-400 space-y-0.5">
                              <div>Символов: <span className={auditResult.stats.length > 2000 ? 'text-rose-400 font-bold' : 'text-slate-200'}>{auditResult.stats.length}</span>/2000</div>
                              <div>Слов: <span className="text-slate-200">{auditResult.stats.words}</span></div>
                              <div>Эмодзи: <span className="text-slate-200">{auditResult.stats.emojisCount}</span></div>
                            </div>
                          )}
                        </div>

                        {/* Category Required Fields Checklist */}
                        {auditResult?.requiredFields && auditResult.requiredFields.length > 0 && (
                          <div className="bg-[#0d0e15]/70 p-3.5 rounded-xl border border-slate-800/80 space-y-2">
                            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <FileCheck className="w-3.5 h-3.5 text-teal-400" />
                                <span>Чек-лист полей категории &quot;{auditResult.categoryLabel}&quot;</span>
                              </div>
                            </div>
                            <div className="space-y-1.5 pt-0.5">
                              {auditResult.requiredFields.map((field, idx) => (
                                <div key={idx} className="flex items-center justify-between text-xs">
                                  <span className="text-slate-300 font-medium">{field.label}</span>
                                  {field.present ? (
                                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-bold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                                      <CheckCircle2 className="w-3 h-3" />Есть
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-[11px] text-rose-400 font-bold px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20">
                                      <AlertCircle className="w-3 h-3" />Не хватает
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>

                            {auditResult.matchedKeywords && auditResult.matchedKeywords.length > 0 && (
                              <div className="pt-2 border-t border-slate-800/60 flex items-center gap-1.5 flex-wrap">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Найденные триггеры:</span>
                                {auditResult.matchedKeywords.map((kw, i) => (
                                  <span key={i} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-300 border border-teal-500/20">
                                    &quot;{kw}&quot;
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Issues List Sorted by Priority */}
                        <div className="space-y-2.5 pt-1">
                          <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                            <span>Замечания ({auditResult?.issues.length || 0})</span>
                            <span className="text-[10px] text-slate-500 font-mono">Сначала критические</span>
                          </div>

                          <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                            {[...(auditResult?.issues || [])]
                              .sort((a, b) => {
                                const priority = { critical: 1, warning: 2, info: 3, success: 4 };
                                return (priority[a.type] || 5) - (priority[b.type] || 5);
                              })
                              .map((issue) => (
                                <div
                                  key={issue.id}
                                  className={`p-3 rounded-xl border text-xs space-y-1 transition-all ${
                                    issue.type === 'critical'
                                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-200'
                                      : issue.type === 'warning'
                                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                                      : issue.type === 'success'
                                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-200'
                                      : 'bg-slate-800/50 border-slate-700/80 text-slate-300'
                                  }`}
                                >
                                  <div className="flex items-center justify-between font-bold">
                                    <span className="flex items-center gap-1.5">
                                      {issue.type === 'critical' && <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0" />}
                                      {issue.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />}
                                      {issue.type === 'success' && <AnimatedCheckIcon className="w-4 h-4 text-emerald-400 shrink-0" />}
                                      {issue.type === 'info' && <Lightbulb className="w-4 h-4 text-blue-400 shrink-0" />}
                                      <span>{issue.title}</span>
                                    </span>
                                    <span
                                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                                        issue.type === 'critical'
                                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                          : issue.type === 'warning'
                                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                      }`}
                                    >
                                      {issue.type === 'critical' ? 'Ошибка' : issue.type === 'warning' ? 'Замечание' : 'Норма'}
                                    </span>
                                  </div>
                                  <p className="text-[11px] opacity-90 leading-relaxed pl-5.5">
                                    {issue.description}
                                  </p>
                                </div>
                              ))}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
          </div>
        ) : (
          /* STANDARD GENERATOR VIEW */
          <>
            {/* Mobile Navigation Bar */}
            <div className="lg:hidden mb-5 bg-[#141722] p-3.5 rounded-2xl border border-slate-800 space-y-2.5 shadow-lg">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300 uppercase tracking-wider px-1">
                <span>Категория:</span>
                <span className="text-rose-400 font-bold">{CATEGORIES.find((c) => c.id === activeTab)?.label}</span>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {CATEGORIES.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <motion.button
                      key={tab.id}
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ type: 'spring', stiffness: 450, damping: 25 }}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`btn-premium flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                        isActive
                          ? 'bg-rose-600/30 text-rose-200 border border-rose-500/50 shadow-sm font-semibold'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {tab.label}
                      {tab.badge && (
                        <span className="text-[10px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                          {tab.badge}
                        </span>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>

        {/* 3-Column Grid Layout: Sidebar Categories | Form Controls | Discord Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Sidebar: Vertical Category Navigation */}
          <div className="hidden lg:block lg:col-span-3 sticky top-20">
            <div className="bg-[#141722] rounded-2xl border border-slate-800 p-4 shadow-xl space-y-3 max-h-[calc(100vh-6rem)] flex flex-col relative overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-800/90 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  <h2 className="text-xs font-bold text-white tracking-wider uppercase">Категории постов</h2>
                </div>
                <span className="text-[11px] font-bold bg-rose-500/15 text-rose-300 px-2 py-0.5 rounded-full border border-rose-500/25">
                  {CATEGORIES.length}
                </span>
              </div>

              {/* Quick Search */}
              <div className="relative shrink-0">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={categorySearch}
                  onChange={(e) => setCategorySearch(e.target.value)}
                  placeholder="Быстрый поиск..."
                  className="w-full bg-[#0d0e14] border border-slate-800 rounded-xl pl-9 pr-7 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition-colors"
                />
                {categorySearch && (
                  <button
                    onClick={() => setCategorySearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-white"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Vertical List of Categories with Dark Scrollbar & Bottom Gradient Fade */}
              <div className="relative flex-1 min-h-0 flex flex-col overflow-hidden">
                <div className="overflow-y-auto space-y-1 pr-1.5 custom-scrollbar flex-1 pb-8">
                  {CATEGORIES.filter((tab) => {
                    const search = categorySearch.toLowerCase().trim();
                    if (!search) return true;
                    if (fuzzyIncludes(tab.label.toLowerCase(), search)) return true;
                    if (tab.keywords?.some((k) => fuzzyIncludes(k.toLowerCase(), search))) return true;
                    return false;
                  }).map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <motion.button
                        key={tab.id}
                        whileHover={{ scale: 1.02, x: 2 }}
                        whileTap={{ scale: 0.97 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 28 }}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all text-left group cursor-pointer ${
                          isActive
                            ? 'bg-gradient-to-r from-rose-600/30 to-pink-600/20 text-rose-200 border border-rose-500/50 shadow-md shadow-rose-950/30 font-semibold ring-1 ring-rose-500/30'
                            : 'text-slate-300 hover:text-white hover:bg-slate-800/60 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon
                            className={`w-3.5 h-3.5 shrink-0 transition-all duration-200 ${
                              isActive ? 'text-rose-400 scale-110' : 'text-slate-400 group-hover:text-rose-400 group-hover:scale-105'
                            }`}
                          />
                          <span className="truncate">{tab.label}</span>
                        </div>
                        {tab.badge && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0 font-mono">
                            {tab.badge}
                          </span>
                        )}
                      </motion.button>
                    );
                  })}
                  {CATEGORIES.filter((tab) => {
                    const search = categorySearch.toLowerCase().trim();
                    if (!search) return true;
                    if (fuzzyIncludes(tab.label.toLowerCase(), search)) return true;
                    if (tab.keywords?.some((k) => fuzzyIncludes(k.toLowerCase(), search))) return true;
                    return false;
                  }).length === 0 && (
                    <div className="text-center py-6 text-xs text-slate-500">
                      Категории не найдены
                    </div>
                  )}
                </div>

                {/* Dark Gradient Overlay at the bottom to indicate scrollability (ending before scrollbar) */}
                <div className="pointer-events-none absolute bottom-0 left-0 right-3 h-10 bg-gradient-to-t from-[#141722] via-[#141722]/85 to-transparent rounded-b-xl" />
              </div>
            </div>
          </div>

          {/* Center Column: Dynamic Form Controls */}
          <div className="lg:col-span-5 space-y-6">
            {/* Smart Algorithm Notification Banner */}
            <SmartAlgorithmNoticeBanner />

            {/* 1. SUPPLIES TAB */}
            {activeTab === 'supplies' && (
              <div className="bg-[#141722] rounded-2xl p-5 border border-slate-800 space-y-5">
                <div>
                  <h2 className="text-base font-semibold text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-rose-400" />
                    Запись о перекрытой поставке / крафте или отбитом нападении
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Автоматическая грамматика окончаний: ГОС — всегда «убилИ/отбилИ», Крайм соло — «убилА/перекрылА», Крайм союз — «убилИ/перекрылИ».
                  </p>
                </div>

                {/* Section 1: Action Type */}
                <div className="space-y-3">
                  <label className="text-xs font-medium text-slate-300 uppercase tracking-wider">Что произошло</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setSuppliesState((s) => ({ ...s, typeAction: 'Перекрыли' }))}
                      className={`py-2.5 px-4 rounded-xl text-sm font-semibold transition-all border ${
                        suppliesState.typeAction === 'Перекрыли'
                          ? 'bg-rose-600 border-rose-500 text-white shadow-lg shadow-rose-950/40'
                          : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-white'
                      }`}
                    >
                      Перекрыли
                    </button>
                    <button
                      onClick={() => setSuppliesState((s) => ({ ...s, typeAction: 'Отбили' }))}
                      className={`py-2.5 px-4 rounded-xl text-sm font-semibold transition-all border ${
                        suppliesState.typeAction === 'Отбили'
                          ? 'bg-rose-600 border-rose-500 text-white shadow-lg shadow-rose-950/40'
                          : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-white'
                      }`}
                    >
                      Отбили
                    </button>
                  </div>
                </div>

                {/* Section 2: Target Type */}
                <div className="space-y-3">
                  <label className="text-xs font-medium text-slate-300 uppercase tracking-wider">Что именно</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setSuppliesState((s) => ({ ...s, typeTarget: 'Поставка' }))}
                      className={`py-2.5 px-4 rounded-xl text-sm font-semibold transition-all border ${
                        suppliesState.typeTarget === 'Поставка'
                          ? 'bg-rose-600 border-rose-500 text-white shadow-lg shadow-rose-950/40'
                          : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-white'
                      }`}
                    >
                      Поставка
                    </button>
                    <button
                      onClick={() => setSuppliesState((s) => ({ ...s, typeTarget: 'Крафт' }))}
                      className={`py-2.5 px-4 rounded-xl text-sm font-semibold transition-all border ${
                        suppliesState.typeTarget === 'Крафт'
                          ? 'bg-rose-600 border-rose-500 text-white shadow-lg shadow-rose-950/40'
                          : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-white'
                      }`}
                    >
                      Крафт
                    </button>
                  </div>
                </div>

                {/* Section 3: Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Кто перекрыл / отбил</label>
                    <SmartInput
                      value={suppliesState.whoIntercepted}
                      onChange={(val) => setSuppliesState((s) => ({ ...s, whoIntercepted: val }))}
                      allowedType={suppliesState.typeAction === 'Перекрыли' ? 'crime_only' : 'all'}
                      className="w-full bg-[#0d0e14] border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
                      placeholder="Marabunta Grande, The Ballas Gang..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Совместно с <span className="text-slate-500">(если вдвоём)</span>
                    </label>
                    <SmartInput
                      value={suppliesState.jointWith}
                      onChange={(val) => setSuppliesState((s) => ({ ...s, jointWith: val }))}
                      allowedType={suppliesState.typeAction === 'Перекрыли' ? 'crime_only' : 'all'}
                      className="w-full bg-[#0d0e14] border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
                      placeholder="The Families, Bloods..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Чью поставку / крафт / от кого</label>
                    <SmartInput
                      value={suppliesState.whoseDelivery}
                      onChange={(val) => setSuppliesState((s) => ({ ...s, whoseDelivery: val }))}
                      className="w-full bg-[#0d0e14] border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
                      placeholder="Marabunta Grande, GOV..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      {suppliesState.typeAction === 'Перекрыли'
                        ? 'Что перекрыли / материалы (обязательно)'
                        : 'Материалы (необязательно)'}
                    </label>
                    <SmartInput
                      value={suppliesState.whatIntercepted}
                      onChange={(val) => setSuppliesState((s) => ({ ...s, whatIntercepted: val }))}
                      className="w-full bg-[#0d0e14] border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
                      placeholder="60.000 бинтов и 2.000 аптечек..."
                    />
                  </div>
                </div>

                {/* Additional Casualty detail */}
                <div className="pt-2 border-t border-slate-800/80 space-y-3">
                  <AnimatedCheckbox
                    checked={suppliesState.hadKills}
                    onChange={(val) => setSuppliesState((s) => ({ ...s, hadKills: val }))}
                    label="Были дополнительно убиты семьи/фракции"
                  />

                  {suppliesState.hadKills && (
                    <div className="pl-7 space-y-2">
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Кого ещё убили в процессе (семьи / фракции):
                      </label>
                      <CasualtiesListInput
                        value={suppliesState.killsDetailText}
                        onChange={(val) => setSuppliesState((s) => ({ ...s, killsDetailText: val }))}
                        autoFamqSuffix={suppliesState.autoFamqSuffix}
                        placeholder="Например: Lalok, FIB или The Families"
                      />
                    </div>
                  )}

                  <div>
                    <AnimatedCheckbox
                      checked={suppliesState.autoFamqSuffix}
                      onChange={(val) => setSuppliesState((s) => ({ ...s, autoFamqSuffix: val }))}
                      label="Автоподстановка «Famq» для односложных названий"
                    />
                  </div>

                  <div>
                    <AnimatedCheckbox
                      checked={suppliesState.hidePreviewCard}
                      onChange={(val) => setSuppliesState((s) => ({ ...s, hidePreviewCard: val }))}
                      label="Ссылка в скобках <http...> — без карточки превью в Discord"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* BANK TAB */}
            {activeTab === 'bank' && (
              <div className="bg-[#141722] rounded-2xl p-5 border border-slate-800 space-y-5">
                <div>
                  <h2 className="text-base font-semibold text-white flex items-center gap-2">
                    <Building className="w-5 h-5 text-rose-400" />
                    Форматирование новостей БАНК
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Записи об успешных ограблениях или отбитиях банков с эмодзи и дополнительными убитыми фракциями.
                  </p>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-medium text-slate-300 uppercase tracking-wider">Тип события</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'robbery', label: 'Ограбление' },
                      { id: 'joint_robbery', label: 'Совместное огр.' },
                      { id: 'repelled', label: 'Отбитие' },
                    ].map((typeItem) => (
                      <button
                        key={typeItem.id}
                        onClick={() => setBankState((s) => ({ ...s, type: typeItem.id as any }))}
                        className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all border ${
                          bankState.type === typeItem.id
                            ? 'bg-rose-600 border-rose-500 text-white shadow-md'
                            : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-white'
                        }`}
                      >
                        {typeItem.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Номер банка</label>
                    <input
                      type="text"
                      value={bankState.bankNumber}
                      onChange={(e) => setBankState((s) => ({ ...s, bankNumber: e.target.value }))}
                      className="w-full bg-[#0d0e14] border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
                      placeholder="БАНК #9"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      {bankState.type === 'repelled' ? 'Кто отбивал' : 'Кто грабил'}
                    </label>
                    <input
                      type="text"
                      value={bankState.who}
                      onChange={(e) => setBankState((s) => ({ ...s, who: e.target.value }))}
                      className="w-full bg-[#0d0e14] border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
                      placeholder=""
                    />
                  </div>

                  {(bankState.type === 'joint_robbery' || bankState.type === 'repelled') && (
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">Совместно с</label>
                      <input
                        type="text"
                        value={bankState.jointWith}
                        onChange={(e) => setBankState((s) => ({ ...s, jointWith: e.target.value }))}
                        className="w-full bg-[#0d0e14] border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
                        placeholder=""
                      />
                    </div>
                  )}

                  {bankState.type === 'repelled' && (
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">От кого (грабители)</label>
                      <input
                        type="text"
                        value={bankState.targetFamq}
                        onChange={(e) => setBankState((s) => ({ ...s, targetFamq: e.target.value }))}
                        className="w-full bg-[#0d0e14] border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
                        placeholder=""
                      />
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-800 space-y-3">
                  <AnimatedCheckbox
                    checked={bankState.hadKills}
                    onChange={(val) => setBankState((s) => ({ ...s, hadKills: val }))}
                    label="Убийство силовиков/третьей стороны"
                  />

                  {bankState.hadKills && (
                    <div className="space-y-2">
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Кого ещё убили в процессе (семьи / фракции):
                      </label>
                      <CasualtiesListInput
                        value={bankState.killsText}
                        onChange={(val) => setBankState((s) => ({ ...s, killsText: val }))}
                        autoFamqSuffix={false}
                        placeholder="Например: FIB, LSPD или Lalok"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TIER / RATING TAB */}
            {activeTab === 'tier' && (
              <div className="bg-[#141722] rounded-2xl p-5 border border-slate-800 space-y-5">
                <div>
                  <h2 className="text-base font-semibold text-white flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-400" />
                    Тир-Рейтинг и Система Баллов
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Анонсы еженедельных рейтингов, тир-листов и регламент начисления баллов.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 pb-2 border-b border-slate-800">
                  {[
                    { id: 'weekly', label: 'Еженедельный рейтинг' },
                    { id: 'tier_list', label: 'Тир семей и фракций' },
                    { id: 'period', label: 'Период рейтинга' },
                    { id: 'points_rules', label: 'Система начисления баллов' },
                  ].map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => setTierSubTab(sub.id as any)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        tierSubTab === sub.id
                          ? 'bg-rose-600 text-white shadow-sm'
                          : 'bg-slate-800/80 text-slate-400 hover:text-white'
                      }`}
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>

                {tierSubTab !== 'points_rules' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">Приветствие</label>
                      <select
                        value={tierState.timeGreeting}
                        onChange={(e) => setTierState((s) => ({ ...s, timeGreeting: e.target.value as any }))}
                        className="w-full bg-[#0d0e14] border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
                      >
                        <option value="Добрый день">Добрый день</option>
                        <option value="Добрый вечер">Добрый вечер</option>
                        <option value="Доброе утро">Доброе утро</option>
                        <option value="Доброй ночи">Доброй ночи</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">Дата начала</label>
                      <input
                        type="text"
                        value={tierState.startDate}
                        onChange={(e) => setTierState((s) => ({ ...s, startDate: e.target.value }))}
                        className="w-full bg-[#0d0e14] border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
                        placeholder="25.08.26"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">Дата окончания</label>
                      <input
                        type="text"
                        value={tierState.endDate}
                        onChange={(e) => setTierState((s) => ({ ...s, endDate: e.target.value }))}
                        className="w-full bg-[#0d0e14] border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
                        placeholder="01.09.26"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* MANSIONS TAB */}
            {activeTab === 'mansions' && (
              <div className="bg-[#141722] rounded-2xl p-5 border border-slate-800 space-y-5">
                <div>
                  <h2 className="text-base font-semibold text-white flex items-center gap-2">
                    <Home className="w-5 h-5 text-emerald-400" />
                    Особняки и Владельцы (8 мафий)
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Управление списком владельцев особняков и кликабельными ссылками на Discord семей.
                  </p>
                </div>

                <div className="space-y-3">
                  {mansionsList.map((mansion, idx) => (
                    <div key={mansion.name} className="p-3 bg-[#0d0e14] border border-slate-800 rounded-xl space-y-2">
                      <span className="text-xs font-bold text-rose-400">{mansion.name}</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={mansion.owner}
                          onChange={(e) => {
                            const val = e.target.value;
                            setMansionsList((prev) => {
                              const next = [...prev];
                              next[idx].owner = val;
                              return next;
                            });
                          }}
                          placeholder="Discord-ник овнера"
                          className="bg-[#141722] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-rose-500"
                        />
                        <input
                          type="text"
                          value={mansion.link}
                          onChange={(e) => {
                            const val = e.target.value;
                            setMansionsList((prev) => {
                              const next = [...prev];
                              next[idx].link = val;
                              return next;
                            });
                          }}
                          placeholder="https://discord.gg/famq"
                          className="bg-[#141722] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-rose-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ARROWS TAB */}
            {activeTab === 'arrows' && (
              <div className="bg-[#141722] rounded-2xl p-5 border border-slate-800 space-y-5">
                <div>
                  <h2 className="text-base font-semibold text-white flex items-center gap-2">
                    <Crosshair className="w-5 h-5 text-indigo-400" />
                    Family Arrows (Стрелы)
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Итоги турнира семейных стрел с подробными результатами матчей.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Победитель мероприятия</label>
                    <input
                      type="text"
                      value={arrowsState.winnerFamq}
                      onChange={(e) => setArrowsState((s) => ({ ...s, winnerFamq: e.target.value }))}
                      className="w-full bg-[#0d0e14] border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
                      placeholder=""
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Комментарий состава</label>
                    <input
                      type="text"
                      value={arrowsState.squadComment}
                      onChange={(e) => setArrowsState((s) => ({ ...s, squadComment: e.target.value }))}
                      className="w-full bg-[#0d0e14] border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
                      placeholder="123"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-slate-300 uppercase tracking-wider">Матчи</label>
                    <button
                      onClick={addArrowMatch}
                      className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300"
                    >
                      <Plus className="w-3.5 h-3.5" /> Добавить матч
                    </button>
                  </div>

                  {arrowsState.matches.map((match, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-[#0d0e14] p-2.5 rounded-xl border border-slate-800">
                      <input
                        type="text"
                        value={match.team1}
                        onChange={(e) => updateArrowMatch(idx, 'team1', e.target.value)}
                        className="w-1/3 bg-[#141722] border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
                        placeholder="Команда 1"
                      />
                      <span className="text-xs text-slate-500 font-bold">VS</span>
                      <input
                        type="text"
                        value={match.team2}
                        onChange={(e) => updateArrowMatch(idx, 'team2', e.target.value)}
                        className="w-1/3 bg-[#141722] border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
                        placeholder="Команда 2"
                      />
                      <input
                        type="text"
                        value={match.winner}
                        onChange={(e) => updateArrowMatch(idx, 'winner', e.target.value)}
                        className="w-1/3 bg-[#141722] border border-slate-700 rounded-lg px-2 py-1 text-xs text-emerald-400 font-bold"
                        placeholder="Победитель"
                      />
                      <button
                        onClick={() => removeArrowMatch(idx)}
                        className="p-1 text-slate-500 hover:text-rose-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ISLAND / FZ TAB */}
            {activeTab === 'islandFz' && (
              <div className="bg-[#141722] rounded-2xl p-5 border border-slate-800 space-y-5">
                <div>
                  <h2 className="text-base font-semibold text-white flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-yellow-400" />
                    Остров Кайо-Перико и Форт-Занкудо
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Форматирование нападений и отбитий на Остров и ФЗ.
                  </p>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-medium text-slate-300 uppercase tracking-wider">Тип события</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'cayo_attack', label: 'Нападение Остров' },
                      { id: 'cayo_repelled', label: 'Отбитие Остров' },
                      { id: 'fz_attack', label: 'Нападение ФЗ' },
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setIslandFzState((s) => ({ ...s, type: item.id as any }))}
                        className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all border ${
                          islandFzState.type === item.id
                            ? 'bg-rose-600 border-rose-500 text-white shadow-md'
                            : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-white'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {islandFzState.type !== 'cayo_repelled' ? (
                    <>
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1.5">Кто нападал</label>
                        <input
                          type="text"
                          value={islandFzState.who}
                          onChange={(e) => setIslandFzState((s) => ({ ...s, who: e.target.value }))}
                          className="w-full bg-[#0d0e14] border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
                          placeholder="The Bloods Gang"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1.5">Вывезенные материалы</label>
                        <input
                          type="text"
                          value={islandFzState.lootedMaterials}
                          onChange={(e) => setIslandFzState((s) => ({ ...s, lootedMaterials: e.target.value }))}
                          className="w-full bg-[#0d0e14] border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
                          placeholder="12.000 оружейных материалов"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1.5">Кто отбил (ГОС)</label>
                        <input
                          type="text"
                          value={islandFzState.targetGos}
                          onChange={(e) => setIslandFzState((s) => ({ ...s, targetGos: e.target.value }))}
                          className="w-full bg-[#0d0e14] border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
                          placeholder="SANG"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1.5">Совместно с</label>
                        <input
                          type="text"
                          value={islandFzState.jointGos}
                          onChange={(e) => setIslandFzState((s) => ({ ...s, jointGos: e.target.value }))}
                          className="w-full bg-[#0d0e14] border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
                          placeholder="LSCSD"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1.5">От кого (нападавшие)</label>
                        <input
                          type="text"
                          value={islandFzState.defenderFamq}
                          onChange={(e) => setIslandFzState((s) => ({ ...s, defenderFamq: e.target.value }))}
                          className="w-full bg-[#0d0e14] border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
                          placeholder=""
                        />
                      </div>
                    </>
                  )}
                </div>

                {islandFzState.type !== 'cayo_repelled' && (
                  <div className="pt-2 border-t border-slate-800 space-y-3">
                    <AnimatedCheckbox
                      checked={islandFzState.hadKills}
                      onChange={(val) => setIslandFzState((s) => ({ ...s, hadKills: val }))}
                      label="Также убили другие семьи"
                    />

                    {islandFzState.hadKills && (
                      <div className="space-y-2">
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          Кого еще убили в процессе (семьи / фракции):
                        </label>
                        <CasualtiesListInput
                          value={islandFzState.killedFamqs}
                          onChange={(val) => setIslandFzState((s) => ({ ...s, killedFamqs: val }))}
                          autoFamqSuffix={true}
                          placeholder="Например: Konchal, Naperdel или SANG"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* TERAKT & RAID TAB */}
            {activeTab === 'teraktRaid' && (
              <div className="bg-[#141722] rounded-2xl p-5 border border-slate-800 space-y-5">
                <div>
                  <h2 className="text-base font-semibold text-white flex items-center gap-2">
                    <Bomb className="w-5 h-5 text-rose-500" />
                    Теракты и Рейды
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Проведение и отбитие терактов и рейдов.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setTeraktRaidState((s) => ({ ...s, category: 'terakt' }))}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border ${
                      teraktRaidState.category === 'terakt'
                        ? 'bg-rose-600 border-rose-500 text-white'
                        : 'bg-slate-800/60 border-slate-700/60 text-slate-400'
                    }`}
                  >
                    Теракт
                  </button>
                  <button
                    onClick={() => setTeraktRaidState((s) => ({ ...s, category: 'raid' }))}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border ${
                      teraktRaidState.category === 'raid'
                        ? 'bg-rose-600 border-rose-500 text-white'
                        : 'bg-slate-800/60 border-slate-700/60 text-slate-400'
                    }`}
                  >
                    Рейд
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setTeraktRaidState((s) => ({ ...s, actionType: teraktRaidState.category === 'terakt' ? 'conducted' : 'repelled' }))}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border ${
                      (teraktRaidState.category === 'terakt' && teraktRaidState.actionType === 'conducted') ||
                      (teraktRaidState.category === 'raid' && teraktRaidState.actionType === 'repelled')
                        ? 'bg-rose-600 border-rose-500 text-white'
                        : 'bg-slate-800/60 border-slate-700/60 text-slate-400'
                    }`}
                  >
                    {teraktRaidState.category === 'terakt' ? 'Провели теракт' : 'Отбили рейд'}
                  </button>
                  <button
                    onClick={() => setTeraktRaidState((s) => ({ ...s, actionType: teraktRaidState.category === 'terakt' ? 'repelled' : 'conducted' }))}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border ${
                      (teraktRaidState.category === 'terakt' && teraktRaidState.actionType === 'repelled') ||
                      (teraktRaidState.category === 'raid' && teraktRaidState.actionType === 'conducted')
                        ? 'bg-rose-600 border-rose-500 text-white'
                        : 'bg-slate-800/60 border-slate-700/60 text-slate-400'
                    }`}
                  >
                    {teraktRaidState.category === 'terakt' ? 'Отбили теракт' : 'Провели рейд'}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Кто организовывал / отбивал</label>
                    <input
                      type="text"
                      value={teraktRaidState.who}
                      onChange={(e) => setTeraktRaidState((s) => ({ ...s, who: e.target.value }))}
                      className="w-full bg-[#0d0e14] border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
                      placeholder="The Families или FIB"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Совместно с (если вдвоем)</label>
                    <input
                      type="text"
                      value={teraktRaidState.jointWith}
                      onChange={(e) => setTeraktRaidState((s) => ({ ...s, jointWith: e.target.value }))}
                      className="w-full bg-[#0d0e14] border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
                      placeholder="SANG, LSPD"
                    />
                  </div>

                  {teraktRaidState.category === 'terakt' && teraktRaidState.actionType === 'conducted' && (
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">На кого (цель)</label>
                      <input
                        type="text"
                        value={teraktRaidState.target}
                        onChange={(e) => setTeraktRaidState((s) => ({ ...s, target: e.target.value }))}
                        className="w-full bg-[#0d0e14] border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
                        placeholder="LSPD"
                      />
                    </div>
                  )}

                  {((teraktRaidState.category === 'terakt' && teraktRaidState.actionType === 'repelled') ||
                    teraktRaidState.category === 'raid') && (
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">От кого / На кого</label>
                      <input
                        type="text"
                        value={teraktRaidState.fromWho}
                        onChange={(e) => setTeraktRaidState((s) => ({ ...s, fromWho: e.target.value }))}
                        className="w-full bg-[#0d0e14] border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
                        placeholder="The Bloods Gang или FIB"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* PUBG / WARZONE TAB */}
            {activeTab === 'pubgWarzone' && (
              <div className="bg-[#141722] rounded-2xl p-5 border border-slate-800 space-y-5">
                <div>
                  <h2 className="text-base font-semibold text-white flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-amber-400" />
                    Турниры PUBG 2x2 и Warzone 2x2
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Результаты турниров и комментарии команд.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setPubgWarzoneState((s) => ({ ...s, gameMode: 'pubg' }))}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border ${
                      pubgWarzoneState.gameMode === 'pubg'
                        ? 'bg-rose-600 border-rose-500 text-white'
                        : 'bg-slate-800/60 border-slate-700/60 text-slate-400'
                    }`}
                  >
                    PUBG 2x2
                  </button>
                  <button
                    onClick={() => setPubgWarzoneState((s) => ({ ...s, gameMode: 'warzone' }))}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border ${
                      pubgWarzoneState.gameMode === 'warzone'
                        ? 'bg-rose-600 border-rose-500 text-white'
                        : 'bg-slate-800/60 border-slate-700/60 text-slate-400'
                    }`}
                  >
                    Warzone 2x2
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Победитель (команда)</label>
                    <input
                      type="text"
                      value={pubgWarzoneState.winnerTeam}
                      onChange={(e) => setPubgWarzoneState((s) => ({ ...s, winnerTeam: e.target.value }))}
                      className="w-full bg-[#0d0e14] border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
                      placeholder="tuler или ketamine"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Комментарий состава</label>
                    <input
                      type="text"
                      value={pubgWarzoneState.squadComment}
                      onChange={(e) => setPubgWarzoneState((s) => ({ ...s, squadComment: e.target.value }))}
                      className="w-full bg-[#0d0e14] border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
                      placeholder="bibubip"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* DEALERS TAB */}
            {activeTab === 'dealers' && (
              <div className="bg-[#141722] rounded-2xl p-5 border border-slate-800 space-y-5">
                <div>
                  <h2 className="text-base font-semibold text-white flex items-center gap-2">
                    <Flame className="w-5 h-5 text-orange-400" />
                    Форматирование &quot;Дилеры и цеха&quot;
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Итоги захвата цехов и дилеров по времени в кодовом блоке.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Дата итогов (ДД.ММ.ГГ)</label>
                    <input
                      type="text"
                      value={dealersState.date}
                      onChange={(e) => setDealersState((s) => ({ ...s, date: e.target.value }))}
                      className="w-full bg-[#0d0e14] border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
                      placeholder="01.07.25"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-slate-300">Временные слоты и победители</label>
                    {dealersState.slots.map((slot, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={slot.time}
                          onChange={(e) => updateDealersSlot(index, 'time', e.target.value)}
                          className="w-28 bg-[#0d0e14] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500 font-mono text-center"
                          placeholder="10:45"
                        />
                        <input
                          type="text"
                          value={slot.winner}
                          onChange={(e) => updateDealersSlot(index, 'winner', e.target.value)}
                          className="flex-1 bg-[#0d0e14] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                          placeholder=""
                        />
                        <button
                          onClick={() => removeDealersSlot(index)}
                          className="p-2 text-slate-500 hover:text-rose-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={addDealersSlot}
                      className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 font-medium pt-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Добавить слот
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* DROPS VZA TAB */}
            {activeTab === 'drops' && (
              <div className="bg-[#141722] rounded-2xl p-5 border border-slate-800 space-y-5">
                <div>
                  <h2 className="text-base font-semibold text-white flex items-center gap-2">
                    <Code className="w-5 h-5 text-indigo-400" />
                    Форматирование &quot;ДРОП / ВЗА&quot;
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Итоги ВЗА по времени каждые 4 часа.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Дата итогов (ДД.ММ.ГГ)</label>
                    <input
                      type="text"
                      value={dropsVzaState.date}
                      onChange={(e) => setDropsVzaState((s) => ({ ...s, date: e.target.value }))}
                      className="w-full bg-[#0d0e14] border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
                      placeholder="04.11.25"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-slate-300">Слоты времени и победители</label>
                    {dropsVzaState.slots.map((slot, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={slot.time}
                          onChange={(e) => updateDropsVzaSlot(index, 'time', e.target.value)}
                          className="w-28 bg-[#0d0e14] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500 font-mono text-center"
                          placeholder="00:00"
                        />
                        <input
                          type="text"
                          value={slot.winner}
                          onChange={(e) => updateDropsVzaSlot(index, 'winner', e.target.value)}
                          className="flex-1 bg-[#0d0e14] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                          placeholder=""
                        />
                        <button
                          onClick={() => removeDropsVzaSlot(index)}
                          className="p-2 text-slate-500 hover:text-rose-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={addDropsVzaSlot}
                      className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 font-medium pt-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Добавить слот
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* RP ARROWS TAB */}
            {activeTab === 'rpArrows' && (
              <div className="bg-[#141722] rounded-2xl p-5 border border-slate-800 space-y-5">
                <div>
                  <h2 className="text-base font-semibold text-white flex items-center gap-2">
                    <Crosshair className="w-5 h-5 text-emerald-400" />
                    Форматирование &quot;РП СТРЕЛЫ&quot;
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Забив стрелы между семьями, итог и скрытый комментарий состава.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Кто забил стрелу (Семья 1)</label>
                    <input
                      type="text"
                      value={rpArrowsState.famq1}
                      onChange={(e) => setRpArrowsState((s) => ({ ...s, famq1: e.target.value }))}
                      className="w-full bg-[#0d0e14] border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
                      placeholder=""
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Кому забили (Семья 2)</label>
                    <input
                      type="text"
                      value={rpArrowsState.famq2}
                      onChange={(e) => setRpArrowsState((s) => ({ ...s, famq2: e.target.value }))}
                      className="w-full bg-[#0d0e14] border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
                      placeholder=""
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Итог</label>
                    <input
                      type="text"
                      value={rpArrowsState.winner}
                      onChange={(e) => setRpArrowsState((s) => ({ ...s, winner: e.target.value }))}
                      className="w-full bg-[#0d0e14] border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
                      placeholder=""
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Комментарий (||спойлер||)</label>
                    <input
                      type="text"
                      value={rpArrowsState.comment}
                      onChange={(e) => setRpArrowsState((s) => ({ ...s, comment: e.target.value }))}
                      className="w-full bg-[#0d0e14] border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
                      placeholder="123"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* WEEKLY CUP TAB */}
            {activeTab === 'weeklyCup' && (
              <div className="bg-[#141722] rounded-2xl p-5 border border-slate-800 space-y-5">
                <div>
                  <h2 className="text-base font-semibold text-white flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-400" />
                    Форматирование &quot;Weekly Cup&quot;
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Итоги турнира Weekly Cup с матчами и комментарием с пингом Discord ID.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">Команда-Победитель</label>
                      <input
                        type="text"
                        value={weeklyCupState.winner}
                        onChange={(e) => setWeeklyCupState((s) => ({ ...s, winner: e.target.value }))}
                        className="w-full bg-[#0d0e14] border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
                        placeholder="999"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">Discord ID комментатора</label>
                      <input
                        type="text"
                        value={weeklyCupState.commentatorDiscordId}
                        onChange={(e) => setWeeklyCupState((s) => ({ ...s, commentatorDiscordId: e.target.value }))}
                        className="w-full bg-[#0d0e14] border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500 font-mono"
                        placeholder="334878444141805568"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Текст комментария (в ||спойлере||)</label>
                    <input
                      type="text"
                      value={weeklyCupState.commentText}
                      onChange={(e) => setWeeklyCupState((s) => ({ ...s, commentText: e.target.value }))}
                      className="w-full bg-[#0d0e14] border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
                      placeholder="выебал как витчблейд после рехаба"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-slate-300">Список матчей турнира</label>
                    {weeklyCupState.matches.map((match, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={match.team1}
                          onChange={(e) => updateWeeklyCupMatch(index, 'team1', e.target.value)}
                          className="flex-1 bg-[#0d0e14] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                          placeholder="zazashmockers"
                        />
                        <span className="text-xs text-slate-500 font-bold">VS</span>
                        <input
                          type="text"
                          value={match.team2}
                          onChange={(e) => updateWeeklyCupMatch(index, 'team2', e.target.value)}
                          className="flex-1 bg-[#0d0e14] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                          placeholder="17"
                        />
                        <input
                          type="text"
                          value={match.winner}
                          onChange={(e) => updateWeeklyCupMatch(index, 'winner', e.target.value)}
                          className="w-36 bg-[#0d0e14] border border-slate-800 rounded-xl px-3 py-2 text-xs text-emerald-400 font-semibold focus:outline-none focus:border-rose-500"
                          placeholder="Победитель"
                        />
                        <button
                          onClick={() => removeWeeklyCupMatch(index)}
                          className="p-2 text-slate-500 hover:text-rose-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={addWeeklyCupMatch}
                      className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 font-medium pt-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Добавить матч
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ACHIEVEMENTS TAB */}
            {activeTab === 'achievements' && (
              <div className="bg-[#141722] rounded-2xl p-5 border border-slate-800 space-y-5">
                <div>
                  <h2 className="text-base font-semibold text-white flex items-center gap-2">
                    <Star className="w-5 h-5 text-amber-400" />
                    Форматирование &quot;Достижения фамок (100% Ghetto/Cartel)&quot;
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Поздравление лидера и капт-состава за взятие сотки или другого достижения.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">Название сервера</label>
                      <input
                        type="text"
                        value={achievementsState.serverName}
                        onChange={(e) => setAchievementsState((s) => ({ ...s, serverName: e.target.value }))}
                        className="w-full bg-[#0d0e14] border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
                        placeholder="Houston"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">Капт-состав</label>
                      <input
                        type="text"
                        value={achievementsState.captSquad}
                        onChange={(e) => setAchievementsState((s) => ({ ...s, captSquad: e.target.value }))}
                        className="w-full bg-[#0d0e14] border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
                        placeholder="Destroy"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Фракция и Никнейм лидера</label>
                    <input
                      type="text"
                      value={achievementsState.leaderFractionAndName}
                      onChange={(e) => setAchievementsState((s) => ({ ...s, leaderFractionAndName: e.target.value }))}
                      className="w-full bg-[#0d0e14] border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
                      placeholder="Marabunta Grande - Sistim Allegri"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Цель контроля / Достижение</label>
                    <input
                      type="text"
                      value={achievementsState.controlTarget}
                      onChange={(e) => setAchievementsState((s) => ({ ...s, controlTarget: e.target.value }))}
                      className="w-full bg-[#0d0e14] border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
                      placeholder="100% территорий Ghetto"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* MOD TEAM TAB */}
            {activeTab === 'modTeam' && (
              <div className="bg-[#141722] rounded-2xl p-5 border border-slate-800 space-y-5">
                <div>
                  <h2 className="text-base font-semibold text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-sky-400" />
                    Форматирование &quot;Состав модерации&quot;
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Список текущего состава модераторов по ролям с эмодзи.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">Chief Moderator</label>
                      <input
                        type="text"
                        value={modTeamState.chiefMod}
                        onChange={(e) => setModTeamState((s) => ({ ...s, chiefMod: e.target.value }))}
                        className="w-full bg-[#0d0e14] border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
                        placeholder="Ник главного модератора"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">Deputy Chief Mod</label>
                      <input
                        type="text"
                        value={modTeamState.deputyChiefMod}
                        onChange={(e) => setModTeamState((s) => ({ ...s, deputyChiefMod: e.target.value }))}
                        className="w-full bg-[#0d0e14] border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
                        placeholder="Ник зам. главного модератора"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-slate-300">Senior Moderators</label>
                    {modTeamState.seniorMods.map((item, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) =>
                            setModTeamState((s) => {
                              const updated = [...s.seniorMods];
                              updated[index].name = e.target.value;
                              return { ...s, seniorMods: updated };
                            })
                          }
                          className="flex-1 bg-[#0d0e14] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                          placeholder="Имя / Пинг"
                        />
                        <input
                          type="text"
                          value={item.note}
                          onChange={(e) =>
                            setModTeamState((s) => {
                              const updated = [...s.seniorMods];
                              updated[index].note = e.target.value;
                              return { ...s, seniorMods: updated };
                            })
                          }
                          className="w-40 bg-[#0d0e14] border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-400 focus:outline-none focus:border-rose-500"
                          placeholder="(formatting)"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-slate-300">Moderators</label>
                    {modTeamState.moderators.map((name, index) => (
                      <input
                        key={index}
                        type="text"
                        value={name}
                        onChange={(e) =>
                          setModTeamState((s) => {
                            const updated = [...s.moderators];
                            updated[index] = e.target.value;
                            return { ...s, moderators: updated };
                          })
                        }
                        className="w-full bg-[#0d0e14] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                        placeholder={`Модератор #${index + 1}`}
                      />
                    ))}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-slate-300">Helpers</label>
                    {modTeamState.helpers.map((name, index) => (
                      <input
                        key={index}
                        type="text"
                        value={name}
                        onChange={(e) =>
                          setModTeamState((s) => {
                            const updated = [...s.helpers];
                            updated[index] = e.target.value;
                            return { ...s, helpers: updated };
                          })
                        }
                        className="w-full bg-[#0d0e14] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                        placeholder={`Хелпер #${index + 1}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 2. LEADERS TAB */}
            {activeTab === 'leaders' && (
              <div className="bg-[#141722] rounded-2xl p-5 border border-slate-800 space-y-5">
                <div>
                  <h2 className="text-base font-semibold text-white flex items-center gap-2">
                    <Crown className="w-5 h-5 text-amber-400" />
                    Форматирование новостей Лидеров
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Строгие правила: Гос сокращаем ВСЕГДА (LSPD, EMS, GOV...). Конкретная причина снятия — ЖИРНЫМ, по совокупности/ПСЖ — обычным текстом.
                  </p>
                </div>

                {/* Subtabs for leaders */}
                <div className="flex flex-wrap gap-2 pb-2 border-b border-slate-800">
                  {[
                    { id: 'warn_complaint', label: 'Выговор по жалобе' },
                    { id: 'warn_pdlf', label: 'Выговор по ПДЛФ' },
                    { id: 'new_leader', label: 'Новый лидер' },
                    { id: 'remove_leader', label: 'Снятие лидера' },
                    { id: 'next_term', label: 'Второй/Новый срок' },
                    { id: 'term_2_3', label: 'Переход со 2 на 3 срок' },
                    { id: 'leave_success', label: 'Успешный срок' },
                    { id: 'leave_pszh', label: 'Уход ПСЖ' },
                  ].map((st) => (
                    <button
                      key={st.id}
                      onClick={() => setLeaderSubTab(st.id as any)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        leaderSubTab === st.id
                          ? 'bg-rose-600 text-white'
                          : 'bg-slate-800/80 text-slate-400 hover:text-white'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>

                {/* Common Leader Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Приветствие по времени</label>
                    <select
                      value={leaderState.timeGreeting}
                      onChange={(e) => setLeaderState((s) => ({ ...s, timeGreeting: e.target.value as any }))}
                      className="w-full bg-[#0d0e14] border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
                    >
                      <option value="Добрый день">Добрый день</option>
                      <option value="Добрый вечер">Добрый вечер</option>
                      <option value="Доброе утро">Доброе утро</option>
                      <option value="Доброй ночи">Доброй ночи</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Фракция / Банда</label>
                    <SmartInput
                      value={leaderState.faction}
                      onChange={(val) => setLeaderState((s) => ({ ...s, faction: val }))}
                      className="w-full bg-[#0d0e14] border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
                      placeholder="FIB, GOV, Marabunta Grande..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Никнейм лидера</label>
                    <input
                      type="text"
                      value={leaderState.nickname}
                      onChange={(e) => setLeaderState((s) => ({ ...s, nickname: e.target.value }))}
                      className="w-full bg-[#0d0e14] border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
                      placeholder="Mister Business"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Статический ID</label>
                    <input
                      type="text"
                      value={leaderState.staticId}
                      onChange={(e) => setLeaderState((s) => ({ ...s, staticId: e.target.value }))}
                      className="w-full bg-[#0d0e14] border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
                      placeholder="#5555"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Discord тег</label>
                    <input
                      type="text"
                      value={leaderState.discordTag}
                      onChange={(e) => setLeaderState((s) => ({ ...s, discordTag: e.target.value }))}
                      className="w-full bg-[#0d0e14] border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
                      placeholder="@MisterBusiness"
                    />
                  </div>

                  {leaderSubTab.startsWith('warn') && (
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">Ситуация по выговорам</label>
                      <input
                        type="text"
                        value={leaderState.warnsStatus}
                        onChange={(e) => setLeaderState((s) => ({ ...s, warnsStatus: e.target.value }))}
                        className="w-full bg-[#0d0e14] border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
                        placeholder="[1/5]"
                      />
                    </div>
                  )}

                  {leaderSubTab === 'remove_leader' && (
                    <div className="sm:col-span-2 space-y-2">
                      <label className="block text-xs font-medium text-slate-300">Тип причины снятия</label>
                      <div className="flex flex-wrap gap-4 text-xs pt-1">
                        <AnimatedRadio
                          checked={leaderState.removalReasonType === 'general'}
                          onChange={() => setLeaderState((s) => ({ ...s, removalReasonType: 'general' }))}
                          label="По совокупности выговоров (обычный текст)"
                        />
                        <AnimatedRadio
                          checked={leaderState.removalReasonType === 'specific'}
                          onChange={() => setLeaderState((s) => ({ ...s, removalReasonType: 'specific' }))}
                          label={<span>Конкретная причина (выделится <strong>ЖИРНЫМ</strong>)</span>}
                        />
                      </div>

                      {leaderState.removalReasonType === 'specific' && (
                        <SmartInput
                          value={leaderState.specificReasonText}
                          onChange={(val) => setLeaderState((s) => ({ ...s, specificReasonText: val }))}
                          className="w-full bg-[#0d0e14] border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                          placeholder="отказ от проверки / обман администрации / 3/3..."
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 3. CAPT & CHAMPIONS TAB */}
            {activeTab === 'capt' && (
              <div className="bg-[#141722] rounded-2xl p-5 border border-slate-800 space-y-5">
                <div>
                  <h2 className="text-base font-semibold text-white flex items-center gap-2">
                    <Swords className="w-5 h-5 text-purple-400" />
                    Капты, Захваты особняков и Champions Cup
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Правило: Капты отписываются ВСЕ по отдельности (1-0, 2-0, 3-0, 4-0).
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 pb-2 border-b border-slate-800">
                  {[
                    { id: 'simple', label: 'Обычный капт' },
                    { id: 'champions_group', label: 'Champions (Группа / Матч)' },
                    { id: 'mansion', label: 'Захват особняка' },
                    { id: 'free_building', label: 'Захват своб. помещения' },
                    { id: 'champions_stage', label: 'Champions (Стадия дня)' },
                  ].map((st) => (
                    <button
                      key={st.id}
                      onClick={() => setCaptSubTab(st.id as any)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        captSubTab === st.id
                          ? 'bg-rose-600 text-white'
                          : 'bg-slate-800/80 text-slate-400 hover:text-white'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {captSubTab === 'simple' && (
                    <>
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1.5">Команда 1</label>
                        <SmartInput
                          value={captState.team1}
                          onChange={(val) => setCaptState((s) => ({ ...s, team1: val }))}
                          className="w-full bg-[#0d0e14] border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1.5">Команда 2</label>
                        <SmartInput
                          value={captState.team2}
                          onChange={(val) => setCaptState((s) => ({ ...s, team2: val }))}
                          className="w-full bg-[#0d0e14] border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
                        />
                      </div>
                    </>
                  )}

                  {(captSubTab === 'champions_group' || captSubTab === 'champions_stage') && (
                    <>
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1.5">Семья 1</label>
                        <SmartInput
                          value={captState.team1}
                          onChange={(val) => setCaptState((s) => ({ ...s, team1: val }))}
                          className="w-full bg-[#0d0e14] border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1.5">Семья 2</label>
                        <SmartInput
                          value={captState.team2}
                          onChange={(val) => setCaptState((s) => ({ ...s, team2: val }))}
                          className="w-full bg-[#0d0e14] border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1.5">Счет (Семья 1 - Семья 2)</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={captState.score1}
                            onChange={(e) => setCaptState((s) => ({ ...s, score1: e.target.value }))}
                            className="w-full bg-[#0d0e14] border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white text-center focus:outline-none focus:border-rose-500"
                          />
                          <span className="text-slate-500">-</span>
                          <input
                            type="text"
                            value={captState.score2}
                            onChange={(e) => setCaptState((s) => ({ ...s, score2: e.target.value }))}
                            className="w-full bg-[#0d0e14] border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white text-center focus:outline-none focus:border-rose-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1.5">Победитель (win)</label>
                        <SmartInput
                          value={captState.winner}
                          onChange={(val) => setCaptState((s) => ({ ...s, winner: val }))}
                          className="w-full bg-[#0d0e14] border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
                        />
                      </div>
                    </>
                  )}

                  {(captSubTab === 'mansion' || captSubTab === 'free_building') && (
                    <>
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1.5">Захватившая семья</label>
                        <SmartInput
                          value={captState.winner}
                          onChange={(val) => setCaptState((s) => ({ ...s, winner: val }))}
                          className="w-full bg-[#0d0e14] border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
                        />
                      </div>

                      {captSubTab === 'mansion' && (
                        <div>
                          <label className="block text-xs font-medium text-slate-300 mb-1.5">Название особняка</label>
                          <input
                            type="text"
                            value={captState.mansionCaptured}
                            onChange={(e) => setCaptState((s) => ({ ...s, mansionCaptured: e.target.value }))}
                            className="w-full bg-[#0d0e14] border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
                            placeholder="Angel of Death"
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1.5">У кого захватили</label>
                        <input
                          type="text"
                          value={captState.mansionFrom}
                          onChange={(e) => setCaptState((s) => ({ ...s, mansionFrom: e.target.value }))}
                          className="w-full bg-[#0d0e14] border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
                          placeholder=""
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* 4. INTERVIEW TAB */}
            {activeTab === 'interview' && (
              <div className="bg-[#141722] rounded-2xl p-5 border border-slate-800 space-y-5">
                <div>
                  <h2 className="text-base font-semibold text-white flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-cyan-400" />
                    Форматирование Интеврью
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Норма: от 1 интервью в 2 недели до максимум 2 интервью в неделю.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Тег сервера</label>
                    <input
                      type="text"
                      value={interviewState.serverTag}
                      onChange={(e) => setInterviewState((s) => ({ ...s, serverTag: e.target.value }))}
                      className="w-full bg-[#0d0e14] border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
                      placeholder="||@tag server||"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Роль респондента</label>
                    <input
                      type="text"
                      value={interviewState.roleTarget}
                      onChange={(e) => setInterviewState((s) => ({ ...s, roleTarget: e.target.value }))}
                      className="w-full bg-[#0d0e14] border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
                      placeholder="лидером/замом/игроком"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Название семьи / фракции</label>
                    <SmartInput
                      value={interviewState.entityName}
                      onChange={(val) => setInterviewState((s) => ({ ...s, entityName: val }))}
                      className="w-full bg-[#0d0e14] border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
                      placeholder="Marabunta Grande, FIB, LSPD..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Discord тег респондента</label>
                    <input
                      type="text"
                      value={interviewState.userTag}
                      onChange={(e) => setInterviewState((s) => ({ ...s, userTag: e.target.value }))}
                      className="w-full bg-[#0d0e14] border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
                      placeholder="@tag"
                    />
                  </div>
                </div>

                {/* Question Items List */}
                <div className="space-y-3 pt-3 border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Вопросы и Ответы ({interviewState.questions.length})
                    </label>
                    <button
                      onClick={addInterviewQuestion}
                      className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 font-medium"
                    >
                      <Plus className="w-3.5 h-3.5" /> Добавить вопрос
                    </button>
                  </div>

                  {interviewState.questions.map((qItem, idx) => (
                    <div key={idx} className="bg-[#0d0e14] rounded-xl p-3 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                        <span>Вопрос #{idx + 1}</span>
                        {interviewState.questions.length > 1 && (
                          <button
                            onClick={() => removeInterviewQuestion(idx)}
                            className="text-slate-500 hover:text-rose-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        value={qItem.q}
                        onChange={(e) => updateInterviewQuestion(idx, 'q', e.target.value)}
                        className="w-full bg-[#141722] border border-slate-700/60 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-rose-500"
                        placeholder="Текст вопроса"
                      />
                      <textarea
                        rows={2}
                        value={qItem.a}
                        onChange={(e) => updateInterviewQuestion(idx, 'a', e.target.value)}
                        className="w-full bg-[#141722] border border-slate-700/60 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-rose-500"
                        placeholder="Текст ответа"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 5. MCL / VZZ TAB */}
            {activeTab === 'mcl' && (
              <div className="bg-[#141722] rounded-2xl p-5 border border-slate-800 space-y-5">
                <div>
                  <h2 className="text-base font-semibold text-white flex items-center gap-2">
                    <Flame className="w-5 h-5 text-orange-400" />
                    Турниры MCL / ВЗЗ / King MCL
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">Оформление итогов турниров.</p>
                </div>

                <div className="flex gap-2 border-b border-slate-800 pb-2">
                  <button
                    onClick={() => setMclSubTab('mcl')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                      mclSubTab === 'mcl' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    Стандартный MCL / ВЗЗ
                  </button>
                  <button
                    onClick={() => setMclSubTab('king_mcl')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                      mclSubTab === 'king_mcl' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    King MCL
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Турнир</label>
                    <select
                      value={mclState.tournamentType}
                      onChange={(e) => setMclState((s) => ({ ...s, tournamentType: e.target.value as any }))}
                      className="w-full bg-[#0d0e14] border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
                    >
                      <option value="MCL">MCL</option>
                      <option value="ВЗЗ">ВЗЗ</option>
                    </select>
                  </div>

                  {mclSubTab === 'king_mcl' && (
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">Номер дня</label>
                      <input
                        type="text"
                        value={mclState.dayNumber}
                        onChange={(e) => setMclState((s) => ({ ...s, dayNumber: e.target.value }))}
                        className="w-full bg-[#0d0e14] border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
                        placeholder="1"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Победившая семья / фракция</label>
                    <SmartInput
                      value={mclState.winnerFamily}
                      onChange={(val) => setMclState((s) => ({ ...s, winnerFamily: val }))}
                      className="w-full bg-[#0d0e14] border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
                      placeholder="Marabunta Grande, The Ballas Gang..."
                    />
                  </div>

                  {mclSubTab === 'mcl' && (
                    <>
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1.5">Комментарий лидера</label>
                        <input
                          type="text"
                          value={mclState.leaderComment}
                          onChange={(e) => setMclState((s) => ({ ...s, leaderComment: e.target.value }))}
                          className="w-full bg-[#0d0e14] border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1.5">Комментарий состава</label>
                        <input
                          type="text"
                          value={mclState.squadComment}
                          onChange={(e) => setMclState((s) => ({ ...s, squadComment: e.target.value }))}
                          className="w-full bg-[#0d0e14] border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
                        />
                      </div>
                    </>
                  )}

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Участники мероприятия</label>
                    <textarea
                      rows={2}
                      value={mclState.participants}
                      onChange={(e) => setMclState((s) => ({ ...s, participants: e.target.value }))}
                      className="w-full bg-[#0d0e14] border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 6. WARS & ALLIANCES TAB */}
            {activeTab === 'wars' && (
              <div className="bg-[#141722] rounded-2xl p-5 border border-slate-800 space-y-5">
                <div>
                  <h2 className="text-base font-semibold text-white flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-rose-400" />
                    Войны, Союзы, Перекрасы и Заморозки
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">Оформление откатов, заморозок FZ / войны семей.</p>
                </div>

                <div className="flex flex-wrap gap-2 pb-2 border-b border-slate-800">
                  {[
                    { id: 'freeze_capt_family', label: '❄️ Заморозка каптов' },
                    { id: 'unfreeze_capt_family', label: '🔥 Разморозка каптов' },
                    { id: 'freeze_family', label: '❄️ Заморозка семьи' },
                    { id: 'unfreeze_family', label: '🔥 Разморозка семьи' },
                    { id: 'recolor_multi', label: '🎨 Перекрас терр (мульти)' },
                    { id: 'recolor_single', label: '📍 Перекрас 1 квадрата' },
                    { id: 'rollback_tech', label: '🔄 Откат квадрата' },
                    { id: 'neutral_recolor', label: '⚪ В нейтрал' },
                    { id: 'fz_freeze', label: '🔒 Заморозка ФЗ/Кайо' },
                    { id: 'fz_unfreeze', label: '🔓 Разморозка ФЗ/Кайо' },
                    { id: 'war_freeze', label: '🛡️ Заморозка Войны' },
                    { id: 'war_unfreeze', label: '⚔️ Разморозка Войны' },
                  ].map((st) => (
                    <button
                      key={st.id}
                      onClick={() => setWarSubTab(st.id as any)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        warSubTab === st.id
                          ? 'bg-rose-600 text-white shadow-md shadow-rose-900/40 font-semibold'
                          : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>

                <div className="space-y-4">
                  {/* Freeze Capt Family or General Freeze Family */}
                  {(warSubTab === 'freeze_capt_family' || warSubTab === 'freeze_family') && (
                    <div className="space-y-4 bg-[#0d0e14] p-4 rounded-xl border border-slate-800">
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                          Основание выдачи заморозки:
                        </label>
                        <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-slate-200">
                          <div className="bg-[#141722] px-3.5 py-2.5 rounded-xl border border-slate-700/80 hover:border-rose-500/80 transition-all">
                            <AnimatedRadio
                              checked={warState.freezeReasonType === 'complaint'}
                              onChange={() => setWarState((s) => ({ ...s, freezeReasonType: 'complaint' }))}
                              label="По жалобе"
                            />
                          </div>
                          <div className="bg-[#141722] px-3.5 py-2.5 rounded-xl border border-slate-700/80 hover:border-rose-500/80 transition-all">
                            <AnimatedRadio
                              checked={warState.freezeReasonType === 'rule'}
                              onChange={() => setWarState((s) => ({ ...s, freezeReasonType: 'rule' }))}
                              label="По пункту правила"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-medium text-slate-300 mb-1.5">Тег роли / Название семьи</label>
                          <input
                            type="text"
                            value={warState.familyRoleTag}
                            onChange={(e) => setWarState((s) => ({ ...s, familyRoleTag: e.target.value }))}
                            className="w-full bg-[#141722] border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
                            placeholder=""
                          />
                        </div>

                        {/* Freeze Unit Selector (Hours vs Days vs Custom) */}
                        <div className="sm:col-span-2 space-y-2 pt-2 border-t border-slate-800/60">
                          <label className="block text-xs font-medium text-slate-300">
                            Формат длительности заморозки:
                          </label>
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setWarState((s) => ({ ...s, freezeUnit: 'days', freezeDays: '7' }))}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                                warState.freezeUnit === 'days'
                                  ? 'bg-rose-600 text-white shadow-md shadow-rose-900/40 font-semibold'
                                  : 'bg-[#141722] text-slate-400 border border-slate-700 hover:text-white'
                              }`}
                            >
                              <Calendar className="w-3.5 h-3.5" /> В днях
                            </button>
                            <button
                              type="button"
                              onClick={() => setWarState((s) => ({ ...s, freezeUnit: 'hours', freezeDays: '24' }))}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                                warState.freezeUnit === 'hours'
                                  ? 'bg-rose-600 text-white shadow-md shadow-rose-900/40 font-semibold'
                                  : 'bg-[#141722] text-slate-400 border border-slate-700 hover:text-white'
                              }`}
                            >
                              <Clock className="w-3.5 h-3.5" /> В часах
                            </button>
                            <button
                              type="button"
                              onClick={() => setWarState((s) => ({ ...s, freezeUnit: 'custom' }))}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                                warState.freezeUnit === 'custom'
                                  ? 'bg-rose-600 text-white shadow-md shadow-rose-900/40 font-semibold'
                                  : 'bg-[#141722] text-slate-400 border border-slate-700 hover:text-white'
                              }`}
                            >
                              <Sparkles className="w-3.5 h-3.5" /> Своя строка
                            </button>
                          </div>
                        </div>

                        {/* Freeze Duration Value Input & Quick Presets */}
                        {warState.freezeUnit !== 'custom' ? (
                          <div className="sm:col-span-2 space-y-2">
                            <label className="block text-xs font-medium text-slate-300">
                              {warState.freezeUnit === 'hours' ? 'Количество часов заморозки' : 'Количество дней заморозки'}
                            </label>
                            <div className="flex flex-wrap items-center gap-3">
                              <input
                                type="text"
                                value={warState.freezeDays}
                                onChange={(e) => setWarState((s) => ({ ...s, freezeDays: e.target.value }))}
                                className="w-32 bg-[#141722] border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500 font-bold"
                                placeholder={warState.freezeUnit === 'hours' ? '24' : '7'}
                              />
                              <div className="text-xs text-rose-400 font-semibold bg-rose-500/10 px-3 py-2 rounded-xl border border-rose-500/20">
                                В тексте поста:{' '}
                                <span className="text-white font-bold">
                                  {formatFreezeDuration(warState.freezeDays, warState.freezeUnit, warState.freezeCustomText)}
                                </span>
                              </div>
                            </div>

                            {/* Presets */}
                            <div className="pt-1 flex flex-wrap items-center gap-1.5">
                              <span className="text-[11px] text-slate-400 mr-1">Быстрый выбор:</span>
                              {warState.freezeUnit === 'hours' ? (
                                <>
                                  {['6', '12', '24', '48', '72'].map((h) => (
                                    <button
                                      key={h}
                                      type="button"
                                      onClick={() => setWarState((s) => ({ ...s, freezeDays: h }))}
                                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                                        warState.freezeDays === h
                                          ? 'bg-rose-500 text-white font-semibold'
                                          : 'bg-[#141722] text-slate-300 border border-slate-700 hover:border-rose-500'
                                      }`}
                                    >
                                      {formatFreezeDuration(h, 'hours')}
                                    </button>
                                  ))}
                                </>
                              ) : (
                                <>
                                  {['1', '3', '5', '7'].map((d) => (
                                    <button
                                      key={d}
                                      type="button"
                                      onClick={() => setWarState((s) => ({ ...s, freezeDays: d }))}
                                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                                        warState.freezeDays === d
                                          ? 'bg-rose-500 text-white font-semibold'
                                          : 'bg-[#141722] text-slate-300 border border-slate-700 hover:border-rose-500'
                                      }`}
                                    >
                                      {formatFreezeDuration(d, 'days')}
                                    </button>
                                  ))}
                                </>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="sm:col-span-2 space-y-1.5">
                            <label className="block text-xs font-medium text-slate-300">
                              Произвольный текст длительности (например: &quot;24 часа&quot;, &quot;до смены лидера&quot;, &quot;48 часов&quot;)
                            </label>
                            <input
                              type="text"
                              value={warState.freezeCustomText}
                              onChange={(e) => setWarState((s) => ({ ...s, freezeCustomText: e.target.value }))}
                              className="w-full bg-[#141722] border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
                              placeholder="24 часа"
                            />
                          </div>
                        )}

                        {warState.freezeReasonType === 'complaint' ? (
                          <div className="sm:col-span-2 space-y-1">
                            <label className="block text-xs font-medium text-slate-300 mb-1">Ссылка на жалобу</label>
                            <input
                              type="text"
                              value={warState.complaintLink}
                              onChange={(e) => setWarState((s) => ({ ...s, complaintLink: e.target.value }))}
                              className="w-full bg-[#141722] border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
                              placeholder="https://forum.majestic-rp.ru/threads/..."
                            />
                          </div>
                        ) : (
                          <div className="sm:col-span-2 space-y-1.5">
                            <label className="block text-xs font-medium text-slate-300">Пункт правил / Причина</label>
                            <input
                              type="text"
                              value={warState.reasonMg}
                              onChange={(e) => setWarState((s) => ({ ...s, reasonMg: e.target.value }))}
                              className="w-full bg-[#141722] border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
                              placeholder=""
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Unfreeze Capt Family or Unfreeze Family */}
                  {(warSubTab === 'unfreeze_capt_family' || warSubTab === 'unfreeze_family') && (
                    <div className="space-y-4 bg-[#0d0e14] p-4 rounded-xl border border-slate-800">
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1.5">
                          Тег роли / Название семьи для разморозки
                        </label>
                        <input
                          type="text"
                          value={warState.familyRoleTag}
                          onChange={(e) => setWarState((s) => ({ ...s, familyRoleTag: e.target.value }))}
                          className="w-full bg-[#141722] border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
                          placeholder=""
                        />
                      </div>
                    </div>
                  )}

                  {/* Multiple Territories Recolor */}
                  {warSubTab === 'recolor_multi' && (
                    <div className="space-y-4 bg-[#0d0e14] p-4 rounded-xl border border-slate-800">
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                          Основание перекраса территорий:
                        </label>
                        <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-slate-200">
                          <div className="bg-[#141722] px-3.5 py-2.5 rounded-xl border border-slate-700/80 hover:border-rose-500/80 transition-all">
                            <AnimatedRadio
                              checked={warState.multiReasonType === 'check'}
                              onChange={() => setWarState((s) => ({ ...s, multiReasonType: 'check' }))}
                              label="По итогам проверки (бан)"
                            />
                          </div>
                          <div className="bg-[#141722] px-3.5 py-2.5 rounded-xl border border-slate-700/80 hover:border-rose-500/80 transition-all">
                            <AnimatedRadio
                              checked={warState.multiReasonType === 'complaint'}
                              onChange={() => setWarState((s) => ({ ...s, multiReasonType: 'complaint' }))}
                              label="По жалобе"
                            />
                          </div>
                          <div className="bg-[#141722] px-3.5 py-2.5 rounded-xl border border-slate-700/80 hover:border-rose-500/80 transition-all">
                            <AnimatedRadio
                              checked={warState.multiReasonType === 'rule'}
                              onChange={() => setWarState((s) => ({ ...s, multiReasonType: 'rule' }))}
                              label="По пункту правила"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-medium text-slate-300 mb-1.5">
                            Семья нарушившего / заблокированного игрока
                          </label>
                          <input
                            type="text"
                            value={warState.bannedUserFamily}
                            onChange={(e) => setWarState((s) => ({ ...s, bannedUserFamily: e.target.value }))}
                            className="w-full bg-[#141722] border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
                            placeholder=""
                          />
                        </div>

                        {warState.multiReasonType === 'complaint' && (
                          <div className="sm:col-span-2">
                            <label className="block text-xs font-medium text-slate-300 mb-1.5">Ссылка на жалобу</label>
                            <input
                              type="text"
                              value={warState.complaintLink}
                              onChange={(e) => setWarState((s) => ({ ...s, complaintLink: e.target.value }))}
                              className="w-full bg-[#141722] border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
                              placeholder="https://forum.majestic-rp.ru/threads/..."
                            />
                          </div>
                        )}

                        {warState.multiReasonType === 'rule' && (
                          <div className="sm:col-span-2">
                            <label className="block text-xs font-medium text-slate-300 mb-1.5">Пункт правил / Причина</label>
                            <input
                              type="text"
                              value={warState.violatingRule}
                              onChange={(e) => setWarState((s) => ({ ...s, violatingRule: e.target.value }))}
                              className="w-full bg-[#141722] border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
                              placeholder="2.4 ОПСО"
                            />
                          </div>
                        )}
                      </div>

                      <div className="space-y-2 pt-2 border-t border-slate-800">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-medium text-slate-300">Список перекрашиваемых территорий</label>
                          <button
                            onClick={addTerritoryRow}
                            className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 font-medium"
                          >
                            <Plus className="w-3.5 h-3.5" /> Добавить
                          </button>
                        </div>

                        {warState.territoriesList.map((tItem, tIdx) => (
                          <div key={tIdx} className="flex items-center gap-2">
                            <input
                              type="text"
                              value={tItem.count}
                              onChange={(e) => updateTerritoryRow(tIdx, 'count', e.target.value)}
                              className="w-1/3 bg-[#141722] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                              placeholder="1 территория"
                            />
                            <span className="text-xs text-slate-500">в сторону</span>
                            <input
                              type="text"
                              value={tItem.to}
                              onChange={(e) => updateTerritoryRow(tIdx, 'to', e.target.value)}
                              className="flex-1 bg-[#141722] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                              placeholder=""
                            />
                            {warState.territoriesList.length > 1 && (
                              <button
                                onClick={() => removeTerritoryRow(tIdx)}
                                className="text-slate-500 hover:text-rose-400 p-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Single Square Recolor */}
                  {warSubTab === 'recolor_single' && (
                    <div className="space-y-4 bg-[#0d0e14] p-4 rounded-xl border border-slate-800">
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                          Основание перекраса 1 квадрата:
                        </label>
                        <div className="flex items-center gap-3 text-xs font-medium text-slate-200">
                          <div className="bg-[#141722] px-3.5 py-2.5 rounded-xl border border-slate-700/80 hover:border-rose-500/80 transition-all">
                            <AnimatedRadio
                              checked={warState.recolorReasonType === 'complaint'}
                              onChange={() => setWarState((s) => ({ ...s, recolorReasonType: 'complaint' }))}
                              label="По жалобе"
                            />
                          </div>
                          <div className="bg-[#141722] px-3.5 py-2.5 rounded-xl border border-slate-700/80 hover:border-rose-500/80 transition-all">
                            <AnimatedRadio
                              checked={warState.recolorReasonType === 'rule'}
                              onChange={() => setWarState((s) => ({ ...s, recolorReasonType: 'rule' }))}
                              label="По пункту правила"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-slate-300 mb-1.5">Код квадрата / особняка</label>
                          <input
                            type="text"
                            value={warState.squareCode}
                            onChange={(e) => setWarState((s) => ({ ...s, squareCode: e.target.value }))}
                            className="w-full bg-[#141722] border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
                            placeholder="CD39"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-slate-300 mb-1.5">Тег/Название семьи</label>
                          <input
                            type="text"
                            value={warState.familyRoleTag}
                            onChange={(e) => setWarState((s) => ({ ...s, familyRoleTag: e.target.value }))}
                            className="w-full bg-[#141722] border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
                          />
                        </div>

                        {warState.recolorReasonType === 'complaint' ? (
                          <div className="sm:col-span-2">
                            <label className="block text-xs font-medium text-slate-300 mb-1.5">Ссылка на жалобу</label>
                            <input
                              type="text"
                              value={warState.complaintLink}
                              onChange={(e) => setWarState((s) => ({ ...s, complaintLink: e.target.value }))}
                              className="w-full bg-[#141722] border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
                              placeholder="https://forum.majestic-rp.ru/threads/..."
                            />
                          </div>
                        ) : (
                          <div className="sm:col-span-2">
                            <label className="block text-xs font-medium text-slate-300 mb-1.5">Пункт правил / Нарушение</label>
                            <input
                              type="text"
                              value={warState.violatingRule}
                              onChange={(e) => setWarState((s) => ({ ...s, violatingRule: e.target.value }))}
                              className="w-full bg-[#141722] border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
                              placeholder="2.4 ОПСО"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Rollback Square */}
                  {warSubTab === 'rollback_tech' && (
                    <div className="space-y-4 bg-[#0d0e14] p-4 rounded-xl border border-slate-800">
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                          Причина отката квадрата:
                        </label>
                        <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-slate-200">
                          <div className="bg-[#141722] px-3.5 py-2.5 rounded-xl border border-slate-700/80 hover:border-rose-500/80 transition-all">
                            <AnimatedRadio
                              checked={warState.rollbackReasonType === 'tech'}
                              onChange={() => setWarState((s) => ({ ...s, rollbackReasonType: 'tech' }))}
                              label="По тех. причинам"
                            />
                          </div>
                          <div className="bg-[#141722] px-3.5 py-2.5 rounded-xl border border-slate-700/80 hover:border-rose-500/80 transition-all">
                            <AnimatedRadio
                              checked={warState.rollbackReasonType === 'complaint'}
                              onChange={() => setWarState((s) => ({ ...s, rollbackReasonType: 'complaint' }))}
                              label="По жалобе"
                            />
                          </div>
                          <div className="bg-[#141722] px-3.5 py-2.5 rounded-xl border border-slate-700/80 hover:border-rose-500/80 transition-all">
                            <AnimatedRadio
                              checked={warState.rollbackReasonType === 'rule'}
                              onChange={() => setWarState((s) => ({ ...s, rollbackReasonType: 'rule' }))}
                              label="По пункту правила"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-slate-300 mb-1.5">Код квадрата</label>
                          <input
                            type="text"
                            value={warState.squareCode}
                            onChange={(e) => setWarState((s) => ({ ...s, squareCode: e.target.value }))}
                            className="w-full bg-[#141722] border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
                            placeholder="CD39"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-slate-300 mb-1.5">В сторону какой семьи</label>
                          <input
                            type="text"
                            value={warState.targetFamily}
                            onChange={(e) => setWarState((s) => ({ ...s, targetFamily: e.target.value }))}
                            className="w-full bg-[#141722] border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
                            placeholder=""
                          />
                        </div>

                        {warState.rollbackReasonType === 'complaint' && (
                          <div className="sm:col-span-2">
                            <label className="block text-xs font-medium text-slate-300 mb-1.5">Ссылка на жалобу</label>
                            <input
                              type="text"
                              value={warState.complaintLink}
                              onChange={(e) => setWarState((s) => ({ ...s, complaintLink: e.target.value }))}
                              className="w-full bg-[#141722] border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
                              placeholder="https://forum.majestic-rp.ru/threads/..."
                            />
                          </div>
                        )}

                        {warState.rollbackReasonType === 'rule' && (
                          <div className="sm:col-span-2">
                            <label className="block text-xs font-medium text-slate-300 mb-1.5">Пункт правил / Нарушение</label>
                            <input
                              type="text"
                              value={warState.violatingRule}
                              onChange={(e) => setWarState((s) => ({ ...s, violatingRule: e.target.value }))}
                              className="w-full bg-[#141722] border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
                              placeholder="2.4 ОПСО"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Neutral Recolor */}
                  {warSubTab === 'neutral_recolor' && (
                    <div className="space-y-4 bg-[#0d0e14] p-4 rounded-xl border border-slate-800">
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                          Основание перекраса в нейтрал:
                        </label>
                        <div className="flex items-center gap-3 text-xs font-medium text-slate-200">
                          <div className="bg-[#141722] px-3.5 py-2.5 rounded-xl border border-slate-700/80 hover:border-rose-500/80 transition-all">
                            <AnimatedRadio
                              checked={warState.neutralReasonType === 'complaint'}
                              onChange={() => setWarState((s) => ({ ...s, neutralReasonType: 'complaint' }))}
                              label="По жалобе"
                            />
                          </div>
                          <div className="bg-[#141722] px-3.5 py-2.5 rounded-xl border border-slate-700/80 hover:border-rose-500/80 transition-all">
                            <AnimatedRadio
                              checked={warState.neutralReasonType === 'rule'}
                              onChange={() => setWarState((s) => ({ ...s, neutralReasonType: 'rule' }))}
                              label="По пункту правила"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-slate-300 mb-1.5">Код квадрата</label>
                          <input
                            type="text"
                            value={warState.squareCode}
                            onChange={(e) => setWarState((s) => ({ ...s, squareCode: e.target.value }))}
                            className="w-full bg-[#141722] border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
                            placeholder="CD39"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-slate-300 mb-1.5">Нарушившая семья</label>
                          <input
                            type="text"
                            value={warState.familyRoleTag}
                            onChange={(e) => setWarState((s) => ({ ...s, familyRoleTag: e.target.value }))}
                            className="w-full bg-[#141722] border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
                          />
                        </div>

                        {warState.neutralReasonType === 'complaint' ? (
                          <div className="sm:col-span-2">
                            <label className="block text-xs font-medium text-slate-300 mb-1.5">Ссылка на жалобу</label>
                            <input
                              type="text"
                              value={warState.complaintLink}
                              onChange={(e) => setWarState((s) => ({ ...s, complaintLink: e.target.value }))}
                              className="w-full bg-[#141722] border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
                              placeholder="https://forum.majestic-rp.ru/threads/..."
                            />
                          </div>
                        ) : (
                          <div className="sm:col-span-2">
                            <label className="block text-xs font-medium text-slate-300 mb-1.5">Нарушение / Пункт правил</label>
                            <input
                              type="text"
                              value={warState.neutralReason}
                              onChange={(e) => setWarState((s) => ({ ...s, neutralReason: e.target.value }))}
                              className="w-full bg-[#141722] border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
                              placeholder="нарушение правил"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 8. CUSTOM EDITOR */}
            {activeTab === 'custom' && (
              <div className="bg-[#141722] rounded-2xl p-5 border border-slate-800 space-y-4">
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-400" />
                  Свободный редактор и конструктор разметки
                </h2>
                <textarea
                  rows={10}
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  className="w-full bg-[#0d0e14] border border-slate-800 rounded-xl p-4 text-sm text-white font-mono focus:outline-none focus:border-rose-500 leading-relaxed"
                />
              </div>
            )}

            {/* 9. RULES & PENALTIES CHEAT SHEET */}
            {activeTab === 'rules' && (
              <div className="bg-[#141722] rounded-2xl p-5 border border-slate-800 space-y-6">
                <div>
                  <h2 className="text-base font-semibold text-amber-300 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                    Регламент модератора Famq News & Система выговоров
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">Памятка по предотвращению ошибок форматирования и инактива.</p>
                </div>

                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Главные правила форматирования:
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="bg-[#0d0e14] p-3 rounded-xl border border-slate-800">
                      <span className="font-semibold text-rose-400">ГОС Фракции:</span>
                      <p className="text-slate-400 mt-1">
                        Всегда сокращаем: LSPD, EMS, LSCSD, SANG, GOV, WN, FIB. Всегда глагол с окончанием «И» (даже если в соло: «отбилИ», «напалИ»).
                      </p>
                    </div>
                    <div className="bg-[#0d0e14] p-3 rounded-xl border border-slate-800">
                      <span className="font-semibold text-rose-400">Крайм и Семьи:</span>
                      <p className="text-slate-400 mt-1">
                        В соло — «перекрылА», «убилА». В союзе — «перекрылИ», «убилИ».
                      </p>
                    </div>
                    <div className="bg-[#0d0e14] p-3 rounded-xl border border-slate-800">
                      <span className="font-semibold text-amber-400">Лидеры Судебной власти:</span>
                      <p className="text-slate-400 mt-1">
                        Председателя верховного суда НЕ отписываем в канал лидеров и не вписываем во фракции!
                      </p>
                    </div>
                    <div className="bg-[#0d0e14] p-3 rounded-xl border border-slate-800">
                      <span className="font-semibold text-cyan-400">Даты и Ссылки:</span>
                      <p className="text-slate-400 mt-1">
                        Дата под спойлером всегда пишется В КОНЦЕ поста без года (_||02.09||_), а ссылка на ТГК всегда строго после даты в самом низу.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-3 border-t border-slate-800">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Штрафы и Выговоры модерации (1 выговор):
                  </h3>
                  <ul className="text-xs space-y-1.5 text-slate-300 list-disc pl-4">
                    <li>Тег сервера/роли без причины</li>
                    <li>Ошибка в форматировании поста (запятые внутри bold, неверные окончания)</li>
                    <li>Инактив 3 дня (ровно 72 часа с момента последнего поста)</li>
                    <li>Больше 2-х комментариев на 1 посту (кроме MCL, ВЗЗ, ВЗМ)</li>
                    <li>Итог дропа до 00:10 / Отсутствие дропов с 00:10 до 10:00</li>
                    <li>Итог Дилеров/Цехов до 11:00 / Отсутствие с 11:00 до 18:45</li>
                    <li>Пост не на своем сервере или неисправленный пост в fix за 24 часа</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Right Side: Interactive Discord Live Preview */}
          <div className="lg:col-span-4">
            <div className="sticky top-20 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-rose-400" /> Живой Discord Предпросмотр
                </span>
                <span className="text-[10px] text-slate-500">Авторасчет синтаксиса</span>
              </div>

              {/* Warnings Banner if any formatting issues detected */}
              {currentWarnings.length > 0 && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 space-y-1">
                  <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                    Замечена возможная ошибка форматирования:
                  </div>
                  {currentWarnings.map((w, idx) => (
                    <p key={idx} className="text-[11px] text-amber-200/80 pl-6">
                      • {w}
                    </p>
                  ))}
                </div>
              )}

              {/* Discord Simulated Card */}
              <div className="bg-[#313338] rounded-2xl p-4 border border-[#1e1f22] shadow-2xl space-y-3 font-sans">
                {/* Simulated Channel Header */}
                <div className="flex items-center justify-between border-b border-[#2b2d31] pb-2 text-xs font-medium text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="text-rose-400 font-bold"># ☇📣┃новости</span>
                    <span className="text-slate-600">•</span>
                    <span>Сегодня в {formattedTime || '12:00'}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">Discord Markdown</span>
                </div>

                {/* Message Content */}
                <div className="text-sm text-[#dbdee1] leading-relaxed whitespace-pre-wrap font-sans break-words bg-[#2b2d31]/40 p-3.5 rounded-xl border border-[#2b2d31] min-h-[100px]">
                  {activeText || <span className="text-slate-500 italic">Заполните поля слева...</span>}
                </div>

                {/* If text exceeds Discord limit (2000 chars), display warning */}
                {activeText.length > 2000 && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-center gap-2 text-xs text-red-300 font-semibold">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>Текст слишком большой ({activeText.length} символов). Лимит Discord — 2000 символов, скопировать невозможно.</span>
                  </div>
                )}

                {/* Action Copy Button */}
                <div className="pt-1">
                  <motion.button
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.96 }}
                    animate={copied ? { scale: 1.03 } : { scale: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    onClick={handleCopy}
                    disabled={!activeText || activeText.length > 2000}
                    className={`btn-premium w-full py-3.5 px-4 text-white font-bold text-sm rounded-xl shadow-xl transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                      activeText.length > 2000
                        ? 'bg-rose-950/80 border border-red-500/40 text-red-300 shadow-none'
                        : copied
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 shadow-emerald-600/30 border border-emerald-400/40 ring-1 ring-emerald-400/30'
                        : 'bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 shadow-rose-600/30 ring-1 ring-rose-400/30'
                    }`}
                  >
                    {activeText.length > 2000 ? (
                      <>
                        <AlertCircle className="w-4 h-4 text-red-300 shrink-0" />
                        <span>Нельзя скопировать (превышен лимит)</span>
                      </>
                    ) : copied ? (
                      <>
                        <AnimatedCheckIcon className="w-4.5 h-4.5 text-emerald-100" />
                        <span>Скопировано в буфер!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 shrink-0" />
                        <span>Скопировать готовый пост</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </div>

              {/* Copy History Box */}
              {copyHistory.length > 0 && (
                <div className="bg-[#141722] rounded-2xl p-4 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <History className="w-3.5 h-3.5 text-rose-400" /> История копирований ({copyHistory.length})
                    </span>
                    <button
                      onClick={() => {
                        setCopyHistory([]);
                        localStorage.removeItem('famq_copy_history');
                      }}
                      className="text-[10px] text-slate-500 hover:text-rose-400 transition-colors"
                    >
                      Очистить
                    </button>
                  </div>

                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {copyHistory.map((item) => (
                      <div
                        key={item.id}
                        className="bg-[#0d0e14] p-2.5 rounded-xl border border-slate-800/80 hover:border-slate-700 transition-all space-y-1 text-xs"
                      >
                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span className="font-semibold text-rose-400">{item.categoryLabel}</span>
                          <span className="text-slate-500">{item.timestamp}</span>
                        </div>
                        <p className="text-slate-300 line-clamp-2 text-[11px] font-mono whitespace-pre-wrap">
                          {item.text}
                        </p>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(item.text);
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2000);
                          }}
                          className="w-full pt-1 flex items-center justify-end gap-1 text-[11px] text-rose-400 hover:text-rose-300 font-semibold"
                        >
                          <Copy className="w-3 h-3" /> Скопировать снова
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        </>
        )}
      </main>

      {/* Updates / Changelog Modal */}
      <UpdatesModal isOpen={showUpdatesModal} onClose={() => setShowUpdatesModal(false)} />

      {/* Assistant Onboarding Modal */}
      <AnimatePresence>
        {showAssistantOnboarding && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-xl bg-[#141722] border border-slate-700/80 rounded-2xl shadow-2xl shadow-black/80 p-6 flex flex-col overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 via-rose-500 to-emerald-500" />
              
              <div className="flex items-start gap-4 mb-5">
                <div className="p-3 bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/30 shrink-0">
                  <GraduationCap className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white tracking-tight mb-1">
                    Помогите алгоритмам стать лучше! 🧠
                  </h2>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    Ассистент автоматически проверяет форматирование и транслитерирует названия семей. Если вы подправите текст в инспекторе или примените автофикс и скопируете его, система скрыто запоминает ваши изменения, чтобы алгоритмы автоматически совершенствовались!
                  </p>
                </div>
              </div>

              <div className="bg-[#0b0c13] rounded-xl p-4 border border-slate-800 space-y-2.5 mb-6">
                <div className="flex items-center gap-3 text-xs text-slate-300">
                  <div className="p-1.5 rounded-lg bg-slate-800/80 text-emerald-400"><BookOpen className="w-4 h-4" /></div>
                  <span>Авто-перевод семей на английский с добавлением <strong className="text-emerald-300 font-mono">Famq</strong> (чикен ➔ Chicken Famq).</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-300">
                  <div className="p-1.5 rounded-lg bg-slate-800/80 text-amber-400"><Sparkles className="w-4 h-4" /></div>
                  <span>Фоновое запоминание индивидуальных правок без ручных заведений правил.</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 mb-6">
                <input
                  type="checkbox"
                  id="dont-show-onboarding"
                  checked={dontShowOnboardingAgain}
                  onChange={(e) => setDontShowOnboardingAgain(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-rose-500 focus:ring-rose-500/50 cursor-pointer"
                />
                <label htmlFor="dont-show-onboarding" className="text-xs text-slate-300 font-medium cursor-pointer select-none">
                  Не получать больше это уведомление при заходе в ассистент
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 mt-auto">
                <button
                  type="button"
                  onClick={handleCloseOnboarding}
                  disabled={onboardingCountdown > 0}
                  className={`w-full py-3 rounded-xl font-bold text-xs transition-all shadow-lg text-center ${
                    onboardingCountdown > 0
                      ? 'bg-slate-800/80 text-slate-500 border border-slate-700/50 cursor-not-allowed'
                      : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/25 cursor-pointer'
                  }`}
                >
                  {onboardingCountdown > 0 ? `Понятно (${onboardingCountdown})` : 'Понятно, продолжить'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Updates / Changelog Button (Bottom-Right) */}
      <button
        type="button"
        onClick={() => setShowUpdatesModal(true)}
        className="fixed bottom-5 right-5 z-40 bg-[#12131a] hover:bg-[#181a24] text-slate-300 hover:text-white border border-slate-800 hover:border-rose-500/50 shadow-2xl px-3.5 py-2.5 rounded-full flex items-center gap-2 text-xs font-semibold transition-all hover:scale-105 active:scale-95 group cursor-pointer"
        title="История обновлений"
      >
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
        </span>
        <Sparkles className="w-4 h-4 text-rose-400 group-hover:rotate-12 transition-transform" />
        <span>Что нового?</span>
        <span className="bg-rose-500/10 text-rose-400 text-[10px] font-mono px-1.5 py-0.5 rounded-md border border-rose-500/20">
          v{UPDATES_HISTORY[0].version}
        </span>
      </button>
    </div>
  );
}

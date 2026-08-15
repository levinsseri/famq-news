import {
  collection,
  doc,
  getDocs,
  setDoc,
  addDoc,
  deleteDoc,
  updateDoc,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';

export interface TrainingRule {
  id?: string;
  pattern: string;
  correction: string;
  category: 'family_name' | 'spoilers' | 'formatting' | 'rule_check' | 'custom';
  enabled: boolean;
  notes?: string;
  createdAt?: any;
}

export interface CustomDictItem {
  id?: string;
  cyrillic: string;
  formattedName: string;
  updatedAt?: any;
}

export interface CorrectionExample {
  id?: string;
  originalText: string;
  fixedText: string;
  userNotes?: string;
  createdAt?: any;
}

// Default seed rules if Firestore is fresh
const DEFAULT_RULES: Omit<TrainingRule, 'id'>[] = [
  {
    pattern: 'заморозка каптов по жалобе',
    correction: 'При упоминании "по жалобе" без быстрой ссылки, обязателен спойлер ||ссылка на жалобу|| или прямой URL в ||спойлере||',
    category: 'spoilers',
    enabled: true,
    notes: 'Правило оформления заморозок каптов',
  },
  {
    pattern: 'фамилия / семья',
    correction: 'Выделять имя семьи жирным шрифтом (**Allegri Famq**) и добавлять Famq при наличии в оригинале или словаре',
    category: 'family_name',
    enabled: true,
    notes: 'Правило выделения семей',
  },
  {
    pattern: 'пробелы внутри тегов',
    correction: 'Удалять пробелы внутри звездочек ** текст ** -> **текст**',
    category: 'formatting',
    enabled: true,
    notes: 'Синтаксис Discord Markdown',
  },
];

const DEFAULT_DICT: Omit<CustomDictItem, 'id'>[] = [
  { cyrillic: 'аллегри', formattedName: 'Allegri Famq' },
  { cyrillic: 'кака', formattedName: 'Kaka Famq' },
  { cyrillic: 'китсуне', formattedName: 'Kitsune Famq' },
  { cyrillic: 'кицуне', formattedName: 'Kitsune Famq' },
  { cyrillic: 'блейз', formattedName: 'Blaze Famq' },
];

/**
 * Fetch active training rules from Firestore
 */
export async function fetchTrainingRules(): Promise<TrainingRule[]> {
  try {
    const colRef = collection(db, 'training_rules');
    const snapshot = await getDocs(colRef);
    if (snapshot.empty) {
      // Seed defaults
      const rules: TrainingRule[] = [];
      for (const item of DEFAULT_RULES) {
        const res = await addDoc(colRef, {
          ...item,
          createdAt: serverTimestamp(),
        });
        rules.push({ ...item, id: res.id });
      }
      return rules;
    }

    return snapshot.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<TrainingRule, 'id'>),
    }));
  } catch (err) {
    console.error('Error fetching training rules from Firestore:', err);
    // Fallback in case offline
    return DEFAULT_RULES.map((r, i) => ({ ...r, id: `default-${i}` }));
  }
}

/**
 * Add a new training rule
 */
export async function addTrainingRule(rule: Omit<TrainingRule, 'id'>): Promise<string> {
  const colRef = collection(db, 'training_rules');
  const res = await addDoc(colRef, {
    ...rule,
    createdAt: serverTimestamp(),
  });
  return res.id;
}

/**
 * Toggle a rule's enabled state
 */
export async function toggleTrainingRule(id: string, enabled: boolean): Promise<void> {
  const docRef = doc(db, 'training_rules', id);
  await updateDoc(docRef, { enabled });
}

/**
 * Delete a training rule
 */
export async function deleteTrainingRule(id: string): Promise<void> {
  const docRef = doc(db, 'training_rules', id);
  await deleteDoc(docRef);
}

/**
 * Fetch custom dictionary items
 */
export async function fetchCustomDictionary(): Promise<CustomDictItem[]> {
  try {
    const colRef = collection(db, 'custom_dictionary');
    const snapshot = await getDocs(colRef);
    if (snapshot.empty) {
      const items: CustomDictItem[] = [];
      for (const item of DEFAULT_DICT) {
        const res = await addDoc(colRef, {
          ...item,
          updatedAt: serverTimestamp(),
        });
        items.push({ ...item, id: res.id });
      }
      return items;
    }

    return snapshot.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<CustomDictItem, 'id'>),
    }));
  } catch (err) {
    console.error('Error fetching custom dictionary from Firestore:', err);
    return DEFAULT_DICT.map((d, i) => ({ ...d, id: `default-${i}` }));
  }
}

/**
 * Add or update custom dictionary mapping
 */
export async function saveCustomDictItem(cyrillic: string, formattedName: string): Promise<string> {
  const colRef = collection(db, 'custom_dictionary');
  const cleanKey = cyrillic.trim().toLowerCase();
  
  // Check if exists
  const snapshot = await getDocs(colRef);
  const existing = snapshot.docs.find((d) => d.data().cyrillic?.toLowerCase() === cleanKey);

  if (existing) {
    await updateDoc(doc(db, 'custom_dictionary', existing.id), {
      formattedName: formattedName.trim(),
      updatedAt: serverTimestamp(),
    });
    return existing.id;
  } else {
    const res = await addDoc(colRef, {
      cyrillic: cleanKey,
      formattedName: formattedName.trim(),
      updatedAt: serverTimestamp(),
    });
    return res.id;
  }
}

/**
 * Delete item from custom dictionary
 */
export async function deleteCustomDictItem(id: string): Promise<void> {
  const docRef = doc(db, 'custom_dictionary', id);
  await deleteDoc(docRef);
}

/**
 * Save user correction example for AI learning context
 */
export async function saveCorrectionExample(
  originalText: string,
  fixedText: string,
  userNotes: string = ''
): Promise<string> {
  const colRef = collection(db, 'corrections_history');
  const res = await addDoc(colRef, {
    originalText,
    fixedText,
    userNotes,
    createdAt: serverTimestamp(),
  });
  return res.id;
}

/**
 * Fetch corrections history
 */
export async function fetchCorrectionsHistory(): Promise<CorrectionExample[]> {
  try {
    const colRef = collection(db, 'corrections_history');
    const snapshot = await getDocs(colRef);
    return snapshot.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<CorrectionExample, 'id'>),
    }));
  } catch (err) {
    console.error('Error fetching corrections history:', err);
    return [];
  }
}

/**
 * Delete correction example
 */
export async function deleteCorrectionExample(id: string): Promise<void> {
  const docRef = doc(db, 'corrections_history', id);
  await deleteDoc(docRef);
}

/**
 * Advanced Token-Sequence Diff Alignment Engine & Pattern Extractor
 * Identifies phrase or word-level corrections between original and edited texts.
 */
export function extractLearnedPatternsFromDiff(
  originalText: string,
  fixedText: string
): Array<{ cyrillic: string; formattedName: string }> {
  if (!originalText || !fixedText || originalText.trim() === fixedText.trim()) {
    return [];
  }

  const clean = (str: string) => str.replace(/[«"”’'"`*_~|]/g, '').trim();

  const origTokens = originalText.split(/\s+/).filter(Boolean);
  const fixedTokens = fixedText.split(/\s+/).filter(Boolean);

  const results: Array<{ cyrillic: string; formattedName: string }> = [];
  const seenKeys = new Set<string>();

  // 1. Equal Token Count Direct Word-by-Word Alignment
  if (origTokens.length === fixedTokens.length && origTokens.length > 0) {
    for (let i = 0; i < origTokens.length; i++) {
      const origWord = clean(origTokens[i]).toLowerCase();
      const fixedWord = clean(fixedTokens[i]);

      if (origWord.length >= 2 && fixedWord && origWord !== fixedWord.toLowerCase()) {
        if (!seenKeys.has(origWord)) {
          seenKeys.add(origWord);
          results.push({ cyrillic: origWord, formattedName: fixedWord });
        }
      }
    }
  }

  // 2. Multi-Word Sequence Alignment using Sliding Window Subsequence Matching
  for (let windowLen = 1; windowLen <= Math.min(3, origTokens.length); windowLen++) {
    for (let i = 0; i <= origTokens.length - windowLen; i++) {
      const origSlice = origTokens.slice(i, i + windowLen).map(clean).join(' ').toLowerCase();
      if (!origSlice || origSlice.length < 2) continue;

      for (let fLen = 1; fLen <= Math.min(4, fixedTokens.length); fLen++) {
        for (let j = 0; j <= fixedTokens.length - fLen; j++) {
          const fixedSlice = fixedTokens.slice(j, j + fLen).map(clean).join(' ');
          if (!fixedSlice) continue;

          if (
            /Famq\b/i.test(fixedSlice) ||
            /^[A-Z][a-zA-Z0-9\s]+$/.test(fixedSlice) ||
            /^(FIB|LSPD|LSCSD|SANG|GOV|EMS|WN|Marabunta Grande|Los Santos Vagos|Blood Street Gang|The Ballas Gang|The Families)$/i.test(fixedSlice)
          ) {
            if (origSlice !== fixedSlice.toLowerCase() && !seenKeys.has(origSlice)) {
              seenKeys.add(origSlice);
              results.push({ cyrillic: origSlice, formattedName: fixedSlice });
            }
          }
        }
      }
    }
  }

  return results;
}

/**
 * Auto-process correction diff, store in corrections_history,
 * and automatically populate custom_dictionary for extracted patterns.
 */
export async function autoProcessCorrectionAndLearn(
  originalText: string,
  fixedText: string,
  userNotes: string = 'Авто-обучение алгоритма'
): Promise<{ correctionId: string; learnedPatternsCount: number }> {
  if (!originalText || !fixedText || originalText.trim() === fixedText.trim()) {
    return { correctionId: '', learnedPatternsCount: 0 };
  }

  const correctionId = await saveCorrectionExample(originalText, fixedText, userNotes);

  const extractedPatterns = extractLearnedPatternsFromDiff(originalText, fixedText);
  let learnedCount = 0;

  for (const item of extractedPatterns) {
    if (item.cyrillic && item.formattedName) {
      await saveCustomDictItem(item.cyrillic, item.formattedName);
      learnedCount++;
    }
  }

  return { correctionId, learnedPatternsCount: learnedCount };
}


'use client';

import type { TopicScript } from './schema';
import type { ReviewState } from './review';
import { initialReviewState } from './review';

/**
 * 本地存储层 · 仅浏览器端
 *
 * 使用 localStorage。v1 够用，后续可以平滑切到 IndexedDB 或服务端。
 *
 * 存储结构（单一 key，整体读写）：
 *   dao-studio:topics  → { [id]: TopicEntry }
 *
 * 选择全量读写而非多 key，是因为条目数不会太多（个人学习用，几十到几百），
 * 简化了事务一致性。
 */

export type TopicEntry = {
  script: TopicScript;
  /** 用户对这个视频的笔记（markdown） */
  notes: string;
  /** 间隔复习状态 */
  review: ReviewState;
  /** 创建/更新时间 */
  createdAt: string;
  updatedAt: string;
};

const STORAGE_KEY = 'dao-studio:topics';

function readAll(): Record<string, TopicEntry> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeAll(data: Record<string, TopicEntry>): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  // 同 tab 不会触发 storage 事件，手动派发一个供 UI 订阅
  window.dispatchEvent(new Event('dao-studio:changed'));
}

export function listTopics(): TopicEntry[] {
  const all = readAll();
  return Object.values(all).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

export function getTopic(id: string): TopicEntry | null {
  return readAll()[id] ?? null;
}

export function saveTopic(script: TopicScript): TopicEntry {
  const all = readAll();
  const now = new Date().toISOString();
  const existing = all[script.id];

  const entry: TopicEntry = existing
    ? { ...existing, script, updatedAt: now }
    : {
        script,
        notes: '',
        review: initialReviewState(),
        createdAt: now,
        updatedAt: now,
      };

  all[script.id] = entry;
  writeAll(all);
  return entry;
}

export function updateNotes(id: string, notes: string): void {
  const all = readAll();
  const entry = all[id];
  if (!entry) return;
  entry.notes = notes;
  entry.updatedAt = new Date().toISOString();
  writeAll(all);
}

export function updateReview(id: string, review: ReviewState): void {
  const all = readAll();
  const entry = all[id];
  if (!entry) return;
  entry.review = review;
  entry.updatedAt = new Date().toISOString();
  writeAll(all);
}

export function updateScript(id: string, script: TopicScript): void {
  const all = readAll();
  const entry = all[id];
  if (!entry) return;
  entry.script = script;
  entry.updatedAt = new Date().toISOString();
  writeAll(all);
}

export function deleteTopic(id: string): void {
  const all = readAll();
  delete all[id];
  writeAll(all);
}

/** 导出全部（用于备份） */
export function exportAll(): string {
  return JSON.stringify(readAll(), null, 2);
}

/** 导入（合并策略：ID 相同覆盖） */
export function importAll(json: string): { imported: number } {
  const data = JSON.parse(json) as Record<string, TopicEntry>;
  const current = readAll();
  let imported = 0;
  for (const [id, entry] of Object.entries(data)) {
    current[id] = entry;
    imported++;
  }
  writeAll(current);
  return { imported };
}

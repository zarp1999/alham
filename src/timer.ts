export type TimerSession = { habitId: string; durationMs: number; remainingMs: number; endAt: number | null };
export function remaining(session: TimerSession, now: number) { return Math.max(0, session.endAt === null ? session.remainingMs : session.endAt - now); }
export function pauseTimer(session: TimerSession, now: number): TimerSession { return { ...session, remainingMs: remaining(session, now), endAt: null }; }
export function resumeTimer(session: TimerSession, now: number): TimerSession { return { ...session, endAt: now + session.remainingMs }; }
export function defaultMinutes(action: string) { const match = action.normalize('NFKC').match(/^\s*(\d+)分/); const n = Number(match?.[1]); return n >= 1 && n <= 1440 ? n : 15; }
export function parseTimer(value: string | null): TimerSession | null {
  if (!value) return null;
  try { const s = JSON.parse(value); return typeof s.habitId === 'string' && s.habitId.length > 0 && Number.isFinite(s.durationMs) && s.durationMs > 0 && s.durationMs <= 86400000 && Number.isFinite(s.remainingMs) && s.remainingMs >= 0 && s.remainingMs <= s.durationMs && (s.endAt === null || (Number.isFinite(s.endAt) && s.endAt > 0)) ? s : null; } catch { return null; }
}
export function notificationHabitId(payload: unknown, ids: string[]) { if (!payload || typeof payload !== 'object') return null; const id = (payload as { habitId?: unknown }).habitId; return typeof id === 'string' && ids.includes(id) ? id : null; }
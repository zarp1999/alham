const { test } = require('node:test');
const assert = require('node:assert/strict');
const d = require('../.test-build/domain.js');
const habit = { id: 'h1', name: '読書', action: '１ページ', reason: '', category: '読書', created: '2026-10-01', paused: false,
  schedules: [{ from: '2026-10-01', kind: 'days', days: [1, 3, 5], target: 3 }] };
test('local dates cross month/year boundaries without UTC conversion', () => {
  assert.equal(d.shift('2026-12-31', 1), '2027-01-01');
  assert.equal(d.weekStart('2026-11-01'), '2026-10-26');
  assert.equal(d.dateKey(new Date(2026, 9, 20, 0, 1)), '2026-10-20');
});
test('schedule edits preserve earlier weekdays and creation bounds', () => {
  const edited = { ...habit, schedules: [...habit.schedules, { from: '2026-10-20', kind: 'daily', days: [], target: 1 }] };
  assert.equal(d.isDue(edited, '2026-10-19'), true);
  assert.equal(d.isDue(edited, '2026-10-18'), false);
  assert.equal(d.isDue(edited, '2026-10-20'), true);
  assert.equal(d.isDue(edited, '2026-09-30'), false);
});
test('one record per day; rest and undo do not inflate weekly counts', () => {
  let data = { habits: [habit], entries: [] };
  data = d.withEntry(data, 'h1', '2026-10-19', 'done');
  data = d.withEntry(data, 'h1', '2026-10-19', 'done');
  data = d.withEntry(data, 'h1', '2026-10-20', 'rest');
  data = d.withEntry(data, 'h1', '2026-10-18', 'done');
  assert.equal(data.entries.length, 3);
  assert.equal(d.weeklyCount(data, 'h1', '2026-10-20'), 1);
  data = d.withEntry(data, 'h1', '2026-10-19');
  assert.equal(d.weeklyCount(data, 'h1', '2026-10-20'), 0);
});
test('backup round trip preserves Japanese text and complete history', () => {
  const data = d.withEntry({ habits: [habit], entries: [] }, 'h1', '2026-10-19', 'done');
  assert.deepEqual(d.parseBackup(d.backup(data)), data);
});
test('invalid dates, orphan entries, duplicate IDs and malformed schedules rejected', () => {
  const data = { version: 1, habits: [habit], entries: [] };
  for (const bad of [
    { ...data, version: 99 },
    { ...data, habits: [habit, habit] },
    { ...data, entries: [{ habitId: 'missing', date: '2026-10-19', status: 'done' }] },
    { ...data, entries: [{ habitId: 'h1', date: '2026-02-30', status: 'done' }] },
    { ...data, habits: [{ ...habit, schedules: [{ ...habit.schedules[0], kind: 'days', days: [] }] }] },
    { ...data, habits: [{ ...habit, schedules: [{ ...habit.schedules[0], target: 8 }] }] },
    { ...data, entries: [{ habitId: 'h1', date: '2026-10-19', status: 'done' }, { habitId: 'h1', date: '2026-10-19', status: 'rest' }] }
  ]) assert.throws(() => d.parseBackup(JSON.stringify(bad)));
});

const { reminderPlans, validReminder } = require('../.test-build/reminder-plan.js');
test('reminder time validates 24h boundaries and survives backup; legacy backups still work', () => {
  for (const value of ['00:00', '23:59', '09:05']) assert.equal(validReminder(value), true);
  for (const value of ['24:00', '12:60', '9:5', '', null]) {
    assert.equal(validReminder(value), false);
    assert.throws(() => d.parseBackup(d.backup({ habits: [{ ...habit, reminder: value }], entries: [] })));
  }
  const data = { habits: [{ ...habit, reminder: '20:30' }], entries: [] };
  assert.deepEqual(d.parseBackup(d.backup(data)), data);
  assert.deepEqual(d.parseBackup(d.backup({ habits: [habit], entries: [] })).habits[0], habit);
});
test('reminder plans map weekdays to Expo, stop paused/off habits, and follow current schedule', () => {
  const h = { ...habit, reminder: '20:30' };
  const plans = reminderPlans([h], '2026-10-21');
  assert.deepEqual(plans.map(p => p.weekday), [2, 4, 6]);
  assert.equal(plans[0].hour, 20); assert.equal(plans[0].minute, 30);
  assert.equal(new Set(plans.map(p => p.id)).size, 3);
  assert.deepEqual(reminderPlans([{ ...h, paused: true }, habit], '2026-10-21'), []);
  const changed = { ...h, schedules: [...h.schedules, { from: '2026-10-21', kind: 'weekly', days: [], target: 3 }] };
  assert.equal(reminderPlans([changed], '2026-10-20').length, 3);
  assert.equal(reminderPlans([changed], '2026-10-21').length, 1);
  assert.equal(reminderPlans([changed], '2026-10-21')[0].weekday, undefined);
  assert.equal(reminderPlans([{ ...h, schedules: [{ ...h.schedules[0], days: [0] }] }], '2026-10-21')[0].weekday, 1);
});

const { parseMinutes, normalizeMinutesInput, timedAction } = require('../.test-build/discovery.js');
test('custom minutes accept full-width input and retain the entered duration in suggestions', () => {
  assert.equal(normalizeMinutesInput('１５'), '15');
  assert.equal(parseMinutes('１５'), 15);
  assert.equal(parseMinutes('1'), 1);
  assert.equal(parseMinutes('1440'), 1440);
  for (const input of ['', '0', '-1', '1.5', '1441', '15分', 'abc']) assert.equal(parseMinutes(input), null);
  require('../.test-build/i18n.js').setLanguage('ja');
  assert.equal(timedAction('本を読む', parseMinutes('25')), '25分、本を読む');
});

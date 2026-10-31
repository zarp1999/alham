const test = require('node:test');
const assert = require('node:assert/strict');
const { remaining, pauseTimer, resumeTimer, parseTimer, defaultMinutes, notificationHabitId } = require('../.test-build/timer.js');
test('timer survives background time and restart without interval ticks', () => {
  const s = { habitId: 'a', durationMs: 60000, remainingMs: 60000, endAt: 61000 };
  assert.equal(remaining(s, 31000), 30000);
  assert.equal(remaining(parseTimer(JSON.stringify(s)), 90000), 0);
  const paused = pauseTimer(s, 21000);
  assert.equal(remaining(paused, 90000), 40000);
  assert.equal(remaining(resumeTimer(paused, 90000), 100000), 30000);
  assert.equal(remaining(pauseTimer(s, 90000), 91000), 0);
});
test('timer rejects invalid saved state and derives only time goals', () => {
  assert.equal(parseTimer('{'), null);
  assert.equal(parseTimer('null'), null);
  assert.equal(parseTimer(JSON.stringify({habitId:'a',durationMs:-1,remainingMs:10,endAt:null})), null);
  assert.equal(defaultMinutes('１５分、本を読む'), 15);
  assert.equal(defaultMinutes('５分、歩く'), 5);
  assert.equal(defaultMinutes('１ページ読む'), 15);
});
test('notification navigation only accepts existing habit identifiers', () => {
  assert.equal(notificationHabitId({habitId:'a'}, ['a']), 'a');
  for (const payload of [null, {}, {habitId:'removed'}, {habitId:['a']}, {url:'https://example.com'}]) assert.equal(notificationHabitId(payload, ['a']), null);
});

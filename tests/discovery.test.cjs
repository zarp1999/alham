const test = require('node:test');
const assert = require('node:assert/strict');
const { discoveryGoals } = require('../.test-build/discovery');
const { habitCategories, filterTemplates } = require('../.test-build/habit-templates');
const { setLanguage, tr } = require('../.test-build/i18n');
test('Discovery covers every template category and offers all candidates when undecided', () => {
  assert.deepEqual(discoveryGoals.filter(g => g.category).map(g => g.category), habitCategories);
  for (const g of discoveryGoals) assert.ok(filterTemplates('', g.category).length > 0);
  assert.equal(filterTemplates('', discoveryGoals.find(g => !g.category).category).length, 61);
  setLanguage('mn');
  try { for (const g of discoveryGoals) assert.notEqual(tr(g.label), g.label); }
  finally { setLanguage('ja'); }
});

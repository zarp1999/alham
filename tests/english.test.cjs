const test = require('node:test');
const assert = require('node:assert/strict');
const {setLanguage,tr,weekday,canonicalUnit} = require('../.test-build/i18n');
const {habitTemplates,habitCategories,filterTemplates} = require('../.test-build/habit-templates');
const {discoveryGoals} = require('../.test-build/discovery');
const {widgetProps} = require('../.test-build/widget-data');
test('English covers habit examples, categories and onboarding choices', () => {
  setLanguage('en');
  try {
    for (const t of habitTemplates) { assert.notEqual(tr(t.name),t.name,t.name); assert.notEqual(tr(t.action),t.action,t.action); }
    for (const name of habitCategories) assert.notEqual(tr(name),name,name);
    for (const g of discoveryGoals) assert.notEqual(tr(g.label),g.label,g.label);
    assert.ok(filterTemplates('gym','').some(t=>t.name==='ジムに行く'));
    assert.equal(weekday(1),'Mon'); assert.equal(canonicalUnit('pages'),'ページ');
    assert.equal(tr('{0}の時間です','読書'),'Time for 読書');
    assert.equal(widgetProps({habits:[],entries:[]},'2026-10-29','en').title, "Today's habits");
  } finally { setLanguage('ja'); }
});

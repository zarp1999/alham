const {test}=require('node:test');
const assert=require('node:assert/strict');
const {habitTemplates,habitCategories,filterTemplates}=require('../.test-build/habit-templates.js');
const {validGoal,parseBackup,backup}=require('../.test-build/domain.js');
test('every template can be saved and restored with its suggested goal',()=>{
 assert.equal(habitTemplates.length,61);assert.equal(new Set(habitTemplates.map(t=>t.id)).size,61);
 for(const t of habitTemplates){
  if(t.goal) assert.equal(validGoal(t.goal),true,t.name);
  const data={habits:[{...t,created:'2026-10-26',reason:'',paused:false,schedules:[{from:'2026-10-26',kind:'daily',days:[],target:7}]}],entries:[]};
  assert.equal(parseBackup(backup(data)).habits[0].name,t.name);
 }
 for(const c of habitCategories) assert.equal(filterTemplates('',c).length,c === '運動' ? 7 : 6);
});
test('template search matches names, actions, categories and combined terms',()=>{
 assert.ok(filterTemplates('散歩','').some(t=>t.name==='散歩する'));
 assert.ok(filterTemplates('読書','').every(t=>t.category==='読書'));
 assert.equal(filterTemplates('散歩','お金').length,0);
 assert.ok(filterTemplates('５分 歩く','運動').some(t=>t.name==='散歩する'));
 assert.equal(filterTemplates('見つからない習慣','').length,0);
});

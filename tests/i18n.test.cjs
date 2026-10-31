const {test,afterEach}=require('node:test');
const assert=require('node:assert/strict');
const {tr,setLanguage,getLanguage,weekday,subscribeLanguage}=require('../.test-build/i18n.js');
const {mn}=require('../.test-build/mn.js');
const {habitTemplates,habitCategories,filterTemplates}=require('../.test-build/habit-templates.js');
const {scheduleLabel,backup,parseBackup}=require('../.test-build/domain.js');
const {goalDraft,draftGoal}=require('../.test-build/measurements.js');
afterEach(()=>setLanguage('ja'));
test('switching language translates UI and not interpolation values',()=>{
 let calls=0; const unsub=subscribeLanguage(()=>calls++);
 setLanguage('mn');assert.equal(getLanguage(),'mn');assert.equal(tr('設定'),'Тохиргоо');
 assert.equal(tr('{0}の時間です','本を読む'),'本を読む: хийх цаг боллоо');
 assert.equal(weekday(1),'Да');assert.equal(scheduleLabel({kind:'weekly',target:3}),'Долоо хоногт 3 удаа');
 setLanguage('ja');assert.equal(tr('設定'),'設定');assert.equal(weekday(1),'月');assert.equal(calls,2);unsub();
});
test('every template and category has Mongolian translations and can be searched',()=>{
 setLanguage('mn');
 for(const t of habitTemplates) for(const text of [t.name,t.action,t.category]) {assert.ok(mn[text],text);assert.ok(!/[\u3040-\u30ff\u3400-\u9fff]/.test(tr(text)),text);}
 for(const c of habitCategories) assert.ok(mn[c]);
 assert.ok(filterTemplates('фитнесс','').some(t=>t.name==='ジムに行く'));
});
test('translated units retain canonical stored units and user content stays intact',()=>{
 const goal={kind:'amount',unit:'ページ',target:5};setLanguage('mn');
 assert.equal(goalDraft(goal).unit,'хуудас');assert.deepEqual(draftGoal(goalDraft(goal)),goal);
 for(const unit of ['本','個','杯','枚','km']) { const g={kind:'amount',unit,target:1};assert.deepEqual(draftGoal(goalDraft(g)),g); }
 const data={habits:[{id:'h',name:'本を読む',action:'Миний зорилго',reason:'自分の理由',category:'読書',created:'2026-10-01',paused:false,goal,schedules:[{from:'2026-10-01',kind:'daily',days:[],target:7}]}],entries:[]};
 assert.deepEqual(parseBackup(backup(data)),data);
});

const {test}=require('node:test');
const assert=require('node:assert/strict');
const d=require('../.test-build/domain.js');
const m=require('../.test-build/measurements.js');
const goal={kind:'time',unit:'分',target:10};
const habit={id:'h',name:'読書',action:'読む',reason:'',category:'読書',created:'2026-09-01',paused:false,goal,schedules:[{from:'2026-09-01',kind:'daily',days:[],target:7}]};
const base=()=>({habits:[habit],entries:[]});
test('partial amounts, target achievement, and replacing a daily total',()=>{
 let data=d.withMeasurement(base(),'h','2026-10-23',goal,3.5);
 assert.equal(data.entries[0].status,'progress');
 assert.equal(d.weeklyCount(data,'h','2026-10-23'),0);
 data=d.withMeasurement(data,'h','2026-10-23',goal,12);
 data=d.withMeasurement(data,'h','2026-10-23',goal,12);
 assert.equal(data.entries.length,1); assert.equal(data.entries[0].measurement.value,12);
 assert.equal(data.entries[0].status,'done');
 assert.equal(d.withEntry(data,'h','2026-10-23','rest').entries[0].measurement,undefined);
 assert.equal(d.withEntry(data,'h','2026-10-23').entries.length,0);
});
test('goals and units are snapshots; different units are never added together',()=>{
 let data=d.withMeasurement(base(),'h','2026-10-21',goal,5);
 data=d.withMeasurement(data,'h','2026-10-22',{kind:'amount',unit:'ページ',target:3},8);
 data=d.withMeasurement(data,'h','2026-10-14',goal,2);
 data=d.withMeasurement(data,'h','2026-10-24',goal,100);
 data=d.updateHabit(data,{...habit,goal:{kind:'amount',unit:'km',target:1}});
 const result=m.summarize(data,'h','2026-10-23',7);
 assert.equal(result.days,2);assert.equal(result.done,1);
 assert.equal(result.series.find(x=>x.unit==='分').total,5);
 assert.equal(result.series.find(x=>x.unit==='分').previous,2);
 assert.equal(result.series.find(x=>x.unit==='ページ').total,8);
 assert.equal(data.entries[0].measurement.target,10);
});
test('legacy backups stay readable and unmeasured achievements are not invented',()=>{
 const {goal:_,...legacyHabit}=habit;
 const legacy={version:1,habits:[legacyHabit],entries:[{habitId:'h',date:'2026-10-23',status:'done'}]};
 const data=d.parseBackup(JSON.stringify(legacy));
 const result=m.summarize(data,'h','2026-10-23',7);
 assert.equal(result.unmeasured,1);assert.deepEqual(result.series,[]);
 const newData=d.withMeasurement(data,'h','2026-10-22',goal,1.25);
 assert.deepEqual(d.parseBackup(d.backup(newData)),newData);
 assert.equal(JSON.parse(d.backup(newData)).version,2);
});
test('backup rejects invalid measures, missing progress amounts, and inconsistent status',()=>{
 const data=d.withMeasurement(base(),'h','2026-10-23',goal,5);
 for(const bad of [NaN,Infinity,0,-1,1.234,1000001]) {
   assert.throws(()=>d.withMeasurement(base(),'h','2026-10-23',goal,bad));
   assert.throws(()=>d.parseBackup(d.backup({...data,entries:[{...data.entries[0],measurement:{...goal,value:bad}}]})));
 }
 for(const change of [{status:'done'},{status:'rest'},{measurement:undefined}]) assert.throws(()=>d.parseBackup(d.backup({...data,entries:[{...data.entries[0],...change}]})));
 for(const goal of [{kind:'time',unit:'km',target:1},{kind:'count',unit:'ページ',target:1},{kind:'amount',unit:' ',target:1}]) assert.throws(()=>d.parseBackup(d.backup({habits:[{...habit,goal}],entries:[]})));
});
test('numeric inputs, decimals, and calendar boundaries',()=>{
 assert.equal(m.parseAmount('１２．５'),12.5);
 for(const v of ['', '0','-1','1e3','1.234','Infinity','1000001']) assert.equal(m.parseAmount(v),null);
 assert.equal(m.draftGoal({kind:'time',target:'5',unit:'ページ'}).unit,'分');
 const data=d.withMeasurement(base(),'h','2026-10-01',goal,0.1);
 const result=m.summarize(data,'h','2026-10-02',7);
 assert.equal(result.start,'2026-09-26');assert.equal(result.series[0].points.length,7);
 assert.equal(result.series[0].total,0.1);
});

test('check-only and empty histories provide complete daily chart points',()=>{
 let data=d.withEntry(base(),'h','2026-10-20','done');
 data=d.withEntry(data,'h','2026-10-21','rest');
 data=d.withMeasurement(data,'h','2026-10-22',goal,2);
 const result=m.summarize(data,'h','2026-10-23',7);
 assert.equal(result.activity.length,7);
 assert.deepEqual(result.activity.slice(-4).map(p=>p.status),['done','rest','progress','none']);
 const empty=m.summarize(base(),'h','2026-10-23',30);
 assert.equal(empty.activity.length,30);
 assert.ok(empty.activity.every(p=>p.status==='none'));
});

test('combined chart counts habits once per day without mixing quantities or rest days',()=>{
 const data={habits:[],entries:[
 {habitId:'a',date:'2026-10-23',status:'done',measurement:{kind:'time',unit:'分',target:10,value:20}},
 {habitId:'b',date:'2026-10-23',status:'done',measurement:{kind:'amount',unit:'ページ',target:1,value:200}},
 {habitId:'c',date:'2026-10-23',status:'progress'},
 {habitId:'d',date:'2026-10-22',status:'rest'},
 {habitId:'a',date:'2026-10-16',status:'done'},
 {habitId:'a',date:'2026-10-24',status:'done'}]};
 const week=m.summarizeAll(data,'2026-10-23',7);
 assert.equal(week.points.length,7); assert.equal(week.done,2); assert.equal(week.progress,1); assert.equal(week.activeDays,1); assert.equal(week.previousDone,1);
 assert.deepEqual(week.points.at(-1),{date:'2026-10-23',done:2,progress:1});
 const month=m.summarizeAll(data,'2026-10-23',30);
 assert.equal(month.points.length,30); assert.equal(month.done,3); assert.equal(month.activeDays,2);
 const empty=m.summarizeAll({habits:[],entries:[]},'2027-01-01',7);
 assert.equal(empty.start,'2026-12-26');assert.equal(empty.done,0);
});

test('habit chart retains identity, stable colors, partial status, and daily ordering',()=>{
 const h2={...habit,id:'h2',name:'散歩',paused:true};
 let data={habits:[habit,h2],entries:[]};
 data=d.withMeasurement(data,'h','2026-10-23',goal,4);
 data=d.withEntry(data,'h2','2026-10-23','done');
 data=d.withEntry(data,'h','2026-10-22','rest');
 data=d.withEntry(data,'h','2026-10-24','done');
 const week=m.habitChart(data,'2026-10-23',7);
 const month=m.habitChart(data,'2026-10-23',30);
 assert.equal(week.points.length,7);assert.equal(month.points.length,30);
 assert.deepEqual(week.points.at(-1).segments.map(s=>s.id),['h','h2']);
 assert.equal(week.points.at(-1).segments[0].entry.status,'progress');
 assert.equal(week.points.at(-1).done,1);
 assert.equal(week.points.at(-2).segments.length,0);
 assert.deepEqual(week.habits,month.habits);
 assert.notEqual(week.habits[0].color,week.habits[1].color);
 const empty=m.habitChart({habits:[habit],entries:[]},'2027-01-01',7);
 assert.equal(empty.start,'2026-12-26');assert.equal(empty.habits.length,0);
});

test('current week is Monday to Sunday, excluding future and previous week records',()=>{
 let data=d.withEntry(base(),'h','2026-10-25','done');
 data=d.withEntry(data,'h','2026-10-26','done');
 data=d.withEntry(data,'h','2026-10-27','done');
 const monday=m.currentWeekChart(data,'2026-10-26');
 assert.equal(monday.start,'2026-10-26');assert.equal(monday.end,'2026-11-01');
 assert.equal(monday.points.length,7);assert.equal(monday.points[0].done,1);
 assert.ok(monday.points.slice(1).every(p=>p.segments.length===0));
 const sunday=m.currentWeekChart(data,'2026-11-01');
 assert.equal(sunday.start,'2026-10-26');assert.equal(sunday.points[1].done,1);
 const newYear=m.currentWeekChart(base(),'2027-01-01');
 assert.equal(newYear.start,'2026-12-28');assert.equal(newYear.end,'2027-01-03');
});

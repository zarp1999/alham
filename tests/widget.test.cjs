const test = require('node:test');
const assert = require('node:assert/strict');
const {widgetProps,widgetTimeline} = require('../.test-build/widget-data');
const habit = (id, extra={}) => ({id,name:id,action:'',category:'暮らし',reason:'',created:'2026-01-01',paused:false,schedules:[{from:'2026-01-01',kind:'daily',days:[],target:7}],...extra});
test('widgets match today schedules, hide paused habits and sort pending first without changing names',()=>{
 const data={habits:[habit('done'),habit('ジム & fitness'),habit('paused',{paused:true}),habit('wednesday',{schedules:[{from:'2026-01-01',kind:'days',days:[3],target:1}]}),habit('future',{created:'2027-01-01'})],entries:[{habitId:'done',date:'2026-10-27',status:'done'}]};
 const props=widgetProps(data,'2026-10-27','mn');
 assert.deepEqual(props.rows.map(r=>r.id),['ジム & fitness','done']);
 assert.equal(props.rows[1].done,true);
 assert.ok(props.title.includes('Өнөөдрийн'));
 assert.equal(new URL(props.rows[0].url).searchParams.get('id'),'ジム & fitness');
 assert.equal(widgetProps(data,'2026-10-28','ja').rows.find(r=>r.id==='done').done,false);
 assert.ok(widgetProps(data,'2026-10-28','ja').rows.some(r=>r.id==='wednesday'));
});
test('timeline crosses local midnight and year boundary, with independent daily statuses',()=>{
 const now=new Date(2026,11,31,23,59);
 const entries=widgetTimeline({habits:[habit('read')],entries:[{habitId:'read',date:'2026-12-31',status:'done'}]},'ja',now);
 assert.equal(entries[0].props.rows[0].done,true);
 assert.equal(entries[1].date.getFullYear(),2027);
 assert.equal(entries[1].date.getHours(),0);
 assert.equal(entries[1].props.rows[0].done,false);
 assert.equal(widgetProps({habits:[],entries:[]},'2026-10-27','ja').rows.length,0);
});

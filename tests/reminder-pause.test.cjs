const test=require('node:test');
const assert=require('node:assert/strict');
const {reminderPlans}=require('../.test-build/reminder-plan');
test('pausing keeps reminder settings and resuming restores the same schedule',()=>{
 const h={id:'one',name:'Reading',action:'Read',created:'2026-01-01',paused:false,reminder:'20:30',schedules:[{from:'2026-01-01',kind:'days',days:[1,3],target:2}]};
 const before=reminderPlans([h],'2026-10-29',true);
 assert.equal(before.length,2); assert.deepEqual(reminderPlans([h],'2026-10-29',false),[]);
 assert.equal(h.reminder,'20:30'); assert.deepEqual(reminderPlans([h],'2026-10-29',true),before);
});

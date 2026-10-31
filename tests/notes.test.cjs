const test=require('node:test');
const assert=require('node:assert/strict');
const d=require('../.test-build/domain');
const habit={id:'h',name:'読書',action:'読む',reason:'',category:'読書',created:'2026-01-01',paused:false,schedules:[{from:'2026-01-01',kind:'daily',days:[],target:7}]};
const base=()=>({habits:[habit],entries:[]});
test('check-only notes survive save, restart, edits and rest status',()=>{
 let data=d.withEntry(base(),'h','2026-10-31','done');
 data=d.withNote(data,'h','2026-10-31','10ページから\n腕立て');
 assert.deepEqual(d.parseBackup(d.backup(data)),data);
 data=d.withEntry(data,'h','2026-10-31','rest'); assert.equal(data.entries[0].note,'10ページから\n腕立て');
 data=d.withEntry(data,'h','2026-10-31','done'); assert.equal(data.entries[0].note,'10ページから\n腕立て');
 data=d.withNote(data,'h','2026-10-31',''); assert.equal(data.entries[0].note,undefined);
});
test('measurement edits preserve notes and notes remain optional',()=>{
 const g={kind:'amount',unit:'ページ',target:10};
 let data=d.withMeasurement(base(),'h','2026-10-31',g,3);
 data=d.withNote(data,'h','2026-10-31','p.12–15');
 data=d.withMeasurement(data,'h','2026-10-31',g,10);
 assert.equal(data.entries[0].note,'p.12–15'); assert.equal(data.entries[0].status,'done');
 assert.deepEqual(d.parseBackup(d.backup(data)),data);
 assert.throws(()=>d.withNote(data,'h','2026-10-31','x'.repeat(2001)));
 assert.throws(()=>d.withNote(data,'h','2026-10-30','missing'));
});

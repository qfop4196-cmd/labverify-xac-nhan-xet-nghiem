import {test} from 'node:test';import assert from 'node:assert/strict';
import '../tests/engine.test.mjs';
const {makeDraft}=await import('../.test-build/demo.mjs');
const base=process.env.TEST_BASE||'http://localhost:3000';
const cookie='__sites_local_auth=1';
const get=async(auth=true)=>{const r=await fetch(base+'/api/lab',{headers:auth?{cookie}:{}});return {status:r.status,data:await r.json()};};
const post=async(action,data={},options={})=>{const r=await fetch(base+'/api/lab',{method:'POST',headers:{'Content-Type':'application/json',cookie,...options},body:JSON.stringify({action,...data})});const text=await r.text();let dataOut;try{dataOut=JSON.parse(text);}catch{dataOut={error:text};}return {status:r.status,data:dataOut};};
test('API rejects unsigned-in callers',async()=>assert.equal((await get(false)).status,401));
test('API rejects cross-origin mutations',async()=>assert.equal((await post('save',{draft:makeDraft(undefined,true)},{origin:'https://unrelated.invalid'})).status,403));
test('Authenticated store has seeded records',async()=>{const r=await get();assert.equal(r.status,200);assert.ok(r.data.records.length>=12);assert.equal(r.data.records.filter(r=>r.sample).length,12);});
test('Persistence, optimistic locking, workflow authorization and immutability',async()=>{
 const d=makeDraft(undefined,true);d.title='API integration synthetic study';
 const save=await post('save',{draft:d});assert.equal(save.status,200);const id=save.data.id;
 let r=await get();let record=r.data.records.find(r=>r.id===id);assert.ok(record);assert.equal(record.draft.title,d.title);
 const edited=await post('save',{id,revision:1,draft:{...d,title:'API integration updated'}});assert.equal(edited.status,200);
 assert.equal((await post('save',{id,revision:1,draft:d})).status,409);
 assert.equal((await post('transition',{id,revision:2,status:'approved',note:'Bypass'})).status,409);
 assert.equal((await post('transition',{id,revision:2,status:'review'})).status,200);
 assert.equal((await post('save',{id,revision:3,draft:d})).status,409);
 assert.equal((await post('transition',{id,revision:3,status:'approved',note:'Self approval'})).status,403);
 assert.equal((await post('transition',{id,revision:3,status:'returned',note:'Synthetic request for correction'})).status,200);
 r=await get();assert.ok(r.data.audit.some(a=>a.recordId===id&&a.action==='Chuyển trạng thái'));
});
test('Demo role is limited to synthetic records',async()=>{
 const r=await get(),record=r.data.records.find(r=>r.sample&&r.status==='review');if(!record)return;
 assert.equal((await post('transition',{id:record.id,revision:record.revision,status:'returned',note:'Test role denial',demoRole:'technician'})).status,403);
});
test('Broken payload is rejected without writing record',async()=>assert.equal((await post('save',{draft:{bad:true}})).status,400));

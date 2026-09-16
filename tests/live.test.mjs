import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import worker from '../live/worker.mjs';
import {commit} from '../live/storage.mjs';

function database(){
 const raw=new DatabaseSync(':memory:');raw.exec(readFileSync(new URL('../drizzle/0000_wakeful_corsair.sql',import.meta.url),'utf8'));
 const prepare=sql=>{let args=[];return {bind(...values){args=values;return this;},async first(){return raw.prepare(sql).get(...args)||null;},async all(){return {results:raw.prepare(sql).all(...args)};},async run(){return raw.prepare(sql).run(...args);}};};
 return {raw,prepare,async batch(statements){raw.exec('BEGIN');try{const out=[];for(const s of statements)out.push(await s.run());raw.exec('COMMIT');return out;}catch(e){raw.exec('ROLLBACK');throw e;}}};
}
function harness(){const DB=database();const env={DB,OWNER_EMAIL:'owner@example.test'};return {DB,async request(email,path='/api/state',action,input={},extra={}){const headers={};if(email){headers['oai-authenticated-user-id']=email;headers['oai-authenticated-user-email']=email;}if(action){headers.Origin='https://gramin.test';headers['Content-Type']='application/json';headers['Idempotency-Key']=crypto.randomUUID();}Object.assign(headers,extra);const r=await worker.fetch(new Request('https://gramin.test'+path,{method:action?'POST':'GET',headers,body:action?JSON.stringify({action,input}):undefined}),env,{});return {status:r.status,data:await r.json(),headers:r.headers};}};}
const config={version:0,brand:'Test business',base:'Test village',pin:'531116',supportPhone:'9000000000',hours:'9am–6pm',terms:'Visit charges apply after arrival.',privacy:'Test notice.',visitFee:100,travelFee:20,areas:['Test village'],ready:true};
const tomorrow=new Date(Date.now()+86400000).toISOString().slice(0,10);
const booking={settingsVersion:1,service:'ac',name:'Test customer',phone:'9000000001',pin:'531116',village:'Test village',landmark:'Test landmark',issue:'Not cooling',date:tomorrow,window:'09:00–13:00',consent:true};

test('hosted account roles, isolation, revocation and full approved cash workflow',async()=>{
 const h=harness(),act=(email,action,input,extra)=>h.request(email,'/api/actions',action,input,extra);
 assert.equal((await h.request(null,'/api/state',null,{}, {Authorization:'Bearer demo-admin'})).data.user,null);
 assert.equal((await act(null,'settings',config)).status,401);
 assert.equal((await act('customer@example.test','settings',config)).status,403);
 assert.equal((await act('owner@example.test','settings',config,{Origin:'https://evil.test'})).status,403);
 assert.equal((await act('owner@example.test','settings',config)).status,200);
 const staff=await act('owner@example.test','technician',{name:'Test technician',email:'tech@example.test',skills:['ac']});assert.equal(staff.status,200);
 assert.equal((await h.request('tech@example.test')).data.user.role,'technician');
 const key='create_retry_123';let r=await act('customer@example.test','create',booking,{'Idempotency-Key':key});assert.equal(r.status,200);let b=r.data;
 assert.equal((await act('customer@example.test','create',booking,{'Idempotency-Key':key})).data.id,b.id);
 assert.equal((await act('customer@example.test','create',{...booking,name:'Other'}, {'Idempotency-Key':key})).status,409);
 assert.equal((await h.request('other@example.test')).data.bookings.length,0);
 assert.equal((await h.request('tech@example.test')).data.bookings.length,0);
 assert.equal((await act('other@example.test','cancel',{id:b.id,version:b.version})).status,404);
 assert.equal((await act('customer@example.test','assign',{id:b.id,version:b.version,technicianId:staff.data.id,coverageConfirmed:true})).status,403);
 async function step(email,action,input={}){const next=await act(email,action,{id:b.id,version:b.version,...input});assert.equal(next.status,200,JSON.stringify(next.data));b=next.data;}
 await step('owner@example.test','assign',{technicianId:staff.data.id,coverageConfirmed:true});
 assert.equal((await h.request('tech@example.test')).data.bookings.length,1);
 assert.equal((await act('customer@example.test','cancel',{id:b.id,version:1})).status,409);
 await step('tech@example.test','depart',{eta:30});await step('tech@example.test','arrive');
 assert.equal((await act('tech@example.test','start',{id:b.id,version:b.version})).status,409);
 await step('tech@example.test','estimate',{description:'Repair',labor:100.1,parts:50});
 await step('customer@example.test','approve');await step('tech@example.test','start');
 await step('tech@example.test','complete',{notes:'Checked',checked:true});
 await step('customer@example.test','cash');await step('tech@example.test','cash_received',{received:true});
 assert.equal(b.amountDue,270.1);assert.equal(b.paymentStatus,'paid');
 assert.equal((await h.request('customer@example.test','/api/export')).status,403);
 assert.equal((await h.request('owner@example.test','/api/export')).data.bookings.length,1);
 assert.equal((await act('owner@example.test','technician',{version:1,name:'Test technician',email:'tech@example.test',skills:['ac'],active:false})).status,200);
 assert.equal((await h.request('tech@example.test')).data.bookings.length,0);
 h.DB.raw.close();
});
test('transaction stale-version guard rolls back writes and retry receipt',async()=>{
 const db=database();await db.prepare('INSERT INTO settings(id,data,version) VALUES (?,?,?)').bind('business','{}',2).run();
 await assert.rejects(commit(db,{key:'retry',fingerprint:'fingerprint',result:{saved:true},guardSql:'SELECT version = ? FROM settings WHERE id = ?',guardArgs:[1,'business'],statements:[db.prepare('UPDATE settings SET data=? WHERE id=?').bind('changed','business')]}),e=>e.status===409);
 assert.equal((await db.prepare('SELECT data FROM settings').first()).data,'{}');assert.equal((await db.prepare('SELECT count(*) AS n FROM operations').first()).n,0);db.raw.close();
});

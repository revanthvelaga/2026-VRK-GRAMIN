import {defaultSettings,error} from './domain.mjs';
export async function settings(db){const row=await db.prepare('SELECT data,version FROM settings WHERE id = ?').bind('business').first();return row?{value:JSON.parse(row.data),version:row.version}:{value:defaultSettings,version:0};}
export async function technicians(db){const rows=await db.prepare('SELECT id,email,name,skills,active,version FROM technicians ORDER BY name').all();return rows.results.map(t=>({...t,active:!!t.active,skills:JSON.parse(t.skills)}));}
export async function getBooking(db,id){const row=await db.prepare('SELECT data,version FROM bookings WHERE id = ?').bind(id).first();return row?{value:JSON.parse(row.data),version:row.version}:null;}
export async function listBookings(db,user){const filter=user.role==='admin'?'':user.role==='customer'?' WHERE customer_id = ?':' WHERE technician_id = ?';const q=db.prepare('SELECT data,version FROM bookings'+filter+' ORDER BY created_at DESC LIMIT 200');const rows=await (filter?q.bind(user.id):q).all();return rows.results.map(r=>({...JSON.parse(r.data),version:r.version}));}
export async function digest(value){const bytes=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)));return [...bytes].map(x=>x.toString(16).padStart(2,'0')).join('');}
export async function replay(db,key,fingerprint){const row=await db.prepare('SELECT fingerprint,result FROM operations WHERE id = ?').bind(key).first();if(!row)return null;if(row.fingerprint!==fingerprint)error('Retry key was used for a different request',409);return JSON.parse(row.result);}
export async function commit(db,{key,fingerprint,result,statements,guardSql,guardArgs=[]}){
 const guard=crypto.randomUUID();const batch=[];
 if(guardSql)batch.push(db.prepare('INSERT INTO write_guards(id,valid) VALUES (?,COALESCE(('+guardSql+'),0))').bind(guard,...guardArgs));
 batch.push(...statements,db.prepare('INSERT INTO operations(id,fingerprint,result,created_at) VALUES (?,?,?,?)').bind(key,fingerprint,JSON.stringify(result),new Date().toISOString()));
 if(guardSql)batch.push(db.prepare('DELETE FROM write_guards WHERE id = ?').bind(guard));
 try{await db.batch(batch);return result;}catch(e){const existing=await replay(db,key,fingerprint);if(existing)return existing;if(String(e).includes('valid_write')||String(e).includes('write_guards'))error('This record changed. Refresh and try again.',409);throw e;}
}
export async function limit(db,id,max=60){const now=Date.now(),bucket=Math.floor(now/60000),key=id+':'+bucket;const row=await db.prepare('INSERT INTO rate_limits(id,count,expires) VALUES (?,1,?) ON CONFLICT(id) DO UPDATE SET count=count+1 RETURNING count').bind(key,now+120000).first();if(row.count>max)error('Too many requests. Please wait a minute.',429);}

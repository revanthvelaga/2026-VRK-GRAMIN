import {authorize,canRead,sameOrigin} from './auth.mjs';
import {services,defaultSettings,error,text,settingsInput,createBooking,transition} from './domain.mjs';
import {settings,technicians,getBooking,listBookings,digest,replay,commit,limit} from './storage.mjs';
import {searchPlaces} from '../backend/places.mjs';
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});
async function body(request){if(!request.headers.get('Content-Type')?.includes('application/json'))error('JSON request required',415);const reader=request.body?.getReader();if(!reader)error('Request body is missing');const chunks=[];let size=0;while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>20000){await reader.cancel();error('Request is too large',413);}chunks.push(value);}const bytes=new Uint8Array(size);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length;}try{const value=JSON.parse(new TextDecoder().decode(bytes));if(!value||Array.isArray(value)||typeof value!=='object')error('Invalid request');return value;}catch{error('Invalid JSON');}}
async function route(request,env,ctx){
 const url=new URL(request.url);
 if(!url.pathname.startsWith('/api/')){
  if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405});
  const asset=env.APP_ASSETS?.[url.pathname==='/'?'/index.html':url.pathname];if(!asset)return new Response('Not found',{status:404});
  const bytes=Uint8Array.from(atob(asset.data),c=>c.charCodeAt(0));return new Response(request.method==='HEAD'?null:bytes,{headers:{'Content-Type':asset.type,'Cache-Control':'no-cache'}});
 }
 if(!env.DB)error('Storage is not configured yet',503);
 if(request.method!=='GET'&&!sameOrigin(request))error('Request origin is not allowed',403);
 const user=await authorize(request,env);
 if(request.method==='GET'&&url.pathname==='/api/state'){
  const cfg=await settings(env.DB);if(!user)return json({user:null,services,settings:cfg.value,settingsVersion:cfg.version,bookings:[],technicians:[]});
  const [jobs,staff]=await Promise.all([listBookings(env.DB,user),technicians(env.DB)]);
  const visibleStaff=user.role==='admin'?staff:staff.filter(t=>user.role==='technician'?t.id===user.id:jobs.some(b=>b.technicianId===t.id)).map(({id,name,skills,active})=>({id,name,skills,active}));
  return json({user:{id:user.id,role:user.role,email:user.email,name:user.name||''},services,settings:cfg.value,settingsVersion:cfg.version,bookings:jobs,technicians:visibleStaff,auth:'Sign in with ChatGPT',paymentMode:'cash',notifications:'in-app'});
 }
 if(!user)error('Sign in to continue',401);
 await limit(env.DB,user.actorId,url.pathname==='/api/places'?20:60);
 if(ctx?.waitUntil)ctx.waitUntil(env.DB.prepare('DELETE FROM rate_limits WHERE expires < ?').bind(Date.now()-60000).run().catch(()=>{}));
 if(request.method==='GET'&&url.pathname==='/api/places')return json(await searchPlaces(url.searchParams.get('q')));
 if(request.method==='GET'&&url.pathname==='/api/export'){
  if(user.role!=='admin')error('Owner account required',403);const cfg=await settings(env.DB);const rows=await env.DB.prepare('SELECT data FROM bookings ORDER BY created_at').all();const events=await env.DB.prepare('SELECT * FROM booking_events ORDER BY created_at').all();const response=json({exportedAt:new Date().toISOString(),settings:cfg.value,technicians:await technicians(env.DB),bookings:rows.results.map(r=>JSON.parse(r.data)),events:events.results});response.headers.set('Content-Disposition','attachment; filename="gramin-backup.json"');return response;
 }
 if(request.method!=='POST'||url.pathname!=='/api/actions')error('Route not found',404);
 const {action,input:p}=await body(request);if(typeof action!=='string'||!p||typeof p!=='object'||Array.isArray(p))error('Invalid request');
 const retry=request.headers.get('Idempotency-Key');if(!retry||!/^[a-zA-Z0-9_-]{8,100}$/.test(retry))error('Valid retry key required');
 const key=user.actorId+':'+retry,fingerprint=await digest(JSON.stringify({action,input:p}));
 const old=await replay(env.DB,key,fingerprint);if(old){if(old.customerId){const current=await getBooking(env.DB,old.id);if(!current||!canRead(user,current.value))error('Booking not found',404);}return json(old);}
 const now=new Date().toISOString();
 if(action==='settings'){
  if(user.role!=='admin')error('Owner account required',403);const cfg=await settings(env.DB);if(p.version!==cfg.version)error('Settings changed. Refresh first.',409);const value=settingsInput(p);
  const statement=cfg.version?env.DB.prepare('UPDATE settings SET data=?,version=version+1 WHERE id=?').bind(JSON.stringify(value),'business'):env.DB.prepare('INSERT INTO settings(id,data,version) VALUES (?,?,1)').bind('business',JSON.stringify(value));
  return json(await commit(env.DB,{key,fingerprint,result:{saved:true,version:cfg.version+1},statements:[statement],guardSql:cfg.version?'SELECT version = ? FROM settings WHERE id = ?':undefined,guardArgs:[cfg.version,'business']}));
 }
 if(action==='technician'){
  if(user.role!=='admin')error('Owner account required',403);const email=text(p.email,'technician email',200).toLowerCase();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))error('Enter a valid email');if(email===env.OWNER_EMAIL?.toLowerCase())error('The owner cannot be added as a technician');
  const name=text(p.name,'technician name',80);if(!Array.isArray(p.skills)||!p.skills.length||p.skills.some(s=>!services.some(x=>x.id===s)))error('Select valid technician skills');
  const existing=await env.DB.prepare('SELECT id,version FROM technicians WHERE email=?').bind(email).first();if(existing&&p.version!==existing.version)error('Technician changed. Refresh first.',409);
  const id=existing?.id||crypto.randomUUID();const statement=existing?env.DB.prepare('UPDATE technicians SET name=?,skills=?,active=?,version=version+1 WHERE id=?').bind(name,JSON.stringify(p.skills),p.active===false?0:1,id):env.DB.prepare('INSERT INTO technicians(id,email,name,skills,active,version) VALUES (?,?,?,?,1,1)').bind(id,email,name,JSON.stringify(p.skills));
  return json(await commit(env.DB,{key,fingerprint,result:{saved:true,id},statements:[statement],guardSql:existing?'SELECT version = ? FROM technicians WHERE id = ?':undefined,guardArgs:[existing?.version,id]}));
 }
 const cfg=await settings(env.DB);let booking,current;
 if(action==='create'){
  if(p.settingsVersion!==cfg.version)error('Visit charges changed. Refresh and review the new charges.',409);booking=createBooking(p,user,cfg.value);
 }else{current=await getBooking(env.DB,p.id||'');if(!current||!canRead(user,current.value))error('Booking not found',404);if(p.version!==current.version)error('Booking changed. Refresh and try again.',409);booking=transition(current.value,user,action,p,await technicians(env.DB));}
 const version=(current?.version||0)+1;const result={...booking,version};
 const write=current?env.DB.prepare('UPDATE bookings SET technician_id=?,status=?,data=?,version=version+1 WHERE id=?').bind(booking.technicianId,booking.status,JSON.stringify(booking),booking.id):env.DB.prepare('INSERT INTO bookings(id,customer_id,technician_id,status,data,version,created_at) VALUES (?,?,?,?,?,1,?)').bind(booking.id,booking.customerId,null,booking.status,JSON.stringify(booking),booking.createdAt);
 const statements=[write,env.DB.prepare('INSERT INTO booking_events(id,booking_id,actor_id,action,created_at) VALUES (?,?,?,?,?)').bind(crypto.randomUUID(),booking.id,user.actorId,action,now)];
 let guardSql=current?'SELECT version = ? FROM bookings WHERE id = ?':'SELECT version = ? FROM settings WHERE id = ?',guardArgs=current?[current.version,booking.id]:[cfg.version,'business'];
 if(action==='assign'){
  guardSql='SELECT version = ? AND NOT EXISTS (SELECT 1 FROM bookings AS other WHERE other.technician_id = ? AND other.id <> ? AND other.status NOT IN (\'completed\',\'cancelled\',\'declined\') AND json_extract(other.data,\'$.date\') = ? AND json_extract(other.data,\'$.window\') = ?) FROM bookings WHERE id = ?';
  guardArgs=[current.version,booking.technicianId,booking.id,booking.date,booking.window,booking.id];
 }
 return json(await commit(env.DB,{key,fingerprint,result,statements,guardSql,guardArgs}));
}
export default {async fetch(request,env,ctx){let response;try{response=await route(request,env,ctx);}catch(e){if(!e.status)console.error('Gramin request failed',{name:e.name});response=json({error:e.status?e.message:'The service is temporarily unavailable. Your unsent form is still on this page.'},e.status||503);}
 response.headers.set('X-Content-Type-Options','nosniff');response.headers.set('Referrer-Policy','same-origin');response.headers.set('Permissions-Policy','camera=(), microphone=(), geolocation=()');response.headers.set('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'self' https://chatgpt.com");response.headers.set('Strict-Transport-Security','max-age=31536000');return response;}};

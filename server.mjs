import http from 'node:http';
import crypto from 'node:crypto';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {apply,scope,services,technicians as sampleTechnicians} from './backend/domain.mjs';
import {read,transact} from './backend/store.mjs';
import {searchPlaces} from './backend/places.mjs';

const root=path.resolve('dist');
const port=Number(process.env.GRAMIN_PORT||4173);
const demoAccounts={
 'demo-customer':{id:'customer-1',login:'demo-customer',name:'Demo Customer',role:'customer',status:'active'},
 'demo-admin':{id:'owner-1',login:'demo-admin',name:'Gramin Owner',role:'admin',status:'active'},
 'demo-tech-1':{id:'tech-1',login:'demo-tech-1',name:'Ravi Kumar',role:'technician',status:'active',technicianId:'tech-1'},
 'demo-tech-2':{id:'tech-2',login:'demo-tech-2',name:'Suresh',role:'technician',status:'active',technicianId:'tech-2'}
};
const sessions=new Map();
const hashToken=token=>crypto.createHash('sha256').update(String(token||'')).digest('hex');
const sessionRecord=account=>({accountId:account.id,demoLogin:account.id.startsWith('local-')?null:account.login,expiresAt:Date.now()+30*24*60*60*1000});
const fail=(message,status=400)=>{throw Object.assign(new Error(message),{status});};
const hashPassword=(password,salt=crypto.randomBytes(16).toString('hex'))=>({salt,hash:crypto.scryptSync(password,salt,32).toString('hex')});
const verifyPassword=(password,record)=>{try{return crypto.timingSafeEqual(Buffer.from(hashPassword(password,record.salt).hash,'hex'),Buffer.from(record.hash,'hex'));}catch{return false;}};
const readBody=async req=>{let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>20000)fail('Request too large',413);}try{return JSON.parse(raw||'{}');}catch{fail('Invalid JSON');}};
const normalizeLogin=value=>{const raw=String(value||'').trim().toLowerCase();if(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw))return raw;const digits=raw.replace(/[^\d]/g,'');if(/^[+\d][\d\s()-]*$/.test(raw)&&digits.length>=10&&digits.length<=15)return digits;fail('Enter a valid email address or mobile number');};
const validateName=value=>{const name=String(value||'').trim();if(!name||name.length>80)fail('Enter your name (up to 80 characters)');return name;};
const validatePassword=value=>{const password=String(value||'');if(password.length<6||password.length>128)fail('Use a password between 6 and 128 characters');return password;};
const publicProfile=account=>{const profile=account.profile||{};const legacy=profile.village?[{id:'legacy-default',label:'Saved address',name:account.name,phone:profile.phone||'',village:profile.village,pin:profile.pin||'',landmark:profile.landmark||''}]:[];return {...profile,addresses:Array.isArray(profile.addresses)?profile.addresses:legacy};};
const publicUser=account=>({id:account.role==='technician'&&account.technicianId?account.technicianId:account.id,accountId:account.id,login:account.login,name:account.name,role:account.role,status:account.status||'active',technicianId:account.technicianId||null,profile:publicProfile(account)});
const publicAccount=account=>({id:account.id,login:account.login,name:account.name,role:account.role,status:account.status||'active',skills:account.skills||[],technicianId:account.technicianId||null,createdAt:account.createdAt});
const allTechnicians=state=>[...sampleTechnicians,...(state.technicians||[])];
const send=(res,value,status=200)=>{res.writeHead(status);res.end(JSON.stringify(value));};

http.createServer(async(req,res)=>{try{
 const url=new URL(req.url,'http://localhost');
 res.setHeader('X-Content-Type-Options','nosniff');
 if(url.pathname.startsWith('/api/')){
  res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');
  if(req.headers.origin&&req.headers.origin!==`http://${req.headers.host}`)fail('Origin not allowed',403);
  const bearer=req.headers.authorization?.replace('Bearer ','');
  if(req.method==='POST'&&url.pathname==='/api/auth/signup'){
   const body=await readBody(req),name=validateName(body.name),login=normalizeLogin(body.login),password=validatePassword(body.password);
   if(body.role==='admin')fail('Only an existing Owner can create another admin',403);
   const role=body.role==='technician'?'technician':'customer';
   const skills=role==='technician'&&Array.isArray(body.skills)?[...new Set(body.skills)].filter(id=>services.some(s=>s.id===id)):[];
   if(role==='technician'&&!skills.length)fail('Select at least one technician skill');
   const token=crypto.randomUUID();
   const account=await transact(state=>{state.users||={};state.sessions||={};if(Object.values(state.users).some(user=>user.login===login))fail('An account already exists for this email or mobile',409);const id='local-'+crypto.randomUUID(),createdAt=new Date().toISOString();state.users[id]={id,login,name,role,status:role==='technician'?'pending':'active',skills,password:hashPassword(password),profile:/^\d{10,15}$/.test(login)?{phone:login.slice(-10)}:{},createdAt};state.sessions[hashToken(token)]=sessionRecord(state.users[id]);return state.users[id];});
   sessions.set(token,{accountId:account.id});
   return send(res,{token,user:publicUser(account),message:role==='technician'?'Application submitted. An Owner must approve technician access.':'Customer account created.'});
  }
  if(req.method==='POST'&&url.pathname==='/api/auth/login'){
   const body=await readBody(req),rawLogin=String(body.login||'').trim().toLowerCase(),password=String(body.password||'');
   const state=await read();let account=demoAccounts[rawLogin];
   if(!account){const login=normalizeLogin(rawLogin);account=Object.values(state.users||{}).find(user=>user.login===login);}
   if(!account)fail('Account not found. Check the email or mobile, or sign up.',401);
   if(account.id.startsWith('local-')?!verifyPassword(password,account.password):password!=='123456')fail('Incorrect password',401);
   if(account.status==='disabled')fail('This account is disabled. Contact the Owner.',403);
   const token=crypto.randomUUID();await transact(next=>{next.sessions||={};next.sessions[hashToken(token)]=sessionRecord(account);});sessions.set(token,sessionRecord(account));
   return send(res,{token,user:publicUser(account),message:'Signed in'});
  }
  if(req.method==='POST'&&url.pathname==='/api/auth/logout'){sessions.delete(bearer);if(bearer)await transact(next=>{if(next.sessions)delete next.sessions[hashToken(bearer)];});return send(res,{ok:true});}

  const state=await read(),storedSession=state.sessions?.[hashToken(bearer)],session=sessions.get(bearer)||storedSession,demo=demoAccounts[bearer];
  if(session?.expiresAt&&session.expiresAt<Date.now())fail('Your session expired. Log in again.',401);
  let account=demo||(session?.demoLogin?demoAccounts[session.demoLogin]:state.users?.[session?.accountId]);
  if(!account)fail('Sign in required',401);
  const requestedView=req.headers['x-local-view-role'];

  if(req.method==='POST'&&url.pathname==='/api/auth/admins'){
   if(account.role!=='admin'||(requestedView&&requestedView!=='admin'))fail('Owner access required',403);
   const body=await readBody(req),name=validateName(body.name),login=normalizeLogin(body.login),password=validatePassword(body.password);
   const created=await transact(next=>{next.users||={};if(Object.values(next.users).some(user=>user.login===login))fail('An account already exists for this email or mobile',409);const id='local-'+crypto.randomUUID();next.users[id]={id,login,name,role:'admin',status:'active',password:hashPassword(password),createdAt:new Date().toISOString(),createdBy:account.id};return next.users[id];});
   return send(res,{user:publicAccount(created),message:'Admin account created'});
  }
  if(req.method==='POST'&&url.pathname==='/api/auth/technicians/approve'){
   if(account.role!=='admin'||(requestedView&&requestedView!=='admin'))fail('Owner access required',403);
   const body=await readBody(req);
   const approved=await transact(next=>{const applicant=next.users?.[body.userId];if(!applicant||applicant.role!=='technician'||applicant.status!=='pending')fail('Pending technician application not found',404);next.technicians||=[];const technicianId='local-tech-'+crypto.randomUUID();const technician={id:technicianId,name:applicant.name,skills:applicant.skills,active:true};next.technicians.push(technician);applicant.status='active';applicant.technicianId=technicianId;applicant.approvedAt=new Date().toISOString();applicant.approvedBy=account.id;return {applicant,technician};});
   return send(res,{user:publicAccount(approved.applicant),technician:approved.technician,message:'Technician approved'});
  }
  if(req.method==='POST'&&url.pathname==='/api/auth/profile'){
   if(!account.id.startsWith('local-'))fail('Create a personal account to save profile details',403);
   const body=await readBody(req),name=validateName(body.name),phone=String(body.phone||'').replace(/\D/g,''),village=String(body.village||'').trim(),pin=String(body.pin||'').trim(),landmark=String(body.landmark||'').trim();
   if(phone&&!/^[6-9]\d{9}$/.test(phone))fail('Enter a valid 10-digit mobile number');if(pin&&!/^\d{6}$/.test(pin))fail('Enter a six-digit PIN');if(village.length>100||landmark.length>250)fail('Profile details are too long');
   const updated=await transact(next=>{const person=next.users?.[account.id];if(!person)fail('Account not found',404);person.name=name;person.profile={phone,village,pin,landmark};person.updatedAt=new Date().toISOString();return person;});
   return send(res,{user:publicUser(updated),message:'Profile saved'});
  }

  let user=publicUser(account),availableTechnicians=allTechnicians(state);
  if(user.status!=='active'&&url.pathname!=='/api/state')fail('Your technician application is awaiting Owner approval',403);
  if(account.role==='admin'&&requestedView==='customer')user={...user,id:'owner-test-customer',role:'customer',ownerTest:true};
  if(account.role==='admin'&&requestedView==='technician'){
   const id=req.headers['x-local-technician-id'];if(!availableTechnicians.some(item=>item.id===id&&item.active!==false))fail('Choose a valid technician test identity');
   user={...user,id,role:'technician',technicianId:id,ownerTest:true};
  }
  if(req.method==='GET'&&url.pathname==='/api/places')return send(res,await searchPlaces(url.searchParams.get('q')));
  if(req.method==='GET'&&url.pathname==='/api/state')return send(res,{user,services,technicians:availableTechnicians,settings:state.settings,bookings:user.status==='active'?state.bookings.filter(booking=>scope(user,booking)):[],accounts:user.role==='admin'?Object.values(state.users||{}).map(publicAccount):undefined});
  if(req.method==='POST'&&url.pathname==='/api/actions'){
   if(user.status!=='active')fail('Your technician application is awaiting Owner approval',403);
   const parsed=await readBody(req);const result=await transact(next=>{const saved=apply(next,user,parsed.action,parsed.input,req.headers['idempotency-key']);if(parsed.action==='create'&&parsed.input.saveAddress&&account.id.startsWith('local-')&&account.role==='customer'){const person=next.users?.[account.id];if(person){const profile=person.profile||{},addresses=Array.isArray(profile.addresses)?profile.addresses:[],candidate={label:String(parsed.input.addressLabel||'Home').trim().slice(0,40)||'Home',name:String(parsed.input.name||'').trim(),phone:String(parsed.input.phone||'').trim(),village:String(parsed.input.village||'').trim(),pin:String(parsed.input.pin||'').trim(),landmark:String(parsed.input.landmark||'').trim()};if(!addresses.some(item=>item.phone===candidate.phone&&item.village===candidate.village&&item.pin===candidate.pin&&item.landmark===candidate.landmark))addresses.unshift({id:'addr-'+crypto.randomUUID(),...candidate,createdAt:new Date().toISOString()});person.profile={...profile,phone:candidate.phone,addresses};person.updatedAt=new Date().toISOString();}}return saved;});return send(res,result);
  }
  fail('API route not found',404);
 }
 if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);return res.end();}
 const file=path.resolve(root,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}let data=await readFile(file);if(path.basename(file)==='index.html')data=Buffer.concat([data,Buffer.from('<script src="/local-auth.js"></script><script src="/address-book.js"></script>')]);res.setHeader('Content-Type',({'html':'text/html; charset=utf-8','css':'text/css; charset=utf-8','js':'text/javascript; charset=utf-8'})[file.split('.').pop()]||'application/octet-stream');res.end(req.method==='HEAD'?undefined:data);
}catch(error){send(res,{error:error.status?error.message:'Request could not be completed'},error.status||(error.code==='ENOENT'?404:500));}
}).listen(port,'127.0.0.1',()=>console.log(`Gramin local preview: http://127.0.0.1:${port}`));

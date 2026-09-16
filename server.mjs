import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {apply,scope,services,technicians} from './backend/domain.mjs';
import {read,transact} from './backend/store.mjs';
import {searchPlaces} from './backend/places.mjs';
const root=path.resolve('dist');
const users={'demo-customer':{id:'customer-1',role:'customer'},'demo-admin':{id:'owner-1',role:'admin'},'demo-tech-1':{id:'tech-1',role:'technician'},'demo-tech-2':{id:'tech-2',role:'technician'}};
http.createServer(async(req,res)=>{try{
 const url=new URL(req.url,'http://localhost');
 res.setHeader('X-Content-Type-Options','nosniff');
 if(url.pathname.startsWith('/api/')){
  res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');
  if(req.headers.origin&&req.headers.origin!==`http://${req.headers.host}`)throw Object.assign(new Error('Origin not allowed'),{status:403});
  const user=users[req.headers.authorization?.replace('Bearer ','')];if(!user)throw Object.assign(new Error('Demo session required'),{status:401});
  if(req.method==='GET'&&url.pathname==='/api/places'){return res.end(JSON.stringify(await searchPlaces(url.searchParams.get('q'))));}
  if(req.method==='GET'&&url.pathname==='/api/state'){const state=await read();return res.end(JSON.stringify({user,services,technicians,settings:state.settings,bookings:state.bookings.filter(b=>scope(user,b))}));}
  if(req.method==='POST'&&url.pathname==='/api/actions'){
   let body='';for await(const chunk of req){body+=chunk;if(body.length>20000)throw Object.assign(new Error('Request too large'),{status:413});}
   let parsed;try{parsed=JSON.parse(body);}catch{throw Object.assign(new Error('Invalid JSON'),{status:400});}
   const result=await transact(state=>apply(state,user,parsed.action,parsed.input,req.headers['idempotency-key']));res.end(JSON.stringify(result));return;
  }
  throw Object.assign(new Error('API route not found'),{status:404});
 }
 if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);return res.end();}
 const file=path.resolve(root,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}const data=await readFile(file);res.setHeader('Content-Type',({'html':'text/html; charset=utf-8','css':'text/css; charset=utf-8','js':'text/javascript; charset=utf-8'})[file.split('.').pop()]||'application/octet-stream');res.end(req.method==='HEAD'?undefined:data);
 }catch(e){res.writeHead(e.status||(e.code==='ENOENT'?404:500));res.end(JSON.stringify({error:e.status?e.message:'Request could not be completed'}));}
}).listen(4173,'127.0.0.1',()=>console.log('Gramin local preview: http://127.0.0.1:4173'));

import {mkdir,readFile,writeFile,copyFile,cp} from 'node:fs/promises';
const root=new URL('../',import.meta.url);const out=new URL('dist/server/',root);await mkdir(out,{recursive:true});
const assets={};for(const [url,file,type] of [['/index.html','live/index.html','text/html; charset=utf-8'],['/app.js','live/app.js','text/javascript; charset=utf-8'],['/live.css','live/live.css','text/css'],['/style.css','dist/style.css','text/css'],['/assets/gramin-logo.png','dist/assets/gramin-logo.png','image/png']])assets[url]={type,data:(await readFile(new URL(file,root))).toString('base64')};
await writeFile(new URL('assets.mjs',out),'export const assets='+JSON.stringify(assets)+';');
for(const name of ['auth','domain','storage'])await copyFile(new URL('live/'+name+'.mjs',root),new URL(name+'.mjs',out));
await copyFile(new URL('backend/places.mjs',root),new URL('places.mjs',out));
const worker=(await readFile(new URL('live/worker.mjs',root),'utf8')).replace("'../backend/places.mjs'","'./places.mjs'");await writeFile(new URL('worker.mjs',out),worker);
await writeFile(new URL('index.js',out),"import worker from './worker.mjs';import {assets} from './assets.mjs';export default {fetch(request,env,ctx){return worker.fetch(request,{...env,APP_ASSETS:assets},ctx)}};");
await mkdir(new URL('dist/.openai/',root),{recursive:true});await copyFile(new URL('.openai/hosting.json',root),new URL('dist/.openai/hosting.json',root));await cp(new URL('drizzle/',root),new URL('dist/.openai/drizzle/',root),{recursive:true});console.log('Hosted application built. Demo data and demo login are not served by the Worker.');

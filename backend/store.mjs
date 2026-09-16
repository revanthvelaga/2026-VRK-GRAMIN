import {mkdir,readFile,writeFile,rename} from 'node:fs/promises';
import {initialState} from './domain.mjs';
const file=new URL('../data/demo.json',import.meta.url);
let queue=Promise.resolve();
export async function read(){try{return JSON.parse(await readFile(file,'utf8'));}catch(e){if(e.code==='ENOENT')return initialState();throw e;}}
export function transact(fn){const operation=queue.then(async()=>{const state=await read();const result=await fn(state);await mkdir(new URL('../data/',import.meta.url),{recursive:true});await writeFile(new URL('../data/demo.tmp',import.meta.url),JSON.stringify(state,null,2));await rename(new URL('../data/demo.tmp',import.meta.url),file);return result;});queue=operation.catch(()=>{});return operation;}

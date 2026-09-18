import {mkdir,readFile,writeFile,rename} from 'node:fs/promises';
import path from 'node:path';
import {initialState} from './domain.mjs';
const file=process.env.GRAMIN_DATA_FILE?path.resolve(process.env.GRAMIN_DATA_FILE):new URL('../data/demo.json',import.meta.url);
const temporary=typeof file==='string'?file+'.tmp':new URL('../data/demo.tmp',import.meta.url);
const directory=typeof file==='string'?path.dirname(file):new URL('../data/',import.meta.url);
let queue=Promise.resolve();
export async function read(){try{return JSON.parse(await readFile(file,'utf8'));}catch(e){if(e.code==='ENOENT')return initialState();throw e;}}
export function transact(fn){const operation=queue.then(async()=>{const state=await read();const result=await fn(state);await mkdir(directory,{recursive:true});await writeFile(temporary,JSON.stringify(state,null,2));await rename(temporary,file);return result;});queue=operation.catch(()=>{});return operation;}

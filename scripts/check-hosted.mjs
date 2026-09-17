// Use a fresh Sites-issued dispatch credential per run. Never save credentials.
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {restoreBackup} from './restore-backup.mjs';
import {validateBackup} from '../live/backup.mjs';
const [origin,token]=process.argv.slice(2);
try{
 if(origin!=='https://gramin-home-services.revanthvelaga.chatgpt.site'||!token)throw Error('Expected the registered Site origin and a fresh dispatch credential');
 async function get(path){const r=await fetch(origin+path,{headers:{'OAI-Sites-Authorization':'Bearer '+token},redirect:'error',signal:AbortSignal.timeout(30000)});if(!r.ok)throw Error(path+' returned HTTP '+r.status);return r;}
 const health=await (await get('/api/health')).json();if(health.status!=='ok')throw Error('Database health check failed');
 const r=await get('/api/backup'),backup=await validateBackup(await r.json());
 const dir=resolve('backups');await mkdir(dir,{recursive:true});const stamp=new Date().toISOString().replace(/[:.]/g,'-');
 const path=resolve(dir,stamp+'.json');await writeFile(path,JSON.stringify(backup),{flag:'wx',mode:0o600});
 const recovery=await restoreBackup(backup,resolve(dir,stamp+'.sqlite'));
 console.log(JSON.stringify({health:health.status,securityHeaders:{nosniff:r.headers.get('x-content-type-options')==='nosniff',csp:!!r.headers.get('content-security-policy'),hsts:!!r.headers.get('strict-transport-security'),noStore:r.headers.get('cache-control')==='no-store'},backupFile:path,recovery}));
}catch(e){console.error(e.message);process.exitCode=1;}

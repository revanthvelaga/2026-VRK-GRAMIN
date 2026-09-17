import {readFileSync,writeFileSync} from 'node:fs';
const path='dist/progress.json',b=JSON.parse(readFileSync(path,'utf8')),at=new Date().toISOString();b.updated=at+' — database view moved to local developer page; hosted Owner page removal is being deployed.';
const view=b.tasks.find(t=>t.id==='data-view');if(view)Object.assign(view,{title:'Local developer database table viewer',status:'done',checkedAt:at,detail:'Database tables are available at http://127.0.0.1:4173/database.html. The viewer uses an ignored local snapshot and is excluded from the hosted Owner app.'});
const deploy=b.tasks.find(t=>t.id==='deploy');if(deploy)Object.assign(deploy,{status:'active',detail:'Publishing the Owner page without database records. Existing site remains private while the replacement deploys.'});
writeFileSync(path,JSON.stringify(b,null,2));

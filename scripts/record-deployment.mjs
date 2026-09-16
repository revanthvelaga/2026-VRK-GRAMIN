import {readFile,writeFile} from 'node:fs/promises';
const path=new URL('../dist/progress.json',import.meta.url),board=JSON.parse(await readFile(path,'utf8'));
board.updated='Owner-only release published successfully on 16 September 2026. Public customer launch remains pending.';
for(const t of board.tasks){
 if(t.id==='storage'){t.status='active';t.detail='Database migration included in the successful hosted release. Real-account persistence checks remain.';}
 if(t.id==='release'){t.status='active';t.detail='Seven automated tests passed. Hosted owner/customer/technician and mobile checks remain.';}
 if(t.id==='deploy'){t.status='done';t.title='Publish the owner setup release';t.detail='Hosting confirmed success. Private owner access: https://gramin-home-services.revanthvelaga.chatgpt.site';}
}
if(!board.tasks.some(t=>t.id==='customer-launch'))board.tasks.push({id:'customer-launch',title:'Open the app to customers',status:'pending',detail:'Enter actual business details, finish recovery and real-account checks, then configure customer access.'});
await writeFile(path,JSON.stringify(board,null,2));

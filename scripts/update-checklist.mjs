import {readFileSync,writeFileSync} from 'node:fs';
const path='dist/progress.json',board=JSON.parse(readFileSync(path,'utf8'));
board.updated=new Date().toISOString()+' — hosted database verified; backup/recovery and release checks underway.';
const updates={
 accounts:{status:'done',detail:'Owner sign-in verified in hosted UI. Customer and technician permissions, revocation and editable accounts pass automated tests; real staff sign-in awaits verified accounts.'},
 storage:{status:'done',detail:'Sites confirms DB and all seven tables. Saved owner settings (version 4) and staff records survived deployment and reload.'},
 operations:{status:'active',detail:'Business fields and four technician records saved. Sample terms/privacy need owner review; real customer/staff workflow requires verified accounts.'},
 security:{status:'active',detail:'Same-origin writes, role isolation, limits, security headers and stale-write protection tested. Provider firewall settings are not exposed by available hosting tools.'},
 recovery:{status:'active',detail:'Complete snapshot and checksum export built. Local restore test passed without overwriting live data. Live backup verification and automatic off-site backup setup remain.'},
 release:{status:'active',detail:'Ten automated tests pass. Hosted owner checks underway; real customer/technician sign-ins and mobile verification remain.'},
 'customer-launch':{status:'pending',detail:'Owner-only site. Awaiting reviewed business policies, verified staff/customer accounts, and confirmation of initial sign-in/payment/notification scope.'}
};for(const t of board.tasks)if(updates[t.id])Object.assign(t,updates[t.id]);
if(!board.tasks.some(t=>t.id==='editable-setup'))board.tasks.push({id:'editable-setup',title:'Editable business and sample technician setup',status:'done',detail:'Business settings, technician email/name/skills/status can be edited. Sample Ravi saved disabled; existing records retained.'});
writeFileSync(path,JSON.stringify(board,null,2));

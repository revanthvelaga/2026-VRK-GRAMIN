import {digest} from './storage.mjs';
// Fixed identifiers only. Backups include retry receipts so a restored database
// cannot accidentally process an already-accepted payment or booking twice.
export const backupColumns={
 settings:['id','data','version'],
 technicians:['id','email','name','skills','active','version'],
 bookings:['id','customer_id','technician_id','status','data','version','created_at'],
 booking_events:['id','booking_id','actor_id','action','created_at'],
 operations:['id','fingerprint','result','created_at']
 ,profiles:['user_id','email','role','data','created_at','updated_at']
 ,technician_applications:['id','user_id','email','name','skills','status','created_at','updated_at']
 ,support_tickets:['id','user_id','subject','message','status','created_at','updated_at']
 ,ratings:['id','booking_id','customer_id','rating','comment','created_at']
 ,payments:['id','booking_id','customer_id','provider','status','amount','reference','created_at']
};
export async function createBackup(db){
 const names=Object.keys(backupColumns);
 const results=await db.batch(names.map(name=>db.prepare('SELECT '+backupColumns[name].join(',')+' FROM '+name+' ORDER BY '+backupColumns[name][0])));
 const tables=Object.fromEntries(names.map((name,i)=>[name,results[i].results]));
 return {format:'gramin-backup',formatVersion:1,createdAt:new Date().toISOString(),tables,sha256:await digest(JSON.stringify(tables))};
}
export async function validateBackup(value){
 if(value?.format!=='gramin-backup'||value.formatVersion!==1||!value.tables||typeof value.tables!=='object')throw Error('Unsupported backup format');
 if(Object.keys(value.tables).sort().join()!==Object.keys(backupColumns).sort().join())throw Error('Backup table list does not match');
 for(const [table,columns] of Object.entries(backupColumns)){
  const rows=value.tables[table];if(!Array.isArray(rows))throw Error('Invalid backup table');
  for(const row of rows){if(!row||Object.keys(row).sort().join()!==[...columns].sort().join()||columns.some(c=>row[c]!==null&&!['string','number'].includes(typeof row[c])))throw Error('Invalid backup row');}
 }
 if(await digest(JSON.stringify(value.tables))!==value.sha256)throw Error('Backup checksum mismatch');
 return value;
}

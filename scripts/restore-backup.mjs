import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync,openSync,closeSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {backupColumns,validateBackup} from '../live/backup.mjs';

export async function restoreBackup(backup,target){
 await validateBackup(backup);
 // Never overwrite a database, even when called with an existing path by mistake.
 const fd=openSync(target,'wx',0o600);closeSync(fd);
 const db=new DatabaseSync(target);
 try{
  db.exec('BEGIN');
  const migrations=new URL('../drizzle/',import.meta.url);
  for(const name of readdirSync(migrations).filter(n=>n.endsWith('.sql')).sort())db.exec(readFileSync(new URL(name,migrations),'utf8'));
  const counts={};
  for(const [table,columns] of Object.entries(backupColumns)){
   const insert=db.prepare('INSERT INTO '+table+' ('+columns.join(',')+') VALUES ('+columns.map(()=>'?').join(',')+')');
   for(const row of backup.tables[table])insert.run(...columns.map(c=>row[c]));
   counts[table]=db.prepare('SELECT count(*) AS n FROM '+table).get().n;
  }
  if(db.prepare('PRAGMA integrity_check').get().integrity_check!=='ok')throw Error('Restored database integrity check failed');
  db.exec('COMMIT');return {integrity:'ok',counts,sourceCreatedAt:backup.createdAt};
 }catch(e){db.exec('ROLLBACK');throw e;}finally{db.close();}
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const [source,target]=process.argv.slice(2);if(!source||!target)throw Error('Usage: node scripts/restore-backup.mjs BACKUP.json NEW-DATABASE.sqlite');
 console.log(JSON.stringify(await restoreBackup(JSON.parse(readFileSync(source,'utf8')),resolve(target))));
}

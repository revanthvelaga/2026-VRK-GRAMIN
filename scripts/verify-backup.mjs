// Verify a downloaded Gramin backup without contacting production.
import {readFile} from 'node:fs/promises';
import {validateBackup} from '../live/backup.mjs';
const file=process.argv[2];
if(!file) throw Error('Usage: node scripts/verify-backup.mjs BACKUP.json');
const value=JSON.parse(await readFile(file,'utf8'));
await validateBackup(value);
const counts=Object.fromEntries(Object.entries(value.tables).map(([name,rows])=>[name,rows.length]));
console.log(JSON.stringify({valid:true,createdAt:value.createdAt,counts}));

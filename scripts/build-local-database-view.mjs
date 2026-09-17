import {readFile,writeFile} from 'node:fs/promises';
const source=new URL('../backups/hosted-verified.json',import.meta.url),target=new URL('../dist/database.json',import.meta.url);
const backup=JSON.parse(await readFile(source,'utf8'));
const payments=(backup.tables.bookings||[]).map(row=>{const data=JSON.parse(row.data);return {booking_id:row.id,status:row.status,amount_due:data.amountDue??null,payment_status:data.paymentStatus??null,receipt:data.receipt??null,paid_at:data.paidAt??null};});
const tables={settings:backup.tables.settings||[],technicians:backup.tables.technicians||[],bookings:backup.tables.bookings||[],booking_events:backup.tables.booking_events||[],payments,operations:backup.tables.operations||[]};
await writeFile(target,JSON.stringify({createdAt:backup.createdAt,tables}));console.log('Local developer database snapshot created.');

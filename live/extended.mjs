import {error,text} from './domain.mjs';
export const now=()=>new Date().toISOString();
export const profileInput=p=>{if(p.otp&&(!/^\d{6}$/.test(String(p.otp))))error('Enter the 6-digit test OTP');return {name:text(p.name,'your name',80),phone:text(p.phone,'mobile number',10),village:text(p.village,'village',150)};};
export async function profile(db,user){return db.prepare('SELECT user_id,email,role,data,created_at,updated_at FROM profiles WHERE user_id=?').bind(user.actorId).first();}
export async function extras(db,user){
 const profileRow=await profile(db,user);const tickets=user.role==='admin'?await db.prepare('SELECT * FROM support_tickets ORDER BY updated_at DESC LIMIT 100').all():await db.prepare('SELECT * FROM support_tickets WHERE user_id=? ORDER BY updated_at DESC LIMIT 100').bind(user.actorId).all();
 const apps=user.role==='admin'?await db.prepare('SELECT * FROM technician_applications ORDER BY updated_at DESC LIMIT 100').all():await db.prepare('SELECT * FROM technician_applications WHERE user_id=?').bind(user.actorId).all();
 const payments=user.role==='admin'?await db.prepare('SELECT * FROM payments ORDER BY created_at DESC LIMIT 100').all():await db.prepare('SELECT * FROM payments WHERE customer_id=? ORDER BY created_at DESC LIMIT 100').bind(user.actorId).all();
 return {profile:profileRow?{...profileRow,data:JSON.parse(profileRow.data)}:null,tickets:tickets.results,applications:apps.results,payments:payments.results};
}
export function validSkills(skills){if(!Array.isArray(skills)||!skills.length||skills.length>4||skills.some(x=>!['ac','plumbing','electrical','washing'].includes(x)))error('Select valid skills');return skills;}

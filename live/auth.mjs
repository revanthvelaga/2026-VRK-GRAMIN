// Identity is supplied by the Sites authentication dispatcher, never by the UI.
export function identity(request){
 const id=request.headers.get('oai-authenticated-user-id');
 const email=request.headers.get('oai-authenticated-user-email')?.trim().toLowerCase();
 return id&&email?{id,email}:null;
}
export async function authorize(request,env){
 const principal=identity(request);if(!principal)return null;
 if(env.OWNER_EMAIL&&principal.email===env.OWNER_EMAIL.trim().toLowerCase()){
  const token=request.headers.get('Cookie')?.match(/(?:^|;\s*)gramin_preview=([^;]+)/)?.[1];
  if(token){const preview=await env.DB.prepare('SELECT role,subject_id FROM preview_sessions WHERE token=? AND owner_id=? AND expires_at>?').bind(token,principal.id,Date.now()).first();if(preview?.role==='customer')return {...principal,id:'preview-customer-'+principal.id,actorId:principal.id,role:'customer',name:'Owner test customer',isOwner:true,preview:{role:'customer'}};if(preview?.role==='technician'){const tech=await env.DB.prepare('SELECT id,name,skills FROM technicians WHERE id=? AND active=1').bind(preview.subject_id).first();if(tech)return {...principal,id:tech.id,actorId:principal.id,name:tech.name,role:'technician',isOwner:true,preview:{role:'technician',technicianId:tech.id}};}}
  return {...principal,role:'admin',actorId:principal.id,isOwner:true};
 }
 const technician=await env.DB.prepare('SELECT id,name,skills FROM technicians WHERE email = ? AND active = 1').bind(principal.email).first();
 return technician?{...principal,id:technician.id,actorId:principal.id,name:technician.name,role:'technician'}:{...principal,role:'customer',actorId:principal.id};
}
export function canRead(user,booking){return !!user&&(user.role==='admin'||user.role==='customer'&&booking.customerId===user.id||user.role==='technician'&&booking.technicianId===user.id);}
export function sameOrigin(request){const origin=request.headers.get('Origin');return !!origin&&origin===new URL(request.url).origin;}

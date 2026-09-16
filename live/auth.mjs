// Identity is supplied by the Sites authentication dispatcher, never by the UI.
export function identity(request){
 const id=request.headers.get('oai-authenticated-user-id');
 const email=request.headers.get('oai-authenticated-user-email')?.trim().toLowerCase();
 return id&&email?{id,email}:null;
}
export async function authorize(request,env){
 const principal=identity(request);if(!principal)return null;
 if(env.OWNER_EMAIL&&principal.email===env.OWNER_EMAIL.trim().toLowerCase())return {...principal,role:'admin',actorId:principal.id};
 const technician=await env.DB.prepare('SELECT id,name,skills FROM technicians WHERE email = ? AND active = 1').bind(principal.email).first();
 return technician?{...principal,id:technician.id,actorId:principal.id,name:technician.name,role:'technician'}:{...principal,role:'customer',actorId:principal.id};
}
export function canRead(user,booking){return !!user&&(user.role==='admin'||user.role==='customer'&&booking.customerId===user.id||user.role==='technician'&&booking.technicianId===user.id);}
export function sameOrigin(request){const origin=request.headers.get('Origin');return !!origin&&origin===new URL(request.url).origin;}

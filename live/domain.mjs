export const services=[{id:'ac',name:'AC repair',te:'ఏసీ రిపేర్',description:'Cooling, leaks and servicing',icon:'❄'},{id:'plumbing',name:'Plumbing',te:'ప్లంబింగ్',description:'Taps, pipes and water leaks',icon:'◉'},{id:'electrical',name:'Electrical work',te:'ఎలక్ట్రికల్ పనులు',description:'Wiring, switches and fixtures',icon:'ϟ'},{id:'washing',name:'Washing machine repair',te:'వాషింగ్ మెషీన్',description:'Drainage, spin and repairs',icon:'▣'}];
export const defaultSettings={brand:'Gramin',ready:false,areas:[],visitFee:0,travelFee:0,supportPhone:'',hours:'',terms:'',privacy:'',base:'',pin:''};
export function error(message,status=400){throw Object.assign(new Error(message),{status});}
export function text(value,name,max=500){if(typeof value!=='string'||!value.trim()||value.length>max)error('Please enter '+name);return value.trim();}
export function amount(value){if(!Number.isFinite(value)||value<0||value>100000||Math.abs(Math.round(value*100)-value*100)>0.000001)error('Enter a valid amount with at most two decimal places');return Math.round(value*100)/100;}
export function settingsInput(p){
 const x={brand:text(p.brand,'business name',60),base:text(p.base,'business location',150),pin:text(p.pin,'business PIN',6),supportPhone:text(p.supportPhone,'support number',10),hours:text(p.hours,'service hours',150),terms:text(p.terms,'visit and cancellation terms',2000),privacy:text(p.privacy,'privacy and retention notice',3000),visitFee:amount(p.visitFee),travelFee:amount(p.travelFee),ready:p.ready===true};
 if(!/^\d{6}$/.test(x.pin)||!/^[6-9]\d{9}$/.test(x.supportPhone))error('Check the business PIN and support number');
 if(!Array.isArray(p.areas)||!p.areas.length||p.areas.length>100)error('Enter the villages you can serve');x.areas=p.areas.map(a=>text(a,'service area',100));return x;
}
export function createBooking(p,user,settings){
 if(user.role!=='customer')error('Customer account required',403);if(!settings.ready)error('Bookings are not open yet',409);
 if(!services.some(s=>s.id===p.service))error('Choose a service');
 if(p.consent!==true)error('Accept the visit charges and service terms');
 if(!/^[6-9]\d{9}$/.test(p.phone||'')||!/^\d{6}$/.test(p.pin||''))error('Check your mobile number and PIN');
 const date=text(p.date,'visit date',10);const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date))||new Date(date).toISOString().slice(0,10)!==date||date<today||Date.parse(date)-Date.parse(today)>30*86400000)error('Choose a valid date in the next 30 days');
 if(!['09:00–13:00','14:00–18:00'].includes(p.window))error('Choose a visit window');
 const now=new Date().toISOString();return {id:'GR-'+crypto.randomUUID(),customerId:user.id,technicianId:null,service:p.service,name:text(p.name,'your name',80),phone:p.phone,village:text(p.village,'village',150),pin:p.pin,landmark:text(p.landmark,'landmark and directions',500),issue:text(p.issue,'the issue',1000),date,window:p.window,status:'requested',paymentStatus:'unpaid',fees:{visit:settings.visitFee,travel:settings.travelFee},acceptedTerms:settings.terms,createdAt:now,updatedAt:now};
}
export function transition(b,user,action,p,technicians){
 const out=structuredClone(b);const state=(...values)=>{if(!values.includes(b.status))error('The booking has changed. Refresh and try again.',409);};
 const customer=()=>{if(user.role!=='customer'||b.customerId!==user.id)error('Customer account required',403);};
 const technician=()=>{if(user.role!=='technician'||b.technicianId!==user.id)error('Assigned technician required',403);};
 const admin=()=>{if(user.role!=='admin')error('Owner account required',403);};
 switch(action){
 case 'assign':admin();state('requested','assigned');if(p.coverageConfirmed!==true)error('Confirm village coverage and timing before assignment');if(!technicians.some(t=>t.id===p.technicianId&&t.active&&t.skills.includes(b.service)))error('Choose an active technician with the required skill');out.technicianId=p.technicianId;out.status='assigned';break;
 case 'depart':technician();state('assigned');if(!Number.isInteger(p.eta)||p.eta<5||p.eta>240)error('Enter an arrival estimate of 5–240 minutes');out.eta=p.eta;out.status='en_route';break;
 case 'arrive':technician();state('en_route');out.status='inspecting';delete out.eta;break;
 case 'estimate':technician();state('inspecting');const labor=amount(p.labor),parts=amount(p.parts);out.estimate={description:text(p.description,'proposed repair',1000),labor,parts,total:Math.round((b.fees.visit+b.fees.travel+labor+parts)*100)/100};out.status='awaiting_approval';break;
 case 'approve':customer();state('awaiting_approval');out.status='approved';out.approvedAt=new Date().toISOString();break;
 case 'decline':customer();state('awaiting_approval');out.status='declined';out.amountDue=Math.round((b.fees.visit+b.fees.travel)*100)/100;break;
 case 'start':technician();state('approved');out.status='repairing';break;
 case 'complete':technician();state('repairing');out.notes=text(p.notes,'completion notes',1000);if(p.checked!==true)error('Confirm the work was checked with the customer');out.status='completed';out.amountDue=b.estimate.total;break;
 case 'cancel':customer();state('requested','assigned');out.status='cancelled';out.amountDue=0;break;
 case 'cash':customer();state('completed','declined');if(b.paymentStatus==='paid')error('Payment is already recorded',409);out.paymentStatus='cash_pending';break;
 case 'cash_received':technician();state('completed','declined');if(b.paymentStatus!=='cash_pending'||p.received!==true)error('Confirm the agreed cash amount was received');out.paymentStatus='paid';out.receipt='CASH-'+crypto.randomUUID().slice(0,8).toUpperCase();out.paidAt=new Date().toISOString();break;
 default:error('Unknown booking action',404);
 }
 out.updatedAt=new Date().toISOString();return out;
}

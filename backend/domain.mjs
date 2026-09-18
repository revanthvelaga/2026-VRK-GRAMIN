export const services=[{id:'ac',en:'AC repair',te:'ఏసీ రిపేర్',detail:'Cooling, leaks & servicing',icon:'❄'},{id:'plumbing',en:'Plumbing',te:'ప్లంబింగ్',detail:'Taps, pipes & water leaks',icon:'♧'},{id:'electrical',en:'Electrical work',te:'ఎలక్ట్రికల్ పనులు',detail:'Wiring, switches & fixtures',icon:'ϟ'},{id:'washing',en:'Washing machine',te:'వాషింగ్ మెషీన్',detail:'Drainage, spin & repairs',icon:'▣'}];
export const technicians=[{id:'tech-1',name:'Ravi Kumar',skills:['ac','washing']},{id:'tech-2',name:'Suresh',skills:['plumbing','electrical']}];
export const initialState=()=>({bookings:[],keys:{},events:{},settings:{brand:'Gramin',areas:['Narsipatnam — sample area','Nearby village — confirm coverage'],visitFee:149,travelFee:50,radius:15}});
export function fail(message,status=400){throw Object.assign(new Error(message),{status});}
export function scope(user,b){return user.role==='admin'||user.role==='customer'&&b.customerId===user.id||user.role==='technician'&&b.technicianId===user.id;}
export function apply(state,user,action,input={},key){
 if(!user)fail('Sign in required',401);
 if(!key||typeof key!=='string'||key.length>150)fail('A valid retry key is required');
 const retryKey=user.id+':'+key;const fingerprint=JSON.stringify({action,input});
 if(state.keys[retryKey]){if(state.keys[retryKey].fingerprint!==fingerprint)fail('Retry key already used for a different request',409);return state.keys[retryKey].result;}
 const admin=()=>{if(user.role!=='admin')fail('Owner access required',403);};
 let b;
 if(action==='create'){
  if(user.role!=='customer')fail('Customer access required',403);
  if(!services.some(s=>s.id===input.service))fail('Select a service');
  for(const name of ['name','village','landmark','issue','slot'])if(typeof input[name]!=='string'||!input[name].trim()||input[name].length>500)fail('Complete '+name);
  if(!/^[6-9]\d{9}$/.test(input.phone||''))fail('Enter a valid 10-digit mobile number');
  if(!/^\d{6}$/.test(input.pin||''))fail('Enter a six-digit PIN');
  if(!['Today · 9 am – 1 pm','Today · 2 pm – 6 pm','Tomorrow · 9 am – 1 pm','Tomorrow · 2 pm – 6 pm'].includes(input.slot))fail('Select a valid visit window');
  if(!input.consent)fail('Accept the sample visit and travel charges');
  let place;
  if(input.place){const p=input.place;if(typeof p.id!=='string'||p.id.length>100||typeof p.name!=='string'||p.name!==input.village.trim()||typeof p.label!=='string'||p.label.length>500||!Number.isFinite(p.latitude)||Math.abs(p.latitude)>90||!Number.isFinite(p.longitude)||Math.abs(p.longitude)>180)fail('Select the village again or enter it manually');place={id:p.id,name:p.name,label:p.label,latitude:p.latitude,longitude:p.longitude,source:'Customer-selected map suggestion',coverageConfirmed:false};}
  b={id:'GR-'+crypto.randomUUID().slice(0,8).toUpperCase(),customerId:user.id,service:input.service,name:input.name.trim(),village:input.village.trim(),landmark:input.landmark.trim(),issue:input.issue.trim(),phone:input.phone,pin:input.pin,slot:input.slot,status:'requested',paymentStatus:'unpaid',technicianId:null,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),fees:{visit:state.settings.visitFee,travel:state.settings.travelFee},history:[{status:'requested',at:new Date().toISOString()}]};state.bookings.unshift(b);
  if(place)b.place=place;
 }else if(action==='settings'){
  admin();if(typeof input.brand!=='string'||!input.brand.trim()||input.brand.length>40)fail('Enter a brand name under 40 characters');
  for(const field of ['visitFee','travelFee','radius'])if(!Number.isFinite(input[field])||input[field]<0||input[field]>100000)fail('Invalid '+field);
  if(!Array.isArray(input.areas)||!input.areas.length||input.areas.length>50||input.areas.some(a=>typeof a!=='string'||!a.trim()||a.length>100))fail('Enter sample coverage areas');
  state.settings={brand:input.brand.trim(),visitFee:input.visitFee,travelFee:input.travelFee,radius:input.radius,areas:input.areas};b=state.settings;
 }else{
  b=state.bookings.find(x=>x.id===input.id);if(!b||!scope(user,b))fail('Booking not found',404);
  const requireStatus=(...statuses)=>{if(!statuses.includes(b.status))fail('This booking has changed. Refresh and try again.',409);};
  const customer=()=>{if(user.role!=='customer'||b.customerId!==user.id)fail('Customer approval required',403);};
  const tech=()=>{if(user.role!=='technician'||b.technicianId!==user.id)fail('Assigned technician required',403);};
  switch(action){
   case 'assign':admin();requireStatus('requested','assigned');if(![...technicians,...(state.technicians||[])].some(t=>t.id===input.technicianId&&t.active!==false&&t.skills.includes(b.service)))fail('Choose a technician with the right service skills');b.technicianId=input.technicianId;b.status='assigned';break;
   case 'depart':tech();requireStatus('assigned');if(!Number.isFinite(input.eta)||input.eta<5||input.eta>240)fail('ETA must be 5–240 minutes');b.status='en_route';b.eta=input.eta;break;
   case 'arrive':tech();requireStatus('en_route');b.status='inspecting';delete b.eta;break;
   case 'estimate':tech();requireStatus('inspecting');for(const f of ['labor','parts'])if(!Number.isFinite(input[f])||input[f]<0||input[f]>100000)fail('Invalid '+f+' amount');if(typeof input.description!=='string'||!input.description.trim()||input.description.length>500)fail('Describe the proposed repair');b.estimate={labor:input.labor,parts:input.parts,description:input.description.trim(),total:b.fees.visit+b.fees.travel+input.labor+input.parts};b.status='awaiting_approval';break;
   case 'approve':customer();requireStatus('awaiting_approval');b.status='approved';b.approvedAt=new Date().toISOString();break;
   case 'decline':customer();requireStatus('awaiting_approval');b.status='declined';b.amountDue=b.fees.visit+b.fees.travel;break;
   case 'start':tech();requireStatus('approved');b.status='repairing';break;
   case 'complete':tech();requireStatus('repairing');if(typeof input.notes!=='string'||!input.notes.trim()||input.notes.length>1000)fail('Add completion notes');b.notes=input.notes.trim();b.status='completed';b.amountDue=b.estimate.total;break;
   case 'cancel':customer();requireStatus('requested','assigned');b.status='cancelled';b.amountDue=0;break;
   case 'pay':customer();requireStatus('completed','declined');if(b.paymentStatus==='paid')fail('Already paid',409);if(!['demo_upi','cash'].includes(input.method))fail('Select a demo payment method');if(input.outcome==='failed'){b.paymentStatus='failed';break;}b.paymentStatus=input.method==='cash'?'cash_pending':'paid';b.paymentMethod=input.method;if(b.paymentStatus==='paid')b.receipt='DEMO-'+crypto.randomUUID().slice(0,8);break;
   case 'cash_received':tech();requireStatus('completed','declined');if(b.paymentStatus!=='cash_pending')fail('No cash payment is pending',409);b.paymentStatus='paid';b.receipt='DEMO-CASH-'+crypto.randomUUID().slice(0,8);break;
   case 'rate':customer();requireStatus('completed');if(!Number.isInteger(input.rating)||input.rating<1||input.rating>5)fail('Choose 1–5 stars');b.rating=input.rating;break;
   default:fail('Unknown action',404);
  }
  b.updatedAt=new Date().toISOString();b.history.push({status:b.status,paymentStatus:b.paymentStatus,at:b.updatedAt});
 }
 const result=structuredClone(b);state.keys[retryKey]={fingerprint,result};return result;
}

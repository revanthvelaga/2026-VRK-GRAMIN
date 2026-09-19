(()=>{
 let authMode='login';
 const baseRender=render;
 const authHeaders=()=>{
  const headers={Authorization:'Bearer '+localToken};
  if(localUser?.role==='admin'){
   headers['X-Local-View-Role']=role;
   if(role==='technician')headers['X-Local-Technician-Id']=sessionStorage.getItem('gramin-preview-tech')||data?.technicians?.[0]?.id||'tech-1';
  }
  return headers;
 };
 const remember=payload=>{
  localToken=payload.token;localUser=payload.user;role=localUser.role;
  localStorage.setItem('gramin-local-token',localToken);localStorage.setItem('gramin-local-user',JSON.stringify(localUser));
  sessionStorage.removeItem('gramin-preview-role');
 };
 const forget=()=>{
  localStorage.removeItem('gramin-local-token');localStorage.removeItem('gramin-local-user');
  sessionStorage.removeItem('gramin-preview-role');sessionStorage.removeItem('gramin-preview-tech');
  localToken='';localUser=null;role='customer';data=null;selected=null;view='home';
 };
 const request=async(path,body)=>{
  const response=await fetch(path,{method:'POST',headers:{'Content-Type':'application/json',...authHeaders()},body:JSON.stringify(body||{})});
  const output=await response.json();if(!response.ok)throw Error(output.error||'Request could not be completed');return output;
 };

 load=async()=>{
  if(!localToken){data=null;return;}
  const response=await fetch('/api/state',{headers:authHeaders()}),output=await response.json();
  if(!response.ok){if(response.status===401)forget();throw Error(output.error||'Unable to load your account');}
  data=output;
  if(localUser&&output.user?.accountId===localUser.accountId){localUser={...localUser,name:output.user.name,login:output.user.login,status:output.user.status,technicianId:output.user.technicianId,profile:output.user.profile||{}};localStorage.setItem('gramin-local-user',JSON.stringify(localUser));if(localUser.role==='customer'){draft={name:localUser.name,phone:localUser.profile.phone||'',...draft};}}
 };
 act=async(action,input)=>{
  if(busy)return;busy=true;document.querySelectorAll('button[type=submit],button[data-action]').forEach(button=>button.disabled=true);
  const signature=JSON.stringify({action,input,account:localUser?.accountId,role});let pending;try{pending=JSON.parse(sessionStorage.getItem('gramin-pending')||'null');}catch{}
  const key=pending?.signature===signature?pending.key:crypto.randomUUID();sessionStorage.setItem('gramin-pending',JSON.stringify({signature,key}));
  try{
   const response=await fetch('/api/actions',{method:'POST',headers:{'Content-Type':'application/json','Idempotency-Key':key,...authHeaders()},body:JSON.stringify({action,input})});
   const output=await response.json();if(!response.ok){sessionStorage.removeItem('gramin-pending');if(response.status===401){forget();render();throw Error('Your session expired. Log in again to continue.');}throw Error(output.error);}
   sessionStorage.removeItem('gramin-pending');selected=output.id||selected;
   if(action==='create'){view='booking';draft={};localStorage.removeItem('gramin-draft');}
   await load();render();toast(t('Saved to the local demo','నమూనాలో సేవ్ అయింది'));return output;
  }catch(error){toast(error.message==='Failed to fetch'?t('Connection lost. Your draft is saved. Reconnect and retry.','కనెక్షన్ లేదు. మళ్లీ ప్రయత్నించండి.'):error.message);}
  finally{busy=false;if(localToken&&data)render();}
 };

 function authScreen(){
  document.documentElement.lang='en';document.querySelector('#roles').innerHTML='';
  app.innerHTML=`<div class="auth-shell"><section class="card auth-card"><div class="eyebrow">GRAMIN ACCOUNT ACCESS</div><h1>${authMode==='login'?'Welcome back':'Create your account'}</h1><p class="muted">Use your email address or mobile number. This local preview stores accounts only on this computer.</p><div class="auth-tabs"><button type="button" data-auth-mode="login" class="${authMode==='login'?'active':''}">Log in</button><button type="button" data-auth-mode="signup" class="${authMode==='signup'?'active':''}">Sign up</button></div>${authMode==='login'?loginForm():signupForm()}<p id="auth-error" class="auth-error" role="alert"></p></section><aside class="card auth-help"><div class="eyebrow">LOCAL DEMO ACCOUNTS</div><h2>Try each workspace</h2><p>All demo accounts use password <strong>123456</strong>.</p>${[['demo-admin','Owner / Admin'],['demo-customer','Customer'],['demo-tech-1','Technician']].map(([login,label])=>`<button type="button" class="demo-login" data-demo-login="${login}"><strong>${label}</strong><small>${login}</small></button>`).join('')}<p class="muted">Public sign-up creates Customer or pending Technician accounts. Admin accounts can be created only inside the Owner workspace.</p></aside></div>`;
  bindAuth();
 }
 function loginForm(){return `<form id="login-form">${field('Email or mobile','login','','text','required autocomplete="username"')}${field('Password','password','','password','required minlength="6" autocomplete="current-password"')}<button class="primary full" type="submit">Log in</button></form>`;}
 function signupForm(){return `<form id="signup-form">${field('Full name','name','','text','required maxlength="80" autocomplete="name"')}${field('Email or mobile','login','','text','required autocomplete="username"')}${field('Create password','password','','password','required minlength="6" maxlength="128" autocomplete="new-password"')}<label class="field">Join as<select name="role"><option value="customer">Customer</option><option value="technician">Technician</option></select></label><fieldset id="signup-skills" class="skills" hidden><legend>Services you can handle</legend>${[['ac','AC repair'],['plumbing','Plumbing'],['electrical','Electrical work'],['washing','Washing machine']].map(([id,label])=>`<label class="check"><input type="checkbox" name="skills" value="${id}">${label}</label>`).join('')}</fieldset><button class="primary full" type="submit">Create account</button><p class="muted">Technician access starts only after Owner approval.</p></form>`;}
 function bindAuth(){
  document.querySelectorAll('[data-auth-mode]').forEach(button=>button.onclick=()=>{authMode=button.dataset.authMode;authScreen();});
  document.querySelectorAll('[data-demo-login]').forEach(button=>button.onclick=()=>{authMode='login';authScreen();document.querySelector('#login-form [name=login]').value=button.dataset.demoLogin;document.querySelector('#login-form [name=password]').value='123456';});
  const showError=error=>{const target=document.querySelector('#auth-error');if(target)target.textContent=error.message;};
  const login=document.querySelector('#login-form');if(login)login.onsubmit=async event=>{event.preventDefault();try{const values=Object.fromEntries(new FormData(login));remember(await request('/api/auth/login',values));await load();render();toast('Signed in');}catch(error){showError(error);}};
  const signup=document.querySelector('#signup-form');if(signup){const roleField=signup.elements.role,skills=document.querySelector('#signup-skills');roleField.onchange=()=>{skills.hidden=roleField.value!=='technician';};signup.onsubmit=async event=>{event.preventDefault();try{const form=new FormData(signup),values=Object.fromEntries(form);values.skills=form.getAll('skills');remember(await request('/api/auth/signup',values));await load();render();toast(localUser.status==='pending'?'Application submitted for Owner approval':'Account created');}catch(error){showError(error);}};}
 }
 function pendingScreen(){
  accountNav();
  app.innerHTML=`<div class="auth-shell"><section class="card auth-card"><span class="pill">TECHNICIAN APPLICATION PENDING</span><h1>Thanks, ${esc(localUser.name)}.</h1><p>Your service skills and contact details were submitted. An Owner must approve the application before assigned visits and technician actions become available.</p><div class="note">Ask an Owner to log in, open Admin, and approve your application under Account administration.</div><button class="primary" id="check-approval">Check approval status</button></section><aside class="card auth-help"><h2>What happens next?</h2><p>After approval, log in with the same email/mobile and password. You will go directly to the Technician workspace.</p></aside></div>`;
  document.querySelector('#check-approval').onclick=async()=>{try{await load();render();toast(localUser.status==='active'?'Approved — technician access is ready':'Still awaiting Owner approval');}catch(error){toast(error.message);}};
 }
 function accountNav(){
  const nav=document.querySelector('#roles');
  if(!localUser){nav.innerHTML='';return;}
  const ownerSwitch=localUser.role==='admin'?`<label class="role-switch">Workspace<select id="role-switch"><option value="admin" ${role==='admin'?'selected':''}>Admin</option><option value="customer" ${role==='customer'?'selected':''}>Customer</option><option value="technician" ${role==='technician'?'selected':''}>Technician</option></select></label>`:`<span class="pill">${localUser.role==='technician'?'Technician':'Customer'} workspace</span>`;
  const ownerTools=localUser.role==='admin'?`<label class="owner-tools">Owner tools<select id="owner-tools"><option value="">Choose an action</option><option value="tickets">Customer tickets</option><option value="assign">Assign technician</option><option value="monitor">Technician dashboard</option><option value="branches">Add / edit branches</option><option value="admins">Add new Admin</option><option value="technicians">Technician approvals</option><option value="settings">Service settings</option></select></label>`:'';
  nav.innerHTML=`<div class="account-nav">${ownerSwitch}${ownerTools}<span class="account-name"><strong>${esc(localUser.name||localUser.login)}</strong><small>${esc(localUser.login)}</small></span><button class="quiet" id="tickets-nav">${role==='technician'?'My Tickets':'Tickets'}</button><button class="quiet" id="logout">Log out</button></div>`;
  const switcher=document.querySelector('#role-switch');if(switcher)switcher.onchange=async event=>{role=event.target.value;sessionStorage.setItem('gramin-preview-role',role);selected=null;view='home';try{await load();render();}catch(error){role='admin';sessionStorage.setItem('gramin-preview-role','admin');await load();render();toast(error.message);}};
  const tickets=document.querySelector('#tickets-nav');if(tickets)tickets.onclick=()=>{view='tickets';render();};
  const tools=document.querySelector('#owner-tools');if(tools)tools.onchange=()=>{const action=tools.value;if(!action)return;role='admin';view=action==='tickets'||action==='assign'?'tickets':'owner-'+action;render();};
  document.querySelector('#logout').onclick=async()=>{try{await request('/api/auth/logout',{});}catch{}forget();authMode='login';render();};
 }
 function accountPanel(){
  const accounts=data.accounts||[],pending=accounts.filter(account=>account.role==='technician'&&account.status==='pending'),admins=accounts.filter(account=>account.role==='admin');
  return `<section class="card account-admin"><div class="eyebrow">OWNER-ONLY ACCOUNT ADMINISTRATION</div><h2>People and access</h2><p class="muted">Public sign-up cannot create an Admin. Only this signed-in Owner workspace can add one.</p><div class="account-grid"><div><h3>Technician applications</h3>${pending.length?pending.map(account=>`<div class="applicant"><strong>${esc(account.name)}</strong><small>${esc(account.login)} · ${account.skills.map(esc).join(', ')}</small><button class="secondary" data-approve-technician="${esc(account.id)}">Approve technician</button></div>`).join(''):'<p class="muted">No applications are waiting.</p>'}</div><form id="create-admin-form"><h3>Create another Admin</h3>${field('Name','name','','text','required maxlength="80"')}${field('Email or mobile','login','','text','required')}${field('Temporary password','password','','password','required minlength="6" maxlength="128"')}<button class="primary full" type="submit">Create Admin</button><small>${admins.length} locally created Admin account${admins.length===1?'':'s'}.</small></form></div><p id="account-error" class="auth-error" role="alert"></p></section>`;
 }
 function customerProfilePanel(){
  const profile=localUser.profile||{};
  return `<details class="card profile-card" ${profile.phone&&profile.village?'':'open'}><summary><span><small>YOUR SAVED DETAILS</small>Customer profile</span><span class="pill">${profile.phone&&profile.village?'Saved':'Complete profile'}</span></summary><p class="muted">These details stay with this account and fill new service requests automatically.</p><form id="profile-form"><div class="fields">${field('Full name','name',localUser.name||'','text','required maxlength="80" autocomplete="name"')}${field('Mobile number','phone',profile.phone||'','tel','required pattern="[6-9][0-9]{9}" maxlength="10" inputmode="numeric" autocomplete="tel"')}${field('Village / neighbourhood','village',profile.village||'','text','required maxlength="100"')}${field('PIN code','pin',profile.pin||'','text','required pattern="[0-9]{6}" maxlength="6" inputmode="numeric"')}</div>${field('Landmark & directions','landmark',profile.landmark||'','text','required maxlength="250"')}<button class="secondary" type="submit">Save my details</button></form><p id="profile-error" class="auth-error" role="alert"></p></details>`;
 }
 function bindCustomerProfile(){const form=document.querySelector('#profile-form');if(!form)return;form.onsubmit=async event=>{event.preventDefault();const error=document.querySelector('#profile-error');error.textContent='';try{const output=await request('/api/auth/profile',Object.fromEntries(new FormData(form)));localUser={...localUser,...output.user};localStorage.setItem('gramin-local-user',JSON.stringify(localUser));draft={...draft,name:localUser.name,...localUser.profile};localStorage.setItem('gramin-draft',JSON.stringify(draft));await load();render();toast(output.message);}catch(problem){error.textContent=problem.message;}};}
 function bindAccountPanel(){
  const show=message=>{const output=document.querySelector('#account-error');if(output)output.textContent=message;};
  document.querySelectorAll('[data-approve-technician]').forEach(button=>button.onclick=async()=>{button.disabled=true;try{const output=await request('/api/auth/technicians/approve',{userId:button.dataset.approveTechnician});await load();render();toast(output.message);}catch(error){button.disabled=false;show(error.message);}});
  const form=document.querySelector('#create-admin-form');if(form)form.onsubmit=async event=>{event.preventDefault();try{const output=await request('/api/auth/admins',Object.fromEntries(new FormData(form)));await load();render();toast(output.message);}catch(error){show(error.message);}};
 }
 function enhanceTechnicianIdentity(){
  const picker=document.querySelector('#technician');if(!picker)return;
  const label=picker.closest('label');
  if(localUser.role!=='admin'){label.remove();return;}
  label.firstChild.textContent='Technician preview identity';const chosen=sessionStorage.getItem('gramin-preview-tech')||data.technicians[0]?.id;if(chosen)picker.value='demo-'+chosen;
  picker.onchange=async event=>{sessionStorage.setItem('gramin-preview-tech',event.target.value.replace(/^demo-/,''));selected=null;await load();render();};
 }
 render=function(){
  if(!localToken||!localUser){authScreen();return;}
  if(!data){app.innerHTML='<div class="card"><h1>Loading your workspace…</h1></div>';accountNav();return;}
  if(localUser.status==='pending'){pendingScreen();return;}
  if(localUser.role!=='admin')role=localUser.role;else if(!['admin','customer','technician'].includes(role))role='admin';
  baseRender();accountNav();
  if(localUser.role==='admin'&&role==='admin'){app.insertAdjacentHTML('afterbegin',accountPanel());bindAccountPanel();}
  if(role==='technician')enhanceTechnicianIdentity();
 };

 if(localToken&&localUser){role=localUser.role==='admin'?(sessionStorage.getItem('gramin-preview-role')||'admin'):localUser.role;load().then(render).catch(error=>{toast(error.message);render();});}
 else render();
})();

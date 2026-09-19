/* Customers choose a search centre themselves; no device location is requested. */
(()=>{
 const key='gramin-typed-location';localStorage.removeItem('gramin-customer-location');
 const read=()=>{try{const value=JSON.parse(localStorage.getItem(key)||'null');return Number.isFinite(value?.latitude)&&Number.isFinite(value?.longitude)?value:null;}catch{return null;}};
 const write=value=>localStorage.setItem(key,JSON.stringify(value));
 window.graminLocation={get:read};
 const close=()=>document.querySelector('#location-picker')?.remove();
 const update=()=>{
  const holder=document.querySelector('header .location');if(!holder)return;
  if(!localToken||!localUser||localUser.role!=='customer'){holder.textContent='';close();return;}
  const location=read();holder.innerHTML=`<button type="button" class="location-control" id="change-location">${location?'⌖ Nearby villages · 50 km':'⌖ Select your location'}<small>${location?'Change location':'Type your town or village'}</small></button>`;
  document.querySelector('#change-location').onclick=picker;
 };
 function picker(){
  close();const panel=document.createElement('section');panel.id='location-picker';panel.className='location-picker';panel.innerHTML='<div class="row"><strong>Choose your location</strong><button type="button" class="quiet" id="close-location">Close</button></div><label class="field">Town or village<input id="location-query" autocomplete="off" placeholder="Start typing your town or village"></label><div id="location-results" class="place-options" role="listbox"></div><p class="muted">Choose a result to show village suggestions within 50 km. Your selection stays only in this browser.</p>';
  document.body.append(panel);document.querySelector('#close-location').onclick=close;
  const input=document.querySelector('#location-query'),results=document.querySelector('#location-results');let timer,controller;
  input.oninput=()=>{clearTimeout(timer);controller?.abort();const q=input.value.trim();results.innerHTML='';if(q.length<3)return;timer=setTimeout(async()=>{controller=new AbortController();try{const response=await fetch('/api/places?q='+encodeURIComponent(q),{headers:{Authorization:'Bearer '+token()},signal:controller.signal}),body=await response.json();if(!response.ok)throw Error(body.error);results.innerHTML=(body.places||[]).map((place,index)=>`<button type="button" role="option" class="location-result" data-index="${index}"><strong>${esc(place.name)}</strong><small>${esc(place.label)}</small></button>`).join('')||'<p class="muted">No matching location found. Try a fuller name.</p>';results.querySelectorAll('[data-index]').forEach(button=>button.onclick=()=>{const place=body.places[Number(button.dataset.index)];write({latitude:place.latitude,longitude:place.longitude,name:place.name,updatedAt:new Date().toISOString()});close();update();toast('Location selected. Village suggestions are now within 50 km.');});}catch(error){if(error.name!=='AbortError')results.innerHTML='<p class="muted">Location search is unavailable. Try again shortly.</p>';};},350);};
  input.focus();
 }
 const baseRender=render;render=function(){baseRender();update();};update();
})();

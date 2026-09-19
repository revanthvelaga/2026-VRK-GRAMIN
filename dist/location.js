/* Customer location stays in this browser and is used only to narrow village suggestions. */
(()=>{
 const key='gramin-customer-location';let locating=false;
 const read=()=>{try{const value=JSON.parse(localStorage.getItem(key)||'null');return Number.isFinite(value?.latitude)&&Number.isFinite(value?.longitude)?value:null;}catch{return null;}};
 const write=value=>{localStorage.setItem(key,JSON.stringify(value));};
 window.graminLocation={get:read};
 const update=()=>{
  const holder=document.querySelector('header .location');if(!holder)return;
  if(!localToken||!localUser||localUser.role!=='customer'){holder.textContent='';return;}
  const location=read();holder.innerHTML=`<button type="button" class="location-control" id="change-location">${location?'⌖ Nearby villages · 50 km':'⌖ Use my location'}<small>${location?'Change location':'For local village suggestions'}</small></button>`;
  const button=document.querySelector('#change-location');if(button)button.onclick=request;
 };
 function request(){
  if(!navigator.geolocation){toast('Location is not available in this browser. You can still enter your village manually.');return;}
  if(locating)return;locating=true;const button=document.querySelector('#change-location');if(button)button.innerHTML='⌖ Finding your location…<small>Please allow location access</small>';
  navigator.geolocation.getCurrentPosition(position=>{locating=false;write({latitude:position.coords.latitude,longitude:position.coords.longitude,accuracy:Math.round(position.coords.accuracy),updatedAt:new Date().toISOString()});update();toast('Location saved. Village suggestions are now within 50 km.');},()=>{locating=false;update();toast('Location was not shared. You can still search and enter your village manually.');},{enableHighAccuracy:false,timeout:10000,maximumAge:300000});
 }
 const baseRender=render;render=function(){baseRender();update();if(localToken&&localUser?.role==='customer'&&!read()&&!sessionStorage.getItem('gramin-location-requested')){sessionStorage.setItem('gramin-location-requested','true');request();}};
 update();
})();

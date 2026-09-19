// Public Photon demo service: low-volume local prototype only.
// Production should configure a contracted or self-hosted Photon service.
const cache=new Map();let nextRequest=0;
const earthRadiusKm=6371;
const distanceKm=(a,b)=>{const radians=value=>value*Math.PI/180,dLat=radians(b.latitude-a.latitude),dLon=radians(b.longitude-a.longitude),x=Math.sin(dLat/2)**2+Math.cos(radians(a.latitude))*Math.cos(radians(b.latitude))*Math.sin(dLon/2)**2;return 2*earthRadiusKm*Math.asin(Math.sqrt(x));};
export function normalizePlaces(body,center=null){
 const seen=new Set();return (body.features||[]).filter(f=>f.properties?.countrycode==='IN'&&f.properties?.name&&f.geometry?.type==='Point').map(f=>{
  const p=f.properties;return {id:`${p.osm_type}${p.osm_id}`,name:p.name,label:[p.name,p.county,p.state,p.country].filter(Boolean).join(', '),postcode:/^\d{6}$/.test(p.postcode||'')?p.postcode:'',longitude:f.geometry.coordinates[0],latitude:f.geometry.coordinates[1],source:'OpenStreetMap via Photon'};
 }).filter(p=>{if(seen.has(p.id)||!Number.isFinite(p.longitude)||!Number.isFinite(p.latitude))return false;if(center&&distanceKm(center,p)>50)return false;seen.add(p.id);return true;}).slice(0,6);
}
export async function searchPlaces(query,center=null){
 const q=(query||'').trim();if(q.length<3)return {places:[],source:'OpenStreetMap via Photon'};
 if(q.length>100)throw Object.assign(new Error('Village search is too long'),{status:400});
 const nearby=center&&Number.isFinite(center.latitude)&&Number.isFinite(center.longitude)&&Math.abs(center.latitude)<=90&&Math.abs(center.longitude)<=180?center:null;
 const key=q.toLocaleLowerCase()+`:${nearby?`${nearby.latitude.toFixed(2)},${nearby.longitude.toFixed(2)}`:'all'}`;const previous=cache.get(key);if(previous&&Date.now()-previous.at<600000)return previous.result;
 const wait=Math.max(0,nextRequest-Date.now());if(wait>3000)throw Object.assign(new Error('Search is busy. Please try again shortly.'),{status:429});
 nextRequest=Date.now()+wait+1100;if(wait)await new Promise(r=>setTimeout(r,wait));
 const url=new URL(globalThis.process?.env?.PHOTON_URL||'https://photon.komoot.io/api/');
 url.searchParams.set('q',q);url.searchParams.set('countrycode','IN');url.searchParams.set('limit','30');url.searchParams.set('lang','en');if(nearby){url.searchParams.set('lat',nearby.latitude);url.searchParams.set('lon',nearby.longitude);}
 url.searchParams.append('layer','city');url.searchParams.append('layer','locality');url.searchParams.append('layer','district');
 try{const r=await fetch(url,{headers:{'User-Agent':'GraminLocalPrototype/1.0 village-search'},signal:AbortSignal.timeout(10000)});if(!r.ok)throw Error('Provider unavailable');const result={places:normalizePlaces(await r.json(),nearby),source:'OpenStreetMap via Photon',radiusKm:nearby?50:null};if(cache.size>=200)cache.delete(cache.keys().next().value);cache.set(key,{at:Date.now(),result});return result;}catch{throw Object.assign(new Error('Map search is unavailable. Enter your village and PIN manually, or try again.'),{status:503});}
}

import {readFileSync,writeFileSync} from 'node:fs';
let code=readFileSync('live/app.js','utf8');
code=code.replace('villageSearch();','villageSearch();setupDataView();');
code=code.replace('<section class="card"><h2>Backup and service health</h2>','<details class="card"><summary>View hosted database records (owner only)</summary><p>Read-only records. Payment entries show cash status and receipts; no payment-provider credentials are stored here.</p><label>Data category<select id="data-category"><option value="bookings">Bookings</option><option value="technicians">Technicians</option><option value="settings">Business settings</option><option value="booking_events">Booking audit history</option><option value="payments">Payment records</option><option value="operations">Transaction and retry history</option></select></label><div class="actions"><button class="quiet" type="button" id="data-refresh">Refresh records</button><button class="quiet" type="button" id="data-previous" disabled>Previous page</button><button class="quiet" type="button" id="data-next" disabled>Next page</button></div><p id="data-status" role="status">Choose a category and press Refresh records.</p><div id="data-records"></div></details><section class="card"><h2>Backup and service health</h2>');
code+=`
function setupDataView(){
 const selector=document.querySelector('#data-category');if(!selector)return;
 const status=document.querySelector('#data-status'),records=document.querySelector('#data-records'),previous=document.querySelector('#data-previous'),next=document.querySelector('#data-next'),refresh=document.querySelector('#data-refresh');let offset=0,loading=false;
 async function load(){if(loading)return;loading=true;refresh.disabled=previous.disabled=next.disabled=selector.disabled=true;status.textContent='Loading records…';records.replaceChildren();try{
  const r=await fetch('/api/data?table='+encodeURIComponent(selector.value)+'&offset='+offset),data=await r.json();if(!r.ok)throw Error(data.error||'Unable to load records');
  status.textContent=data.rows.length?'Showing '+(offset+1)+'–'+(offset+data.rows.length)+'. Refreshed '+new Date().toLocaleTimeString():'No records in this category.';
  records.innerHTML=data.rows.map(row=>'<details class="card"><summary>'+esc(row.name||row.id||'Record')+'</summary><dl>'+Object.entries(row).map(([key,value])=>{let display=value;try{if(['data','skills','result'].includes(key)&&typeof value==='string')display=JSON.stringify(JSON.parse(value),null,2);}catch{}return '<dt><strong>'+esc(key.replaceAll('_',' '))+'</strong></dt><dd><pre>'+esc(display??'—')+'</pre></dd>';}).join('')+'</dl></details>').join('');previous.disabled=offset===0;next.disabled=!data.hasMore;
 }catch(e){status.textContent=e.message;}finally{refresh.disabled=selector.disabled=false;loading=false;}}
 refresh.onclick=()=>{offset=0;load();};selector.onchange=()=>{offset=0;load();};previous.onclick=()=>{offset=Math.max(0,offset-25);load();};next.onclick=()=>{offset+=25;load();};
}
`;
writeFileSync('live/app.js',code);

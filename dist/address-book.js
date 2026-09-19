(()=>{
 const baseRender=render;
 render=function(){
  baseRender();
  if(!localToken||!data||localUser?.role!=='customer'||role!=='customer'||view!=='form')return;
  const form=document.querySelector('#booking-form');
  if(!form||form.dataset.addressBook)return;
  form.dataset.addressBook='ready';
  const addresses=data.user?.profile?.addresses||[];
  const anchor=form.querySelector('.fields')||form.querySelector('textarea[name=issue]')?.closest('label');
  if(!anchor)return;
  const options=addresses.map(address=>'<option value="'+esc(address.id)+'">'+esc(address.label||'Saved address')+' · '+esc(address.village)+'</option>').join('');
  const saved=addresses.length?'<label class="field address-picker">Choose a saved address<select id="saved-address"><option value="">Add a new address</option>'+options+'</select></label><p class="muted">Selecting an address fills the visit form. You can still edit it for this request.</p>':'<p class="muted address-empty">No saved addresses yet. Add this one below and save it for your next request.</p>';
  const controls='<section class="address-book"><div class="eyebrow">SERVICE ADDRESS</div><h3>Where should we come?</h3>'+saved+'<label class="field">Address name<input name="addressLabel" maxlength="40" value="Home" placeholder="Home, Parents, Shop"></label><label class="check"><input type="checkbox" name="saveAddress">Save this address for future service requests</label></section>';
  anchor.insertAdjacentHTML('beforebegin',controls);
  const picker=document.querySelector('#saved-address');
  if(picker)picker.onchange=()=>{
   const address=addresses.find(item=>item.id===picker.value);
   if(!address)return;
   for(const name of ['name','phone','village','pin','landmark']){const input=form.elements[name];if(input)input.value=address[name]||'';}
   form.elements.addressLabel.value=address.label||'Saved address';
   form.elements.saveAddress.checked=false;
   draft.saveAddress=false;
   form.dispatchEvent(new Event('input',{bubbles:true}));
  };
 };
})();

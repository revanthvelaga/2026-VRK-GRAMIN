import {test} from 'node:test';
import assert from 'node:assert/strict';
import {normalizePlaces} from '../backend/places.mjs';
import {apply,initialState} from '../backend/domain.mjs';
test('map results exclude foreign results and malformed points, remove duplicates and never guess a PIN',()=>{
 const f={properties:{countrycode:'IN',name:'G.Koduru',county:'Makavarapalem',state:'Andhra Pradesh',country:'India',osm_type:'N',osm_id:1},geometry:{type:'Point',coordinates:[82.7,17.5]}};
 const places=normalizePlaces({features:[f,f,{...f,properties:{...f.properties,countrycode:'US'}},{...f,geometry:{type:'Point',coordinates:[null,null]}}]});
 assert.equal(places.length,1);assert.equal(places[0].postcode,'');assert.match(places[0].label,/Makavarapalem/);
});
test('booking retains the selected map location without claiming coverage and rejects stale location',()=>{
 const state=initialState(),user={id:'c',role:'customer'};
 const input={service:'ac',name:'Demo',phone:'9000000000',village:'G.Koduru',landmark:'School',issue:'Not cooling',pin:'531113',slot:'Tomorrow · 9 am – 1 pm',consent:true,place:{id:'N1',name:'G.Koduru',label:'G.Koduru, Makavarapalem',latitude:17.5,longitude:82.7}};
 const result=apply(state,user,'create',input,'one');assert.equal(result.place.coverageConfirmed,false);assert.equal(result.place.latitude,17.5);
 assert.throws(()=>apply(state,user,'create',{...input,village:'Different village'},'two'),/Select the village again/);
});

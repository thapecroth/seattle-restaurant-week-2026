/* Synthetic arithmetic fixtures, never research evidence. */
const assert=require('node:assert/strict');
const E=require('./discount-engine.js');
const venue={id:1,name:'Synthetic test venue',city:'Seattle',cuisines:['test'],regular_menu_sources:[{id:'p',kind:'official_dine_in',branch_match:true,read_extent:'full',url:'https://example.com/menu'}]};
const offer={offer_id:'fixture',package_price:65,serves:1,meal:'dinner',event_valid:true};
const comparison={offer_id:'fixture',status:'verified',event_package_price:65,serves:1,basket_type:'maximum_choice',selected_choices:['Starter','Main','Dessert'],items:[{name:'Starter',quantity:1,unit_price:20,source_ids:['p'],event_match:'exact'},{name:'Main',quantity:1,unit_price:50,source_ids:['p'],event_match:'exact'},{name:'Dessert',quantity:1,unit_price:15,source_ids:['p'],event_match:'exact'}],regular_combo_price:null,regular_combo_source_ids:[],complete_basket:true,portion_equivalent:true,event_valid:true,event_only_mandatory_extra:0,uncertainties:[]};
const x=E.normalize(venue,comparison,offer);
assert.equal(x.regular_total,85);
assert.equal(x.event_total,65);
assert.equal(x.saved_total,20);
assert.equal(x.saved_pp,20);
assert.equal(x.discount_pct,20/85*100);
assert.equal(x.verified,true);
assert.equal(x.rankable,true);
console.log('PASS: a valid maximum-choice basket computes actual menu-price savings');
const combo=E.normalize(venue,{...comparison,regular_combo_price:70,regular_combo_source_ids:['p'],regular_combo_notes:'Same exact basket sold as a normal bundle'},offer);
assert.equal(combo.regular_total,70,'Use a cheaper identical regular combo, not inflated a-la-carte sum');
assert.equal(combo.saved_total,5);
assert.equal(combo.regular_route,'regular_combo');
console.log('PASS: cheapest identical normal purchase route wins');
for(const [name,c,o,r] of [
 ['partial basket',{...comparison,complete_basket:false},offer,venue],
 ['unpriced component',{...comparison,items:[{...comparison.items[0],unit_price:null}]},offer,venue],
 ['unknown serving basis',comparison,{...offer,serves:null},venue],
 ['wrong event tier',{...comparison,event_package_price:35},offer,venue],
 ['ended event',comparison,{...offer,event_valid:false},venue],
 ['missing current event validity',{...comparison,event_valid:null},offer,venue],
 ['wrong branch',comparison,offer,{...venue,regular_menu_sources:[{...venue.regular_menu_sources[0],branch_match:false}]}],
 ['third-party delivery',comparison,offer,{...venue,regular_menu_sources:[{...venue.regular_menu_sources[0],kind:'third_party'}]}],
 ['historical menu',comparison,offer,{...venue,regular_menu_sources:[{...venue.regular_menu_sources[0],kind:'historical'}]}]
]){const result=E.normalize(r,c,o);assert.equal(result.rankable,false,name);assert.equal(result.discount_pct,null,name+' must not fabricate a discount');}
const portions=E.normalize(venue,{...comparison,portion_equivalent:false,status:'provisional'},offer);
assert.equal(portions.verified,false);
assert.equal(portions.rankable,true,'A completely priced same-named estimate may be shown with an explicit estimate badge');
const ordering=E.normalize({...venue,regular_menu_sources:[{...venue.regular_menu_sources[0],kind:'official_ordering'}]},comparison,offer);
assert.equal(ordering.verified,false,'Official takeout pricing is not proven dine-in pricing');
console.log('PASS: provenance, full baskets, portion confidence, serving and current-event gates');
const large=E.normalize({...venue,id:2,name:'Other synthetic venue',city:'Bellevue',cuisines:['japanese']},{...comparison,event_package_price:270,items:[{...comparison.items[0],unit_price:300}]},{...offer,package_price:270,meal:'lunch'});
assert.equal(E.rank([large,x],'percent')[0].key,x.key);
assert.equal(E.rank([large,x],'dollars')[0].key,large.key);
assert.equal(E.filter([large,x],{city:'Bellevue',cuisine:'japanese',q:'other',meal:'lunch'}).length,1);
assert.equal(E.filter([large,x],{city:'Bellevue',cuisine:'korean'}).length,0);
assert.equal(E.filter([x,portions],{verified:true}).length,1);
const bad=E.normalize(venue,{...comparison,event_package_price:95},{...offer,package_price:95});
assert.equal(bad.saved_total,-10);
assert.equal(bad.rankable,true,'Negative savings are a real finding, not an unknown');
assert.equal(E.rank([bad,x],'percent')[1].key,bad.key);
const shared=E.normalize(venue,{...comparison,event_package_price:65,serves:2,event_only_mandatory_extra:5},{...offer,serves:2});
assert.equal(shared.event_total,70);
assert.equal(shared.saved_pp,7.5);
console.log('PASS: %/$ rankings, combined filters, negative savings, parties and event extras');

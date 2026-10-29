/* Presentation grouping tests against actual audit records and modified copies. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const E=require('./frontier-engine.js');
const G=require('./offer-groups.js');
const data=JSON.parse(fs.readFileSync('signature-data.json','utf8'));
const r=data.restaurants.find(x=>x.id===17459);
const raw=r.offers.map(o=>E.normalizeOffer(r,o,2));
const grouped=G.collapse(raw);
assert.equal(raw.length,4);
assert.equal(grouped.length,2,'One card per distinct $35/$50 menu, not a duplicate for each meal');
assert.deepEqual(grouped.map(o=>o.package_price).sort((a,b)=>a-b),[35,50]);
assert(grouped.every(o=>o.meals.includes('lunch')&&o.meals.includes('dinner')));
assert(grouped.every(o=>o.display_label.includes('Lunch & dinner')));
assert.equal(grouped.reduce((n,o)=>n+o.member_keys.length,0),4);
assert.equal(G.collapse(E.filterOffers(raw,{meal:'lunch'})).length,2);
const a=raw[0];
for(const change of [
 {included_dishes:['A genuinely different menu']},
 {serves:2},
 {package_price:50},
 {mandatory_fee_pct:20},
 {min_party:3},
 {availability_notes:'Different date or participation restrictions'},
 {restaurant:{...r,id:99999}},
 {label:'A different named tier'}
])assert.equal(G.collapse([a,{...a,key:'different',offer_id:'different',meal:'dinner',...change}]).length,2,'Do not merge a real difference');
console.log('PASS: lunch/dinner duplicates collapse; prices, menus, portions, fees, parties, dates, branches and tiers stay separate');
const p1={restaurant:{id:1},key:'1:a',offer_id:'a',items:[{name:'Same dish',unit_price:20}],regular_total:20,event_total:15,event_offer:{offer_id:'a',label:'Lunch set',meal:'lunch',package_price:15,serves:1}};
const p2={...p1,key:'1:b',offer_id:'b',event_offer:{...p1.event_offer,offer_id:'b',meal:'dinner',label:'Dinner set'}};
assert.equal(G.collapseDiscount([p1,p2]).length,1);
assert.equal(G.collapseDiscount([p1,p2])[0].member_keys.length,2);
assert.equal(G.collapseDiscount([p1,{...p2,regular_total:25}]).length,2,'Different original-price baskets must not merge');
console.log('PASS: savings-view grouping preserves price/evidence differences');

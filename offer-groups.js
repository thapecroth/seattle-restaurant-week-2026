/* Exact presentation deduplication. Original audit records and IDs remain intact. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.SRWOfferGroups=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const mealNames={lunch:'Lunch',dinner:'Dinner',brunch:'Brunch',any:'All meals'};
  const stripMeal=s=>String(s||'').replace(/\b(?:lunch|dinner|brunch|any)\b/gi,'').replace(/\s+/g,' ').replace(/^\s*[-:—·]+\s*|\s*[-:—·]+\s*$/g,'').trim();
  function stable(value){
    if(Array.isArray(value))return value.map(stable);
    if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(k=>[k,stable(value[k])]));
    return value;
  }
  function fingerprint(offer){
    const skip=new Set(['restaurant','key','offer_id','meal','label','member_keys','members','meals','display_label']);
    const content=Object.fromEntries(Object.entries(offer).filter(([k])=>!skip.has(k)));
    content.restaurant_id=offer.restaurant.id;
    content.normalized_label=stripMeal(offer.label).toLowerCase();
    return JSON.stringify(stable(content));
  }
  function collapse(offers){
    const groups=new Map();
    for(const offer of offers){
      const id=fingerprint(offer);
      if(!groups.has(id))groups.set(id,{...offer,member_keys:[],members:[],meals:[]});
      const group=groups.get(id);
      group.member_keys.push(offer.key);
      group.members.push({key:offer.key,offer_id:offer.offer_id,label:offer.label,meal:offer.meal});
      if(offer.meal&&!group.meals.includes(offer.meal))group.meals.push(offer.meal);
    }
    return [...groups.values()].map(group=>{
      const ordered=['lunch','dinner','brunch','any'].filter(m=>group.meals.includes(m));
      group.meals=[...ordered,...group.meals.filter(m=>!ordered.includes(m))];
      const meals=group.meals.map(m=>mealNames[m]||m.toUpperCase()).join(' & ').replace('Lunch & Dinner','Lunch & dinner');
      group.display_label=group.members.length>1?`${meals} · ${stripMeal(group.label)}`:group.label;
      return group;
    });
  }
  function collapseDiscount(offers){
    const originals=new Map(offers.map(x=>[x.key,x]));
    const prepared=offers.map(x=>({...x,label:x.event_offer.label,meal:x.event_offer.meal,event_offer:{...x.event_offer,offer_id:null,meal:null,label:stripMeal(x.event_offer.label).toLowerCase()}}));
    return collapse(prepared).map(group=>({...group,event_offer:originals.get(group.key).event_offer}));
  }
  return {collapse,collapseDiscount,fingerprint};
});

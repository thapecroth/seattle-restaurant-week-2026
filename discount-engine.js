/* Published menu-price comparisons. Unknown evidence is never a zero-percent discount. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.SRWDiscount=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const finite=n=>typeof n==='number'&&Number.isFinite(n);
  const positive=n=>finite(n)&&n>0;
  const cents=n=>Math.round((n+Number.EPSILON)*100);
  function normalize(restaurant,comparison,offer){
    const sources=new Map((restaurant.regular_menu_sources||[]).map(s=>[s.id,s]));
    const primary=id=>{const s=sources.get(id);return !!s&&s.branch_match===true&&['official_dine_in','official_ordering'].includes(s.kind)&&['full','partial'].includes(s.read_extent)&&/^https?:\/\//i.test(s.url||'');};
    const refsValid=refs=>Array.isArray(refs)&&refs.length>0&&refs.every(primary);
    const dineIn=refs=>refs.every(id=>sources.get(id)?.kind==='official_dine_in');
    const items=Array.isArray(comparison.items)?comparison.items:[];
    const itemsValid=items.length>0&&items.every(x=>positive(x.quantity)&&positive(x.unit_price)&&['exact','portion_unknown'].includes(x.event_match)&&refsValid(x.source_ids));
    const itemSum=itemsValid?items.reduce((n,x)=>n+Math.round(x.quantity*cents(x.unit_price)),0):Infinity;
    const comboValid=positive(comparison.regular_combo_price)&&refsValid(comparison.regular_combo_source_ids);
    const combo=comboValid?cents(comparison.regular_combo_price):Infinity;
    const regular=Math.min(itemSum,combo),regular_route=combo<itemSum?'regular_combo':'itemized_basket';
    const routeDineIn=regular_route==='regular_combo'?dineIn(comparison.regular_combo_source_ids):itemsValid&&items.every(x=>dineIn(x.source_ids));
    const extraKnown=finite(comparison.event_only_mandatory_extra)&&comparison.event_only_mandatory_extra>=0;
    const eventBase=positive(offer.package_price)?cents(offer.package_price):null;
    const event=eventBase===null?null:eventBase+(extraKnown?cents(comparison.event_only_mandatory_extra):0);
    const serves=positive(offer.serves)?offer.serves:null;
    const reasons=[],cautions=[];
    if(!['verified','provisional'].includes(comparison.status))reasons.push('No supported complete comparison established');
    if(comparison.complete_basket!==true)reasons.push('The full event basket is not priced');
    if(!finite(regular)||regular<=0)reasons.push('No complete, current exact-branch primary price route');
    if(eventBase===null)reasons.push('Event package price is unresolved');
    if(!positive(comparison.event_package_price)||eventBase!==cents(comparison.event_package_price))reasons.push('Event price/tier does not match the canonical offer');
    if(serves===null)reasons.push('Event intended serving basis is unresolved');
    if(positive(comparison.serves)&&serves!==comparison.serves)reasons.push('Serving basis disagrees with the canonical offer');
    if(offer.event_valid!==true||comparison.event_valid!==true)reasons.push('Current event validity is not established');
    if(comparison.portion_equivalent!==true)cautions.push('Equal regular and event portions are not established');
    if(!routeDineIn)cautions.push('Ordering-channel prices are not confirmed dine-in prices');
    if(!extraKnown)cautions.push('Any additional event-only mandatory charge is unresolved');
    const rankable=reasons.length===0;
    const verified=rankable&&comparison.status==='verified'&&comparison.portion_equivalent===true&&routeDineIn&&extraKnown&&items.every(x=>x.event_match==='exact');
    const regularTotal=finite(regular)&&comparison.complete_basket===true?regular/100:null;
    const eventTotal=event===null?null:event/100;
    const saved=rankable?regular-event:null;
    return {...comparison,restaurant,event_offer:offer,key:restaurant.id+':'+offer.offer_id,regular_route,
      regular_total:regularTotal,event_total:eventTotal,
      regular_pp:regularTotal!==null&&serves!==null?regularTotal/serves:null,
      event_pp:eventTotal!==null&&serves!==null?eventTotal/serves:null,
      saved_total:saved===null?null:saved/100,saved_pp:saved===null?null:saved/100/serves,
      discount_pct:saved===null?null:saved/regular*100,verified,rankable,reasons,comparison_caveats:cautions};
  }
  function rank(offers,by='percent'){
    const field=by==='dollars'?'saved_pp':'discount_pct';
    return [...offers].sort((a,b)=>Number(b.rankable)-Number(a.rankable)||(finite(b[field])?b[field]:-Infinity)-(finite(a[field])?a[field]:-Infinity)||Number(b.verified)-Number(a.verified)||a.restaurant.name.localeCompare(b.restaurant.name));
  }
  function filter(offers,f={}){
    const q=String(f.q||'').trim().toLowerCase();
    return offers.filter(x=>(!f.city||x.restaurant.city===f.city)&&(!f.cuisine||(x.restaurant.cuisines||[]).includes(f.cuisine))&&(!f.meal||x.event_offer.meal===f.meal||x.event_offer.meal==='any')&&(!f.verified||x.verified)&&(!q||[x.restaurant.name,x.restaurant.city,x.event_offer.label,x.verdict,...(x.selected_choices||[]),...(x.items||[]).map(i=>i.name)].join(' ').toLowerCase().includes(q)));
  }
  return {normalize,rank,filter};
});

/* Price-first companion to the signature guide. All amounts come from cited audit records. */
(async()=>{
  'use strict';
  const E=window.SRWDiscount,G=window.SRWOfferGroups,h=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money=n=>Number.isFinite(n)?'$'+n.toFixed(2).replace(/\.00$/,''):'Unpriced';
  const safe=url=>/^https?:\/\//i.test(String(url))?url:'';
  const link=(url,label)=>safe(url)?`<a href="${h(url)}" target="_blank" rel="noopener noreferrer">${h(label)}</a>`:h(label);
  const controls={city:document.querySelector('#discount-city'),cuisine:document.querySelector('#discount-cuisine'),meal:document.querySelector('#discount-meal'),sort:document.querySelector('#discount-sort'),q:document.querySelector('#discount-search'),verified:document.querySelector('#discount-verified'),unknown:document.querySelector('#discount-unknown')};
  const status=document.querySelector('#discount-status');
  let data;
  try{const r=await fetch('discount-data.json',{cache:'no-store'});if(!r.ok)throw new Error('Price audit HTTP '+r.status);data=await r.json();}
  catch(e){status.className='notice';status.textContent='The price audit could not load. No discounts have been invented. The original signature guide remains available. '+e.message;return;}
  const offers=data.restaurants.flatMap(r=>(r.comparisons||[]).map(c=>{
    const offer=(r.offers||[]).find(x=>x.offer_id===c.offer_id);
    if(!offer)throw new Error('Unknown event offer '+c.offer_id);
    return E.normalize(r,c,offer);
  }));
  for(const [field,values] of [[controls.city,[...new Set(data.restaurants.map(r=>r.city).filter(Boolean))]],[controls.cuisine,[...new Set(data.restaurants.flatMap(r=>r.cuisines||[]))]]]){
    for(const value of values.sort((a,b)=>a.localeCompare(b))){const option=document.createElement('option');option.value=value;option.textContent=value;field.append(option);}
  }
  const p=new URLSearchParams(location.search);
  for(const key of ['city','cuisine','meal'])if([...controls[key].options].some(o=>o.value===p.get(key)))controls[key].value=p.get(key);
  controls.q.value=p.get('q')||'';controls.sort.value=p.get('sort')==='dollars'?'dollars':'percent';controls.verified.checked=p.get('verified')==='1';controls.unknown.checked=p.get('unknown')==='1';
  function card(x,i,max){
    const r=x.restaurant,o=x.event_offer,sourceMap=new Map((r.regular_menu_sources||[]).map(s=>[s.id,s]));
    const sources=(r.regular_menu_sources||[]).map(s=>`<li>${link(s.url,s.title||'Regular menu')}<br><small>${h(s.kind)} · checked ${h(s.checked_date)} · ${s.branch_match?'exact branch':'branch unconfirmed'}</small><p>${h(s.notes||'')}</p></li>`).join('');
    const rows=(x.items||[]).map(item=>`<tr><td>${h(item.name)}<p class="item-note">${h(item.portion_notes||'Portion evidence not supplied')}</p></td><td>${h(item.quantity)}</td><td>${money(item.unit_price)}</td><td>${(item.source_ids||[]).map(id=>sourceMap.get(id)).filter(Boolean).map(s=>link(s.url,'Price source')).join(' · ')||'No usable source'}<p class="item-note">${h(item.price_evidence||'')}</p></td></tr>`).join('');
    const kind=x.verified?'Verified portions':x.rankable?'Estimate — portions/channel caveat':'Unpriced / not comparable';
    let headline='Not ranked',subtitle='price or comparison gap',negative=false;
    if(x.rankable){negative=x.discount_pct<0;headline=(x.basket_type==='maximum_choice'&&!negative?'Up to ':'')+Math.abs(x.discount_pct).toFixed(1)+'%';subtitle=x.discount_pct<0?'more than regular':x.discount_pct===0?'no menu-price savings':x.verified?'menu-price savings':'estimated menu-price savings';}
    const valid=Number.isFinite(x.regular_pp)&&Number.isFinite(x.event_pp)&&x.rankable;
    const width=n=>Math.max(0,Math.min(100,n/max*100));
    const spectrum=valid?`<div class="price-spectrum" aria-label="Regular ${money(x.regular_pp)} versus event ${money(x.event_pp)} per person"><div class="spectrum-row"><span>Regular</span><span class="spectrum-track"><span class="spectrum-bar" style="width:${width(x.regular_pp)}%"></span></span><span class="spectrum-value">${money(x.regular_pp)}</span></div><div class="spectrum-row"><span>SRW</span><span class="spectrum-track"><span class="spectrum-bar event" style="width:${width(x.event_pp)}%"></span></span><span class="spectrum-value">${money(x.event_pp)}</span></div></div>`:'';
    const caveats=[...(x.comparison_caveats||[]),...(x.uncertainties||[]),...x.reasons];
    const min=o.min_party>1?' · minimum '+o.min_party+' diners':'';
    return `<article class="discount-card" id="deal-${h(x.key)}" data-discount-key="${h(x.key)}"><div class="discount-card-top"><div class="discount-card-heading"><p class="eyebrow">${String(i+1).padStart(2,'0')} · ${h(r.city)}</p><h3>${link(r.url,r.name)}</h3><p class="discount-card-label">${h(x.display_label||o.label||o.offer_id)}${(x.meals||[]).length>1?'':' · '+h(o.meal||'meal unspecified')}${h(min)}</p><span class="discount-kind ${x.verified?'':x.rankable?'estimate':'unpriced'}">${h(kind)}</span>${x.regular_route==='regular_combo'&&x.rankable?'<span class="discount-kind">Cheaper normal combo used</span>':''}</div><div class="discount-percent ${negative?'is-negative':''} ${x.rankable?'':'is-unknown'}">${h(headline)}<small>${h(subtitle)}</small></div></div><div class="discount-money-grid"><div><span>Regular equivalent</span><strong>${valid?money(x.regular_pp):'Unpriced'}</strong><small>per intended diner</small></div><div><span>Event menu price</span><strong>${money(x.event_pp)}</strong><small>${Number.isFinite(x.event_pp)?'per intended diner':money(x.event_total)+' package; basis unresolved'}</small></div><div><span>${x.saved_pp<0?'Extra cost':'Menu-price saving'}</span><strong>${x.rankable?money(Math.abs(x.saved_pp)):'Unresolved'}</strong><small>per intended diner</small></div></div>${spectrum}<p class="discount-basis">Same dollar scale across these results. Menu prices before ordinary tax, service and tips; known event-only mandatory extras included. ${h(x.fee_notes||'Regular fees are not established.')}</p>${caveats.length?'<p class="discount-caveat"><b>Comparison limits:</b> '+h([...new Set(caveats)].join(' · '))+'</p>':''}<div class="discount-choices"><b>${x.basket_type==='maximum_choice'?'Highest-value documented choices:':'The compared basket:'}</b><p>${h((x.selected_choices||[]).join(' · ')||'No fully priced valid basket established.')}</p><p>${h(x.verdict||'')}</p></div><details><summary>Item prices, portions &amp; sources</summary>${rows?'<div class="scroll"><table class="discount-breakdown"><thead><tr><th>Regular item / portion</th><th>Quantity</th><th>Unit price</th><th>Evidence</th></tr></thead><tbody>'+rows+'</tbody></table></div>':'<p>No complete regular item-price evidence established.</p>'}${x.regular_combo_price?'<p><b>Identical regular combo:</b> '+money(x.regular_combo_price)+' total. '+h(x.regular_combo_notes||'')+'</p>':''}<p><b>Package comparison:</b> regular ${money(x.regular_total)} versus event ${money(x.event_total)}, intended for ${h(o.serves??'?')} diner(s). No itemized total is a bill guarantee.</p><p><b>Normal specials:</b> ${h(x.normal_special_notes||'No competing normal-special comparison established.')}</p><p><b>Event restrictions:</b> ${h(o.availability_notes||'Check the original event menu.')}</p><ul class="discount-source-list">${sources||'<li>No usable regular-price source.</li>'}</ul><p>${h((r.research_gaps||[]).join(' '))}</p></details></article>`;
  }
  function render(){
    const filters={city:controls.city.value,cuisine:controls.cuisine.value,meal:controls.meal.value,q:controls.q.value,verified:controls.verified.checked};
    const all=E.filter(offers,filters),comparable=all.filter(x=>x.rankable),verified=comparable.filter(x=>x.verified),rows=G.collapseDiscount(E.rank(controls.unknown.checked?all:comparable,controls.sort.value));
    const max=Math.max(1,...comparable.flatMap(x=>[x.regular_pp,x.event_pp]).filter(Number.isFinite));
    status.innerHTML=[[G.collapseDiscount(verified).length,'fully verified comparisons'],[G.collapseDiscount(comparable).length-G.collapseDiscount(verified).length,'unique priced estimates'],[all.length-comparable.length,'unresolved offer audits'],[new Set(all.map(x=>x.restaurant.id)).size,'matching restaurants']].map(([n,label])=>`<span class="count-item"><strong>${n}</strong><span>${h(label)}</span></span>`).join('');
    document.querySelector('#discount-results').innerHTML=rows.map((x,i)=>card(x,i,max)).join('');
    document.querySelector('#discount-empty').hidden=rows.length>0;
    document.querySelector('#discount-results-caption').textContent=(controls.sort.value==='dollars'?'Ranked by dollars saved per intended diner.':'Ranked by the highest documented percentage savings among priced choice baskets.')+' Estimates are explicitly labeled; unpriced alternatives may change the true maximum. A larger saving does not mean better food.';
    const ids=new Set(all.map(x=>x.restaurant.id));
    document.querySelector('#discount-coverage-list').innerHTML=data.restaurants.filter(r=>ids.has(r.id)).sort((a,b)=>a.name.localeCompare(b.name)).map(r=>{const own=all.filter(x=>x.restaurant.id===r.id),n=own.filter(x=>x.rankable).length;return `<div class="discount-coverage-row"><div>${link(r.url,r.name)}<small>${h(r.city)} · ${h(r.audit_status||'unverified')}</small></div><span>${n} priced comparisons / ${own.length} offers<br>${own.filter(x=>x.verified).length} verified portion matches</span></div>`;}).join('');
    const q=new URLSearchParams();for(const key of ['city','cuisine','meal'])if(controls[key].value)q.set(key,controls[key].value);if(controls.q.value.trim())q.set('q',controls.q.value.trim());if(controls.sort.value==='dollars')q.set('sort','dollars');if(controls.verified.checked)q.set('verified','1');if(controls.unknown.checked)q.set('unknown','1');history.replaceState(null,'',location.pathname+(q.size?'?'+q:'')+location.hash);
    window.SRWDiscountView={matching:all.length,rankable:comparable.length,verified:verified.length,shown:rows.length,member_count:rows.reduce((n,x)=>n+x.member_keys.length,0),sort:controls.sort.value,keys:rows.map(x=>x.key),filters};
  }
  for(const c of Object.values(controls))c.addEventListener(c===controls.q?'input':'change',render);
  document.querySelector('#discount-reset').addEventListener('click',()=>{for(const k of ['city','cuisine','meal','q'])controls[k].value='';controls.sort.value='percent';controls.verified.checked=false;controls.unknown.checked=false;render();});
  document.querySelector('#discount-checked').textContent='Regular-price research checked '+data.checked_at+'. Full audit: '+data.restaurants.length+' restaurants; '+offers.length+' event offer variants. Missing evidence is not a zero-percent discount.';
  render();
})();

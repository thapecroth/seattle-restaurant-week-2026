/* Signature-first ranking. All claims come from the cited audit data, not generated browser scores. */
(async function () {
  'use strict';
  const root = document.querySelector('#signature-analysis');
  if (!root) return;
  const E = window.SRWFrontier;
  const G = window.SRWOfferGroups;
  const h = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money = value => Number.isFinite(value) ? '$'+value.toFixed(2).replace(/\.00$/,'') : 'unresolved';
  const safeURL = url => /^https?:\/\//i.test(String(url)) ? String(url) : '';
  const sourceLink = (source,label) => safeURL(source.url) ? `<a href="${h(source.url)}" target="_blank" rel="noopener noreferrer">${h(label || source.title || 'Source')}</a>` : h(label || source.title || 'Source unavailable');
  let data;
  try {
    const response=await fetch('signature-data.json',{cache:'no-store'});
    if(!response.ok)throw new Error('Evidence file HTTP '+response.status);
    data=await response.json();
  } catch(error) {
    root.innerHTML='<h2>Signature-dish analysis</h2><p class="notice">The evidence file could not load. The original menu directory remains available below. '+h(error.message)+'</p>';
    return;
  }
  const allParams=new URLSearchParams(location.search);
  const fitLabels={4:'Core preparations strongly represented',3:'Confirmed core signature included',2:'Modified preparation / style only',1:'Known core signatures missing',0:'Nonrepresentative offer'};
  root.innerHTML=`<div class="section-heading"><p class="eyebrow">THE SIGNATURE EDIT</p><h2 id="signature">The menu matters.</h2>
    <p>What they’re known for. What’s actually included. Every price and meal, compared on its own merits.</p></div>
    <div class="sig-warning"><b>A match score, not a taste score.</b> Signature fit measures documented menu overlap—not deliciousness. Modified dishes, small or older review samples, paid upgrades and unknown evidence stay labeled. All 275 restaurant listings remain below.</div>
    <div class="sig-controls"><label>Meal<select id="signature-meal"><option value="">All meals</option><option value="lunch">Lunch</option><option value="dinner">Dinner</option><option value="brunch">Brunch</option></select></label>
    <label>Comparison party<select id="signature-party"><option value="1">1 diner</option><option value="2" selected>2 diners</option><option value="4">4 diners</option></select></label>
    <label class="sig-check"><input type="checkbox" id="signature-all"> Include weak &amp; unverified audits</label></div>
    <p id="signature-count" role="status" aria-live="polite"></p>
    <details class="sig-method"><summary>How the frontier and ranking work</summary>
    <p>An offer is Pareto-dominated when another matching offer costs no more, has equal or higher signature fit, and offers at least as many exact-signature choices—with at least one strict improvement.</p>
    <p>The plot shows price versus fit. Marker size represents the third objective: distinct exact-signature options available at that price. Alternatives are choices, NOT all served together. Modified recipes, sushi pieces and ingredients do not inflate this count. There is no invented all-in quality score.</p>
    <p>Only independently supported, interpretable offers with fit3–4 qualify. Unknown signatures, uncertain serving counts, ambiguous fees, wrong-season offers and unmet group minima do not enter the frontier. They remain available in the audit.</p>
    <p><b>Cost:</b> published per-person price plus disclosed applicable compulsory fees, before tax, optional drinks and discretionary tips. Unknown additional fees and unequal portions can change the frontier. Package prices use the published intended number served; this is not a guaranteed bill for an arbitrary party size.</p>
    <p><b>Ordering:</b> signature-backed offers first, then signature fit, exact-signature choice coverage, evidence confidence and price. A signature-backed offer stays ranked even when unclear fees prevent plotting its price. Frontier status is a tradeoff indicator—not a claim of superior food. Compare within the cuisine and location you actually want.</p>
    <ul><li>4: independently documented core preparations strongly represented.</li><li>3: at least one confirmed core signature included.</li><li>2: only a modified version or representative style.</li><li>1: documented core dishes absent.</li><li>0: explicit mismatch. Unknown: insufficient independent evidence.</li></ul></details>
    <section class="chart-panel" aria-labelledby="chart-title"><div class="chart-heading"><div><p class="eyebrow">BEYOND THE PRICE TAG</p><h3 id="chart-title">Find your tradeoff.</h3></div><p class="sig-legend"><span class="sig-dot frontier"></span> Pareto frontier <span class="sig-dot other"></span> Other comparable offers<br><small>Larger circle = more exact-signature choices</small></p></div>
    <div id="signature-chart" class="sig-chart" aria-label="Published cost versus signature fit"></div>
    <p id="signature-chart-note"></p></section>
    <div class="offers-heading"><h3>The offers, dish by dish.</h3><p>Open a card for the full menu, missing signatures, participation rules and sources.</p></div>
    <div id="signature-table-wrap" class="scroll"><table id="signature-table"><thead><tr><th>Offer / published cost</th><th>Famous dishes actually included</th><th>Missing dishes / evidence and caveats</th></tr></thead><tbody></tbody></table></div>
    <p id="signature-empty" hidden>No eligible signature-backed offers match these filters. This means the audit cannot establish a supported tradeoff—not that these restaurants serve bad food. Enable weak/unverified audits or reset the filters.</p>
    <p class="sig-footnote">Research checked ${h(data.checked_at)}. <a href="signature-data.json" download>Download signature evidence (JSON)</a> · <a href="signature-offers.csv" download>Download all offer audits (CSV)</a>. Exact event menus remain linked in the original directory.</p>`;
  const controls={city:document.querySelector('#location-filter'),cuisine:document.querySelector('#cuisine-filter'),q:document.querySelector('#search'),meal:document.querySelector('#signature-meal'),party:document.querySelector('#signature-party'),all:document.querySelector('#signature-all')};
  if(['lunch','dinner','brunch'].includes(allParams.get('meal')))controls.meal.value=allParams.get('meal');
  if(['1','2','4'].includes(allParams.get('party')))controls.party.value=allParams.get('party');
  controls.all.checked=allParams.get('audit')==='all';
  let chartState={offers:[],keys:new Set()};
  function renderChart(offers,frontierKeys) {
    chartState={offers,keys:frontierKeys};
    const container=root.querySelector('#signature-chart');
    if(!offers.length){container.innerHTML='<div class="sig-warning">No independently supported offers to plot under these filters.</div>';return;}
    const W=Math.max(300,Math.min(1000,container.clientWidth||800)),H=320,L=58,R=34,T=38,B=70,maxCost=Math.max(20,...offers.map(x=>x.cost_pp))*1.1;
    const px=cost=>L+cost/maxCost*(W-L-R),py=fit=>H-B-(fit-2.5)/2*(H-T-B);
    let svg=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Price and signature overlap. Bubble size is distinct signature count."><rect width="${W}" height="${H}" fill="#fbfaf6"/>`;
    for(let i=0;i<=4;i++){const cost=maxCost*i/4,x=px(cost);svg+=`<line x1="${x}" y1="${T}" x2="${x}" y2="${H-B}" stroke="#dce4e9"/><text x="${x}" y="${H-B+24}" text-anchor="middle">${h(money(cost))}</text>`;}
    for(const fit of [3,4]){const y=py(fit);svg+=`<line x1="${L}" y1="${y}" x2="${W-R}" y2="${y}" stroke="#cbd8df"/><text x="${L-12}" y="${y+5}" text-anchor="end">Fit ${fit}</text>`;}
    svg+=`<text x="${W/2}" y="${H-12}" text-anchor="middle">Published minimum $/person, pre-tax</text><text x="${L}" y="18">Signature fit — not food quality</text>`;
    for(const o of [...offers].sort((a,b)=>b.signature_count-a.signature_count)){
      const radius=5+Math.sqrt(o.signature_count)*3.5,isFrontier=frontierKeys.has(o.key),id='sig-'+o.key;
      const tooltip=`${o.restaurant.name} — ${o.label}: ${money(o.cost_pp)} / person; fit${o.signature_fit}; ${o.signature_count} signature option(s). ${isFrontier?'Frontier':'Dominated'}. ${o.fee_warning}`;
      svg+=`<a href="#${encodeURIComponent(id)}"><circle class="${isFrontier?'frontier':'other'}" cx="${px(o.cost_pp)}" cy="${py(o.signature_fit)}" r="${radius}" fill="${isFrontier?'#35654b':'#a6afa4'}" fill-opacity=".78" stroke="${isFrontier?'#253f31':'#7d887b'}" stroke-width="1.5" tabindex="0"><title>${h(tooltip)}</title></circle></a>`;
    }
    svg+='</svg>';container.innerHTML=svg;
  }
  function offerHTML(o,frontierKeys,index,filtered) {
    const r=o.restaurant, sourceMap=new Map((r.sources||[]).map(s=>[s.id,s]));
    const matchText=(o.matches||[]).map(m=>{
      const citations=(m.source_ids||[]).map(id=>sourceMap.get(id)).filter(Boolean).map((s,i)=>sourceLink(s,`evidence${i+1}`)).join(' · ');
      return `<li><b>${h(m.signature_dish)}</b> — ${h(m.match_type)}${m.notes?': '+h(m.notes):''} <small>${citations}</small></li>`;
    }).join('');
    const missing=(o.missing_signatures||[]).length?h(o.missing_signatures.join('; ')):'No specific absence established; this is not proof the whole regular menu is included.';
    const fee=`${o.fee_warning?'<p class="sig-uncertain">'+h(o.fee_warning)+'</p>':''}`;
    const packageLine=Number.isFinite(o.package_price)?`${money(o.package_price)} package / ${o.serves||'?'} intended diner(s)`:'Package price unresolved';
    const state=o.eligible?(frontierKeys.has(o.key)?'<span class="sig-badge frontier">Pareto frontier</span>':'<span class="sig-badge">Dominated tradeoff</span>'):'<span class="sig-badge uncertain">Not frontier-eligible</span>';
    const dom=o.eligible&&!frontierKeys.has(o.key)?filtered.find(x=>E.dominates(x,o)):null;
    const proof=(r.sources||[]).map(s=>`<li>${sourceLink(s)} — ${h(s.kind)}, ${h(s.read_extent)}; ${s.exact_branch===false?'chain-level / different branch, not eligible signature proof':'branch match noted'}; published ${h(s.published_date||'date not established')}. ${(s.claims||[]).map(h).join(' ')}</li>`).join('');
    const prior=r.prior_positions?'<p><small>Previously: '+h(r.prior_positions)+'. New disposition: '+h(o.verdict||r.verdict)+'</small></p>':'';
    const aliases=(o.member_keys||[]).filter(key=>key!==o.key).map(key=>`<span class="offer-alias" id="sig-${h(key)}" aria-hidden="true"></span>`).join('');
    const mealRecords=(o.members||[]).length>1?'<p class="offer-sample">Combined identical meal records: '+o.members.map(m=>h(m.label)).join(' · ')+'. Prices, portions, fees and participation rules are unchanged.</p>':'';
    const price=Number.isFinite(o.cost_pp)?money(o.cost_pp):Number.isFinite(o.package_price)?money(o.package_price):'Unresolved';
    const priceUnit=Number.isFinite(o.cost_pp)?'/ person, pre-tax':'published package';
    return `<tr id="sig-${h(o.key)}" class="offer-card" data-offer="${h(o.key)}"><td class="offer-summary">${aliases}<div class="offer-kicker"><span class="offer-index">${String(index+1).padStart(2,'0')}</span><span class="offer-place">${h(r.city)}</span>${state}</div><h3 class="restaurant-name"><a href="${h(safeURL(r.url))}">${h(r.name)}</a></h3><p class="offer-label">${h(o.display_label||o.label)}${o.min_party>1?' · minimum '+h(o.min_party)+' diners':''}</p><div class="offer-price"><strong>${price}</strong><span>${priceUnit}</span></div><small class="package-line">${h(packageLine)}</small><div class="fit-row"><span class="fit-number">${o.signature_fit===null?'?':o.signature_fit}<small>/4</small></span><span class="fit-caption"><b>Signature fit</b><span>${h(fitLabels[o.signature_fit]||'No adequate independent evidence')}</span></span></div><p class="offer-preview">${h((o.included_dishes||[]).join(' · ')||'Menu details not established')}</p><p class="offer-evidence">${o.signature_count} exact signature option(s) · ${h(o.confidence||'unverified')} confidence</p>${fee}<button type="button" class="offer-expand" data-offer-toggle aria-expanded="false" aria-controls="menu-${h(o.key)} evidence-${h(o.key)}">View menu &amp; evidence <span aria-hidden="true">↗</span></button></td>
    <td id="menu-${h(o.key)}" class="offer-detail"><h4>What’s on the menu</h4><p>${h((o.included_dishes||[]).join('; ')||'Not established')}</p><h4>The signature comparison</h4>${matchText?'<ul>'+matchText+'</ul>':'<p>No directly supported signature match found in this audit.</p>'}<p>${h(o.verdict||r.verdict||'Unresolved')}</p>${prior}</td>
    <td id="evidence-${h(o.key)}" class="offer-detail"><h4>What you won’t get</h4><p>${missing}</p><h4>Before you go</h4><p>${h(o.availability_notes||'Check the current official event menu.')}</p>${mealRecords}${dom?'<p><b>Dominated by:</b> '+h(dom.restaurant.name+' — '+dom.label)+' under the three displayed objectives. This does not mean worse food.</p>':''}${o.exclusion_reasons.length?'<p><b>Not plotted because:</b> '+h(o.exclusion_reasons.join('; '))+'</p>':''}<p class="offer-sample">Sample: ${r.full_professional_reviews_read||0} full professional reviews; ${r.full_diner_reviews_read||0} full diner reviews; ${r.excerpts_read||0} excerpts. Aggregate review totals are not counted as read.</p><details><summary>Sources &amp; evidence limits</summary><ul>${proof||'<li>No usable independent dish-specific source.</li>'}</ul><p>${h((r.research_gaps||[]).join(' '))}</p></details></td></tr>`;
  }
  function render() {
    const party=Number(controls.party.value),filters={city:controls.city.value,cuisine:controls.cuisine.value,q:controls.q.value,meal:controls.meal.value};
    const normalized=data.restaurants.flatMap(r=>(r.offers||[]).map(o=>E.normalizeOffer(r,o,party)));
    const matching=E.filterOffers(normalized,filters),eligible=matching.filter(o=>o.eligible),frontier=E.pareto(eligible),keys=new Set(frontier.map(o=>o.key));
    const backed=matching.filter(o=>o.signature_qualified);
    const auditedRows=E.rank(controls.all.checked?matching:backed),rows=G.collapse(auditedRows),visibleVenueIDs=new Set(matching.map(o=>o.restaurant.id));
    root.querySelector('#signature-count').innerHTML=[[G.collapse(backed).length,'unique signature menus'],[G.collapse(eligible).length,'unique price-comparable menus'],[G.collapse(frontier).length,'Pareto tradeoffs'],[matching.length,'matching offer audits']].map(([n,label])=>`<span class="count-item"><strong>${n}</strong><span>${label}</span></span>`).join('');
    root.querySelector('#signature-count').setAttribute('aria-label',`${matching.length} matching offers across ${visibleVenueIDs.size} restaurants; full audit ${data.restaurants.length} restaurant records`);
    renderChart(G.collapse(eligible),keys);
    root.querySelector('#signature-chart-note').textContent='Click a point for its exact offer. Points can overlap. Frontier membership uses all three objectives, not only the two plot axes. Unknown extra fees remain flagged.';
    root.querySelector('#signature-table tbody').innerHTML=rows.map((o,i)=>offerHTML(o,keys,i,eligible)).join('');
    root.querySelector('#signature-empty').hidden=rows.length!==0;
    const table=root.querySelector('#signature-table');table.hidden=!rows.length;
    document.querySelectorAll('.directory tbody tr').forEach(row=>{const evidence=data.restaurants.find(r=>r.name===row.dataset.name);if(!evidence)return;let badge=row.querySelector('.signature-directory-badge');if(!badge){badge=document.createElement('p');badge.className='signature-directory-badge';row.cells[0].append(badge)}const own=normalized.filter(o=>o.restaurant.id===evidence.id);badge.textContent=own.some(o=>o.eligible)?'Signature evidence: at least one qualified offer':`Signature audit: ${evidence.coverage_status||'unverified'} — no qualified offer established`;});
    const p=new URLSearchParams(location.search);if(controls.meal.value)p.set('meal',controls.meal.value);else p.delete('meal');if(party!==2)p.set('party',String(party));else p.delete('party');if(controls.all.checked)p.set('audit','all');else p.delete('audit');history.replaceState(null,'',location.pathname+(p.size?'?'+p:'')+location.hash);
    window.SRWSignatureView={matching:matching.length,eligible:eligible.length,frontier:frontier.length,shown:rows.length,unique_matching:G.collapse(matching).length,unique_eligible:G.collapse(eligible).length,raw_shown:auditedRows.length,member_count:rows.reduce((n,o)=>n+o.member_keys.length,0),keys:[...keys],filters};
    window.dispatchEvent(new Event('srw:rendered'));
  }
  root.addEventListener('click',event=>{
    const button=event.target.closest('[data-offer-toggle]');
    if(!button)return;
    const card=button.closest('[data-offer]'),open=card.classList.toggle('is-open');
    button.setAttribute('aria-expanded',String(open));
    button.innerHTML=open?'Close full menu <span aria-hidden="true">−</span>':'View menu &amp; evidence <span aria-hidden="true">↗</span>';
  });
  for(const c of [controls.city,controls.cuisine,controls.meal,controls.party,controls.all])c.addEventListener('change',render);
  controls.q.addEventListener('input',render);
  document.querySelector('#reset-filters').addEventListener('click',()=>{controls.meal.value='';controls.party.value='2';controls.all.checked=false;render()});
  render();
  // Hash targets in this section are created after the asynchronous evidence fetch.
  const initialTarget=location.hash?document.getElementById(decodeURIComponent(location.hash.slice(1))):null;
  if(initialTarget)setTimeout(()=>initialTarget.scrollIntoView(),0);
  let resizeTimer,lastWidth=window.innerWidth;
  window.addEventListener('resize',()=>{
    if(window.innerWidth===lastWidth)return;
    lastWidth=window.innerWidth;
    clearTimeout(resizeTimer);
    resizeTimer=setTimeout(()=>renderChart(chartState.offers,chartState.keys),150);
  });
})();

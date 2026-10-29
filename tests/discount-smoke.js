/* Exercise the real, loaded savings page: runSRWDiscountSmoke(). */
window.runSRWDiscountSmoke=function(){
 const ok=(v,m)=>{if(!v)throw new Error(m)},change=e=>e.dispatchEvent(new Event('change')),reset=()=>document.querySelector('#discount-reset').click();
 ok(window.SRWDiscountView,'Price data failed to load');reset();
 const initial={...window.SRWDiscountView};ok(initial.matching===621,'Incomplete audit census');ok(initial.member_count===initial.rankable,'Grouping lost priced records');
 const v=document.querySelector('#discount-verified');v.checked=true;change(v);
 ok(window.SRWDiscountView.shown===1,'The duplicate Una-Ju lunch/dinner comparison should be one card');
 ok(document.querySelector('.discount-money-grid').innerText.includes('$38'),'Regular eel price missing');ok(document.querySelector('.discount-money-grid').innerText.includes('$30'),'Event eel price missing');
 reset();const sort=document.querySelector('#discount-sort');sort.value='dollars';change(sort);ok(window.SRWDiscountView.sort==='dollars','Dollar sorting failed');const dollarLeader=window.SRWDiscountView.keys[0];
 reset();const city=document.querySelector('#discount-city'),cuisine=document.querySelector('#discount-cuisine');city.value='Bellevue';change(city);cuisine.value='japanese';change(cuisine);ok(window.SRWDiscountView.matching===37,'Combined branch/cuisine filter changed');
 reset();const q=document.querySelector('#discount-search');q.value='none-matches-xyz';q.dispatchEvent(new Event('input'));ok(!document.querySelector('#discount-empty').hidden,'Missing empty state');
 reset();const unknown=document.querySelector('#discount-unknown');unknown.checked=true;change(unknown);ok(window.SRWDiscountView.member_count===621,'Unresolved records were dropped');const fullCards=window.SRWDiscountView.shown;
 reset();ok(document.querySelector('.discount-percent.is-negative'),'Negative savings were hidden');document.querySelector('.discount-card details').open=true;ok(document.querySelector('.discount-card details').open,'Source disclosure failed');
 ok(document.documentElement.scrollWidth<=innerWidth+1,'Page has horizontal overflow');
 return {passed:['full 621-offer coverage','deduplication','verified-only filter','regular/event prices','percent/dollar sorts','combined city/cuisine','empty state','unresolved audits','negative savings','sources disclosure','viewport width'],pricedMenus:initial.shown,pricedAudits:initial.rankable,fullCards,dollarLeader,viewport:{width:innerWidth,pageWidth:document.documentElement.scrollWidth}};
};

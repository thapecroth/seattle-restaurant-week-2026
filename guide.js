/* Accessible disclosure and deep-link navigation. */
(() => {
  'use strict';
  function revealTarget(hash,scroll){
    let id;
    try{id=decodeURIComponent(hash.replace(/^#/,''));}catch(_){return false;}
    const target=document.getElementById(id);
    if(!target)return false;
    for(let parent=target.parentElement;parent;parent=parent.parentElement){
      if(parent.tagName==='DETAILS')parent.open=true;
    }
    const card=target.matches('[data-offer]')?target:target.closest('[data-offer]');
    if(card&&!card.classList.contains('is-open')){
      card.querySelector('[data-offer-toggle]')?.click();
    }
    if(scroll)(card||target).scrollIntoView({block:'start'});
    return true;
  }
  document.addEventListener('click',event=>{
    const anchor=event.target.closest('a[href^="#"]');
    if(anchor)revealTarget(anchor.getAttribute('href'),false);
  });
  window.addEventListener('hashchange',()=>revealTarget(location.hash,true));
  let initialHashResolved=false;
  function restoreInitialHash(){
    if(!initialHashResolved&&location.hash&&revealTarget(location.hash,true))initialHashResolved=true;
  }
  window.addEventListener('srw:rendered',restoreInitialHash);
  restoreInitialHash();
})();

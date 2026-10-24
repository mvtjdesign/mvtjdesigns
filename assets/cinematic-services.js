(() => {
 const t=key=>window.MVTJI18N?.messages?.[key]||key;
 const chapters=[...document.querySelectorAll('.service-chapter')];
 const reduce=matchMedia('(prefers-reduced-motion: reduce)');
 const pausedReview=document.querySelector('.cinematic-services')?.dataset.reviewMode==='paused';
 const labels={define:['Competing directions','Editing the hierarchy','One clear direction'],build:['Reconstructed wireframe','Content & typography','Authentic finished website'],create:['Original source / awaiting approval','Media layout','Format layout / awaiting media'],evolve:['Previous offer & information','Refreshing the essentials','New services. Clearer next step.']};
 if(document.querySelector('.has-approved-media'))labels.create=['Approved original source','Media layout','Campaign format layout'];
 const timers=new Map(),manual=new Set();let ticking=false;
 function videoFor(chapter,step){const v=chapter.querySelector('video');if(!v)return;if(pausedReview){if(document.hidden||chapter.getBoundingClientRect().bottom<0||chapter.getBoundingClientRect().top>innerHeight)v.pause();return;}if(step===1&&!reduce.matches&&!document.hidden){if(!v.src)v.src=v.dataset.src;v.play().catch(()=>{});}else v.pause();}
 function setStep(chapter,step){
  chapter.dataset.step=String(step);
  chapter.querySelectorAll('[data-scene-step]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.sceneStep)===step)));
  chapter.querySelector('.scene-state').textContent=labels[chapter.dataset.chapter][step];
  chapter.querySelectorAll('.rejected-paper').forEach(e=>e.setAttribute('aria-hidden',String(step===2)));
  const formats=chapter.querySelector('.create-deliverables');if(formats){formats.inert=step<2;formats.setAttribute('aria-hidden',String(step<2));}
  for(const [selector,inactive]of [['.er-before',step>0],['.er-after',step===0],['.build-category',step>0],['.build-result',step===0]]){
   const state=chapter.querySelector(selector);if(state){state.inert=inactive;state.setAttribute('aria-hidden',String(inactive));}
  }
  videoFor(chapter,step);
 }
 function stop(chapter){(timers.get(chapter)||[]).forEach(clearTimeout);timers.delete(chapter);chapter.querySelector('[data-replay]').textContent=t(pausedReview?'Replay on hold':'Replay ↗');}
 chapters.forEach(chapter=>{
  if(chapter.dataset.sceneLabels)labels[chapter.dataset.chapter]=JSON.parse(chapter.dataset.sceneLabels);
  if(pausedReview)setStep(chapter,2);
  chapter.querySelectorAll('[data-scene-step]').forEach(b=>b.addEventListener('click',()=>{manual.add(chapter);stop(chapter);setStep(chapter,Number(b.dataset.sceneStep));}));
  chapter.querySelector('[data-replay]').addEventListener('click',()=>{if(timers.has(chapter)){stop(chapter);return;}manual.add(chapter);if(reduce.matches){setStep(chapter,2);return;}setStep(chapter,0);chapter.querySelector('[data-replay]').textContent=t('Stop');timers.set(chapter,[setTimeout(()=>setStep(chapter,1),2400),setTimeout(()=>setStep(chapter,2),6500),setTimeout(()=>stop(chapter),8000)]);});
 });
 function measure(){ticking=false;chapters.forEach(chapter=>{const rect=chapter.getBoundingClientRect();if(rect.bottom<0||rect.top>innerHeight){videoFor(chapter,2);return;}if(pausedReview)return;if(reduce.matches){if(!manual.has(chapter))setStep(chapter,2);return;}if(manual.has(chapter))return;const p=Math.max(0,Math.min(1,(innerHeight*.8-rect.top)/(innerHeight*.75)));setStep(chapter,p<.3?0:p<.65?1:2);});}
 function schedule(){if(!ticking){ticking=true;requestAnimationFrame(measure);}}addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule,{passive:true});reduce.addEventListener('change',()=>{chapters.forEach(stop);manual.clear();measure();});
 const build=document.querySelector('.chapter-build'),surface=build.querySelector('.site-surface');
 build.querySelector('.responsive-toggle')?.addEventListener('click',event=>{
  const focused=surface.classList.toggle('is-mobile');
  surface.querySelectorAll('[data-build-focus-source]').forEach(source=>source.media=focused?'all':'(max-width: 760px)');
  event.currentTarget.textContent=t(focused?'Show full capture':'Show focused view');
  event.currentTarget.setAttribute('aria-pressed',String(focused));
 });
 document.addEventListener('visibilitychange',()=>{if(document.hidden)chapters.forEach(c=>{stop(c);videoFor(c,2);});});
 measure();
})();

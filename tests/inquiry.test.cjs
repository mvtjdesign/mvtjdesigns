// No dependencies and no real network requests: node tests/inquiry.test.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('assets/inquiry.js', 'utf8');
function fixture({ configured = true, endpoint = 'https://formspree.io/f/localtest', blockedStorage = false, search = '', saved = null, fetchImpl } = {}) {
  const elements = new Map(), controls = [], handlers = {}, timers = new Map();
  function node(id) {
    const n = { id, value: '', checked: false, children: [], attrs: {}, textContent: '', hidden: false,
      handlers: {}, append(child) { this.children.push(child); }, replaceChildren() { this.children = []; },
      setAttribute(k,v) { this.attrs[k] = v; }, removeAttribute(k) { delete this.attrs[k]; },
      getAttribute(k) { return this.attrs[k] ?? null; }, focus() { state.focus = this.id; },
      addEventListener(k,v) { this.handlers[k] = v; } };
    elements.set(id,n); return n;
  }
  const state = { requests: 0, redirects: [], focus: '', data: null };
  for (const id of ['inquiry-fields','inquiry-submit','inquiry-status','inquiry-setup','inquiry-summary','inquiry-error-list']) node(id);
  node('project-inquiry-form');
  const form = elements.get('project-inquiry-form');
  if (configured) form.attrs.action = endpoint; // MOCK ONLY: never shipped as an endpoint.
  const names = [['name','text',true],['business','text',true],['email','email',true],['website','url',false],
    ['interest','select',true],['budget','select',true],['timeframe','select',true],['message','textarea',true],
    ['source','select',false],['consent','checkbox',true]];
  for (const [name,type,required] of names) {
    const n = node('inquiry-'+name); Object.assign(n,{name,type,required,tagName:type==='select'?'SELECT':'INPUT',labels:[{textContent:name}]});
    n.value = type==='email'?'max@example.com':type==='url'?'https://example.com':type==='checkbox'?'agreed':'Valid data';
    n.checked = true;
    Object.defineProperty(n,'validity',{get() { const mismatch = type==='email' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(n.value); return {valid:!mismatch,typeMismatch:mismatch}; }});
    controls.push(n); node(n.id+'-error');
  }
  const hidden = new Map();
  for (const name of ['_gotcha','utm_source','utm_medium','utm_campaign','utm_content','utm_term','original_referrer','page_url']) {
    const n=node(name);n.name=name;hidden.set(name,n);
  }
  form.elements={namedItem(name) { return hidden.get(name) || controls.find(c=>c.name===name); }};
  form.querySelectorAll=()=>controls;
  form.addEventListener=(name,fn)=>handlers['form:'+name]=fn;
  const document={referrer:'https://referrer.example/path?email=private@example.com',getElementById:id=>elements.get(id),
    addEventListener:(name,fn)=>handlers['document:'+name]=fn,createElement:tag=>node('generated-'+tag+'-'+Math.random())};
  const storage = new Map(saved ? [['mvtj-inquiry-attribution-v1',JSON.stringify(saved)]] : []);
  const window={location:{search,href:'https://www.mvtjdesigns.com/?email=private@example.com'+search,assign:url=>state.redirects.push(url)},
    sessionStorage:{getItem:k=>{if(blockedStorage)throw Error('blocked');return storage.get(k);},setItem:(k,v)=>{if(blockedStorage)throw Error('blocked');storage.set(k,v);}},
    setTimeout:fn=>{timers.set(1,fn);return 1;},clearTimeout:id=>timers.delete(id)};
  class FormData { constructor() { state.data = Object.fromEntries([...controls,...hidden.values()].map(c=>[c.name,c.value])); } }
  const fetch=async(...args)=>{state.requests++;return fetchImpl ? fetchImpl(...args) : {ok:true,json:async()=>({ok:true})};};
  vm.runInNewContext(source,{document,window,URL,URLSearchParams,FormData,fetch,AbortController});
  return {state,elements,controls,hidden,handlers,window,form,timers,submit:()=>handlers['form:submit']({preventDefault(){}})};
}
(async()=>{
  let f=fixture({configured:false}); await f.submit();
  assert.equal(f.state.requests,0);assert.equal(f.state.redirects.length,0);assert.equal(f.elements.get('inquiry-submit').disabled,true);
  for (const endpoint of ['https://invalid.example/f/localtest','javascript:alert(1)','https://formspree.io/f/localtest?secret=value']) {
    f=fixture({endpoint});await f.submit();assert.equal(f.state.requests,0);assert.equal(f.elements.get('inquiry-submit').disabled,true);
  }
  f=fixture(); f.controls.find(c=>c.name==='name').value='   ';f.controls.find(c=>c.name==='consent').checked=false;
  await f.submit();assert.equal(f.state.requests,0);assert.equal(f.state.focus,'inquiry-summary');assert.equal(f.elements.get('inquiry-error-list').children.length,2);
  assert.equal(f.elements.get('inquiry-name').attrs['aria-invalid'],'true');
  for (const name of ['name','business','email','interest','budget','timeframe','message','consent']) {
    f=fixture();const c=f.controls.find(c=>c.name===name);if(name==='consent')c.checked=false;else c.value='';
    await f.submit();assert.equal(f.state.requests,0,name+' must be required');
  }
  f=fixture();f.controls.find(c=>c.name==='website').value='javascript:alert(1)';await f.submit();assert.equal(f.state.requests,0);
  f=fixture();f.controls.find(c=>c.name==='email').value='invalid';await f.submit();assert.equal(f.state.requests,0);
  f=fixture({blockedStorage:true,search:'?utm_source=%3Cimg%20src%3Dx%20onerror%3Dalert(1)%3E&utm_campaign=launch'});
  assert.equal(f.hidden.get('utm_source').value,'<img src=x onerror=alert(1)>');
  assert.equal(f.hidden.get('original_referrer').value,'https://referrer.example/path');
  assert.equal(f.hidden.get('page_url').value,'https://www.mvtjdesigns.com/');
  f.handlers['form:input']({target:f.controls[0]});f.handlers['form:change']({target:f.controls[1]});
  await f.submit();assert.equal(f.state.requests,1);assert.deepEqual(f.state.redirects,['/thank-you/']);
  assert.equal(f.window.dataLayer.filter(e=>e.event==='lead_form_start').length,1);
  assert.equal(f.window.dataLayer.filter(e=>e.event==='lead_form_submit').length,1);
  assert.ok(f.window.dataLayer.every(e=>Object.keys(e).join()==='event'));await f.submit();assert.equal(f.state.requests,1);
  for (const response of [{ok:false,json:async()=>({errors:[{message:'rejected'}]})},{ok:true,json:async()=>({ok:false})},
    {ok:true,json:async()=>({errors:[{message:'rejected'}]})},{ok:true,json:async()=>{throw Error('not JSON');}}]) {
    f=fixture({fetchImpl:async()=>response});const original=f.controls[0].value;await f.submit();
    assert.equal(f.state.redirects.length,0);assert.equal(f.controls[0].value,original);assert.equal(f.elements.get('inquiry-submit').disabled,false);
    assert.equal(f.window.dataLayer.filter(e=>e.event==='lead_form_error').length,1);
  }
  f=fixture({fetchImpl:async()=>{throw Error('network failure');}});await f.submit();assert.equal(f.state.redirects.length,0);
  f=fixture({fetchImpl:(_url,options)=>new Promise((_resolve,reject)=>options.signal.addEventListener('abort',()=>reject(Error('timeout'))))});
  const timed=f.submit();f.timers.get(1)();await timed;assert.equal(f.state.redirects.length,0);assert.equal(f.elements.get('inquiry-submit').disabled,false);
  f=fixture();f.window.dataLayer={push(){throw Error('hook failure');}};await f.submit();assert.deepEqual(f.state.redirects,['/thank-you/']);
  let resolve;f=fixture({fetchImpl:()=>new Promise(r=>resolve=r)});const pending=f.submit();await f.submit();assert.equal(f.state.requests,1);
  assert.equal(f.elements.get('inquiry-submit').disabled,true);resolve({ok:true,json:async()=>({ok:true})});await pending;
  f=fixture({saved:{utm_source:'first',original_referrer:'https://original.example/'}});assert.equal(f.hidden.get('utm_source').value,'first');
  assert.equal(f.hidden.get('original_referrer').value,'https://original.example/');
  f=fixture({saved:{utm_source:'old',utm_term:'oldterm'},search:'?utm_campaign=new'});assert.equal(f.hidden.get('utm_source').value,'');assert.equal(f.hidden.get('utm_term').value,'');
  f=fixture();f.hidden.get('_gotcha').value='spam';await f.submit();assert.equal(f.state.requests,0);assert.equal(f.state.redirects.length,0);
  f=fixture();const link={getAttribute:()=> 'https://calendly.com/max-tijerino/30min',closest:()=>true};
  f.handlers['document:click']({target:{closest:()=>link}});assert.equal(f.window.dataLayer[0].event,'calendly_click');
  console.log('PASS: unconfigured delivery, every required field/consent, email/URL validation, safe UTM/referrer handling, blocked storage, session attribution, success-only redirect/events, failed responses/network failure, data retention, repeat-submission protection, honeypot, and booking event hook. No real requests sent.');
})().catch(error=>{console.error(error);process.exitCode=1;});

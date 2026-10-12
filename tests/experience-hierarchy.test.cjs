const assert=require('node:assert/strict');
const fs=require('node:fs');
const cp=require('node:child_process');
const html=fs.readFileSync('index.html','utf8').replace(/\r\n/g,'\n');
const previous=cp.execFileSync('git',['show','HEAD:index.html'],{encoding:'utf8'});
const section=html.match(/<section[^>]*id="experience"[\s\S]*?<\/section>/)[0];
const cards=[...section.matchAll(/class="experience-card [^"]*experience-card--([a-z]+)"/g)].map(m=>m[1]);
assert.deepEqual(cards,['cloudwards','southern','ncompass']);
for(const title of ['Cloudwards','Southern Stone Communications','NCompass'])assert(section.includes(title));
assert(!section.includes('experience-card--film')&&!section.includes('experience-card--marine'));
assert(!html.includes('founder-story-bridge')&&!section.includes('Read the founder story'));
const about=html.match(/<section[^>]*id="about"[\s\S]*?<\/section>/)[0];
assert.equal(about,previous.match(/<section[^>]*id="about"[\s\S]*?<\/section>/)[0]);
assert(about.includes('href="/founder/"')&&about.includes('More About Max'));
assert(section.includes('href="/cloudwards/"')&&section.includes('href="https://www.daytonaradio.com/"'));
const founder=fs.readFileSync('founder/index.html','utf8');
for(const url of ['https://etalenta.me/max-tijerino','https://www.encast.pro/profile/53925/max-tijerino','https://www.imdb.com/name/nm5947252/','https://showreel.etalenta.eu/max-tijerino/startplaylist/340733'])assert(founder.includes(url));
for(const id of ['work']){
 const expression=new RegExp('<section[^>]*id="'+id+'"[\\s\\S]*?<\\/section>');assert.equal(html.match(expression)[0],previous.match(expression)[0]);
}
assert.equal(html.slice(html.indexOf('<body'),html.indexOf('<section class="section" id="work"')),previous.slice(previous.indexOf('<body'),previous.indexOf('<section class="section" id="work"')));
const labels=['View e-TALENTA Profile','View enCAST Profile','View IMDb Profile','Watch Acting Reel'];
for(const label of labels){const anchor=[...founder.matchAll(/<a\b[^>]*>[\s\S]*?<\/a>/g)].find(m=>m[0].includes('>'+label+'</a>'))?.[0];assert(anchor);assert(anchor.includes('target="_blank"')&&anchor.includes('rel="noopener noreferrer"'));}
assert(founder.includes('<a href="/privacy/">Privacy Policy</a>'), 'required founder Privacy Policy link remains present');
assert.equal(founder.replace(/\r\n/g,'\n'),cp.execFileSync('git',['show','HEAD:founder/index.html'],{encoding:'utf8'}).replace(/\r\n/g,'\n'));
console.log('PASS: three professional entries, bridge absent, unchanged About/founder CTA, all four secure profile links, unchanged hero and Selected Work.');

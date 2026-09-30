'use strict';
const byId = id => document.getElementById(id);
const labels = {SPOTIFY:'Spotify',APPLE_MUSIC:'Apple Music',YOUTUBE_MUSIC:'YouTube Music',DEEZER:'Deezer',BEATPORT:'Beatport',SOUNDCLOUD:'SoundCloud',AMAZON_MUSIC:'Amazon Music',ANGHAMMI:'Anghami',TIDAL:'Tidal',INSTAGRAM:'Instagram',YOUTUBE:'YouTube',TIKTOK:'TikTok',FACEBOOK:'Facebook',TWITTER:'X'};
function node(tag, cls, text) { const el=document.createElement(tag); if(cls)el.className=cls; if(text!=null)el.textContent=text; return el; }
function safeUrl(value, mail=false) {
  if(typeof value!=='string'||!value.trim())return null;
  try { const url=new URL(value,document.baseURI); return ['https:','http:',...(mail?['mailto:']:[])].includes(url.protocol)?url.href:null; } catch { return null; }
}
function link(text,url,cls) {const a=node('a',cls,text);const href=safeUrl(url);if(!href)return null;a.href=href;a.target='_blank';a.rel='noopener noreferrer';return a;}
function image(src,alt,cls) {const img=node('img',cls);img.alt=alt;img.loading='lazy';const url=safeUrl(src);if(url)img.src=url;img.addEventListener('error',()=>{img.hidden=true;});return img;}
function platforms(items,compact=false) {const box=node('div','platforms');(items||[]).forEach(item=>{const a=link(labels[item.type]||item.label||item.type,item.url,compact&&!['SPOTIFY','APPLE_MUSIC'].includes(item.type)?'other-platform':'');if(a)box.append(a);});return box;}
function releaseCard(item,featured=false) {
  const article=node('article',featured?'feature':'release');article.append(image(item.artwork,item.title+' artwork'));
  const text=node('div');if(featured)text.append(node('p','eyebrow',item.badge||'FEATURED RELEASE'));
  text.append(node('h3','',item.title),node('p','',item.artist));text.append(platforms(item.links,!featured));article.append(text);return article;
}
function render(data) {
  byId('tagline').textContent=data.tagline||'DJ / PRODUCER';byId('genres').textContent=data.genres||'';
  const photo=safeUrl(data.heroImage);if(photo)byId('artist-photo').src=photo;const logo=safeUrl(data.logo);if(logo)byId('artist-logo').src=logo;
  (data.socials||[]).forEach(item=>{const a=link(labels[item.type]||item.label||item.type,item.url);if(a)byId('socials').append(a);});
  const spotify=(data.socials||[]).find(x=>x.type==='SPOTIFY');if(spotify&&safeUrl(spotify.url))byId('spotify-profile').href=safeUrl(spotify.url);
  const releases=(data.releases||[]).filter(x=>x.visible!==false);const featured=releases.find(x=>x.featured)||releases[0];
  if(featured)byId('featured').append(releaseCard(featured,true));releases.filter(x=>x!==featured).forEach(item=>byId('releases').append(releaseCard(item)));
  if(!releases.length)byId('music').hidden=true;
  (data.links||[]).filter(x=>x.visible!==false).forEach(item=>{const a=link('',item.url,'link-card');if(!a)return;if(item.image)a.append(image(item.image,''));const box=node('div');box.append(node('h3','',item.title));if(item.subtitle)box.append(node('p','',item.subtitle));a.append(box);byId('link-grid').append(a);});
  if(!byId('link-grid').children.length)byId('links').hidden=true;
  const today=new Date().toLocaleDateString('en-CA',{timeZone:'Europe/Amsterdam'});
  const shows=(data.shows||[]).filter(x=>x.visible!==false&&x.date&&x.date>=today).sort((a,b)=>a.date.localeCompare(b.date));
  shows.forEach(item=>{const row=node('article','show');const date=new Date(item.date+'T12:00:00Z');if(Number.isNaN(date.getTime()))return;const time=node('time','date',String(date.getUTCDate()).padStart(2,'0'));time.dateTime=item.date;time.append(node('small','',date.toLocaleDateString('en-GB',{month:'short',timeZone:'UTC'}).toUpperCase()+' '+date.getUTCFullYear()));row.append(time);const detail=node('div');detail.append(node('h3','',item.title||item.venue||'No Sync live'),node('p','',[item.venue,item.location].filter(Boolean).join(' · ')));row.append(detail);const ticket=safeUrl(item.ticketUrl);if(ticket){const a=link(item.soldOut?'Sold out':'Tickets',ticket,'button');if(a)row.append(a);}else row.append(node('span','show-note','More info soon'));byId('show-list').append(row);});
  if(!shows.length)byId('show-list').append(node('p','empty','New dates coming soon. Follow on Bandsintown for show updates.'));
  if(safeUrl(data.bandsintown))byId('bandsintown').href=safeUrl(data.bandsintown);
  (data.contacts||[]).forEach(item=>{if(typeof item.email!=='string'||!/^\S+@\S+\.\S+$/.test(item.email))return;const box=node('div');box.append(node('p','contact-label',item.label));const a=node('a','contact-email',item.email);a.href='mailto:'+item.email;box.append(a);if(item.note)box.append(node('p','contact-note',item.note));byId('contacts').append(box);});
  const press=safeUrl(data.presskit);if(press){byId('presskit').href=press;byId('presskit').hidden=false;}
  byId('year').textContent=String(new Date().getFullYear());
}
fetch('content.json',{cache:'no-store'}).then(response=>{if(!response.ok)throw new Error('Content unavailable');return response.json();}).then(render).catch(()=>{byId('load-error').hidden=false;});

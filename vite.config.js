import {defineConfig} from 'vite';
import {readdir,readFile,writeFile} from 'node:fs/promises';
import {resolve,relative} from 'node:path';
import {createHash} from 'node:crypto';
import {CONTENT_SECURITY_POLICY,SECURITY_HEADERS} from './security.config.js';
function browserSecurity(){return {
  name:'lunaria-browser-security',apply:'build',
  transformIndexHtml(){return [
    {tag:'meta',attrs:{'http-equiv':'Content-Security-Policy',content:CONTENT_SECURITY_POLICY},injectTo:'head-prepend'},
    {tag:'meta',attrs:{name:'referrer',content:'no-referrer'},injectTo:'head-prepend'},
  ];},
};}
function offlineBundle(){return {name:'lunaria-offline-bundle',apply:'build',async closeBundle(){
  const dir=resolve('dist');const files=[];
  async function visit(folder){for(const e of await readdir(folder,{withFileTypes:true})){const p=resolve(folder,e.name);if(e.isDirectory())await visit(p);else if(e.name!=='sw.js')files.push(p);}}
  await visit(dir);files.sort();const hash=createHash('sha256');hash.update('same-origin-offline-v2');for(const p of files)hash.update(await readFile(p));
  const cache='lunaria-v1-'+hash.digest('hex').slice(0,12);const urls=['/',...files.map(p=>'/'+relative(dir,p).replaceAll('\\','/'))];
  const worker=`const CACHE=${JSON.stringify(cache)};const FILES=${JSON.stringify(urls)};
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('lunaria-v1-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{const request=event.request;if(request.method!=='GET'||new URL(request.url).origin!==self.location.origin)return;if(request.mode==='navigate'){event.respondWith(fetch(request).catch(()=>caches.open(CACHE).then(cache=>cache.match('/index.html',{ignoreVary:true}))));return;}event.respondWith(caches.open(CACHE).then(async cache=>(await cache.match(request,{ignoreSearch:true,ignoreVary:true}))||fetch(request)));});`;
  await writeFile(resolve(dir,'sw.js'),worker);
}};}
export default defineConfig({
  plugins:[browserSecurity(),offlineBundle()],
  server:{host:'127.0.0.1',fs:{strict:true,allow:[resolve('.')],deny:[
    '**/.env', '**/.env.*', '**/*.{crt,pem,key}', '**/.git/**',
    ...['backups','audit','models','videos','out','art','docs'].map(dir=>`${resolve(dir)}/**`),
  ]}},
  preview:{host:'127.0.0.1',headers:SECURITY_HEADERS},
  build:{rolldownOptions:{output:{codeSplitting:{groups:[{name:'three-math',test:/node_modules\/three\/build\/three.core.js/,priority:30},{name:'three-renderer',test:/node_modules\/three\/build/,priority:20},{name:'three-effects',test:/node_modules\/three\/examples/,priority:10}]}}}},
});

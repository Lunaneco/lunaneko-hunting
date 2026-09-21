import {fieldFor} from './terrain.js';
export const fieldSummary=(act,area)=>fieldFor(act,area).note;
export function mapSvg(layout,extra=''){
 return `<svg viewBox="-28 -28 56 56" aria-hidden="true"><polygon points="${layout.points.map(p=>p.join(',')).join(' ')}" fill="#456776" stroke="#c1d5bd" stroke-width=".7"/>${extra}</svg>`;
}
let mapKey='';
export function updateTerrainUi(game){
 const map=document.querySelector('#field-map'),guide=document.querySelector('#passage-guide');if(!game)return;
 const l=game.layout,key=l.id+':'+game.travelOpen+':'+game.exitOpen;
 if(key!==mapKey){mapKey=key;map.innerHTML=`<small>${game.field.kind==='floors'?(game.wave%2?'1F / 2F':'2F / 2F'):game.route==='elite'?'DANGER ROUTE':game.field.kind==='branch'?'BRANCH ROUTE':'FIELD MAP'} <i>N ↑</i></small>${mapSvg(l,`<g id="map-targets"></g><circle id="map-player" r="1.25" fill="#fff7cc" stroke="#153240" stroke-width=".6"/>`)}<span>${l.name}</span>`;}
 const player=map.querySelector('#map-player');player.setAttribute('cx',game.player.x);player.setAttribute('cy',game.player.z);
 const targets=game.exitOpen?[{...game.exitPoint,color:0xffe6a0}]:game.travelTargets;
 map.querySelector('#map-targets').innerHTML=targets.map(t=>`<circle cx="${t.x}" cy="${t.z}" r="1.65" fill="#${t.color.toString(16).padStart(6,'0')}"/>`).join('');
 guide.classList.toggle('hidden',!game.travelOpen);guide.classList.toggle('compact',!!game.travelOrigin&&Math.hypot(game.player.x-game.travelOrigin.x,game.player.z-game.travelOrigin.z)>1.5);
 const signature=game.travelOpen??'';
 if(guide.dataset.kind!==signature){guide.dataset.kind=signature;guide.innerHTML=signature==='stairs'?'<small>LOWER FLOOR CLEAR</small><strong>青い階段から、上のフロアへ</strong><span>祝福・HP・クリスタルを引き継ぎます</span>':signature==='branch'?'<small>CHOOSE YOUR PATH</small><strong>進む道を、歩いて選ぼう</strong><div><span class="safe">左 · 緑の門<br><b>通常ルート</b></span><span class="elite">右 · 赤の門<br><b>強ボスルート</b></span></div><p>強ボス撃破：星の芽20・月のしずく4・核1を追加<br>門を通ると、この出撃では道を戻れません</p>':'';}
}

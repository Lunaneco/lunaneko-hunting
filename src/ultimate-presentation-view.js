import {storySpeaker} from './story-cast.js';

export class UltimatePresentationView{
  constructor(root){this.root=root;}
  async show(heroId,line,spec){
    const speaker=storySpeaker(heroId),root=this.root;
    root.dataset.hero=heroId;root.dataset.phase='enter';root.classList.remove('hidden','is-speaking','is-paused');
    root.style.setProperty('--cutin-color',speaker.color);
    root.querySelector('.cutin-hero').textContent=speaker.name;
    root.querySelector('.cutin-role').textContent=speaker.role;
    root.querySelector('.cutin-ability').textContent=spec.name;
    root.querySelector('.cutin-line').textContent=line.text;
    const image=root.querySelector('.cutin-face');image.alt=`${speaker.name}の必殺技カットイン`;image.src=speaker.image;
    root.setAttribute('aria-hidden','false');document.querySelector('#hud').inert=true;root.focus({preventScroll:true});await image.decode();
  }
  speaking(value){this.root.classList.toggle('is-speaking',value);if(value)this.root.dataset.phase='voice';}
  pause(value){this.root.classList.toggle('is-paused',value);}
  release(){this.root.dataset.phase='release';}
  hide(){this.root.classList.add('hidden');this.root.classList.remove('is-speaking','is-paused');this.root.setAttribute('aria-hidden','true');document.querySelector('#hud').inert=false;}
}

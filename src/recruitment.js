export const RECRUITMENT_NOTE='第1章・第4幕クリアで合流します';
export const recruitmentNote=id=>id==='omsolo'?'第2章・第4幕で救出後に加入します':RECRUITMENT_NOTE;
export function isHeroUnlocked(profile,id){
 return id==='nyanluna'||id==='tsukineko'&&(profile?.story?.tsukinekoUnlocked===true||profile?.story?.chapterOneCleared===true)||id==='omsolo'&&profile?.story?.chapterTwoCleared===true;
}
export function availableHeroes(profile,roster){return roster.filter(hero=>isHeroUnlocked(profile,hero.id));}

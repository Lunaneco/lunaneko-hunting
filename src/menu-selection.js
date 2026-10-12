import {ACTS,actFor,chapterForAct,isActCleared,isActUnlocked} from './acts.js';

export const MENU_SELECTION_KEY='lunaria-menu-selection-v1';

export function restoreSelectedAct(raw,profile){
  if(isActUnlocked(profile,raw?.act))return raw.act;
  // Older saves have no selection. Stay on completed content instead of
  // silently entering a newly unlocked chapter and its story party rules.
  return ACTS.findLast(act=>isActCleared(profile,act.id))?.id??0;
}

export function selectionAfterClear(act){
  return actFor(act).extra?act:Math.min(chapterForAct(act).end,act+1);
}

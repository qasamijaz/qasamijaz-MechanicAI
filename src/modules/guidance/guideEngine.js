// Domain-neutral guided session engine. Steps are deliberately non-technical until evidence is verified.
export function createGuide(context){
 const subject=[context.maker,context.model,context.year].filter(Boolean).join(" ");
 const title=context.task ? context.task+(subject?" — "+subject:"") : "Ny opgave";
 return {title,index:0,steps:[
  {title:"Afklar opgaven",text:"Bekræft køretøj, variant og præcis opgave. Hvis noget er usikkert, skal det afklares før arbejdet."},
  {title:"Find dokumentation",text:"Find en relevant, lovligt tilgængelig servicemanual eller anden verificeret kilde for netop denne variant. YouTube kan supplere, men ikke erstatte specifikationer."},
  {title:"Gennemgå sikkerhed",text:"Kontrollér risici, nødvendigt udstyr og egne kompetencer. Stop, hvis proceduren ikke er dokumenteret, eller opgaven kræver fagperson."},
  {title:"Klar til udførelse",text:"Den generelle demo slutter her. Konkrete mekaniske trin kræver verificeret, modelspecifik dokumentation."}
 ]};
}
export function moveGuide(guide,direction){
 if(!guide)return null;
 const index=Math.max(0,Math.min(guide.steps.length-1,guide.index+direction));
 return {...guide,index};
}
export function guidePrompt(guide){
 const step=guide.steps[guide.index];
 return "Trin "+(guide.index+1)+" af "+guide.steps.length+": "+step.title+". "+step.text;
}

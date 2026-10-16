/** Offline fence design intent parsing. Explicitly conceptual, not construction engineering. */
export const clamp = (n,min,max) => Math.min(max,Math.max(min,n));
export function initialFence(text="") {
  const match=String(text).match(/(\d+(?:[,.]\d+)?)\s*(meter|metre|m)\b/i);
  return { length: match ? clamp(Number(match[1].replace(",",".")),2,40) : 12, height: 1.8, spacing: 2, style: "horizontal" };
}
export function updateFence(current, utterance) {
  const s=String(utterance||"").toLocaleLowerCase("da-DK");
  const next={...current};
  const n= s.match(/(\d+(?:[,.]\d+)?)/);
  const number=n?Number(n[1].replace(",",".")):null;
  if(number!==null && /højde|højt|højere|lavere/.test(s)) next.height=clamp(number,0.5,3);
  else if(number!==null && /afstand|mellem stolp|stolpeafstand/.test(s)) next.spacing=clamp(number,0.5,4);
  else if(number!==null && /længde|langt|meter|metre|forlæng|forkort/.test(s)) next.length=clamp(number,2,40);
  else if(/lodret|vertikal/.test(s)) next.style="vertical";
  else if(/vandret|horisontal/.test(s)) next.style="horizontal";
  else return { config:current, changed:false, message:"Prøv fx 'længde 12 meter', 'højde 1,6 meter', 'stolpeafstand 2 meter' eller 'lodret'." };
  return { config:next, changed:true, message:"Skitsen er opdateret. Mål er kun til konceptvisualisering." };
}

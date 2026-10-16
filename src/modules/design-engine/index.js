/** Shared deterministic design commands; conceptual previews only. */
export const LIMITS={width:[2,30],length:[2,40],height:[.5,3],spacing:[.5,4],count:[1,12]};
const clamp=(n,[min,max])=>Math.max(min,Math.min(max,n));
export function initialDesign(plan) {
 const domain=plan?.domain||"general";
 const config={width:8,length:12,height:1.8,spacing:2,count:3,orientation:"horizontal",offset:0};
 const text=plan?.input||"";
 const m=text.match(/(\d+(?:[,.]\d+)?)\s*(meter|metre|m)\b/i);
 if(m)config.length=clamp(Number(m[1].replace(",",".")),LIMITS.length);
 const c=text.match(/(\d+)\s*(?:spots?|lamper?)/i);
 if(c)config.count=clamp(Number(c[1]),LIMITS.count);
 return {domain,config};
}
const patterns=[
 ["spacing",/\b(?:stolpeafstand|afstand mellem stolper|afstand)\b/i],
 ["height",/\b(?:højde|højt|højere|lavere)\b/i],
 ["width",/\b(?:bredde|bredt)\b/i],
 ["length",/\b(?:længde|langt|meter|metre|forlæng|forkort)\b/i],
 ["count",/\b(?:antal|spots?|lamper?|tilføj|fjern)\b/i]
];
export function editDesign(state,utterance){
 const text=String(utterance||"").trim().toLocaleLowerCase("da-DK");
 const config={...state.config};
 const numberMatch=text.match(/(\d+(?:[,.]\d+)?)/);
 const number=numberMatch?Number(numberMatch[1].replace(",",".")):null;
 if(/lodret|vertikal/.test(text)){config.orientation="vertical";}
 else if(/vandret|horisontal/.test(text)){config.orientation="horizontal";}
 else if(/(?:flyt|ryk).*(?:venstre|højre)/.test(text)){
   config.offset=clamp(config.offset+(/venstre/.test(text)?-.1:.1),[-.4,.4]);
 }else{
   const field=patterns.find(([,re])=>re.test(text))?.[0];
   if(!field || number===null) return {state,changed:false,message:"Prøv fx 'længde 12 meter', 'bredde 6 meter', 'højde 1,5', 'antal 5' eller 'flyt til venstre'."};
   const relative=/\b(?:tilføj|fjern)\b/.test(text)&&field==="count";
   const target=relative?config.count+(/fjern/.test(text)?-number:number):number;
   config[field]=clamp(field==="count"?Math.round(target):target,LIMITS[field]);
 }
 return {state:{...state,config},changed:true,message:"Konceptskitsen er opdateret."};
}

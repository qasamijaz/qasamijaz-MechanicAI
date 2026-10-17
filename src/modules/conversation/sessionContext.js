// Deterministic, session-only context. Never presents guesses as verified repair instructions.
const makers=["BMW","Suzuki","Honda","Yamaha","Toyota","Volkswagen","VW","Ford","Audi","Mercedes","Kawasaki","Tesla","Volvo","Peugeot","Opel"];
export const emptyContext=()=>({maker:null,model:null,year:null,task:null,category:null});
export function updateContext(previous,input){
 const next={...previous},s=input.trim(),low=s.toLocaleLowerCase("da-DK");
 const maker=makers.find(m=>new RegExp("\\b"+m+"\\b","i").test(s));
 if(maker)next.maker=maker==="VW"?"Volkswagen":maker;
 const year=s.match(/\b(?:19|20)\d{2}\b/);if(year)next.year=Number(year[0]);
 const taskPatterns=[[/skift(?:e|er)?\s+(?:hele\s+)?motor(?:en)?|motorudskiftning/i,"skifte motor"],[/skift(?:e|er)?\s+(?:motor)?olie|olieskift/i,"skifte olie"],[/bremse(?:r|klodser|skiver)?|skifte bremser/i,"arbejde med bremser"],[/reparere|fejlsøg|virker ikke/i,"fejlsøge"]];
 const found=taskPatterns.find(([re])=>re.test(low));if(found)next.task=found[1];
 if(/motorcykel|suzuki|yamaha|kawasaki/.test(low))next.category="motorcykel";
 else if(/\bbil\b|bmw|toyota|volkswagen|ford|audi|mercedes|volvo/.test(low))next.category="bil";
 if(next.maker){
  const escaped=next.maker==="Volkswagen"?"(?:Volkswagen|VW)":next.maker;
  const match=s.match(new RegExp("\\b"+escaped+"\\s+([a-z0-9-]+(?:\\s+[a-z0-9]+(?:[,.][0-9]+)?){0,2})","i"));
  if(match){
   const words=match[1].split(/\s+/).filter(w=>!(/^(19|20)\d{2}$/.test(w)||/^(fra|årgang|model|jeg|skal|med|på|min|og|at|er)$/i.test(w)));
   if(words.length)next.model=words.slice(0,2).join(" ");
  }
 }
 // A bare vehicle description after a task is a clarification, not a new task.
 return next;
}
export function replyFor(context){
 const vehicle=[context.maker,context.model,context.year].filter(Boolean).join(" ");
 if(!context.task)return vehicle?"Tak, jeg har noteret "+vehicle+". Hvad vil du gerne lave på "+(context.category==="motorcykel"?"motorcyklen":"køretøjet")+"?":"Hvad skal du reparere eller vedligeholde? Fortæl gerne hvilket køretøj eller udstyr det drejer sig om.";
 if(!context.maker)return "Vi arbejder med at "+context.task+". Hvilket mærke og hvilken model drejer det sig om?";
 if(!context.model)return "Forstået: "+context.task+" på din "+context.maker+". Hvilken model er det?";
 if(!context.year)return "Godt. Vi arbejder med at "+context.task+" på "+vehicle+". Hvilket modelår er det?";
 return "Jeg har nu opgaven: "+context.task+" på "+vehicle+". Vil du starte med en gennemgang af værktøj og forberedelse, eller har du allerede styr på det? Før konkrete reparationstrin skal vi finde og kontrollere dokumentation for den præcise variant.";
}

/** Minimal local diagnostic journal. Stores no user messages or prompts. */
export const KEY="mechanicai:ai-diagnostic:v1";
export const MAX_AGE_MS=15*60*1000;
export function readDiagnostic(storage){
 try { const value=JSON.parse(storage?.getItem(KEY)||"null");return value&&typeof value==="object"&&typeof value.phase==="string"?value:null; }catch{return null;}
}
export function recordDiagnostic(storage,phase,details={},now=Date.now()){
 const value={phase,at:now,model:String(details.model||""),error:String(details.error||"").slice(0,300)};
 try{storage?.setItem(KEY,JSON.stringify(value));}catch{}
 return value;
}
export function interpretDiagnostic(value,now=Date.now()){
 if(!value)return {kind:"none",message:""};
 if(value.phase==="loading"||value.phase==="generating"){
  if(now-value.at<MAX_AGE_MS)return {kind:"interrupted",message:"Forrige AI-forsøg blev afbrudt under "+(value.phase==="loading"?"modelindlæsning":"svargenerering")+". Browsergenindlæsning eller lukning er mulig; årsagen er ikke fastslået."};
  return {kind:"stale",message:"Et tidligere AI-forsøg blev ikke afsluttet. Årsagen er ukendt."};
 }
 if(value.phase==="error")return {kind:"error",message:"Sidste AI-forsøg fejlede: "+(value.error||"Ukendt fejl")};
 if(value.phase==="complete")return {kind:"complete",message:"Sidste AI-forsøg blev gennemført."};
 return {kind:"none",message:""};
}
export function clearDiagnostic(storage){try{storage?.removeItem(KEY);}catch{}}

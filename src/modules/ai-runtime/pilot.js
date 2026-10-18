/** Pilot client: same-origin, server-authenticated only. No secrets in browser. */
export const pilotEnabled=()=>import.meta.env?.VITE_PILOT_AI_ENABLED==="true";
export async function generatePilotReply(history,{signal}={}){
  if(!pilotEnabled())throw new Error("Pilot AI er ikke aktiveret.");
  const messages=history.slice(-10).map(m=>({role:m.role==="assistant"?"assistant":"user",content:String(m.text||"").slice(0,1000)}));
  const response=await fetch("/v1/chat",{method:"POST",credentials:"same-origin",
    headers:{"Content-Type":"application/json"},body:JSON.stringify({messages}),signal});
  let data;try{data=await response.json();}catch{throw new Error("Ugyldigt svar fra pilotserver.");}
  if(!response.ok)throw new Error(String(data?.error||"Pilotserver utilgængelig.").slice(0,200));
  if(typeof data?.reply!=="string"||!data.reply.trim())throw new Error("Tomt AI-svar.");
  return data.reply.trim();
}

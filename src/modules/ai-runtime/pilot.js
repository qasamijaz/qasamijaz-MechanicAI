/** Same-origin invite-only pilot; disabled by default. Never put invites or secrets in build vars. */
export const pilotEnabled=()=>import.meta.env?.VITE_PILOT_AI_ENABLED==="true";
let csrf=null;
export const pilotAuthenticated=()=>Boolean(csrf);
export async function pilotLogin(invite){
  if(!pilotEnabled())throw new Error("Pilot AI er ikke aktiveret.");
  const r=await fetch("/v1/login",{method:"POST",credentials:"same-origin",
    headers:{"Content-Type":"application/json"},body:JSON.stringify({invite})});
  const data=await r.json();
  if(!r.ok)throw new Error("Invitationen blev ikke godkendt.");
  csrf=data.csrf;
  return true;
}
export async function pilotLogout(){
  const token=csrf;
  csrf=null;
  if(token)await fetch("/v1/logout",{method:"POST",credentials:"same-origin",
    headers:{"Content-Type":"application/json","X-CSRF-Token":token},body:"{}"}).catch(()=>{});
}
export async function generatePilotReply(history,{signal}={}){
  if(!pilotEnabled())throw new Error("Pilot AI er ikke aktiveret.");
  if(!csrf)throw new Error("Log ind med en invitation først.");
  const messages=history.slice(-10).map(m=>({role:m.role==="assistant"?"assistant":"user",content:String(m.text||"").slice(0,1000)}));
  const response=await fetch("/v1/chat",{method:"POST",credentials:"same-origin",
    headers:{"Content-Type":"application/json","X-CSRF-Token":csrf},
    body:JSON.stringify({messages}),signal});
  let data;try{data=await response.json();}catch{throw new Error("Ugyldigt svar fra pilotserver.");}
  if(response.status===401)csrf=null;
  if(!response.ok){
    const messages={401:"Din AI-session er udløbet. Log ind igen.",429:"AI-serveren er optaget, eller din dagskvote er brugt. Prøv igen senere.",503:"Den lokale AI-model er midlertidigt utilgængelig."};
    const error=new Error(messages[response.status]||"Pilotserveren kunne ikke svare.");
    error.status=response.status;
    throw error;
  }
  if(typeof data?.reply!=="string"||!data.reply.trim())throw new Error("Tomt AI-svar.");
  return data.reply.trim();
}

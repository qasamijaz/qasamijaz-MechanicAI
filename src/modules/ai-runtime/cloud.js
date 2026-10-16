/** Cloud AI transport. The browser never receives the Hugging Face access token. */
export const CLOUD_URL=(import.meta.env?.VITE_CLOUD_API_URL||"https://mechanicai-cloud-poc-poc.up.railway.app").replace(/\/$/,"");
export const cloudConfigured=()=>/^https:\/\//.test(CLOUD_URL);
export async function generateCloudReply(history,{signal,pilotKey}={}){
 if(!pilotKey)throw new Error("Indtast PoC-adgangskoden.");
 if(!cloudConfigured())throw new Error("Cloud-AI er ikke konfigureret endnu.");
 const response=await fetch(CLOUD_URL+"/chat",{method:"POST",headers:{"Content-Type":"application/json","X-MechanicAI-Pilot-Key":pilotKey},body:JSON.stringify({messages:history.slice(-10).map(t=>({role:t.role==="assistant"?"assistant":"user",content:String(t.text||"").slice(0,1000)}))}),signal});
 let data;try{data=await response.json();}catch{throw new Error("AI-serveren returnerede et ugyldigt svar.");}
 if(!response.ok)throw new Error(String(data?.error||"AI-serveren kunne ikke svare.").slice(0,250));
 if(typeof data?.reply!=="string"||!data.reply.trim())throw new Error("AI-serveren returnerede et tomt svar.");
 return data.reply.trim();
}

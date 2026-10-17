import React,{useState,useRef,useEffect} from "react";
import {startConversation,replyConversation} from "./index.js";
import ManualUpload from "../evidence/ManualUpload.jsx";
import {summarizeEvidence} from "../evidence/index.js";
import {discoverSuzukiManual} from "../evidence/suzukiDiscovery.js";
import {generateLocalReply,supported,MODEL_ID} from "../ai-runtime/huggingface.js";
import {generateCloudReply,cloudConfigured,CLOUD_URL} from "../ai-runtime/cloud.js";
import {readDiagnostic,recordDiagnostic,interpretDiagnostic,clearDiagnostic} from "../ai-runtime/diagnostics.js";
export default function ConversationPanel({plan}){
 const [conversation,setConversation]=useState(()=>startConversation(plan.input));
 const [answer,setAnswer]=useState("");
 const [listening,setListening]=useState(false);
 const [mode,setMode]=useState("offline");
 const [pilotKey,setPilotKey]=useState("");
 const [liveDiscovery,setLiveDiscovery]=useState(null);
 const [busy,setBusy]=useState(false);
 const [modelStatus,setModelStatus]=useState("");
 const [diagnostic,setDiagnostic]=useState(null);
 const recognition=useRef(null);
 useEffect(()=>{setConversation(startConversation(plan.input));setAnswer("");},[plan.input]);
 useEffect(()=>()=>recognition.current?.abort(),[]);
 useEffect(()=>{try{setDiagnostic(readDiagnostic(window.localStorage));}catch{}},[]);
 function track(phase,error=""){const value=recordDiagnostic(window.localStorage,phase,{model:MODEL_ID,error});setDiagnostic(value);}
 const evidence=summarizeEvidence([]);
 const discovery=discoverSuzukiManual([plan.input,...conversation.turns.filter(t=>t.role==="user").map(t=>t.text)].join(" "));
 useEffect(()=>{if(!discovery?.exactModel||!discovery?.yearMatch||!cloudConfigured()){setLiveDiscovery(null);return;}
 const controller=new AbortController();const q=encodeURIComponent("Suzuki GSX-S1000F 2019");
 fetch(CLOUD_URL+"/manual-discovery?q="+q,{signal:controller.signal}).then(r=>r.ok?r.json():Promise.reject(new Error("Source lookup failed"))).then(setLiveDiscovery).catch(()=>setLiveDiscovery({status:"source_unavailable",sources:[]}));
 return ()=>controller.abort();},[discovery?.exactModel,discovery?.yearMatch]);
 async function submit(text){
  if(!text.trim()||busy)return;
  setAnswer("");
  if(mode==="offline"){setConversation(c=>replyConversation(c,text));return;}
  if(mode==="cloud"&&!cloudConfigured()){setModelStatus("Cloud-serveren er ikke konfigureret.");return;}
  if(mode==="ai"){setModelStatus("Lokal AI er slået fra. Vælg cloud eller fallback.");return;}
  const history=[...conversation.turns,{role:"user",text}];
  setConversation(c=>({...c,turns:history}));
  setBusy(true);setModelStatus(mode==="cloud"?"Kontakter cloud-AI…":"Indlæser eller bruger Hugging Face-modellen lokalt…");
  track(mode==="cloud"?"cloud-request":"loading");
  try{
   const reply=mode==="cloud"?await generateCloudReply(history,{pilotKey}):await generateLocalReply(history,evidence.verified,stage=>{track(stage);setModelStatus(stage==="loading"?"Indlæser Hugging Face-modellen lokalt…":"Genererer AI-svar lokalt…");});
   track("complete");
   setConversation(c=>({...c,turns:[...c.turns,{role:"assistant",text:reply}]}));
   setModelStatus(mode==="cloud"?"Cloud-AI-svar. Tekniske oplysninger er ikke verificeret.":"Lokalt AI-svar. Tekniske oplysninger er ikke verificeret.");
  }catch(error){
   track("error",String(error?.message||"Ukendt fejl"));
   setConversation(c=>({...c,turns:[...c.turns,{role:"assistant",text:"AI kunne ikke svare. Du kan vælge den regelbaserede fallback i stedet."}]}));
   setModelStatus(String(error?.message||"Ukendt fejl"));
  }finally{setBusy(false);}
 }
 function speak(){
  const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!Recognition)return;
  try{recognition.current?.abort();const r=new Recognition();recognition.current=r;r.lang="da-DK";
   r.onstart=()=>setListening(true);r.onresult=e=>submit(e.results[0][0].transcript);
   r.onend=()=>{setListening(false);if(recognition.current===r)recognition.current=null;};
   r.onerror=()=>setListening(false);r.start();
  }catch{setListening(false);}
 }
 function readLast(){if(!("speechSynthesis" in window))return;window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(conversation.turns.at(-1)?.text||"");u.lang="da-DK";window.speechSynthesis.speak(u);}
 return <section aria-label="Samtale om opgaven" style={{border:"1px solid #64748b",padding:12,borderRadius:12,marginTop:12}}>
  <h3>Opgavesamtale</h3>
  {diagnostic&&<div role="status" style={{padding:10,border:"1px solid #64748b",borderRadius:8,marginBottom:10}}><strong>AI-diagnosticering</strong><p>{interpretDiagnostic(diagnostic).message}</p><p style={{fontSize:12}}>Fase: {diagnostic.phase} · {new Date(diagnostic.at).toLocaleString("da-DK")}</p><button type="button" onClick={()=>{clearDiagnostic(window.localStorage);setDiagnostic(null);}}>Ryd diagnosticering</button></div>}
  <label>Tilstand <select aria-label="Samtaletilstand" value={mode} onChange={e=>setMode(e.target.value)}><option value="offline">Regelbaseret fallback</option><option value="cloud" disabled={!cloudConfigured()}>Hugging Face AI i skyen</option><option value="ai" disabled>Hugging Face AI (lokal, slået fra på iPhone)</option></select></label>
  {mode==="cloud"&&<label style={{display:"block",marginTop:8}}>PoC-adgangskode <input type="password" autoComplete="off" aria-label="PoC-adgangskode" value={pilotKey} onChange={e=>setPilotKey(e.target.value)} placeholder="Kun til test" /></label>}
  {mode==="cloud"&&<p style={{fontSize:12}}>Modellen kører i skyen, ikke på telefonen. Samtaletekst sendes til AI-serveren og Hugging Face Inference Provider. Ingen verificerede manualer er tilsluttet.</p>}
  {mode==="ai"&&<p style={{fontSize:12}}>Model: {MODEL_ID}. Kræver WebGPU, modeldownload og ledig hukommelse. {supported()?"WebGPU registreret.":"WebGPU ikke registreret."}</p>}
  <div aria-live="polite" style={{maxHeight:260,overflowY:"auto",display:"grid",gap:8}}>
   {conversation.turns.map((turn,i)=><div key={i} style={{padding:9,borderRadius:8,background:turn.role==="assistant"?"#193147":"#253a48"}}><strong>{turn.role==="assistant"?"MechanicAI":"Dig"}:</strong> {turn.text}</div>)}
  </div>
  {discovery&&<aside aria-label="Automatisk dokumentationssøgning" style={{padding:12,border:"1px solid #64748b",borderRadius:8,marginTop:12}}><strong>Fundet i officielle Suzuki-kilder</strong><p>{discovery.model} · {discovery.year||"årgang ikke angivet"}</p><p>{discovery.notice}</p>{!discovery.exactModel&&<p>Bekræft modelvarianten (GSX-S1000F eller en anden GSX).</p>}<ul>{discovery.sources.map(x=><li key={x.url}><a href={x.url} target="_blank" rel="noopener noreferrer">{x.title}</a> ({x.language})</li>)}</ul><p><strong>Live kontrol:</strong> {liveDiscovery?.status==="catalogue_match"?"Producentens katalog bekræfter model og årgang.":liveDiscovery?.status==="not_found"?"Ingen match i producentens katalog.":liveDiscovery?.status==="source_unavailable"?"Producentens katalog kunne ikke kontrolleres lige nu.":"Afventer kontrol af producentens katalog."}</p><small>Live katalogopslag er ikke det samme som læsning eller verifikation af PDF-manualen.</small></aside>}
  <ManualUpload/>
  <form onSubmit={e=>{e.preventDefault();submit(answer);}} style={{marginTop:10}}>
   <input aria-label="Svar på spørgsmålet" value={answer} onChange={e=>setAnswer(e.target.value)} placeholder="Svar på spørgsmålet" style={{width:"100%",padding:10,marginBottom:8}}/>
   <div style={{display:"flex",gap:8,flexWrap:"wrap"}}><button type="submit" disabled={busy}>{busy?"Arbejder…":"Send svar"}</button><button type="button" disabled={listening} onClick={speak}>{listening?"Lytter…":"🎤 Svar med stemmen"}</button><button type="button" onClick={readLast}>🔊 Læs svaret op</button></div>
  </form>
  <p role="status">{modelStatus}</p><p style={{fontSize:12,opacity:.85}}>Dokumentation: {evidence.notice} Dokumentindekset er endnu ikke tilkoblet webappen. Cloud-tilstand kræver PoC-adgangskode. Lokal WebGPU-model er deaktiveret af hensyn til stabiliteten.</p>
 </section>;
}

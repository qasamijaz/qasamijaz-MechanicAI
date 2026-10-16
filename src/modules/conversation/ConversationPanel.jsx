import React,{useState,useRef,useEffect} from "react";
import {startConversation,replyConversation} from "./index.js";
import {summarizeEvidence} from "../evidence/index.js";
import {generateLocalReply,supported,MODEL_ID} from "../ai-runtime/huggingface.js";
import {generateCloudReply,cloudConfigured} from "../ai-runtime/cloud.js";
import {readDiagnostic,recordDiagnostic,interpretDiagnostic,clearDiagnostic} from "../ai-runtime/diagnostics.js";
export default function ConversationPanel({plan}){
 const [conversation,setConversation]=useState(()=>startConversation(plan.input));
 const [answer,setAnswer]=useState("");
 const [listening,setListening]=useState(false);
 const [mode,setMode]=useState("offline");
 const [busy,setBusy]=useState(false);
 const [modelStatus,setModelStatus]=useState("");
 const [diagnostic,setDiagnostic]=useState(null);
 const recognition=useRef(null);
 useEffect(()=>{setConversation(startConversation(plan.input));setAnswer("");},[plan.input]);
 useEffect(()=>()=>recognition.current?.abort(),[]);
 useEffect(()=>{try{setDiagnostic(readDiagnostic(window.localStorage));}catch{}},[]);
 function track(phase,error=""){const value=recordDiagnostic(window.localStorage,phase,{model:MODEL_ID,error});setDiagnostic(value);}
 const evidence=summarizeEvidence([]);
 async function submit(text){
  if(!text.trim()||busy)return;
  setAnswer("");
  if(mode==="offline"){setConversation(c=>replyConversation(c,text));return;}
  if(mode==="cloud"&&!cloudConfigured()){setModelStatus("Cloud-serveren er ikke konfigureret.");return;}
  if(mode==="ai"&&!supported()){setModelStatus("WebGPU er ikke tilgængelig. Brug cloud eller fallback.");return;}
  const history=[...conversation.turns,{role:"user",text}];
  setConversation(c=>({...c,turns:history}));
  setBusy(true);setModelStatus("Indlæser eller bruger Hugging Face-modellen lokalt…");
  track(mode==="cloud"?"cloud-request":"loading");
  try{
   const reply=mode==="cloud"?await generateCloudReply(history):await generateLocalReply(history,evidence.verified,stage=>{track(stage);setModelStatus(stage==="loading"?"Indlæser Hugging Face-modellen lokalt…":"Genererer AI-svar lokalt…");});
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
  <label>Tilstand <select aria-label="Samtaletilstand" value={mode} onChange={e=>setMode(e.target.value)}><option value="offline">Regelbaseret fallback</option><option value="cloud" disabled={!cloudConfigured()}>Hugging Face AI i skyen</option><option value="ai" disabled={!supported()}>Hugging Face AI (lokal, kræver WebGPU)</option></select></label>
  {mode==="cloud"&&<p style={{fontSize:12}}>Modellen kører i skyen, ikke på telefonen. Samtaletekst sendes til AI-serveren og Hugging Face Inference Provider. Ingen verificerede manualer er tilsluttet.</p>}
  {mode==="ai"&&<p style={{fontSize:12}}>Model: {MODEL_ID}. Kræver WebGPU, modeldownload og ledig hukommelse. {supported()?"WebGPU registreret.":"WebGPU ikke registreret."}</p>}
  <div aria-live="polite" style={{maxHeight:260,overflowY:"auto",display:"grid",gap:8}}>
   {conversation.turns.map((turn,i)=><div key={i} style={{padding:9,borderRadius:8,background:turn.role==="assistant"?"#193147":"#253a48"}}><strong>{turn.role==="assistant"?"MechanicAI":"Dig"}:</strong> {turn.text}</div>)}
  </div>
  <form onSubmit={e=>{e.preventDefault();submit(answer);}} style={{marginTop:10}}>
   <input aria-label="Svar på spørgsmålet" value={answer} onChange={e=>setAnswer(e.target.value)} placeholder="Svar på spørgsmålet" style={{width:"100%",padding:10,marginBottom:8}}/>
   <div style={{display:"flex",gap:8,flexWrap:"wrap"}}><button type="submit" disabled={busy}>{busy?"Arbejder…":"Send svar"}</button><button type="button" disabled={listening} onClick={speak}>{listening?"Lytter…":"🎤 Svar med stemmen"}</button><button type="button" onClick={readLast}>🔊 Læs svaret op</button></div>
  </form>
  <p role="status">{modelStatus}</p><p style={{fontSize:12,opacity:.85}}>Dokumentation: {evidence.notice} Dokumentindekset er endnu ikke tilkoblet webappen. Cloud-tilstand kræver en særskilt serverkonfiguration; lokal model er fortsat eksperimentel.</p>
 </section>;
}

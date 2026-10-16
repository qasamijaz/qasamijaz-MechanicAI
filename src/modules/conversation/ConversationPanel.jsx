import React,{useState,useRef,useEffect} from "react";
import {startConversation,replyConversation} from "./index.js";
import {summarizeEvidence} from "../evidence/index.js";
import {generateLocalReply,supported,MODEL_ID} from "../ai-runtime/huggingface.js";
export default function ConversationPanel({plan}){
 const [conversation,setConversation]=useState(()=>startConversation(plan.input));
 const [answer,setAnswer]=useState("");
 const [listening,setListening]=useState(false);
 const [mode,setMode]=useState("offline");
 const [busy,setBusy]=useState(false);
 const [modelStatus,setModelStatus]=useState("");
 const recognition=useRef(null);
 useEffect(()=>{setConversation(startConversation(plan.input));setAnswer("");},[plan.input]);
 useEffect(()=>()=>recognition.current?.abort(),[]);
 const evidence=summarizeEvidence([]);
 async function submit(text){
  if(!text.trim()||busy)return;
  setAnswer("");
  if(mode!=="ai"){setConversation(c=>replyConversation(c,text));return;}
  if(!supported()){setModelStatus("WebGPU er ikke tilgængelig. Brug den regelbaserede fallback.");return;}
  const history=[...conversation.turns,{role:"user",text}];
  setConversation(c=>({...c,turns:history}));
  setBusy(true);setModelStatus("Indlæser eller bruger Hugging Face-modellen lokalt…");
  try{
   const reply=await generateLocalReply(history,evidence.verified);
   setConversation(c=>({...c,turns:[...c.turns,{role:"assistant",text:reply}]}));
   setModelStatus("Lokalt AI-svar. Tekniske oplysninger er ikke verificeret.");
  }catch(error){
   setConversation(c=>({...c,turns:[...c.turns,{role:"assistant",text:"Den lokale AI kunne ikke køre. Du kan vælge offline-prototypen i stedet."}]}));
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
  <label>Tilstand <select aria-label="Samtaletilstand" value={mode} onChange={e=>setMode(e.target.value)}><option value="offline">Regelbaseret fallback</option><option value="ai" disabled={!supported()}>Hugging Face AI (lokal, kræver WebGPU)</option></select></label>
  {mode==="ai"&&<p style={{fontSize:12}}>Model: {MODEL_ID}. Kræver WebGPU, modeldownload og ledig hukommelse. {supported()?"WebGPU registreret.":"WebGPU ikke registreret."}</p>}
  <div aria-live="polite" style={{maxHeight:260,overflowY:"auto",display:"grid",gap:8}}>
   {conversation.turns.map((turn,i)=><div key={i} style={{padding:9,borderRadius:8,background:turn.role==="assistant"?"#193147":"#253a48"}}><strong>{turn.role==="assistant"?"MechanicAI":"Dig"}:</strong> {turn.text}</div>)}
  </div>
  <form onSubmit={e=>{e.preventDefault();submit(answer);}} style={{marginTop:10}}>
   <input aria-label="Svar på spørgsmålet" value={answer} onChange={e=>setAnswer(e.target.value)} placeholder="Svar på spørgsmålet" style={{width:"100%",padding:10,marginBottom:8}}/>
   <div style={{display:"flex",gap:8,flexWrap:"wrap"}}><button type="submit" disabled={busy}>{busy?"Arbejder…":"Send svar"}</button><button type="button" disabled={listening} onClick={speak}>{listening?"Lytter…":"🎤 Svar med stemmen"}</button><button type="button" onClick={readLast}>🔊 Læs svaret op</button></div>
  </form>
  <p role="status">{modelStatus}</p><p style={{fontSize:12,opacity:.85}}>Dokumentation: {evidence.notice} Dokumentindekset er endnu ikke tilkoblet webappen. AI-tilstand er valgfri og bruger en lokal model.</p>
 </section>;
}

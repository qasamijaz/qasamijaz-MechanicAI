import React, {useEffect, useRef, useState} from "react";
import {emptyContext,updateContext,replyFor} from "../conversation/sessionContext.js";
import {createGuide,moveGuide,guidePrompt} from "../guidance/guideEngine.js";
import {guideInterruption} from "../guidance/guideInterruption.js";
import ManualUpload from "../evidence/ManualUpload.jsx";
import LegacyApp from "../../App.jsx";
import {pilotEnabled,generatePilotReply} from "../ai-runtime/pilot.js";
import "./home.css";

export default function MechanicHome(){
  const [draft,setDraft]=useState("");
  const [aiPending,setAiPending]=useState(false);
  const pendingRequest=useRef(null);
  const taskGeneration=useRef(0);
  const [messages,setMessages]=useState([]);
  const [context,setContext]=useState(emptyContext);
  const [guide,setGuide]=useState(null);
  const chatScroll=useRef(null);
  useEffect(()=>{if(messages.length&&chatScroll.current)chatScroll.current.scrollTop=chatScroll.current.scrollHeight;},[messages]);
  const [listening,setListening]=useState(false);
  const [voiceOn,setVoiceOn]=useState(true);
  const [speechState,setSpeechState]=useState("idle");
  const utterance=useRef(null);
  const voiceEnabled=useRef(true);
  const speechToken=useRef(0);
  const [attachments,setAttachments]=useState(false);
  const [pdfOpen,setPdfOpen]=useState(false);
  const [technical,setTechnical]=useState(false);
  const [legacy,setLegacy]=useState(false);
  const [photo,setPhoto]=useState(null);
  const [notice,setNotice]=useState("");
  const recognition=useRef(null);
  const recognitionId=useRef(0);
  const photoUrl=useRef(null);
  useEffect(()=>()=>{taskGeneration.current++;pendingRequest.current?.abort();recognitionId.current++;recognition.current?.abort();speechToken.current++;window.speechSynthesis?.cancel();if(photoUrl.current)URL.revokeObjectURL(photoUrl.current);},[]);
  function stopSpeech(){speechToken.current++;window.speechSynthesis?.cancel();utterance.current=null;setSpeechState("idle");}
  function readAloud(value){
    if(!voiceEnabled.current||!window.speechSynthesis||!window.SpeechSynthesisUtterance)return;
    stopSpeech();
    const token=speechToken.current;
    const u=new SpeechSynthesisUtterance(value);
    u.lang="da-DK";u.rate=0.95;
    const danish=window.speechSynthesis.getVoices().find(v=>v.lang.toLowerCase().startsWith("da"));
    if(danish)u.voice=danish;
    u.onstart=()=>{if(token===speechToken.current)setSpeechState("speaking");};
    u.onend=()=>{if(token===speechToken.current)setSpeechState("idle");};
    u.onerror=()=>{if(token===speechToken.current){setSpeechState("idle");setNotice("Oplæsning kunne ikke startes på denne enhed.");}};
    utterance.current=u;setSpeechState("speaking");window.speechSynthesis.speak(u);
  }
  function answer(value){setMessages(prev=>[...prev,{role:"assistant",text:value}]);readAloud(value);}
  function toggleVoice(){const next=!voiceEnabled.current;voiceEnabled.current=next;setVoiceOn(next);if(!next)stopSpeech();}
  function pauseSpeech(){if(speechState==="speaking"){window.speechSynthesis?.pause();setSpeechState("paused");}else if(speechState==="paused"){window.speechSynthesis?.resume();setSpeechState("speaking");}}

  function stopListening(){
    recognitionId.current++;
    const current=recognition.current;
    recognition.current=null;
    if(current){current.onstart=null;current.onresult=null;current.onerror=null;current.onend=null;try{current.abort();}catch{}}
    setListening(false);
    setNotice("Mikrofonen er stoppet.");
  }
  async function send(value=draft){
    if(aiPending)return;
    const input=value.trim();if(!input)return;
    if(recognition.current)stopListening();
    if(guide && /^(næste|videre|fortsæt)$/i.test(input)){const moved=moveGuide(guide,1);setGuide(moved);setMessages(prev=>[...prev,{role:"user",text:input}]);answer(guidePrompt(moved));setDraft("");return;}
    if(guide && /^(tilbage|forrige)$/i.test(input)){const moved=moveGuide(guide,-1);setGuide(moved);setMessages(prev=>[...prev,{role:"user",text:input}]);answer(guidePrompt(moved));setDraft("");return;}
    if(guide && /^(gentag|igen)$/i.test(input)){setMessages(prev=>[...prev,{role:"user",text:input}]);answer(guidePrompt(guide));setDraft("");return;}
    const interruption=guideInterruption(input,guide);
    if(interruption){setMessages(prev=>[...prev,{role:"user",text:input}]);answer(interruption);setDraft("");return;}
    const next=updateContext(context,input);
    setContext(next);
    if(next.task!==context.task || next.maker!==context.maker || next.model!==context.model || next.year!==context.year)setGuide(null);
    const response=replyFor(next);
    const history=[...messages,{role:"user",text:input}];
    setMessages(history);
    setDraft("");
    if(!pilotEnabled()){answer(response);return;}
    const generation=taskGeneration.current;
    const controller=new AbortController();
    pendingRequest.current=controller;
    setAiPending(true);
    try{
      const reply=await generatePilotReply(history,{signal:controller.signal});
      if(generation===taskGeneration.current)answer(reply);
    }catch(error){
      if(generation!==taskGeneration.current)return;
      answer(response);
      setNotice("AI kunne ikke svare. Viser den eksisterende regelbaserede hjælp i stedet.");
    }finally{
      if(generation===taskGeneration.current){pendingRequest.current=null;setAiPending(false);}
    }
  }
  function speak(){
    stopSpeech();
    const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!SpeechRecognition){setNotice("Talegenkendelse er ikke tilgængelig her. Tryk i tekstfeltet og brug mikrofonen på iPhone-tastaturet.");return;}
    if(listening){stopListening();return;}
    stopListening();
    try{
      const r=new SpeechRecognition();const id=++recognitionId.current;recognition.current=r;r.lang="da-DK";r.interimResults=false;r.continuous=false;
      r.onstart=()=>{if(id!==recognitionId.current){try{r.abort();}catch{}return;}setListening(true);setNotice("Jeg lytter…");};
      r.onresult=e=>{if(id!==recognitionId.current)return;const heard=e.results?.[0]?.[0]?.transcript||"";setDraft(heard);stopListening();setNotice("Mikrofon slukket. Kontrollér teksten og tryk Send.");};
      r.onerror=e=>{if(id!==recognitionId.current)return;stopListening();setNotice("Mikrofonfejl ("+e.error+"). Kontrollér Safari-mikrofontilladelsen.");};
      r.onend=()=>{if(id!==recognitionId.current)return;recognition.current=null;setListening(false);};
      setNotice("Starter talegenkendelse…");r.start();
    }catch{stopListening();setNotice("Mikrofonen kunne ikke startes. Brug mikrofonen på iPhone-tastaturet.");}
  }
  function choosePhoto(e){
    const f=e.target.files?.[0];if(!f)return;
    if(!f.type.startsWith("image/")||f.size>15*1024*1024){setNotice("Vælg et billede på højst 15 MB.");return;}
    if(photoUrl.current)URL.revokeObjectURL(photoUrl.current);
    photoUrl.current=URL.createObjectURL(f);setPhoto(photoUrl.current);
    setNotice("Fotoet vises kun lokalt. Denne prototype kan ikke identificere dele sikkert ud fra billedet.");
  }
  if(legacy)return <div className="mh-legacy"><button onClick={()=>setLegacy(false)}>← Tilbage til samtalen</button><LegacyApp/></div>;
  return <main className="mh">
    <header className="mh-header"><div className="mh-brand"><span className="mh-logo">⚙</span><strong>MechanicAI</strong></div><button className="mh-menu" onClick={()=>setTechnical(v=>!v)} aria-expanded={technical}>Værktøjer ☰</button></header>
    <section className={"mh-hero "+(messages.length?"mh-hero-compact":"")}><span className="mh-kicker">DIN ASSISTENT I VÆRKSTEDET</span><h1>Hvad skal vi fikse i dag?</h1><p>Fortæl mig, hvad du arbejder på. Vi tager det sammen, ét trin ad gangen.</p></section>
    {context.task&&<section className="mh-guide"><div><strong>Aktuel opgave</strong><p>{[context.task,context.maker,context.model,context.year].filter(Boolean).join(" · ")}</p></div><button type="button" onClick={()=>{const g=createGuide(context);setGuide(g);answer(guidePrompt(g));}}>Start trinvis guide</button>{guide&&<div className="mh-guide-controls"><span>Trin {guide.index+1} / {guide.steps.length}</span><button type="button" disabled={guide.index===0} onClick={()=>{const g=moveGuide(guide,-1);setGuide(g);answer(guidePrompt(g));}}>← Tilbage</button><button type="button" disabled={guide.index===guide.steps.length-1} onClick={()=>{const g=moveGuide(guide,1);setGuide(g);answer(guidePrompt(g));}}>Næste →</button></div>}</section>}
    {messages.length>0&&<section ref={chatScroll} className="mh-chat" aria-label="Samtale" aria-live="polite">{messages.map((m,i)=><div key={i} className={"mh-bubble "+m.role}>{m.text}</div>)}</section>}
    <div className={"mh-voice "+(messages.length?"mh-voice-compact":"")}><button type="button" onClick={speak} className={"mh-mic "+(listening?"active":"")} aria-label={listening?"Stop optagelse":"Tal til assistenten"}>🎙</button><span>{listening?"Lytter…":"Tryk og tal"}</span></div>
    <div className="mh-listening-controls"><button type="button" onClick={stopListening} disabled={!listening&& !recognition.current}>■ Stop lytning</button><span>{listening?"Mikrofon aktiv":"Mikrofon slukket"}</span></div>
    <div className="mh-speech-controls"><button type="button" onClick={toggleVoice}>{voiceOn?"🔊 Talesvar til":"🔇 Talesvar fra"}</button><button type="button" disabled={speechState==="idle"} onClick={pauseSpeech}>{speechState==="paused"?"▶ Fortsæt tale":"⏸ Pause tale"}</button><button type="button" disabled={speechState==="idle"} onClick={stopSpeech}>■ Stop tale</button></div>
    <form className="mh-compose" onSubmit={e=>{e.preventDefault();send();}}>
      <label htmlFor="mh-input">Skriv til din assistent</label>
      <div className="mh-input-row"><textarea id="mh-input" rows="2" placeholder="Fx: Jeg skal skifte olie på min motorcykel…" value={draft} onChange={e=>setDraft(e.target.value)}/><button type="submit" disabled={!draft.trim()||aiPending} aria-label="Send besked">➜</button></div>
      {aiPending&&<p role="status">AI tænker…</p>}<div className="mh-actions"><button type="button" onClick={()=>setAttachments(v=>!v)}>＋ Vedhæft</button><button type="button" onClick={()=>setTechnical(v=>!v)}>▣ Teknisk visning</button><button type="button" onClick={()=>{taskGeneration.current++;pendingRequest.current?.abort();pendingRequest.current=null;setAiPending(false);stopSpeech();stopListening();setMessages([]);setContext(emptyContext());setGuide(null);setDraft("");}}>Ny opgave</button></div>
    </form>
    {notice&&<p className="mh-notice" role="status">{notice}</p>}
    {attachments&&<section className="mh-panel"><h2>Vedhæft dokumentation</h2><label>📷 Vælg billede <input type="file" accept="image/*" onChange={choosePhoto}/></label>{photo&&<img src={photo} alt="Dit valgte foto" className="mh-photo"/>}<button type="button" onClick={()=>setPdfOpen(v=>!v)}>📄 {pdfOpen?"Skjul PDF-upload":"Upload PDF-manual"}</button>{pdfOpen&&<ManualUpload/>}</section>}
    {technical&&<section className="mh-panel"><h2>Tekniske værktøjer</h2><p>Tegninger og 3D er valgfrie. Den nuværende 3D-model er kun en illustration og ikke en verificeret model af dit køretøj.</p><button type="button" onClick={()=>{stopListening();setLegacy(true);}}>Åbn eksisterende teknisk demo →</button></section>}
    <footer className="mh-footer">Prototype: {pilotEnabled()?"AI-pilot aktiveret; svar er ikke verificerede reparationsinstruktioner.":"Opgavesamtalen bruger en regelbaseret motor, ikke generativ AI."} Kontroller altid modelspecifikke og sikkerhedskritiske instruktioner i verificeret dokumentation.</footer>
  </main>;
}

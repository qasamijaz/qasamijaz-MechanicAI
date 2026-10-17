import React, {useEffect, useRef, useState} from "react";
import {emptyContext,updateContext,replyFor} from "../conversation/sessionContext.js";
import ManualUpload from "../evidence/ManualUpload.jsx";
import LegacyApp from "../../App.jsx";
import "./home.css";

export default function MechanicHome(){
  const [draft,setDraft]=useState("");
  const [messages,setMessages]=useState([]);
  const [context,setContext]=useState(emptyContext);
  const chatEnd=useRef(null);
  useEffect(()=>{if(messages.length)chatEnd.current?.scrollIntoView({behavior:"smooth",block:"nearest"});},[messages]);
  const [listening,setListening]=useState(false);
  const [attachments,setAttachments]=useState(false);
  const [pdfOpen,setPdfOpen]=useState(false);
  const [technical,setTechnical]=useState(false);
  const [legacy,setLegacy]=useState(false);
  const [photo,setPhoto]=useState(null);
  const [notice,setNotice]=useState("");
  const recognition=useRef(null);
  const photoUrl=useRef(null);
  useEffect(()=>()=>{recognition.current?.abort();if(photoUrl.current)URL.revokeObjectURL(photoUrl.current);},[]);
  function send(value=draft){
    const input=value.trim();if(!input)return;
    const next=updateContext(context,input);
    setContext(next);
    const response=replyFor(next);
    setMessages(prev=>[...prev,{role:"user",text:input},{role:"assistant",text:response}]);
    setDraft("");
  }
  function speak(){
    const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!SpeechRecognition){setNotice("Talegenkendelse understøttes ikke i denne browser. Brug tekstfeltet.");return;}
    if(listening){recognition.current?.stop();return;}
    try{
      const r=new SpeechRecognition();recognition.current=r;r.lang="da-DK";r.interimResults=false;
      r.onstart=()=>{setListening(true);setNotice("Jeg lytter…");};
      r.onresult=e=>{const heard=e.results?.[0]?.[0]?.transcript||"";setDraft(heard);setNotice("Talen er skrevet i feltet. Kontrollér teksten og send.");};
      r.onerror=e=>setNotice("Mikrofon: "+e.error);
      r.onend=()=>setListening(false);
      r.start();
    }catch{setNotice("Mikrofonen kunne ikke startes.");setListening(false);}
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
    <section className="mh-hero"><span className="mh-kicker">DIN ASSISTENT I VÆRKSTEDET</span><h1>Hvad skal vi fikse i dag?</h1><p>Fortæl mig, hvad du arbejder på. Vi tager det sammen, ét trin ad gangen.</p></section>
    {messages.length>0&&<section className="mh-chat" aria-label="Samtale" aria-live="polite">{messages.map((m,i)=><div key={i} className={"mh-bubble "+m.role}>{m.text}</div>)}<div ref={chatEnd}/></section>}
    <div className="mh-voice"><button type="button" onClick={speak} className={"mh-mic "+(listening?"active":"")} aria-label={listening?"Stop optagelse":"Tal til assistenten"}>🎙</button><span>{listening?"Lytter…":"Tryk og tal"}</span></div>
    <form className="mh-compose" onSubmit={e=>{e.preventDefault();send();}}>
      <label htmlFor="mh-input">Skriv til din assistent</label>
      <div className="mh-input-row"><textarea id="mh-input" rows="2" placeholder="Fx: Jeg skal skifte olie på min motorcykel…" value={draft} onChange={e=>setDraft(e.target.value)}/><button type="submit" disabled={!draft.trim()} aria-label="Send besked">➜</button></div>
      <div className="mh-actions"><button type="button" onClick={()=>setAttachments(v=>!v)}>＋ Vedhæft</button><button type="button" onClick={()=>setTechnical(v=>!v)}>▣ Teknisk visning</button><button type="button" onClick={()=>{setMessages([]);setContext(emptyContext());setDraft("");}}>Ny opgave</button></div>
    </form>
    {notice&&<p className="mh-notice" role="status">{notice}</p>}
    {attachments&&<section className="mh-panel"><h2>Vedhæft dokumentation</h2><label>📷 Vælg billede <input type="file" accept="image/*" onChange={choosePhoto}/></label>{photo&&<img src={photo} alt="Dit valgte foto" className="mh-photo"/>}<button type="button" onClick={()=>setPdfOpen(v=>!v)}>📄 {pdfOpen?"Skjul PDF-upload":"Upload PDF-manual"}</button>{pdfOpen&&<ManualUpload/>}</section>}
    {technical&&<section className="mh-panel"><h2>Tekniske værktøjer</h2><p>Tegninger og 3D er valgfrie. Den nuværende 3D-model er kun en illustration og ikke en verificeret model af dit køretøj.</p><button type="button" onClick={()=>setLegacy(true)}>Åbn eksisterende teknisk demo →</button></section>}
    <footer className="mh-footer">Prototype: Opgavesamtalen bruger en regelbaseret motor, ikke generativ AI. Kontroller altid modelspecifikke og sikkerhedskritiske instruktioner i verificeret dokumentation.</footer>
  </main>;
}

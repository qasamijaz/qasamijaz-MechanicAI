import React, { useRef, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { useEffect } from "react";
import * as THREE from "three";
import { OrbitControls, Grid } from "@react-three/drei";

const PARTS = {
  sump: { title: "Bundkar", detail: "Illustrativ beholder nederst på motoren. Form og placering er ikke verificeret mod Suzuki.", partNumber: "11511-21H01", reference: "1", evidence: "Reservedelskatalog 2019 GSX-S1000F: PAN, OIL." },
  drain: { title: "Bundprop (demo)", detail: "Den orange sekskant er kun et demonstrationspunkt. Brug den ikke til at identificere en bolt på din motorcykel.", partNumber: "09247-14036", reference: "5-1", evidence: "Reservedelskatalog 2019 GSX-S1000F: PLUG, OIL DRAIN. Alternativt nummer 11972-17E70 er også opført; kontrollér variant." },
  filter: { title: "Oliefilter (demo)", detail: "Viser, hvordan en komponent kan udpeges i 3D. Placering og udformning er ikke verificeret.", partNumber: null, reference: null, evidence: "Endnu ikke verificeret i komponentbiblioteket." },
  head: { title: "Topstykke (demo)", detail: "Forenklet øvre motordel til navigation i modellen; ikke en teknisk gengivelse.", partNumber: null, reference: null, evidence: "Endnu ikke verificeret i komponentbiblioteket." }
};
const PARTS_SOURCE = "https://www.revzilla.com/oem/suzuki/2019-suzuki-gsx-s1000f/oil-panoil-pump?submodel=gsx-s1000fzal9";
function Part({ id, selected, onSelect, children }) {
  return <group onClick={e => { e.stopPropagation(); onSelect(id); }}>{children}</group>;
}
function Mat({ selected, color }) {
  return <meshStandardMaterial color={selected ? "#ffa94d" : color} emissive={selected ? "#a64a00" : "#000000"} emissiveIntensity={selected ? 0.32 : 0} metalness={0.6} roughness={0.42} />;
}
function Engine({ selected, onSelect }) {
  return <group rotation={[0, -0.3, 0]}>
    <mesh position={[0, 0.22, 0]}><boxGeometry args={[2.55, 1.15, 1.45]}/><meshStandardMaterial color="#64748b" metalness={0.65} roughness={0.43}/></mesh>
    <Part id="head" selected={selected} onSelect={onSelect}>
      <mesh position={[0, 1.08, 0]}><boxGeometry args={[2.4, 0.58, 1.33]}/><Mat selected={selected === "head"} color="#8b9aaa"/></mesh>
      {[-0.72,-0.24,0.24,0.72].map(x => <mesh key={x} position={[x,1.45,0]}><boxGeometry args={[0.14,0.2,1.23]}/><meshStandardMaterial color="#a6b1bd"/></mesh>)}
    </Part>
    <Part id="sump" selected={selected} onSelect={onSelect}>
      <mesh position={[0,-0.62,0]}><boxGeometry args={[2.17,0.56,1.32]}/><Mat selected={selected === "sump"} color="#303f51"/></mesh>
    </Part>
    <Part id="drain" selected={selected} onSelect={onSelect}>
      <mesh position={[0.62,-0.98,0.28]} rotation={[0,0,0]}><cylinderGeometry args={[0.16,0.16,0.16,6]}/><Mat selected={selected === "drain"} color="#c2cbd4"/></mesh>
    </Part>
    <Part id="filter" selected={selected} onSelect={onSelect}>
      <mesh position={[-1.32,-0.15,0.35]} rotation={[0,0,Math.PI/2]}><cylinderGeometry args={[0.35,0.35,0.72,28]}/><Mat selected={selected === "filter"} color="#2c3442"/></mesh>
    </Part>
    {[-1.04,1.04].map(x => <mesh key={x} position={[x,0.18,0.77]} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[0.4,0.4,0.11,32]}/><meshStandardMaterial color="#45566a" metalness={0.7}/></mesh>)}
  </group>;
}
const FOCUS = { drain: [0.62,-0.88,0.28], sump: [0,-0.62,0], filter: [-1.32,-0.15,0.35], head: [0,1.08,0] };
function CameraFocus({ selected }) {
  const { controls, camera } = useThree();
  useEffect(() => {
    if (!controls || !selected || !FOCUS[selected]) return;
    const target = new THREE.Vector3(...FOCUS[selected]);
    const offset = new THREE.Vector3(3.9,2.7,4.5).normalize().multiplyScalar(4.7);
    controls.target.copy(target);
    camera.position.copy(target.clone().add(offset));
    controls.update();
  }, [selected, controls, camera]);
  return null;
}
function Viewer({ selected, onSelect, reset }) {
  return <Canvas key={reset} camera={{position:[3.9,2.7,4.5],fov:45}} gl={{antialias:true}}>
    <color attach="background" args={["#111b29"]}/>
    <ambientLight intensity={1.5}/><directionalLight position={[4,6,5]} intensity={2.3}/>
    <Engine selected={selected} onSelect={onSelect}/>
    <Grid position={[0,-1.4,0]} infiniteGrid fadeDistance={16} sectionColor="#30465c" cellColor="#1f3144"/>
    <OrbitControls makeDefault enableDamping minDistance={2.8} maxDistance={10} target={[0,0.1,0]}/>
    <CameraFocus selected={selected}/>
  </Canvas>;
}
export default function App() {
  const [selected,setSelected]=useState("drain");
  const [reset,setReset]=useState(0);
  const [question,setQuestion]=useState("");
  const [history,setHistory]=useState([]);
  const selectedRef=useRef("drain");
  const [message,setMessage]=useState("Vælg en del i 3D eller brug en af knapperne.");
  const [listening,setListening]=useState(false);
  const [handsFree,setHandsFree]=useState(false);
  const handsFreeRef=useRef(false);
  const speakingRef=useRef(false);
  const restartRef=useRef(null);
  const listenRef=useRef(null);
  const commandRef=useRef(null);
  const [voiceStatus,setVoiceStatus]=useState("Fra");
  const [guideStep,setGuideStep]=useState(-1);
  const [voiceEnabled,setVoiceEnabled]=useState(true);
  const steps=[
    {part:"drain",text:"Trin 1. Find bundproppen i vores demonstrationsmodel. Den orange markering viser kun en illustrativ placering, ikke din Suzukis faktiske bundprop."},
    {part:"sump",text:"Trin 2. Se bundkarret. Reservedelskataloget angiver et delnummer, men vi har endnu ikke verificeret motorens geometri."},
    {part:"filter",text:"Trin 3. Find oliefilteret i demonstrationsmodellen. Dets placering er endnu ikke verificeret mod din motorcykel."},
    {part:null,text:"Trin 4. Demonstrationen er slut. Før en rigtig reparation skal vi verificere modelvariant, manual, komponentplacering og sikkerhedsforhold."}
  ];
  function resumeListening() {
    if(!handsFreeRef.current || speakingRef.current)return;
    if(restartRef.current)clearTimeout(restartRef.current);
    restartRef.current=setTimeout(()=>{if(handsFreeRef.current&&!speakingRef.current)listenRef.current?.();},350);
  }
  function say(text) {
    if(!voiceEnabled || !("speechSynthesis" in window)){resumeListening();return;}
    recognition.current?.abort();
    speakingRef.current=true;setVoiceStatus("Taler");
    window.speechSynthesis.cancel();
    const u=new SpeechSynthesisUtterance(text);u.lang="da-DK";u.rate=0.92;
    u.onend=()=>{speakingRef.current=false;resumeListening();};
    u.onerror=()=>{speakingRef.current=false;resumeListening();};
    window.speechSynthesis.speak(u);
  }
  function goStep(index) {
    if(index<0||index>=steps.length)return;
    const step=steps[index];setGuideStep(index);
    setSelected(step.part);setMessage(step.text);say(step.text);
  }
  function stopHandsFree() {
    handsFreeRef.current=false;setHandsFree(false);setVoiceStatus("Fra");
    if(restartRef.current)clearTimeout(restartRef.current);
    recognition.current?.abort();
    if("speechSynthesis" in window)window.speechSynthesis.cancel();
    speakingRef.current=false;setListening(false);
  }
  function startHandsFree() {
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!SR){setMessage("Håndfri stemmegenkendelse understøttes ikke i denne browser. Brug knapperne eller en anden browser.");return;}
    handsFreeRef.current=true;setHandsFree(true);setVoiceStatus("Starter");
    say("Håndfri tilstand er startet. Sig start guide, næste, gentag eller stop.");
    if(!voiceEnabled)resumeListening();
  }
  function stopGuide() {
    if("speechSynthesis" in window)window.speechSynthesis.cancel();
    stopHandsFree();
    setGuideStep(-1);setMessage("Guiden er stoppet.");
  }
  useEffect(()=>()=>{handsFreeRef.current=false;if(restartRef.current)clearTimeout(restartRef.current);if("speechSynthesis" in window)window.speechSynthesis.cancel();if(recognition.current)recognition.current.abort();},[]);
  const recognition=useRef(null);
  function selectPart(id) {selectedRef.current=id;setSelected(id);setMessage(PARTS[id].detail);say(PARTS[id].title+". "+PARTS[id].detail);}
  function respond(input) {
    const s=input.toLocaleLowerCase("da-DK");
    const id=/bundprop|olieprop|aftapningsprop/.test(s)?"drain":/oliefilter|filter/.test(s)?"filter":/bundkar/.test(s)?"sump":/topstykke/.test(s)?"head":selectedRef.current;
    const part=PARTS[id];
    let reply;
    if(/hvilken bolt|peger ud|peger ned|venstre|højre|kan ikke finde|kan ikk finde|er det den|er det denne/.test(s)){
      reply="Jeg kan ikke bekræfte den faktiske bolt ud fra vores demonstrationsmodel. Stop før du løsner noget. Du kan vise mig et foto i en senere version, eller sammenholde med en verificeret servicemanual.";
    }else if(/nummer|reservedel|varenummer|delnummer/.test(s)){
      reply=part.partNumber?"Reservedelsregisteret angiver "+part.partNumber+" for "+part.title+". Kontrollér variant og stelnummer i kilden.":"Vi har endnu ikke verificeret et reservedelsnummer for "+part.title+".";
    }else if(/hvor|find|vis|sidder|fortæl|hvad er/.test(s)){
      selectedRef.current=id;setSelected(id);
      reply="Jeg markerer "+part.title+" i demonstrationsmodellen. "+part.detail;
    }else if(/moment|newton|spænde|løsne|skrue af|olie mængde|olietype/.test(s)){
      reply="Det kræver verificerede serviceoplysninger for præcis model og årgang. Jeg vil ikke gætte på moment, væske eller fremgangsmåde.";
    }else{
      reply="Jeg kan hjælpe med komponenternes navne, demonstrationsvisning og dokumenterede reservedelsnumre. Spørg for eksempel: Hvor sidder oliefilteret? Eller: Hvilket reservedelsnummer har bundproppen?";
    }
    setMessage(reply);setHistory(h=>[...h.slice(-7),{q:input,a:reply}]);say(reply);
  }
  function command(input) {
    const s=input.toLocaleLowerCase("da-DK");
    if (/stop|afbryd|hold op/.test(s)) stopGuide();
    else if (/gentag|sig det igen/.test(s)) {if(guideStep>=0)say(steps[guideStep].text);else say(message);}
    else if (/næste|videre|fortsæt/.test(s)) goStep(guideStep<0?0:Math.min(guideStep+1,steps.length-1));
    else if (/start guide|start vejledning|hjælp mig/.test(s)) goStep(0);
    else if (/bundprop|olieprop|bolt/.test(s)) selectPart("drain");
    else if (/filter/.test(s)) selectPart("filter");
    else if (/bundkar/.test(s)) selectPart("sump");
    else if (/topstykke|toppen/.test(s)) selectPart("head");
    else if (/nulstil|reset|start forfra/.test(s)) {setReset(x=>x+1);setSelected(null);setMessage("Visningen er nulstillet.");}
    else if (/skjul|fjern/.test(s)) {setSelected(null);setMessage("Markeringen er fjernet.");}
    else respond(input);
  }
  function listen() {
    const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!SpeechRecognition){setMessage("Stemmegenkendelse understøttes ikke i denne browser. Brug knapperne.");stopHandsFree();return;}
    if(speakingRef.current)return;
    try {
      recognition.current?.abort();
      const r=new SpeechRecognition();r.lang="da-DK";r.interimResults=false;r.continuous=false;
      recognition.current=r;
      r.onstart=()=>{setListening(true);setVoiceStatus("Lytter");};
      r.onresult=e=>{const heard=e.results[0][0].transcript;setVoiceStatus("Forstod: "+heard);commandRef.current?.(heard);};
      r.onerror=e=>{
        setListening(false);
        if(e.error==="not-allowed"||e.error==="service-not-allowed"){stopHandsFree();setMessage("Mikrofonadgang blev afvist. Tillad mikrofonen i browseren.");}
        else if(e.error!=="aborted"&&e.error!=="no-speech"){setVoiceStatus("Mikrofon: "+e.error);}
      };
      r.onend=()=>{setListening(false);if(recognition.current===r)recognition.current=null;resumeListening();};
      r.start();
    } catch {setListening(false);setVoiceStatus("Kunne ikke starte mikrofon");if(handsFreeRef.current)resumeListening();}
  }
  listenRef.current=listen;
  commandRef.current=command;
  return <main>
    <header><div><h1>MechanicAI <small>V2.5 LAB</small></h1><p>Interaktiv 3D · stemmekommandoer · webprototype</p></div><span className="status">Isoleret demo</span></header>
    <section className="workspace">
      <div className="viewer" aria-label="Interaktiv illustrativ 3D-motormodel">
        <Viewer selected={selected} onSelect={selectPart} reset={reset}/>
        <div className="viewer-tag">ILLUSTRATIV MODEL · IKKE SUZUKI</div>
      </div>
      <aside>
        <h2>AI-mekaniker · V2.5</h2>
        <p className="notice">Dette er en interaktiv demonstration uden verificeret motorgeometri, servicemanual eller reparationsdata. Undlad at bruge placeringerne til arbejde på et køretøj.</p>
        <div className="part-info"><span className="eyebrow">VALGT KOMPONENT</span><strong>{selected ? PARTS[selected].title : "Ingen markering"}</strong><p>{selected ? PARTS[selected].detail : "Tryk på en del af modellen for at vælge den."}</p></div>
        <div className="part-info"><span className="eyebrow">KILDEBASERET RESERVEDELSREGISTER · 2019</span>
          {selected && PARTS[selected].partNumber ? <><p><strong>Delnummer: {PARTS[selected].partNumber}</strong> · Diagramposition {PARTS[selected].reference}</p><p>{PARTS[selected].evidence}</p><a href={PARTS_SOURCE} target="_blank" rel="noopener noreferrer">Se reservedelsdiagram og variant</a></> : <p>{selected ? PARTS[selected].evidence : "Vælg en komponent for at se eventuelle verificerede reservedelsoplysninger."}</p>}
          <p className="hint">Delnummeret kommer fra et reservedelskatalog, ikke fra den viste 3D-geometri. Bekræft stelnummer og markedsvariant før bestilling eller reparation.</p>
        </div>
        <div className="reply" aria-live="polite">{message}</div>
        <div className="part-info"><span className="eyebrow">SAMTALEPROTOTYPE · INGEN CLOUD-AI</span>
          <p>Stil spørgsmål på dansk. Denne version bruger kontrollerede svar og komponentdata – ikke en sprogmodel.</p>
          <form onSubmit={e=>{e.preventDefault();if(question.trim()){respond(question.trim());setQuestion("");}}}>
            <input aria-label="Spørg mekanikeren" placeholder="Fx: Hvilken bolt mener du?" value={question} onChange={e=>setQuestion(e.target.value)} style={{width:"100%",padding:"12px",borderRadius:"8px",marginBottom:"8px"}}/>
            <button type="submit">Spørg mekanikeren</button>
          </form>
          {history.slice(-3).map((entry,i)=><p key={i}><strong>Du:</strong> {entry.q}<br/><strong>MechanicAI:</strong> {entry.a}</p>)}
        </div>
        <div className="part-info"><span className="eyebrow">DOKUMENTATION · 2019 GSX-S1000F</span><p>Vi har fundet Suzukis officielle manualoversigt og en reservedelskatalog-reference til bundkar og olieaftapningsprop. Det dokumenterer delnumre, men ikke den præcise placering på vores 3D-demomodel.</p><a href="https://www.suzuki.nl/motoren/service/gebruikershandleidingen-motoren/" target="_blank" rel="noopener noreferrer">Suzuki: ejerhåndbøger</a><p><a href="https://www.pieces-suzuki.ca/suzuki-moto/1000-MOTO/GSX-S/2019/GSX-S1000FYA-L9-E21-/MOTEUR-TRANSMISSION/CARTER-INFERIEUR--POMPE-A-HUILE/2021000000/2021018533/M/10531" target="_blank" rel="noopener noreferrer">2019: reservedelskatalog for bundkar</a></p><p>Ingen bolte eller tilspændingsmomenter er verificeret i 3D endnu.</p></div>
        <div className="part-info" aria-live="polite"><span className="eyebrow">STEMMESTYRET DEMOGUIDE</span><p>{guideStep>=0?"Trin "+(guideStep+1)+" af "+steps.length+": "+steps[guideStep].text:"Start et firetrins demonstrationsforløb med dansk oplæsning og 3D-fokus."}</p>
          <p><strong>Håndfri: {handsFree?"Aktiv":"Fra"}</strong> · {voiceStatus}</p><div className="controls"><button className="primary" onClick={handsFree?stopHandsFree:startHandsFree}>{handsFree?"⏹ Afslut håndfri":"🎤 Start håndfri"}</button><button onClick={()=>goStep(0)}>▶ Start guide</button><button onClick={()=>goStep(Math.min(guideStep+1,steps.length-1))}>Næste</button><button onClick={()=>guideStep>=0?say(steps[guideStep].text):say(message)}>Gentag</button><button onClick={stopGuide}>Stop</button><button onClick={()=>{if(voiceEnabled&&"speechSynthesis" in window)window.speechSynthesis.cancel();setVoiceEnabled(v=>!v);}}>{voiceEnabled?"🔊 Tale til":"🔇 Tale fra"}</button></div>
          <p className="hint">Prøv også mikrofonkommandoerne: “start guide”, “næste”, “gentag” og “stop”. Håndfri genstarter mikrofonen efter hvert svar, når browseren tillader det. På iPhone kan browseren kræve ny aktivering eller stoppe i baggrunden. Talegenkendelse og oplæsning afhænger af browseren. Ingen AI-genererede reparationsinstruktioner.</p>
        </div>
        <div className="controls">
          <button className="primary" onClick={listen} disabled={listening}>{listening ? "🎙 Lytter…" : "🎙 Tal til modellen"}</button>
          <button onClick={()=>selectPart("drain")}>Vis bundproppen</button>
          <button onClick={()=>selectPart("filter")}>Vis oliefilter</button>
          <button onClick={()=>selectPart("sump")}>Vis bundkar</button>
          <button onClick={()=>selectPart("head")}>Vis topstykke</button>
          <button onClick={()=>command("nulstil")}>Nulstil visning</button>
        </div>
        <p className="hint">Drej modellen med fingeren eller musen. Zoom med to fingre eller musehjulet. Tale bruger browserens stemmegenkendelse, ikke Whisper.</p>
      </aside>
    </section>
  </main>;
}

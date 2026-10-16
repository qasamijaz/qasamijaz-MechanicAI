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
  const [message,setMessage]=useState("Vælg en del i 3D eller brug en af knapperne.");
  const [listening,setListening]=useState(false);
  const recognition=useRef(null);
  function selectPart(id) {setSelected(id);setMessage(PARTS[id].detail);}
  function command(input) {
    const s=input.toLocaleLowerCase("da-DK");
    if (/bundprop|olieprop|bolt/.test(s)) selectPart("drain");
    else if (/filter/.test(s)) selectPart("filter");
    else if (/bundkar/.test(s)) selectPart("sump");
    else if (/topstykke|toppen/.test(s)) selectPart("head");
    else if (/nulstil|reset|start forfra/.test(s)) {setReset(x=>x+1);setSelected(null);setMessage("Visningen er nulstillet.");}
    else if (/skjul|fjern/.test(s)) {setSelected(null);setMessage("Markeringen er fjernet.");}
    else setMessage("Kommando ikke genkendt. Prøv eksempelvis: vis oliefilter.");
  }
  function listen() {
    const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!SpeechRecognition) {setMessage("Stemmegenkendelse understøttes ikke i denne browser. Brug knapperne.");return;}
    try {
      const r=new SpeechRecognition();r.lang="da-DK";r.interimResults=false;
      r.onresult=e=>command(e.results[0][0].transcript);
      r.onerror=e=>{setListening(false);setMessage("Mikrofonfejl: "+e.error);};
      r.onend=()=>setListening(false);recognition.current=r;r.start();setListening(true);
    } catch {setListening(false);setMessage("Mikrofonen kunne ikke startes.");}
  }
  return <main>
    <header><div><h1>MechanicAI <small>V2.2 LAB</small></h1><p>Interaktiv 3D · stemmekommandoer · webprototype</p></div><span className="status">Isoleret demo</span></header>
    <section className="workspace">
      <div className="viewer" aria-label="Interaktiv illustrativ 3D-motormodel">
        <Viewer selected={selected} onSelect={selectPart} reset={reset}/>
        <div className="viewer-tag">ILLUSTRATIV MODEL · IKKE SUZUKI</div>
      </div>
      <aside>
        <h2>AI-mekaniker · V2.2</h2>
        <p className="notice">Dette er en interaktiv demonstration uden verificeret motorgeometri, servicemanual eller reparationsdata. Undlad at bruge placeringerne til arbejde på et køretøj.</p>
        <div className="part-info"><span className="eyebrow">VALGT KOMPONENT</span><strong>{selected ? PARTS[selected].title : "Ingen markering"}</strong><p>{selected ? PARTS[selected].detail : "Tryk på en del af modellen for at vælge den."}</p></div>
        <div className="part-info"><span className="eyebrow">KILDEBASERET RESERVEDELSREGISTER · 2019</span>
          {selected && PARTS[selected].partNumber ? <><p><strong>Delnummer: {PARTS[selected].partNumber}</strong> · Diagramposition {PARTS[selected].reference}</p><p>{PARTS[selected].evidence}</p><a href={PARTS_SOURCE} target="_blank" rel="noopener noreferrer">Se reservedelsdiagram og variant</a></> : <p>{selected ? PARTS[selected].evidence : "Vælg en komponent for at se eventuelle verificerede reservedelsoplysninger."}</p>}
          <p className="hint">Delnummeret kommer fra et reservedelskatalog, ikke fra den viste 3D-geometri. Bekræft stelnummer og markedsvariant før bestilling eller reparation.</p>
        </div>
        <div className="reply" aria-live="polite">{message}</div>
        <div className="part-info"><span className="eyebrow">DOKUMENTATION · 2019 GSX-S1000F</span><p>Vi har fundet Suzukis officielle manualoversigt og en reservedelskatalog-reference til bundkar og olieaftapningsprop. Det dokumenterer delnumre, men ikke den præcise placering på vores 3D-demomodel.</p><a href="https://www.suzuki.nl/motoren/service/gebruikershandleidingen-motoren/" target="_blank" rel="noopener noreferrer">Suzuki: ejerhåndbøger</a><p><a href="https://www.pieces-suzuki.ca/suzuki-moto/1000-MOTO/GSX-S/2019/GSX-S1000FYA-L9-E21-/MOTEUR-TRANSMISSION/CARTER-INFERIEUR--POMPE-A-HUILE/2021000000/2021018533/M/10531" target="_blank" rel="noopener noreferrer">2019: reservedelskatalog for bundkar</a></p><p>Ingen bolte eller tilspændingsmomenter er verificeret i 3D endnu.</p></div>
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

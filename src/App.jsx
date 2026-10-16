import React, { useRef, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Grid, Html } from "@react-three/drei";

function DemoAssembly({ highlight }) {
  return <group>
    <mesh position={[0, 0.2, 0]}><boxGeometry args={[2.7, 0.8, 1.7]}/><meshStandardMaterial color="#657384" metalness={0.55} roughness={0.4}/></mesh>
    <mesh position={[0, -0.35, 0]}><boxGeometry args={[2.2, 0.35, 1.45]}/><meshStandardMaterial color="#303d4b" metalness={0.7}/></mesh>
    <mesh position={[0.9, -0.55, 0.25]} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[0.17,0.17,0.22,6]}/><meshStandardMaterial color={highlight?"#ff9f43":"#aab7c4"} emissive={highlight?"#ff6500":"#000000"} emissiveIntensity={highlight?0.6:0}/></mesh>
    {highlight && <Html position={[0.9,-0.2,0.25]}><span className="part-label">Demo: bundprop</span></Html>}
  </group>;
}
function Scene({highlight, resetToken}) {
  return <Canvas key={resetToken} camera={{position:[4,3,5],fov:45}}><color attach="background" args={["#111b29"]}/><ambientLight intensity={1.5}/><directionalLight position={[3,5,4]} intensity={2}/><DemoAssembly highlight={highlight}/><Grid position={[0,-1,0]} infiniteGrid fadeDistance={18} sectionColor="#34506c" cellColor="#233548"/><OrbitControls makeDefault enableDamping/></Canvas>;
}
export default function App(){
 const [highlight,setHighlight]=useState(false),[resetToken,setResetToken]=useState(0),[message,setMessage]=useState("Klar. Vælg en kommando eller brug mikrofonen."),[listening,setListening]=useState(false);
 const recognition=useRef(null);
 function command(input){const s=input.toLocaleLowerCase("da-DK");if(/bundprop|bolt/.test(s)){setHighlight(true);setMessage("Bundproppen er fremhævet på DEMO-modellen. Dette er ikke en verificeret Suzuki-komponent.");}else if(/nulstil|reset|start forfra/.test(s)){setResetToken(x=>x+1);setHighlight(false);setMessage("Visningen er nulstillet.");}else if(/skjul|fjern markering/.test(s)){setHighlight(false);setMessage("Markeringen er fjernet.");}else{setMessage('Ukendt kommando: "'+input+'". Prøv "vis bundproppen".');}}
 function listen(){const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SpeechRecognition){setMessage("Browseren understøtter ikke Web Speech API. Brug knapperne; open-source STT tilføjes senere.");return;}const r=new SpeechRecognition();r.lang="da-DK";r.interimResults=false;r.onresult=e=>command(e.results[0][0].transcript);r.onerror=e=>{setListening(false);setMessage("Mikrofonfejl: "+e.error);};r.onend=()=>setListening(false);recognition.current=r;r.start();setListening(true);}
 return <main><header><div><h1>MechanicAI <small>V1 LAB</small></h1><p>Håndfri, visuel reparationsassistent · lokal prototype</p></div><span className="status">Isoleret demo</span></header><section className="workspace"><div className="viewer"><Scene highlight={highlight} resetToken={resetToken}/><div className="watermark">ILLUSTRATIV 3D · IKKE SUZUKI-GEOMETRI</div></div><aside><h2>AI-mekaniker</h2><p className="notice">Denne prototype bruger en geometrisk testmodel, ikke en servicemanual. Ingen tekniske reparationsinstruktioner er verificeret.</p><div className="reply" aria-live="polite">{message}</div><button onClick={listen} disabled={listening}>{listening?"Lytter…":"🎙 Tal til modellen"}</button><button onClick={()=>command("vis bundproppen")}>Vis bundproppen</button><button onClick={()=>command("skjul markering")}>Skjul markering</button><button onClick={()=>command("nulstil")}>Nulstil visning</button><p className="hint">Brug musen til at rotere og zoome. Stemmestyring bruger foreløbig browserens Web Speech API, ikke Whisper.</p></aside></section></main>;
}

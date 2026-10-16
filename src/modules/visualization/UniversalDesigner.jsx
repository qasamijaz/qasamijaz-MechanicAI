import React,{useState,useEffect,useRef} from "react";
import {initialDesign,editDesign,LIMITS} from "../design-engine/index.js";
import {createScene} from "./scene.js";
export default function UniversalDesigner({plan}){
 const [state,setState]=useState(()=>initialDesign(plan));
 const [instruction,setInstruction]=useState("");
 const [feedback,setFeedback]=useState("Brug tekst, mikrofon eller felterne.");
 const [listening,setListening]=useState(false);
 const recognition=useRef(null);
 useEffect(()=>{setState(initialDesign(plan));},[plan.input,plan.domain]);
 useEffect(()=>()=>recognition.current?.abort(),[]);
 const {config}=state;
 const scene=createScene(plan,config);
 function apply(command){const result=editDesign(state,command);setState(result.state);setFeedback(result.message);}
 function speak(){
  const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SpeechRecognition){setFeedback("Talegenkendelse understøttes ikke. Brug tekstfeltet.");return;}
  try{
   recognition.current?.abort();
   const r=new SpeechRecognition();recognition.current=r;r.lang="da-DK";r.interimResults=false;
   r.onstart=()=>setListening(true);
   r.onresult=e=>{const spoken=e.results[0][0].transcript;setInstruction(spoken);setState(current=>editDesign(current,spoken).state);setFeedback("Forstod: "+spoken);};
   r.onerror=e=>setFeedback("Mikrofonfejl: "+e.error);
   r.onend=()=>{setListening(false);if(recognition.current===r)recognition.current=null;};
   r.start();
  }catch{setListening(false);setFeedback("Kunne ikke starte mikrofonen.");}
 }
 const update=(field,value)=>{if(value==="")return;const n=Number(value);if(Number.isFinite(n))setState(s=>({...s,config:{...s.config,[field]:Math.min(LIMITS[field][1],Math.max(LIMITS[field][0],field==="count"?Math.round(n):n))}}));};
 const dimensions=[["length","Længde (m)"],["width","Bredde (m)"],...(scene.kind==="fence"?[["height","Højde (m)"],["spacing","Stolpeafstand (m)"]]:[]),...(scene.kind==="lights"?[["count","Antal lamper"]]:[])];
 const count=Math.ceil(config.length/config.spacing),postXs=Array.from({length:count+1},(_,i)=>25+450*Math.min(config.length,i*config.spacing)/config.length);
 return <section aria-label="Universel interaktiv designer" style={{padding:12,border:"1px solid #64748b",borderRadius:12,marginTop:12}}>
  <h3>Interaktiv konceptdesigner</h3>
  <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
   {dimensions.map(([field,label])=><label key={field} style={{display:"grid",gap:4}}>{label}<input aria-label={label} type="number" step={field==="count"?1:.1} min={LIMITS[field][0]} max={LIMITS[field][1]} value={config[field]} onChange={e=>update(field,e.target.value)} style={{width:105,padding:8}}/></label>)}
   {scene.kind==="fence"&&<label style={{display:"grid",gap:4}}>Brædder<select value={config.orientation} onChange={e=>setState(s=>({...s,config:{...s.config,orientation:e.target.value}}))}><option value="horizontal">Vandrette</option><option value="vertical">Lodrette</option></select></label>}
  </div>
  <svg role="img" aria-label={"Konceptskitse for "+plan.label} viewBox="0 0 500 240" style={{width:"100%",maxHeight:280,marginTop:10}}>
   <rect width="500" height="240" fill="#193147"/>
   {scene.kind==="fence"&&<g>
    {config.orientation==="horizontal"?Array.from({length:4},(_,i)=><rect key={i} x="25" y={35+i*32} width="450" height="25" fill="#b88c5a" stroke="#654527"/>):Array.from({length:Math.ceil(config.length*2)},(_,i)=><rect key={i} x={25+i*450/Math.ceil(config.length*2)} y="35" width={450/Math.ceil(config.length*2)*.85} height="125" fill="#b88c5a" stroke="#654527"/>)}
    {postXs.map((x,i)=><rect key={i} x={Math.min(x,466)} y="25" width="9" height="150" fill="#e3bb86" stroke="#654527"/>)}
    <text x="20" y="208" fill="white" fontSize="14">{config.length} m × {config.height} m · {count+1} stolper (skitse)</text>
   </g>}
   {scene.kind==="lights"&&<g>
    <rect x="30" y="20" width="440" height="175" fill="#172b3f" stroke="#d8e4f0" strokeWidth="3"/>
    {Array.from({length:config.count},(_,i)=>{const cols=Math.ceil(Math.sqrt(config.count));const rows=Math.ceil(config.count/cols);const x=30+(i%cols+.5)*440/cols+config.offset*150;const y=20+(Math.floor(i/cols)+.5)*175/rows;return <circle key={i} cx={Math.min(450,Math.max(50,x))} cy={y} r="14" fill="#f9d78b" stroke="#f3b34e" strokeWidth="3"/>;})}
    <text x="20" y="220" fill="white" fontSize="14">{config.count} lamper · rum {config.width} × {config.length} m</text>
   </g>}
   {scene.kind==="floorplan"&&<g>
    {scene.rooms.map((r,i)=><g key={i}><rect x={20+r.x*460+config.offset*100} y={15+r.y*190} width={r.w*460} height={r.h*190} fill="#172b3f" stroke="#d8e4f0" strokeWidth="3"/><text x={26+r.x*460+config.offset*100} y={40+r.y*190} fill="white" fontSize="13">{r.name}</text></g>)}
    <text x="20" y="228" fill="white" fontSize="14">Konceptplan · {config.width} × {config.length} m</text>
   </g>}
   {scene.kind==="guide"&&<text x="20" y="45" fill="white" fontSize="17">Guiden kræver verificerede kilder før udførelse.</text>}
  </svg>
  <form onSubmit={e=>{e.preventDefault();apply(instruction);}}>
   <input aria-label="Rediger skitsen med tekst" placeholder="Fx: bredde 6 meter, antal 5, flyt til venstre" value={instruction} onChange={e=>setInstruction(e.target.value)} style={{width:"100%",padding:10,marginBottom:8}}/>
   <div style={{display:"flex",gap:8,flexWrap:"wrap"}}><button type="submit">Opdater skitse</button><button type="button" onClick={speak} disabled={listening}>{listening?"Lytter…":"🎤 Sig en ændring"}</button></div>
  </form>
  <p role="status">{feedback}</p><p style={{fontSize:12,opacity:.85}}>{scene.warning} Illustrationerne er ikke godkendte tekniske tegninger.</p>
 </section>;
}

import React,{useState,useRef,useEffect} from "react";
import { initialFence,updateFence } from "./fenceDesign.js";

export default function FenceDesigner({ taskText="" }) {
  const [config,setConfig]=useState(()=>initialFence(taskText));
  const [instruction,setInstruction]=useState("");
  const [feedback,setFeedback]=useState("Ændr målene nedenfor eller brug mikrofonen.");
  const [listening,setListening]=useState(false);
  const recognition=useRef(null);
  useEffect(()=>{setConfig(initialFence(taskText));},[taskText]);
  useEffect(()=>()=>recognition.current?.abort(),[]);
  function apply(text) {
    const result=updateFence(config,text);
    setConfig(result.config);setFeedback(result.message);
  }
  function speak() {
    const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!Recognition){setFeedback("Talegenkendelse understøttes ikke her. Brug tekstfeltet.");return;}
    try{
      recognition.current?.abort();
      const r=new Recognition();recognition.current=r;r.lang="da-DK";r.interimResults=false;
      r.onstart=()=>setListening(true);
      r.onresult=e=>{const heard=e.results[0][0].transcript;setInstruction(heard);apply(heard);};
      r.onerror=e=>setFeedback("Mikrofon: "+e.error+". Brug tekstfeltet, hvis browseren afviser adgang.");
      r.onend=()=>{setListening(false);if(recognition.current===r)recognition.current=null;};
      r.start();
    }catch(e){setListening(false);setFeedback("Mikrofonen kunne ikke startes.");}
  }
  const count=Math.ceil(config.length/config.spacing);
  const w=500, x0=25, x1=475, y0=175, top=y0-config.height/3*140;
  const posts=Array.from({length:count+1},(_,i)=>x0+(x1-x0)*Math.min(config.length,i*config.spacing)/config.length);
  return <section aria-label="Interaktiv hegnsdesigner" style={{border:"1px solid #64748b",borderRadius:12,padding:12,marginTop:12}}>
    <h3>Interaktiv hegnsdesigner · koncept</h3>
    <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
      {[[ "Længde (m)","length",2,40,.5],["Højde (m)","height",.5,3,.1],["Stolpeafstand (m)","spacing",.5,4,.1]].map(([label,key,min,max,step])=><label key={key} style={{display:"grid",gap:4}}>{label}<input aria-label={label} type="number" min={min} max={max} step={step} value={config[key]} onChange={e=>{const n=Number(e.target.value);if(Number.isFinite(n))setConfig(c=>({...c,[key]:Math.min(max,Math.max(min,n))}));}} style={{width:105,padding:8}}/></label>)}
      <label style={{display:"grid",gap:4}}>Brædder<select value={config.style} onChange={e=>setConfig(c=>({...c,style:e.target.value}))} style={{padding:8}}><option value="horizontal">Vandrette</option><option value="vertical">Lodrette</option></select></label>
    </div>
    <svg role="img" aria-label={"Hegn "+config.length+" meter langt og "+config.height+" meter højt, "+(count+1)+" stolper"} viewBox="0 0 500 210" style={{width:"100%",maxHeight:260,marginTop:12}}>
      <rect width="500" height="210" fill="#193147"/>
      <path d="M10 176H490" stroke="#89a7a3" strokeWidth="3"/>
      {config.style==="horizontal" ? Array.from({length:4},(_,i)=><rect key={i} x={x0} y={top+i*(y0-top)/4} width={x1-x0} height={Math.max(3,(y0-top)/5)} fill="#b88c5a" stroke="#654527"/>)
        : Array.from({length:Math.max(2,Math.round(config.length*2))},(_,i)=><rect key={i} x={x0+i*(x1-x0)/Math.max(2,Math.round(config.length*2))} y={top} width={(x1-x0)/Math.max(2,Math.round(config.length*2))*.85} height={y0-top} fill="#b88c5a" stroke="#654527"/>)}
      {posts.map((x,i)=><rect key={i} x={Math.min(x,467)} y={top-5} width="9" height={y0-top+10} fill="#e3bb86" stroke="#654527"/>)}
      <text x="20" y="196" fill="white" fontSize="13">{config.length} m længde · {config.height} m højde · {count+1} stolper (illustration)</text>
    </svg>
    <form onSubmit={e=>{e.preventDefault();apply(instruction);}}>
      <input aria-label="Ændring til hegn" placeholder="Fx: gør højden 1,5 meter" value={instruction} onChange={e=>setInstruction(e.target.value)} style={{width:"100%",padding:10,marginBottom:8}}/>
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}><button type="submit">Opdater fra tekst</button><button type="button" onClick={speak} disabled={listening}>{listening?"Lytter…":"🎤 Sig en ændring"}</button></div>
    </form>
    <p role="status">{feedback}</p>
    <p style={{fontSize:12,opacity:.85}}>Illustration uden verificerede dimensioneringskrav, skelregler, vindlast eller fundament. Stolpeantallet er en skitseberegning, ikke en materialeliste.</p>
  </section>;
}

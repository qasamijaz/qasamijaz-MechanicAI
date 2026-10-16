import React from "react";
import { createScene } from "./scene.js";

export default function ConceptPreview({ plan, width = 8, length = 12 }) {
  if (!plan) return null;
  const scene = createScene(plan, { width, length });
  const border = { stroke: "#d8e4f0", strokeWidth: 2, fill: "#172b3f" };
  return <section aria-label="Konceptvisualisering" style={{padding: 12, border:"1px solid #64748b", borderRadius:12, marginTop:12}}>
    <strong>Visuel konceptskitse · {scene.kind}</strong>
    {scene.kind === "fence" && <svg role="img" aria-label="Hegn set fra siden med stolper og vandrette brædder" viewBox="0 0 500 180" style={{width:"100%",maxHeight:220}}>
      <rect x="0" y="0" width="500" height="180" fill="#193147"/>
      {[55,100,145].map(y=><rect key={y} x="20" y={y} width="460" height="24" fill="#b88c5a" stroke="#654527" strokeWidth="2"/>)}
      {scene.posts.map((p,i)=><rect key={i} x={20+450*p.x/scene.length} y="20" width="12" height="145" fill="#e3bb86" stroke="#654527" strokeWidth="2"/>)}
      <text x="20" y="175" fill="white" fontSize="12">Illustration: ca. {scene.length} m hegn · stolper ca. 2 m fra hinanden</text>
    </svg>}
    {scene.kind === "floorplan" && <svg role="img" aria-label="Konceptuel plantegning med fire rum" viewBox="0 0 500 320" style={{width:"100%",maxHeight:320}}>
      <rect x="0" y="0" width="500" height="320" fill="#193147"/>
      {scene.rooms.map((r,i)=><g key={i}><rect x={20+r.x*460} y={20+r.y*270} width={r.w*460} height={r.h*270} {...border}/><text x={25+r.x*460} y={42+r.y*270} fill="white" fontSize="14">{r.name}</text></g>)}
      <text x="20" y="310" fill="white" fontSize="12">Koncept · {scene.width} × {scene.length} m (ikke målfast konstruktionstegning)</text>
    </svg>}
    {scene.kind === "lights" && <svg role="img" aria-label="Konceptuel lampeplacering i rum set ovenfra" viewBox="0 0 500 280" style={{width:"100%",maxHeight:280}}>
      <rect x="0" y="0" width="500" height="280" fill="#193147"/>
      <rect x="30" y="20" width="440" height="220" {...border}/>
      {scene.points.map((p,i)=><g key={i}><circle cx={30+p.x*440} cy={20+p.y*220} r="20" fill="#f9d78b" stroke="#f3b34e" strokeWidth="3"/><text x={24+p.x*440} y={25+p.y*220} fontSize="14" fill="#243247">{i+1}</text></g>)}
      <text x="30" y="265" fill="white" fontSize="12">Konceptuel placering · {scene.width} × {scene.length} m</text>
    </svg>}
    {scene.kind === "guide" && <ol>{scene.steps.map((step,i)=><li key={i}>{step}</li>)}</ol>}
    <p style={{fontSize:12,opacity:.85}}>{scene.warning}</p>
  </section>;
}

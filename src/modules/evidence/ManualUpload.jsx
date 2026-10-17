import React,{useState} from "react";
import {CLOUD_URL,cloudConfigured} from "../ai-runtime/cloud.js";

/** Upload is explicitly user-initiated. Do not retain PDFs or pilot keys in storage. */
export default function ManualUpload(){
 const [file,setFile]=useState(null);
 const [key,setKey]=useState("");
 const [result,setResult]=useState(null);
 const [error,setError]=useState("");
 const [loading,setLoading]=useState(false);
 async function upload(event){
  event.preventDefault();setError("");setResult(null);
  if(!file||file.type!=="application/pdf"||file.size<1||file.size>5*1024*1024){setError("Vælg en PDF på højst 5 MB.");return;}
  if(!key.trim()){setError("Indtast PoC-adgangskoden.");return;}
  if(!cloudConfigured()){setError("MechanicAI-serveren er ikke konfigureret.");return;}
  setLoading(true);
  try{
   const response=await fetch(CLOUD_URL+"/manual-upload",{method:"POST",headers:{"Content-Type":"application/pdf","X-MechanicAI-Pilot-Key":key},body:file});
   const data=await response.json();
   if(!response.ok)throw new Error(data.error||"PDF kunne ikke læses.");
   setResult(data);
  }catch(e){setError(e.message||"Netværksfejl ved upload.");}
  finally{setLoading(false);}
 }
 return <section aria-label="PDF-manual" style={{marginTop:14,padding:12,border:"1px solid #64748b",borderRadius:12}}>
  <h3>📄 Undersøg en PDF-manual</h3>
  <p>Vælg en PDF, som du har ret til at bruge. Den sendes til MechanicAI-serveren til midlertidig tekstudtrækning. Filen gemmes ikke permanent. Ingen AI aktiveres.</p>
  <form onSubmit={upload}>
   <label style={{display:"block",marginBottom:8}}>Vælg PDF fra Filer
    <input type="file" accept=".pdf,application/pdf" onChange={e=>{setFile(e.target.files?.[0]||null);setResult(null);setError("");}} style={{display:"block",maxWidth:"100%"}}/>
   </label>
   <label style={{display:"block",marginBottom:8}}>PoC-adgangskode
    <input type="password" autoComplete="off" value={key} onChange={e=>setKey(e.target.value)} style={{display:"block",maxWidth:"100%"}}/>
   </label>
   <button type="submit" disabled={loading||!file}>{loading?"Læser PDF…":"Undersøg PDF"}</button>
  </form>
  {error&&<p role="alert">{error}</p>}
  {result&&<div role="status">
   <p><strong>PDF modtaget:</strong> {result.page_count} sider. Tekst er udtrukket, men indhold og model er ikke verificeret.</p>
   <p style={{fontSize:12}}>Dokumentfingeraftryk: <code style={{overflowWrap:"anywhere"}}>{result.sha256}</code></p>
   <ol>{(result.pages||[]).map(page=><li key={page.page} style={{marginBottom:10}}>
    <strong>Side {page.page}</strong> – {page.text_available?"Tekst fundet":"Ingen udtrækkelig tekst"}
    {page.preview&&<p style={{whiteSpace:"pre-wrap",overflowWrap:"anywhere",fontSize:13}}>{page.preview}</p>}
   </li>)}</ol>
   {result.page_count>20&&<p>Viser kun de første 20 sider.</p>}
   <p><strong>Vigtigt:</strong> Dette er ikke en verificeret reparationsvejledning. Brug ikke udtrækket alene til momentværdier eller sikkerhedskritiske reparationer.</p>
  </div>}
 </section>;
}

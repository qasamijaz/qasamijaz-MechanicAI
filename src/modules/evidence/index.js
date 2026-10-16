/** Explicit evidence adapter: bundled metadata is not verified technical evidence. */
export function summarizeEvidence(matches=[], context={}){
 const safe=Array.isArray(matches)?matches:[];
 const candidates=safe.filter(x=>x&&typeof x==="object").slice(0,10).map(x=>({
  title:String(x.value||x.title||"Ukendt kilde").slice(0,200),
  source:String(x.source_filename||x.source||"Ukendt").slice(0,200),
  page:Number.isInteger(x.page)?x.page:null,
  verified: x.page_verified===true && x.procedure_verified===true && x.fitment_verified===true
 }));
 return {candidates,verified:candidates.filter(x=>x.verified),notice:candidates.length
  ? "Dokumentfund er kandidater, ikke godkendte arbejdsinstruktioner. Kontroller originalkilden."
  : "Ingen verificerede dokumentfund tilgængelige i webappen endnu.",context};
}

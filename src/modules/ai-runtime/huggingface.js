/** Optional Hugging Face local LLM. No token, paid inference, or remote prompt endpoint. */
export const MODEL_ID="onnx-community/Qwen2.5-0.5B-Instruct";
let generatorPromise;
export function supported(){return typeof navigator!=="undefined" && !!navigator.gpu;}
export async function loadLocalModel(){
 if(!supported())throw new Error("WebGPU er ikke tilgængelig i denne browser. Brug en kompatibel browser eller den regelbaserede samtale.");
 if(!generatorPromise)generatorPromise=import("@huggingface/transformers").then(({pipeline})=>pipeline("text-generation",MODEL_ID,{device:"webgpu",dtype:"q4"})).catch(error=>{generatorPromise=null;throw error;});
 return generatorPromise;
}
export function buildMessages(history, evidence=[]){
 const sources=evidence.filter(x=>x?.verified===true).map(x=>String(x.title).slice(0,200));
 const system="Du er MechanicAI, en hjælpsom dansk assistent til praktiske opgaver. Stil relevante opfølgende spørgsmål og giv trinvis, forståelig hjælp. Skeln mellem generel viden og verificeret dokumentation. Opfind aldrig manualer, reservedelsplaceringer, momentværdier, mål eller sikkerhedsgodkendelser. Hvis en handling kan være farlig eller kræve autorisation, forklar begrænsningen og bed om dokumentation eller faglig hjælp. Tilgængelige verificerede kilder: "+(sources.join("; ")||"ingen")+".";
 return [{role:"system",content:system},...history.slice(-10).map(x=>({role:x.role==="assistant"?"assistant":"user",content:String(x.text||"").slice(0,1000)}))];
}
export async function generateLocalReply(history,evidence=[]){
 const generator=await loadLocalModel();
 const output=await generator(buildMessages(history,evidence),{max_new_tokens:180,do_sample:false,return_full_text:false});
 const result=output?.[0]?.generated_text;
 const text=typeof result==="string"?result:Array.isArray(result)?result.filter(x=>x.role==="assistant").at(-1)?.content:"";
 if(!text || typeof text!=="string")throw new Error("Modellen returnerede intet brugbart svar.");
 return text.trim();
}

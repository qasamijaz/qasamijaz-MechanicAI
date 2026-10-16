import test from "node:test";
import assert from "node:assert/strict";
import {MODEL_ID,buildMessages} from "../src/modules/ai-runtime/huggingface.js";
test("uses a concrete Hugging Face ONNX model",()=>assert.match(MODEL_ID,/^onnx-community\//));
test("does not claim unverified sources",()=>{const m=buildMessages([{role:"user",text:"Hvor er bundproppen?"}]);assert.match(m[0].content,/ingen/);assert.match(m[0].content,/Opfind aldrig/);});
test("caps conversation context",()=>{const history=Array.from({length:20},(_,i)=>({role:i%2?"assistant":"user",text:"x"}));assert.equal(buildMessages(history).length,11);});
test("only verified source titles enter prompt",()=>{const m=buildMessages([],[{verified:false,title:"Fake manual"},{verified:true,title:"Verified manual"}]);assert.match(m[0].content,/Verified manual/);assert.doesNotMatch(m[0].content,/Fake manual/);});

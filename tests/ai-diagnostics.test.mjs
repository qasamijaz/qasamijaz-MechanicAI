import test from "node:test";
import assert from "node:assert/strict";
import {KEY,readDiagnostic,recordDiagnostic,interpretDiagnostic,clearDiagnostic} from "../src/modules/ai-runtime/diagnostics.js";
function storage(){const data=new Map();return {getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};}
test("records model loading without storing prompts",()=>{const s=storage();recordDiagnostic(s,"loading",{model:"test"} ,1000);assert.equal(readDiagnostic(s).phase,"loading");assert.doesNotMatch(s.getItem(KEY),/prompt|conversation|history/);});
test("interrupted loading is reported on next load",()=>{const s=storage();recordDiagnostic(s,"loading",{},1000);assert.equal(interpretDiagnostic(readDiagnostic(s),2000).kind,"interrupted");});
test("interrupted generation is distinguishable",()=>{const s=storage();recordDiagnostic(s,"generating",{},1000);assert.match(interpretDiagnostic(readDiagnostic(s),2000).message,/svargenerering/);});
test("stale entries do not assert a crash",()=>{const s=storage();recordDiagnostic(s,"loading",{},1000);assert.equal(interpretDiagnostic(readDiagnostic(s),1000+16*60*1000).kind,"stale");});
test("error details are capped",()=>{const s=storage();recordDiagnostic(s,"error",{error:"x".repeat(500)});assert.equal(readDiagnostic(s).error.length,300);});
test("clear removes the diagnostic",()=>{const s=storage();recordDiagnostic(s,"complete");clearDiagnostic(s);assert.equal(readDiagnostic(s),null);});
test("storage unavailable fails safely",()=>{assert.equal(readDiagnostic(null),null);assert.equal(recordDiagnostic(null,"loading").phase,"loading");});

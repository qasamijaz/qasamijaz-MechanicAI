import test from "node:test";
import assert from "node:assert/strict";
import { planTask } from "../src/modules/task-engine/index.js";
test("routes motorcycle oil change",()=>{const p=planTask("Skift olie på min Suzuki motorcykel");assert.equal(p.domain,"vehicle");assert.equal(p.verifiedInstructions,false);});
test("routes lamps with electrical safety gate",()=>{const p=planTask("Sæt tre lamper op i stuen");assert.equal(p.domain,"electrical");assert.equal(p.safety,"regulated-electrical");});
test("routes fences",()=>assert.equal(planTask("Design et hegn langs indkørslen").domain,"construction"));
test("routes house designs",()=>assert.equal(planTask("Tegn et hus med fire værelser").domain,"architecture"));
test("handles unknown requests without inventing procedure",()=>{const p=planTask("Kan du hjælpe?");assert.equal(p.domain,"general");assert.equal(p.verifiedInstructions,false);});
test("empty input requests clarification",()=>assert.equal(planTask("  ").needsClarification,true));

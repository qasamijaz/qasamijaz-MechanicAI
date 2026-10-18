import test from "node:test";
import assert from "node:assert/strict";
import {pilotEnabled,generatePilotReply} from "../src/modules/ai-runtime/pilot.js";
test("pilot disabled by default in Node", async ()=>{
  assert.equal(pilotEnabled(),false);
  await assert.rejects(()=>generatePilotReply([{role:"user",text:"Hej"}]),/ikke aktiveret/);
});

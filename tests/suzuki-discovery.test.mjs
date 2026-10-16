import test from "node:test";
import assert from "node:assert/strict";
import {discoverSuzukiManual} from "../src/modules/evidence/suzukiDiscovery.js";

test("2019 GSX-S1000F returns manufacturer indexes, never procedure approval",()=>{
 const r=discoverSuzukiManual("Suzuki GSX-S1000F 2019 olieskift");
 assert.equal(r.model,"GSX-S1000F");assert.equal(r.yearMatch,true);
 assert.ok(r.sources.length>=2);assert.equal(r.verifiedProcedure,false);
});
test("GSX-R1000 never gets GSX-S1000F sources",()=>{
 const r=discoverSuzukiManual("Suzuki GSX-R1000 2019 olieskift");
 assert.equal(r.sources.length,0);assert.equal(r.verifiedProcedure,false);
});
test("missing or different year does not offer 2019 manual as matched",()=>{
 for(const input of ["Suzuki GSX-S1000F olie","Suzuki GSX-S1000F 2020 olie"]){
  const r=discoverSuzukiManual(input);assert.equal(r.yearMatch,false);assert.equal(r.sources.length,0);
 }
});
test("unrelated bikes do not trigger Suzuki discovery",()=>assert.equal(discoverSuzukiManual("Honda CBR 1000 2019"),null));

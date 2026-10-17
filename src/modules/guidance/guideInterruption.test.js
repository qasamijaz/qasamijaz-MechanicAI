import {test} from "node:test";
import assert from "node:assert/strict";
import {createGuide} from "./guideEngine.js";
import {guideInterruption} from "./guideInterruption.js";
const guide=createGuide({task:"skifte olie",maker:"Suzuki",model:"GSX",year:2021});
test("technical question returns safe answer and does not mutate step",()=>{
 const before=guide.index;
 assert.match(guideInterruption("Hvilket moment skal bolten spændes med?",guide),/verificeret kilde/);
 assert.equal(guide.index,before);
});
test("photo question does not fabricate visual analysis",()=>{
 assert.match(guideInterruption("Ser det rigtigt ud?",guide),/foto/);
});
test("non-question falls through to normal conversation",()=>{
 assert.equal(guideInterruption("BMW 320 1988",guide),null);
});
test("no guide means no interruption",()=>{
 assert.equal(guideInterruption("Hvilket moment?",null),null);
});

import {test} from "node:test";
import assert from "node:assert/strict";
import {createGuide,moveGuide,guidePrompt} from "./guideEngine.js";
test("guide starts at first step and does not advance beyond bounds",()=>{
 const g=createGuide({task:"skifte motor",maker:"BMW",model:"320 1,6",year:1988});
 assert.equal(g.index,0);
 assert.match(guidePrompt(g),/Trin 1 af 4/);
 assert.equal(moveGuide(g,-1).index,0);
 assert.equal(moveGuide(moveGuide(moveGuide(moveGuide(g,1),1),1),1).index,3);
 assert.equal(moveGuide(moveGuide(moveGuide(moveGuide(g,1),1),1),1).index,3);
 assert.match(guidePrompt(moveGuide(g,1)),/dokumentation/);
});

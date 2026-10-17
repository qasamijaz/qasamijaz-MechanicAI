import {test} from "node:test";
import assert from "node:assert/strict";
import {emptyContext,updateContext,replyFor} from "./sessionContext.js";

test("vehicle details in second message retain original task",()=>{
 let ctx=updateContext(emptyContext(),"Jeg skal skifte motor på min BMW");
 assert.equal(ctx.task,"skifte motor");
 ctx=updateContext(ctx,"BMW 320 1,6 1988");
 assert.equal(ctx.maker,"BMW");
 assert.equal(ctx.model,"320 1,6");
 assert.equal(ctx.year,1988);
 assert.match(replyFor(ctx),/skifte motor/);
 assert.match(replyFor(ctx),/1988/);
});
test("new session has no inherited vehicle or task",()=>{
 const first=updateContext(emptyContext(),"Skifte olie på min Suzuki GSX 1000F fra 2021");
 assert.equal(first.year,2021);
 const second=emptyContext();
 assert.equal(second.year,null);
 assert.equal(second.task,null);
});

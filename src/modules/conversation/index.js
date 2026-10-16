import {planTask} from "../task-engine/index.js";
/** Deterministic dialogue fallback. Does not pretend to be an LLM. */
export function startConversation(input){
 const plan=planTask(input);
 return {plan,answers:[],turns:[{role:"user",text:input},{role:"assistant",text:plan.question}],stage:"clarify"};
}
export function replyConversation(state,input){
 const text=String(input||"").trim().slice(0,1000);
 if(!text)return state;
 const answers=[...state.answers,text];
 const stage=answers.length>=2?"review":"clarify";
 const nextQuestion=state.plan.domain==="vehicle"
   ? "Har du en manual eller et dokument for præcis model og årgang? Uden den kan jeg kun give en generel oversigt."
   : state.plan.domain==="electrical"
   ? "Handler det kun om placering, eller skal der også udføres elektrisk installation? Installation skal vurderes efter gældende regler."
   : state.plan.domain==="architecture"
   ? "Hvilke rum er vigtigst, og hvilke omtrentlige mål skal vi bruge?"
   : state.plan.domain==="construction"
   ? "Hvilke mål, materialer og placering forestiller du dig? Konstruktionen skal verificeres før udførelse."
   : "Hvilken del af opgaven vil du uddybe?";
 const response=stage==="review"
  ? "Jeg har registreret dine oplysninger. Du kan nu se en foreløbig skitse eller plan. Jeg har ikke verificeret faglige kilder eller arbejdsinstruktioner."
  : nextQuestion;
 return {...state,answers,stage,turns:[...state.turns,{role:"user",text},{role:"assistant",text:response}]};
}

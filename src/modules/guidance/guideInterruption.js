// Handle interruptions without losing the user's current guided step.
// This is a limited offline PoC, not an LLM or a verified mechanical knowledge base.
export function guideInterruption(input,guide){
 if(!guide)return null;
 const s=input.trim().toLocaleLowerCase("da-DK");
 if(/^(hvilket|hvad|hvordan|hvorfor|kan jeg|skal jeg|må jeg|er det|hvor|hvor meget|hvilken|ser det)/.test(s)||s.endsWith("?")){
  if(/moment|nm\b|temperatur|grader|liter|mængde|olie|skrue|bolt|placering|udseende|ser det/.test(s)){
   return "Det kan jeg ikke fastslå sikkert uden en verificeret kilde eller en vurdering af din konkrete situation. Vedhæft gerne en relevant manual eller et foto. Jeg bliver på det aktuelle trin, mens vi afklarer spørgsmålet.";
  }
  return "Godt spørgsmål. Jeg har endnu ikke dokumentation nok til et sikkert, konkret svar. Vi kan undersøge det med en manual eller et billede, og jeg holder fast i det aktuelle trin.";
 }
 if(/^(jeg har|jeg kan ikke|det virker ikke|jeg mangler|den sidder|den er|det ser)/.test(s)){
  return "Tak, det er noteret. Jeg ændrer ikke trinnet automatisk. Beskriv gerne problemet nærmere, eller vedhæft et billede, så vi kan afklare det, før du fortsætter.";
 }
 return null;
}

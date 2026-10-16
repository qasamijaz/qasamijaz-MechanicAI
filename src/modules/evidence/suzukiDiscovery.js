/** Manufacturer source registry for a narrow, auditable PoC; no unverified torque values. */
const SOURCES=[
 {title:"Suzuki Nederland – GSX-S1000(F) 2019 instruktionsbog",url:"https://www.suzuki.nl/motoren/service/gebruikershandleidingen-motoren/",language:"NL",type:"Officiel manualoversigt"},
 {title:"Suzuki Japan – GSX-S1000F ABS 2019",url:"https://www1.suzuki.co.jp/motor/support/owners_manual/dl/index.html?bikedisp=6&modelname=GSX-S1000+ABS+%2F+GSX-S1000F+ABS",language:"JA",type:"Officiel manualoversigt"},
 {title:"Suzuki Deutschland – Fahrerhandbücher 2019",url:"https://motorrad.suzuki.de/informationen/dokumente/fahrerhandbuecher/2019",language:"DE",type:"Officiel manualoversigt"}
];
export function discoverSuzukiManual(input){
 const value=String(input||"").toLowerCase();
 if(!/\\b(?:suzuki|gsx)\\b/.test(value)&&!value.includes("gsx-"))return null;
 if(!/gsx[\\s-]*[sr]?[\\s-]*1000/.test(value))return null;
 const year=(value.match(/\\b(20(?:1[6-9]|20))\\b/)||[])[1]||null;
 const exact=/gsx[\\s-]*s[\\s-]*1000[\\s-]*f\\b/.test(value);
 const incompatible=/gsx[\\s-]*r[\\s-]*1000/.test(value);
 if(incompatible)return {make:"Suzuki",model:"GSX-R1000",year,exactModel:false,yearMatch:false,sources:[],verifiedProcedure:false,notice:"GSX-R1000 er en anden model. GSX-S1000F-manualen må ikke bruges."};
 const yearMatch=year==="2019";
 return {make:"Suzuki",model:exact?"GSX-S1000F":"GSX-S1000 (F-variant ubekræftet)",year,exactModel:exact,yearMatch,sources:yearMatch?SOURCES:[],verifiedProcedure:false,notice:yearMatch?"Officielle Suzuki-manualoversigter for 2019 fundet. PDF-indhold, præcis variant og arbejdsprocedure er ikke verificeret.":"Angiv årgang 2019 for at få relevante manualkilder; ingen procedure er verificeret."};
}

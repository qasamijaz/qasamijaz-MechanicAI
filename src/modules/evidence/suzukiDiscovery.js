/** First verified-source discovery fixture. Links to official manufacturer indexes; does not claim PDF contents were checked. */
const SOURCES=[
 {title:"Suzuki Nederland – GSX-S1000(F) 2019 instruktionsbog",url:"https://www.suzuki.nl/motoren/service/gebruikershandleidingen-motoren/",language:"NL",type:"Producentens manualoversigt"},
 {title:"Suzuki Japan – GSX-S1000F ABS 2019",url:"https://www1.suzuki.co.jp/motor/support/owners_manual/dl/index.html?bikedisp=6&modelname=GSX-S1000+ABS+%2F+GSX-S1000F+ABS",language:"JA",type:"Producentens manualoversigt"},
 {title:"Suzuki Österreich – GSX-S1000A FA L9",url:"https://www.suzuki.at/zubehoer-service/dokumente/motorrad/fahrerhandbuecher",language:"DE",type:"Producentens manualoversigt"}
];
export function discoverSuzukiManual(input){
 const value=String(input||"").toLowerCase();
 if(!/suzuki|gsx/.test(value)||!/gsx[\\s-]*s?1000|gsx[\\s-]*1000/.test(value))return null;
 const year=(value.match(/\\b(20(?:1[6-9]|20))\\b/)||[])[1]||null;
 const exact=/gsx[\\s-]*s1000\\s*f|gsx[\\s-]*s\\s*1000\\s*f/.test(value);
 return {make:"Suzuki",model:exact?"GSX-S1000F":"GSX-1000 (variant skal bekræftes)",year,exactModel:exact,yearMatch:year==="2019",sources:SOURCES,verifiedProcedure:false,notice:"Producentens officielle manualoversigter er fundet. Manualens indhold, modelvariant og olieprocedure er endnu ikke kontrolleret."};
}

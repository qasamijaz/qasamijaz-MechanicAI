// Curated reference index, not a repair manual or validated VIN fitment.
export const references = [
 {id:"revzilla-oil",title:"2019 GSX-S1000F — Oil Pan/Oil Pump",publisher:"RevZilla OEM",url:"https://www.revzilla.com/oem/suzuki/2019-suzuki-gsx-s1000f/oil-panoil-pump?submodel=gsx-s1000fzal9",year:2019,model:"GSX-S1000F",topics:["drain","sump"],kind:"OEM reservedelsdiagram",confidence:"Variant skal bekræftes"},
 {id:"suzuki-manuals",title:"Suzuki ejerhåndbøger",publisher:"Suzuki Nederland",url:"https://www.suzuki.nl/motoren/service/gebruikershandleidingen-motoren/",year:null,model:"Suzuki",topics:["drain","sump","filter","head"],kind:"Producentens manualoversigt",confidence:"Specifik håndbog endnu ikke kontrolleret"},
 {id:"parts-suzuki-oil",title:"GSX-S1000FYA L9 — Carter inférieur / pompe à huile",publisher:"Pièces Suzuki",url:"https://www.pieces-suzuki.ca/suzuki-moto/1000-MOTO/GSX-S/2019/GSX-S1000FYA-L9-E21-/MOTEUR-TRANSMISSION/CARTER-INFERIEUR--POMPE-A-HUILE/2021000000/2021018533/M/10531",year:2019,model:"GSX-S1000FYA L9 E21",topics:["drain","sump"],kind:"Reservedelsdiagram",confidence:"Markedsvariant skal bekræftes"}
];
export function referencesFor(partId){return references.filter(r=>r.topics.includes(partId));}

export function normalizeText(s:string){return s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').toLowerCase();}
export function inScope(query:string){return /\b(xet nghiem|phuong phap|do chum|lap lai|tai lap|bias|clia|cv|sd|te|tea|lod|loq|tham chieu|phe duyet|ho so|nguon|khong dam bao|quy trinh|don vi|ft4|thuoc thu)\b/i.test(normalizeText(query));}
export function rankDocuments<T extends {title:string}>(docs:T[],vectors:number[][],query:string,q:number[]){
 const stop=new Set(['cua','cho','can','bao','nhieu','nhu','the','nao','duoc','voi','trong','mot','cac','khi','nhung','gi','thi','tai','sao']);
 const words=[...new Set(normalizeText(query).split(/\W+/).filter(w=>w.length>=2&&!stop.has(w)))];
 return docs.map((d,i)=>{const similarity=vectors[i].reduce((s,v,j)=>s+v*q[j],0),title=new Set(normalizeText(d.title).split(/\W+/));const lexical=words.filter(w=>title.has(w)).length/Math.max(1,words.length);return {...d,similarity,score:.7*similarity+.3*lexical};}).sort((a,b)=>b.score-a.score);
}

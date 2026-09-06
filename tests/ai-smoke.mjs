import fs from 'node:fs';
import {pipeline,env} from '@huggingface/transformers';
import {knowledge,sourceNotes} from '../.test-build/catalog.mjs';
import {rankDocuments,inScope} from '../.test-build/retrieval.mjs';
env.cacheDir='.test-build/ai-cache';env.allowLocalModels=false;
const corpus=[...knowledge,...sourceNotes.map((s,i)=>({id:'source-'+i,title:s.title,text:s.body}))];
const extractor=await pipeline('feature-extraction','Xenova/paraphrase-multilingual-MiniLM-L12-v2',{revision:'2c4055b12046f11709e9df2c122e59ffbdc2f900',dtype:'q8'});
const text=corpus.map(k=>k.title+'. '+k.text);
const embeddings=(await extractor(text,{pooling:'mean',normalize:true})).tolist();
const queries=[['Cần bao nhiêu ngày để kiểm tra độ chụm?','qt-precision'],['Tính sai số toàn bộ từ bias và CV','qt-te'],['Thủ tục lập kế hoạch và phê duyệt hồ sơ','qt-steps']];
const results=[];
for(const [query,expected] of queries){const q=(await extractor(query,{pooling:'mean',normalize:true})).tolist()[0];const ranked=rankDocuments(corpus,embeddings,query,q);const pass=ranked.slice(0,3).some(x=>x.id===expected);results.push({query,expected,top:ranked.slice(0,3).map(r=>({id:r.id,score:r.score})),pass});}
results.push({query:'Thời tiết hôm nay?',pass:!inScope('Thời tiết hôm nay?')});
results.push({query:'Tesla price?',pass:!inScope('Tesla price?')});
fs.mkdirSync('test-results',{recursive:true});fs.writeFileSync('test-results/ai-smoke.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));if(results.some(r=>!r.pass))process.exitCode=1;await extractor.dispose();

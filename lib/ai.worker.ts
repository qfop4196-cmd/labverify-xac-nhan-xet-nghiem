import {env,pipeline} from '@huggingface/transformers';
import {knowledge,sourceNotes} from './catalog';
import {inScope,rankDocuments} from './retrieval';
env.allowLocalModels=false;
if(env.backends.onnx.wasm)env.backends.onnx.wasm.numThreads=1;
const corpus=[...knowledge.map(k=>({...k,source:'XN-QTQL-16 · bản tóm lược đã đối chiếu'})),...sourceNotes.map((s,i)=>({id:'source-'+i,title:s.title,text:s.body,source:'Ghi chú đối chiếu nguồn của LabVerify'}))];
let extractor:any;let vectors:number[][];
self.onmessage=async(event:MessageEvent)=>{const query=event.data?.query;try{
 if(typeof query!=='string'||query.length<3||query.length>500)throw new Error('Câu hỏi cần từ 3 đến 500 ký tự.');
 if(!inScope(query))throw new Error('Câu hỏi ngoài phạm vi kiểm tra xác nhận xét nghiệm.');
 if(!extractor)extractor=await pipeline('feature-extraction','Xenova/paraphrase-multilingual-MiniLM-L12-v2',{revision:'2c4055b12046f11709e9df2c122e59ffbdc2f900',dtype:'q8',device:'wasm',progress_callback:(p:any)=>self.postMessage({type:'progress',message:p.status==='progress'?`Đang tải mô hình: ${Math.round(p.progress||0)}%`:'Đang chuẩn bị mô hình trên thiết bị…'})});
 if(!vectors){const all=await extractor(corpus.map(d=>d.title+'. '+d.text),{pooling:'mean',normalize:true});vectors=all.tolist();}
 const embed=await extractor(query,{pooling:'mean',normalize:true});const q=embed.tolist()[0];
 const ranked=rankDocuments(corpus,vectors,query,q);
 self.postMessage({type:'result',items:ranked.filter(d=>d.score>=.25).slice(0,3)});
}catch(e){self.postMessage({type:'error',message:(e as Error).message});}};


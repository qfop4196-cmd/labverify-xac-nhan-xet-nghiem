import { benchmarks, profiles } from './catalog';
export type Study='precision'|'qualitative'|'reference'|'comparison'|'linearity'|'lod'|'loq';
export type Level={name:string;target:number;concentration:number;repeatLimit:number;withinLimit:number;basis:'CV'|'SD';data:string;uReference:number|null;biasCorrected:boolean};
export type Draft={title:string;lab:string;instrument:string;manufacturer:string;automation:'automatic'|'semi'|'manual';analyte:string;assay:string;unit:string;matrix:string;lot:string;profileId:string;source:string;sourceVersion:string;sourceUrl:string;sourceConfirmed:boolean;conditions:boolean;anonymous:boolean;homogeneous:boolean;study:Study;teFactor:number;z:number;teaMode:'clia'|'custom';customTea:number|null;levels:Level[];note:string;extras:{data:string;tp:number;fn:number;fp:number;tn:number;sensitivity:number;specificity:number;lower:number;upper:number;tolerance:number;blank:number;concentration:number;lodClaim:number;loqCV:number;}};
export type Criterion={name:string;value:number|null;limit:number|null;unit:string;pass:boolean|null;rule:string;source:string};
export type LevelResult={name:string;n:number;days:number;mean:number;sd:number;repeatSD:number;betweenSD:number;withinSD:number;repeatCV:number;withinCV:number;bias:number;biasPercent:number;te:number;tea:number|null;sigma:number|null;u:number|null;dayMeans:number[];values:number[];criteria:Criterion[];warnings:string[]};
export type Evaluation={version:string;status:'pass'|'fail'|'insufficient';label:string;summary:string;blockers:string[];warnings:string[];levels:LevelResult[];criteria:Criterion[];metrics:Record<string,number|null>;scope:string};
export const VERSION='LV-1.0.0';
export const mean=(x:number[])=>x.reduce((a,b)=>a+b,0)/x.length;
export function sd(x:number[]){const m=mean(x);return Math.sqrt(x.reduce((s,v)=>s+(v-m)**2,0)/(x.length-1));}
export function parseRows(text:string):number[][]{
 if(typeof text!=='string'||text.length>100000)throw new Error('Dữ liệu trống hoặc vượt giới hạn 100.000 ký tự.');
 const lines=text.trim().split(/\r?\n/).filter(s=>s.trim());
 if(!text.trim())throw new Error('Chưa nhập dữ liệu đo.');
 if(lines.length>366)throw new Error('Tối đa 366 dòng dữ liệu.');
 return lines.map((line,i)=>{
  const pieces=line.trim().split(/[;\t ]+/);
  if(pieces.length>100)throw new Error(`Dòng ${i+1}: tối đa 100 giá trị.`);
  return pieces.map(s=>{if(!/^[+-]?(?:\d+(?:[.,]\d+)?|[.,]\d+)(?:[eE][+-]?\d+)?$/.test(s))throw new Error(`Dòng ${i+1}: “${s.slice(0,25)}” không phải số hợp lệ. Tách cột bằng dấu chấm phẩy hoặc tab.`);const v=Number(s.replace(',','.'));if(!Number.isFinite(v)||Math.abs(v)>1e12)throw new Error(`Dòng ${i+1}: số ngoài phạm vi.`);return v;});
 });
}
export function precision(rows:number[][]){
 if(rows.length<2||rows.some(r=>r.length<2)||rows.some(r=>r.length!==rows[0].length))throw new Error('ANOVA cần ít nhất 2 ngày, mỗi ngày cùng số lần lặp (tối thiểu 2).');
 const values=rows.flat(),m=mean(values),d=rows.length,r=rows[0].length,dayMeans=rows.map(mean);
 const msw=rows.reduce((s,row,i)=>s+row.reduce((a,x)=>a+(x-dayMeans[i])**2,0),0)/(d*(r-1));
 const msb=r*dayMeans.reduce((s,x)=>s+(x-m)**2,0)/(d-1);
 const vb=Math.max(0,(msb-msw)/r),sr=Math.sqrt(msw),sw=Math.sqrt(msw+vb);
 return {mean:m,sd:sd(values),repeatSD:sr,betweenSD:Math.sqrt(vb),withinSD:sw,repeatCV:100*sr/Math.abs(m),withinCV:100*sw/Math.abs(m),dayMeans,values,negativeVariance:msb<msw};
}
export function allowable(analyte:string,unit:string,target:number){
 const b=benchmarks.find(b=>b.analyte.toLowerCase()===analyte.trim().toLowerCase());if(!b)return null;
 let t=target;
 if(analyte.toUpperCase()==='FT4'&&unit==='pmol/L')t=target/12.87;
 else if(analyte.toLowerCase()==='glucose'&&unit==='mmol/L')t=target*18.0182;
 else if(b.unit!==unit)return null;
 return t>0?Math.max(b.percent,b.absolute/t*100):null;
}
function numeric(v:unknown,name:string,min=0,max=1e12){if(typeof v!=='number'||!Number.isFinite(v)||v<min||v>max)throw new Error(`${name}: giá trị phải từ ${min} đến ${max}.`);return v;}
export function validateDraft(raw:unknown):Draft{
 if(!raw||typeof raw!=='object')throw new Error('Hồ sơ không hợp lệ.');const d=raw as Draft;
 for(const key of ['title','lab','instrument','manufacturer','analyte','assay','unit','matrix','lot','profileId','source','sourceVersion','sourceUrl','note'] as const){if(typeof d[key]!=='string'||d[key].length>(key==='note'?5000:500))throw new Error(`Trường ${key} không hợp lệ.`);}
 if(!['automatic','semi','manual'].includes(d.automation)||!['precision','qualitative','reference','comparison','linearity','lod','loq'].includes(d.study))throw new Error('Loại máy hoặc phép đánh giá không hợp lệ.');
 if(!['clia','custom'].includes(d.teaMode))throw new Error('Nguồn TEa không hợp lệ.');
 if(![.5,1].includes(d.teFactor)||![1.65,2].includes(d.z))throw new Error('Hệ số TE không hợp lệ.');
 for(const key of ['sourceConfirmed','conditions','anonymous','homogeneous'] as const)if(typeof d[key]!=='boolean')throw new Error('Trường xác nhận không hợp lệ.');
 if(d.customTea!==null)numeric(d.customTea,'TEa',.0001,1000);
 if(d.sourceUrl&&!/^https?:\/\/[^\s]+$/.test(d.sourceUrl))throw new Error('Liên kết nguồn phải bắt đầu bằng https:// hoặc http://.');
 if(!Array.isArray(d.levels)||d.levels.length<1||d.levels.length>6)throw new Error('Cần từ 1 đến 6 mức nồng độ.');
 for(const l of d.levels){if(typeof l.name!=='string'||l.name.length>80||typeof l.data!=='string'||l.data.length>100000||!['CV','SD'].includes(l.basis)||typeof l.biasCorrected!=='boolean')throw new Error('Mức nồng độ không hợp lệ.');for(const key of ['target','concentration','repeatLimit','withinLimit'] as const)numeric(l[key],key,0);if(l.uReference!==null)numeric(l.uReference,'u đích');}
 if(!d.extras||typeof d.extras.data!=='string'||d.extras.data.length>100000)throw new Error('Dữ liệu bổ sung không hợp lệ.');
 for(const [key,val] of Object.entries(d.extras)){if(key!=='data')numeric(val,key);}
 const required=['tp','fn','fp','tn','sensitivity','specificity','lower','upper','tolerance','blank','concentration','lodClaim','loqCV'];for(const key of required)numeric((d.extras as any)[key],key);
 for(const key of ['tp','fn','fp','tn'] as const)if(!Number.isInteger(d.extras[key]))throw new Error('Số mẫu trong bảng 2×2 phải là số nguyên.');
 if(d.extras.sensitivity>100||d.extras.specificity>100)throw new Error('Độ nhạy và độ đặc hiệu không vượt quá 100%.');
 return d;
}
const test=(name:string,value:number|null,limit:number|null,unit:string,rule:string,source:string,operator:'lt'|'le'|'ge'='le'):Criterion=>({name,value,limit,unit,rule,source,pass:value===null||limit===null?null:operator==='lt'?value<limit:operator==='ge'?value>=limit:value<=limit});
export function evaluate(input:Draft):Evaluation{
 const d=validateDraft(input),blockers:string[]=[],warnings:string[]=[],levels:LevelResult[]=[],criteria:Criterion[]=[],metrics:Record<string,number|null>={};
 if(!d.lab.trim()||!d.instrument.trim()||!d.analyte.trim()||!d.assay.trim()||!d.lot.trim())blockers.push('Bổ sung đơn vị, máy, xét nghiệm, bộ thuốc thử và lô.');
 if(!d.anonymous)blockers.push('Xác nhận chỉ nhập dữ liệu giả lập hoặc đã ẩn danh.');
 if(!d.source.trim()||!d.sourceVersion.trim()||!d.sourceConfirmed)blockers.push('Cần xác nhận nguồn, phiên bản và phạm vi áp dụng của tiêu chí.');
 if(!d.conditions)blockers.push('Chưa xác nhận các điều kiện cơ bản theo BM07.');
 const p=profiles.find(p=>p.id===d.profileId);
 if(p&&(d.instrument!==p.model||d.analyte!==p.analyte||d.assay!==p.assay||d.unit!==p.unit||d.automation!=='automatic'))blockers.push('Thông tin máy, bộ thuốc thử, đơn vị hoặc loại máy không khớp hồ sơ tham chiếu. Chọn nguồn tùy chỉnh phù hợp.');
 if(d.profileId!=='custom'&&!p)blockers.push('Không tìm thấy hồ sơ tham chiếu.');
 if(d.study==='precision'){
  if(d.levels.length<2)blockers.push('Cần ít nhất hai mức nồng độ cho bộ đánh giá độ chụm.');
  if(!d.homogeneous)blockers.push('Chưa xác nhận cùng vật liệu ổn định tại mỗi mức qua các ngày.');
  for(const [idx,l] of d.levels.entries()){
   try{
    const rows=parseRows(l.data);if(rows.flat().some(x=>x<=0))throw new Error('Nhánh CV/Bias yêu cầu các kết quả dương.');
    if(l.target<=0||l.concentration<=0||l.repeatLimit<=0||l.withinLimit<=0)throw new Error('Nhập giá trị đích QC, nồng độ tham chiếu và các giới hạn lớn hơn 0.');
    const a=precision(rows),w:string[]=[];
    if(rows.length<20)blockers.push(`${l.name}: ${rows.length}/20 ngày theo nhánh dài ngày XN-QTQL-16.`);
    if(Math.abs(a.mean-l.concentration)/l.concentration>.1)blockers.push(`${l.name}: trung bình lệch trên 10% nồng độ tham chiếu. Cần chọn lại công bố phù hợp (quy ước ghép nguồn của ứng dụng).`);
    if(p){const point=p.points[idx];if(!point||l.concentration!==point.concentration||l.repeatLimit!==(l.basis==='CV'?point.repeatCV:point.repeatSD)||l.withinLimit!==(l.basis==='CV'?point.withinCV:point.withinSD))blockers.push(`${l.name}: giới hạn đã khác hồ sơ gốc. Chọn nguồn tùy chỉnh để lưu rõ thay đổi.`);}
    if(a.negativeVariance)w.push('Phương sai giữa ngày ước lượng âm được đặt bằng 0.');
    if(a.values.every(v=>v===a.values[0])||a.withinSD<Number.EPSILON*Math.abs(a.mean)*10)blockers.push(`${l.name}: dữ liệu không có biến thiên; kiểm tra độ phân giải và việc sao chép.`);
    const bias=a.mean-l.target,biasPercent=100*bias/l.target,te=Math.abs(biasPercent)+d.z*a.withinCV,tea=d.teaMode==='clia'?allowable(d.analyte,d.unit,l.target):d.customTea;
    if(tea===null)blockers.push(`${l.name}: chưa có TEa đúng chất phân tích và đơn vị. Nhập tiêu chí có nguồn.`);
    const lc=[test('Độ lặp lại',l.basis==='CV'?a.repeatCV:a.repeatSD,l.repeatLimit,l.basis==='CV'?'%':d.unit,'Quan sát < công bố',d.source,'lt'),test('Độ chụm trong PXN',l.basis==='CV'?a.withinCV:a.withinSD,l.withinLimit,l.basis==='CV'?'%':d.unit,'Quan sát < công bố',d.source,'lt'),test('Sai số toàn bộ TE',te,tea===null?null:tea*d.teFactor,'%','TE < hệ số × TEa',d.teaMode==='clia'?'XN-QTQL-16 + CLIA (đối chiếu mục tiêu)':'Tiêu chí PXN','lt')];
    let u:number|null=null;
    if(l.uReference!==null&&l.biasCorrected){u=2*Math.sqrt(a.withinSD**2+l.uReference**2+(a.withinSD/Math.sqrt(rows.length))**2);w.push('U ước lượng: k=2; giả định độc lập và độ chệch đã hiệu chỉnh. u(mean) dùng số ngày độc lập, cần người phụ trách xem xét mô hình.');}
    else w.push('Chưa ước lượng U: cần u của giá trị đích và xác nhận xử lý độ chệch.');
    levels.push({name:l.name,n:a.values.length,days:rows.length,...a,bias,biasPercent,te,tea,sigma:tea===null||a.withinCV===0?null:(tea-Math.abs(biasPercent))/a.withinCV,u,criteria:lc,warnings:w});criteria.push(...lc);
   }catch(e){blockers.push(`${l.name||'Mức '+(idx+1)}: ${(e as Error).message}`);}
  }
  warnings.push('So sánh trực tiếp theo tiêu chí nội bộ, chưa áp dụng giới hạn xác nhận thống kê EP15. CLIA được dùng làm mục tiêu đối chiếu, không phải kết quả ngoại kiểm hoặc chứng nhận quốc tế.');
 } else if(d.study==='qualitative'){
  const e=d.extras,pos=e.tp+e.fn,neg=e.tn+e.fp;
  if(pos<10||neg<10)blockers.push('Cần tối thiểu 10 mẫu dương và 10 mẫu âm độc lập.');
  const sens=pos?100*e.tp/pos:null,spec=neg?100*e.tn/neg:null;
  metrics.sensitivity=sens;metrics.specificity=spec;metrics.falsePositive=neg?100*e.fp/neg:null;metrics.falseNegative=pos?100*e.fn/pos:null;metrics.n=pos+neg;
  criteria.push(test('Độ nhạy',sens,e.sensitivity,'%', 'TP / (TP + FN) ≥ ngưỡng',d.source,'ge'),test('Độ đặc hiệu',spec,e.specificity,'%', 'TN / (TN + FP) ≥ ngưỡng',d.source,'ge'));
  warnings.push('Nhập số mẫu độc lập, không coi các lần chạy lặp cùng mẫu là các bệnh nhân độc lập. Kết quả điểm không thay cho khoảng tin cậy và thẩm định lâm sàng.');
 }else{
  try{
   const rows=parseRows(d.extras.data),v=rows.flat(),e=d.extras;metrics.n=v.length;
   if(d.study==='reference'){
    if(e.lower>=e.upper)throw new Error('Giới hạn dưới phải nhỏ hơn giới hạn trên.');
    if(rows.some(r=>r.length!==1))throw new Error('Mỗi dòng là một người thuộc quần thể tham chiếu.');
    if(v.length<20)blockers.push('Cần ít nhất 20 người tham chiếu phù hợp tiêu chí chọn.');
    const inside=v.filter(x=>x>=e.lower&&x<=e.upper).length;metrics.inside=inside;metrics.outside=v.length-inside;metrics.percent=100*inside/v.length;
    criteria.push(test('Kết quả trong khoảng',metrics.percent,90,'%','≥ 90% theo ví dụ 18/20 trong SOP','XN-QTQL-16','ge'));
    warnings.push('SOP ghi “>90%” nhưng ví dụ “18/20”. Ứng dụng dùng ≥90% theo ví dụ và yêu cầu xác nhận tiêu chí. Nếu chưa đạt, lấy thêm mẫu theo kế hoạch; kết quả không tự thiết lập khoảng tham chiếu mới.');
   }else if(d.study==='comparison'||d.study==='linearity'){
    if(rows.some(r=>d.study==='comparison'?r.length!==2:r.length<4))throw new Error(d.study==='comparison'?'Mỗi dòng cần 2 cột: tham chiếu; máy khảo sát.':'Mỗi dòng cần nồng độ đích và ít nhất 3 kết quả lặp.');
    const x=rows.map(r=>r[0]),y=rows.map(r=>mean(r.slice(1)));if(new Set(x).size<2)throw new Error('Các giá trị tham chiếu phải có biến thiên.');
    if(rows.length<(d.study==='comparison'?40:5))blockers.push(d.study==='comparison'?'Cần ít nhất 40 cặp mẫu độc lập.':'Cần ít nhất 5 mức nồng độ.');
    if(e.tolerance<=0)throw new Error('Nhập sai lệch cho phép (%) đã được chọn trước.');
    if(x.some(a=>a<=0))throw new Error('Giá trị tham chiếu phải dương để tính % sai lệch.');
    const xm=mean(x),ym=mean(y),xx=x.reduce((s,a)=>s+(a-xm)**2,0),yy=y.reduce((s,a)=>s+(a-ym)**2,0),xy=x.reduce((s,a,i)=>s+(a-xm)*(y[i]-ym),0),slope=xy/xx,intercept=ym-slope*xm;
    metrics.slope=slope;metrics.intercept=intercept;metrics.rSquared=yy===0?0:xy**2/(xx*yy);metrics.meanBias=mean(y.map((a,i)=>a-x[i]));metrics.maxDeviation=Math.max(...y.map((a,i)=>Math.abs(100*(a-x[i])/x[i])));metrics.n=rows.length;
    criteria.push(test('Sai lệch lớn nhất',metrics.maxDeviation,e.tolerance,'%','max |y − x| / x × 100 ≤ ngưỡng',d.source));
    warnings.push(d.study==='comparison'?'Hồi quy OLS và sai lệch cặp là phân tích thăm dò. Chưa thực hiện Deming/Passing–Bablok, khoảng tin cậy hoặc đánh giá sai lệch tại điểm quyết định; không kết luận hai phương pháp thay thế nhau.':'Hệ số R² cao không chứng minh tuyến tính. Cần kiểm định độ lệch phi tuyến theo CLSI EP06 trước khi phê duyệt dải đo.');
    blockers.push('Phân tích thăm dò: cần người phụ trách bổ sung đánh giá thống kê chuyên biệt.');
   }else if(d.study==='lod'){
    if(v.length<20)blockers.push('Cần ít nhất 20 phép đo ở mức thấp đã chuẩn bị.');
    if(e.concentration<=0||e.lodClaim<=0)throw new Error('Nhập nồng độ mẫu thấp và LoD công bố lớn hơn 0.');
    if(e.concentration>e.lodClaim)blockers.push('Nồng độ khảo sát lớn hơn LoD công bố, chưa xác nhận được LoD tại mức cần đánh giá.');
    const detected=v.filter(x=>x>e.blank).length;metrics.detection=detected/v.length*100;metrics.detected=detected;
    criteria.push(test('Tỷ lệ phát hiện trên LoB',metrics.detection,95,'%','Kết quả > LoB; tỷ lệ ≥ 95%','Kế hoạch khảo sát mức thấp','ge'));
    blockers.push('Khảo sát hỗ trợ LoD: cần thiết kế CLSI EP17, đánh giá nền và bất định trước kết luận chính thức.');
   }else if(d.study==='loq'){
    if(v.length<20)blockers.push('Cần ít nhất 20 phép đo tại mức LoQ khảo sát.');
    if(mean(v)<=0||v.length<2)throw new Error('Không tính được CV ở mức này.');
    metrics.mean=mean(v);metrics.sd=sd(v);metrics.cv=100*sd(v)/mean(v);
    criteria.push(test('CV tại mức khảo sát',metrics.cv,e.loqCV,'%','CV ≤ công bố tại mức LoQ',d.source));
    warnings.push('Đây là đánh giá độ chụm tại một mức nồng độ; không tự xác lập LoQ mới hoặc chứng minh độ đúng ở mức thấp.');
   }
  }catch(e){blockers.push((e as Error).message);}
 }
 const status=blockers.length||criteria.some(c=>c.pass===null)||!criteria.length?'insufficient':criteria.some(c=>c.pass===false)?'fail':'pass';
 return {version:VERSION,status,label:{pass:'Đạt tiêu chí đã chọn',fail:'Chưa đạt tiêu chí',insufficient:'Chưa đủ cơ sở kết luận'}[status],summary:status==='pass'?'Các thông số trong phạm vi đánh giá đáp ứng tiêu chí đã chọn. Hồ sơ cần được xem xét trước khi áp dụng.':status==='fail'?'Có thông số vượt giới hạn. Ghi nhận nguyên nhân, khắc phục và thực hiện đánh giá lại.':'Bổ sung các mục còn thiếu hoặc đánh giá chuyên biệt trước khi đưa ra kết luận.',blockers:[...new Set(blockers)],warnings,levels,criteria,metrics,scope:'Kết luận chỉ áp dụng cho phép đánh giá, vật liệu, máy, bộ thuốc thử, lô, đơn vị và nguồn đã ghi trong hồ sơ; không chứng nhận toàn bộ phương pháp.'};
}

import {body,checkOrigin,db,failure,getRecord,identity,log,recordFromRow,seed,ApiError} from '@/lib/server';
import {evaluate,validateDraft} from '@/lib/engine';
import {profiles} from '@/lib/catalog';
export const dynamic='force-dynamic';
export async function GET(){try{const m=await identity();await seed(m);const [r,a,people,refs]=await Promise.all([db().prepare('SELECT * FROM records WHERE workspace_id=? ORDER BY updated_at DESC LIMIT 500').bind(m.workspaceId).all(),db().prepare('SELECT actor,action,detail,record_id AS recordId,created_at AS createdAt FROM audit WHERE workspace_id=? ORDER BY created_at DESC LIMIT 200').bind(m.workspaceId).all(),db().prepare('SELECT user_id AS userId,role,label FROM members WHERE workspace_id=?').bind(m.workspaceId).all(),db().prepare('SELECT payload FROM reference_profiles WHERE workspace_id=? ORDER BY created_at DESC LIMIT 100').bind(m.workspaceId).all()]);return Response.json({member:m,records:r.results.map(recordFromRow),audit:a.results,members:people.results,profiles:refs.results.map((v:any)=>JSON.parse(v.payload))},{headers:{'Cache-Control':'no-store'}});}catch(e){return failure(e);}}
export async function POST(req:Request){try{
 checkOrigin(req);const m=await identity(),b=await body(req),date=new Date().toISOString();
 if(b.action==='save'){
  const draft=validateDraft(b.draft);if(!draft.anonymous)throw new ApiError(400,'Chỉ lưu khi đã xác nhận dữ liệu giả lập hoặc ẩn danh.');
  const evaluation=evaluate(draft),id=typeof b.id==='string'?b.id:crypto.randomUUID();let revision=1,sample=false;
  if(b.id){const old=await getRecord(m,id);if(old.status==='approved'||old.status==='review')throw new ApiError(409,'Hồ sơ đang duyệt hoặc đã duyệt được khóa. Tạo bản đánh giá lại.');if(old.created_by!==m.userId&&m.role!=='admin'&&!old.sample)throw new ApiError(403,'Bạn không có quyền sửa hồ sơ này.');if(old.revision!==b.revision)throw new ApiError(409,'Hồ sơ đã thay đổi. Tải lại trước khi sửa.');revision=old.revision+1;sample=!!old.sample;
   const result=await db().batch([db().prepare("UPDATE records SET payload=?,evaluation=?,revision=?,status='draft',updated_at=?,review_note='' WHERE id=? AND workspace_id=? AND revision=?").bind(JSON.stringify(draft),JSON.stringify(evaluation),revision,date,id,m.workspaceId,b.revision),log(m,'Sửa hồ sơ',`Phiên bản ${revision}`,id)]);if(!result[0].meta.changes)throw new ApiError(409,'Xung đột phiên bản. Tải lại hồ sơ.');
  }else await db().batch([db().prepare("INSERT INTO records(id,workspace_id,payload,evaluation,status,revision,created_by,updated_at,sample,review_note) VALUES(?,?,?,?,'draft',1,?,?,0,'')").bind(id,m.workspaceId,JSON.stringify(draft),JSON.stringify(evaluation),m.userId,date),log(m,'Tạo hồ sơ',draft.title,id)]);
  return Response.json({id,revision,evaluation,sample});
 }
 if(b.action==='transition'){
  const r=await getRecord(m,b.id);if(b.revision!==r.revision)throw new ApiError(409,'Hồ sơ đã được cập nhật. Vui lòng tải lại.');
  const allowed:Record<string,string[]>={draft:['review'],returned:['review'],review:['approved','returned'],approved:[]};
  if(!allowed[r.status]?.includes(b.status))throw new ApiError(409,'Không thể chuyển trạng thái này.');
  let role=m.role;if(r.sample&&['technician','reviewer','admin'].includes(b.demoRole))role=b.demoRole;
  if(b.status==='review'&&r.created_by!==m.userId&&role!=='admin'&&!r.sample)throw new ApiError(403,'Chỉ người lập hoặc quản trị viên được trình hồ sơ.');
  if(['approved','returned'].includes(b.status)&&!['admin','reviewer'].includes(role))throw new ApiError(403,'Chỉ người xem xét hoặc quản trị viên được duyệt / trả lại.');
  const ev=evaluate(JSON.parse(r.payload));
  if(b.status==='approved'&&ev.status!=='pass')throw new ApiError(422,'Chỉ phê duyệt khi phép đánh giá đủ cơ sở và đạt tiêu chí.');
  if(b.status==='approved'&&r.created_by===m.userId&&!r.sample)throw new ApiError(403,'Người lập không tự phê duyệt hồ sơ. Mời một người xem xét độc lập.');
  const note=typeof b.note==='string'?b.note.trim():'';if(['approved','returned'].includes(b.status)&&(!note||note.length>5000))throw new ApiError(400,'Cần nhận xét xem xét từ 1 đến 5.000 ký tự.');
  const results=await db().batch([db().prepare('UPDATE records SET status=?,review_note=?,evaluation=?,revision=revision+1,updated_at=? WHERE id=? AND workspace_id=? AND revision=? AND status=?').bind(b.status,note,JSON.stringify(ev),date,r.id,m.workspaceId,r.revision,r.status),log(m,r.sample?'Chuyển trạng thái demo':'Chuyển trạng thái',`${r.status} → ${b.status}. ${note}`,r.id)]);
  if(!results[0].meta.changes)throw new ApiError(409,'Xung đột cập nhật trạng thái.');return Response.json({ok:true});
 }
 if(b.action==='invite'){
  if(m.role!=='admin')throw new ApiError(403,'Cần quyền quản trị viên.');if(!['reviewer','technician'].includes(b.role))throw new ApiError(400,'Vai trò không hợp lệ.');
  const code=crypto.randomUUID();await db().batch([db().prepare('INSERT INTO invitations(id,workspace_id,role,expires,used) VALUES(?,?,?,?,0)').bind(code,m.workspaceId,b.role,new Date(Date.now()+86400000).toISOString()),log(m,'Tạo mã tham gia',`Vai trò ${b.role}; hiệu lực 24 giờ.`)]);return Response.json({code});
 }
 if(b.action==='join'){
  const inv=await db().prepare('SELECT * FROM invitations WHERE id=? AND used=0 AND expires>?').bind(String(b.code),date).first<any>();if(!inv)throw new ApiError(400,'Mã tham gia không hợp lệ, đã dùng hoặc hết hạn.');
  if(inv.workspace_id===m.workspaceId)throw new ApiError(400,'Bạn đã ở trong đơn vị này.');
  const count=await db().prepare('SELECT COUNT(*) AS n FROM records WHERE workspace_id=? AND sample=0').bind(m.workspaceId).first<any>();if(count.n>0)throw new ApiError(409,'Không thể rời đơn vị đang có hồ sơ riêng. Dùng tài khoản thành viên khác.');
  const r=await db().batch([db().prepare('UPDATE members SET workspace_id=?,role=?,label=? WHERE user_id=? AND EXISTS (SELECT 1 FROM invitations WHERE id=? AND used=0 AND expires>?)').bind(inv.workspace_id,inv.role,inv.role==='reviewer'?'Người xem xét':'Kỹ thuật viên',m.userId,b.code,date),db().prepare('UPDATE invitations SET used=1 WHERE id=? AND used=0').bind(b.code)]);if(!r[0].meta.changes)throw new ApiError(409,'Mã đã được dùng.');await db().batch([log({...m,workspaceId:inv.workspace_id},'Tham gia đơn vị',`Vai trò ${inv.role}`)]);return Response.json({ok:true});
 }
 if(b.action==='importProfiles'){
  if(m.role!=='admin')throw new ApiError(403,'Chỉ quản trị viên được nhập thư viện tham chiếu.');
  if(!Array.isArray(b.profiles)||!b.profiles.length||b.profiles.length>30)throw new ApiError(400,'Gói tham chiếu phải có từ 1 đến 30 hồ sơ.');
  const clean=b.profiles.map((p:any)=>{for(const key of ['manufacturer','model','assay','analyte','unit','matrix','version','source','url','note'])if(typeof p[key]!=='string'||p[key].length>1000)throw new ApiError(400,`Nguồn thiếu hoặc sai trường ${key}.`);if(!p.source.trim()||!p.version.trim()||!p.model.trim()||!p.analyte.trim())throw new ApiError(400,'Nguồn phải có tên máy, xét nghiệm, nguồn và phiên bản.');if(p.url&&!/^https?:\/\/[^\s]+$/.test(p.url))throw new ApiError(400,'Liên kết nguồn không hợp lệ.');if(!Array.isArray(p.points)||p.points.length<1||p.points.length>6)throw new ApiError(400,'Mỗi nguồn cần 1–6 mức.');p.points.forEach((v:any)=>{if(typeof v.name!=='string'||v.name.length>80)throw new ApiError(400,'Tên mức không hợp lệ.');for(const k of ['concentration','repeatCV','withinCV','repeatSD','withinSD'])if(typeof v[k]!=='number'||!Number.isFinite(v[k])||v[k]<=0)throw new ApiError(400,`Thông số ${k} phải dương.`);});return {...p,id:'custom-'+crypto.randomUUID()};});
  await db().batch([...clean.map((p:any)=>db().prepare('INSERT INTO reference_profiles(id,workspace_id,payload,created_by,created_at) VALUES(?,?,?,?,?)').bind(p.id,m.workspaceId,JSON.stringify(p),m.userId,date)),log(m,'Nhập nguồn tham chiếu',`${clean.length} hồ sơ; người sử dụng phải xác nhận phạm vi.`)]);return Response.json({count:clean.length});
 }
 if(b.action==='auditExport'){await db().batch([log(m,'Xuất dữ liệu',String(b.format).slice(0,80))]);return Response.json({ok:true});}
 throw new ApiError(400,'Thao tác không hợp lệ.');
}catch(e){return failure(e);}}

import {env} from 'cloudflare:workers';
import {getChatGPTUser} from '@/app/chatgpt-auth';
import {demoRecords} from './demo';
export function db():D1Database{const binding=(env as unknown as {DB:D1Database}).DB;if(!binding)throw new Error('Chưa kết nối được kho hồ sơ.');return binding;}
export type Member={userId:string;workspaceId:string;role:'admin'|'reviewer'|'technician';label:string};
export async function identity():Promise<Member>{
 const user=await getChatGPTUser();if(!user)throw new ApiError(401,'Vui lòng đăng nhập để lưu và quản lý hồ sơ.');
 const sql=db();let m=await sql.prepare('SELECT user_id AS userId,workspace_id AS workspaceId,role,label FROM members WHERE user_id=?').bind(user.userId).first<Member>();
 if(!m){const id=crypto.randomUUID(),date=new Date().toISOString();await sql.batch([sql.prepare('INSERT OR IGNORE INTO workspaces(id,owner_id,created_at) VALUES(?,?,?)').bind(id,user.userId,date),sql.prepare("INSERT OR IGNORE INTO members(user_id,workspace_id,role,label) SELECT ?,id,'admin',? FROM workspaces WHERE owner_id=?").bind(user.userId,'Người quản trị',user.userId)]);m=await sql.prepare('SELECT user_id AS userId,workspace_id AS workspaceId,role,label FROM members WHERE user_id=?').bind(user.userId).first<Member>();}
 if(!m)throw new Error('Không khởi tạo được không gian làm việc.');return m;
}
export class ApiError extends Error{constructor(public status:number,message:string){super(message);}}
export function log(m:Member,action:string,detail:string,recordId:string|null=null){return db().prepare('INSERT INTO audit(id,workspace_id,record_id,actor,action,detail,created_at) VALUES(?,?,?,?,?,?,?)').bind(crypto.randomUUID(),m.workspaceId,recordId,m.label,action,detail,new Date().toISOString());}
export async function seed(m:Member){
 const statements=demoRecords.map(r=>db().prepare('INSERT OR IGNORE INTO records(id,workspace_id,payload,evaluation,status,revision,created_by,updated_at,sample,review_note) VALUES(?,?,?,?,?,?,?,?,?,?)').bind(`${m.workspaceId}:${r.id}`,m.workspaceId,JSON.stringify(r.draft),JSON.stringify(r.evaluation),r.status,1,'demo-technician',r.updatedAt,1,r.reviewNote));await db().batch(statements);
}
export function recordFromRow(r:any){return {id:r.id,draft:JSON.parse(r.payload),evaluation:JSON.parse(r.evaluation),status:r.status,revision:r.revision,createdBy:r.created_by,updatedAt:r.updated_at,sample:!!r.sample,reviewNote:r.review_note};}
export async function getRecord(m:Member,id:string){const r=await db().prepare('SELECT * FROM records WHERE id=? AND workspace_id=?').bind(id,m.workspaceId).first<any>();if(!r)throw new ApiError(404,'Không tìm thấy hồ sơ trong đơn vị của bạn.');return r;}
export function checkOrigin(req:Request){const o=req.headers.get('origin');if(o&&o!==new URL(req.url).origin)throw new ApiError(403,'Yêu cầu từ nguồn không được phép.');}
export async function body(req:Request){if(Number(req.headers.get('content-length')||0)>1500000)throw new ApiError(413,'Dữ liệu tối đa 1,5 MB.');const text=await req.text();if(text.length>1500000)throw new ApiError(413,'Dữ liệu tối đa 1,5 MB.');try{return JSON.parse(text);}catch{throw new ApiError(400,'Nội dung JSON không hợp lệ.');}}
export function failure(e:unknown){const status=e instanceof ApiError?e.status:400;const message=e instanceof Error?e.message:'Không xử lý được yêu cầu.';return Response.json({error:message.includes('D1')||message.includes('SQLITE')?'Kho hồ sơ chưa sẵn sàng. Vui lòng thử lại.':message},{status});}

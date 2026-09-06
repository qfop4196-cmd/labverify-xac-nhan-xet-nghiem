import {body,checkOrigin,failure} from '@/lib/server';
import {evaluate} from '@/lib/engine';
export async function POST(req:Request){try{checkOrigin(req);const b=await body(req);return Response.json(evaluate(b.draft));}catch(e){return failure(e);}}

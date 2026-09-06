import {profiles,benchmarks,knowledge,sourceNotes,REVIEW_DATE,CLIA_URL} from '@/lib/catalog';
export function GET(){return Response.json({version:'1.0',reviewedAt:REVIEW_DATE,profiles,benchmarks,knowledge,sourceNotes,cliaUrl:CLIA_URL});}

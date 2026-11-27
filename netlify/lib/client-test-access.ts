import {createHash,timingSafeEqual} from 'node:crypto';

export const TEST_ORIGIN='https://deploy-preview-3--pc-prac-availability.netlify.app';
export const TEST_HEADERS={
 'Cache-Control':'private, no-store, max-age=0',
 'Netlify-CDN-Cache-Control':'no-store',
 'CDN-Cache-Control':'no-store',
 'X-Robots-Tag':'noindex, nofollow, noarchive',
 'Referrer-Policy':'no-referrer',
 'X-Content-Type-Options':'nosniff',
 'Vary':'Origin',
};
export function testReply(body:unknown,status=200){return Response.json(body,{status,headers:TEST_HEADERS});}
// This endpoint cannot run on production or arbitrary preview hosts, even if
// the branch were accidentally merged. It has no write, booking or email code.
export function externalTestOrigin(req:Request,context=process.env.CONTEXT){
 return context==='deploy-preview'&&new URL(req.url).origin===TEST_ORIGIN&&req.headers.get('origin')===TEST_ORIGIN;
}
export function permittedTestToken(token:unknown,expectedHash:string,expiresAt:string,now=Date.now()){
 if(typeof token!=='string'||!/^[A-Za-z0-9_-]{43}$/.test(token)||!Number.isFinite(Date.parse(expiresAt))||now>=Date.parse(expiresAt)||!/^[a-f0-9]{64}$/.test(expectedHash))return false;
 const supplied=createHash('sha256').update(token).digest();
 return timingSafeEqual(supplied,Buffer.from(expectedHash,'hex'));
}

import { mock } from 'bun:test';
import assert from 'node:assert/strict';
import { ANNA_EMAIL, ANNA_ID, melbourneDay } from '../deploy/netlify/lib/staff-policy';
let user:any=null, reads=0,writes=0, stored:any=null, recoveryRequests=0, failRecovery=false, inviteRedeems=0, recoveryRedeems=0;
mock.module('@netlify/identity',()=>({getUser:async()=>user,refreshSession:async()=>null,verifyRequestOrigin:(r:Request)=>{if(r.headers.get('origin')!=='https://pc-prac-availability.netlify.app')throw Error('CSRF');},login:async()=>user,logout:async()=>{user=null;},acceptInvite:async()=>{inviteRedeems++;return user;},recoverPassword:async()=>{recoveryRedeems++;return user;},requestPasswordRecovery:async()=>{recoveryRequests++;if(failRecovery)throw Error('provider-private-error');}}));
mock.module('@netlify/blobs',()=>({getStore:()=>({get:async()=>{reads++;return stored;},setJSON:async(_k:string,v:any)=>{writes++;stored=v;}})}));
const {default:ages}=await import('../deploy/netlify/functions/staff-ages');
const {default:session}=await import('../deploy/netlify/functions/staff-session');
process.env.STAFF_PRIVATE_ACCESS_ENABLED='true';
let checks=0;const check=(x:any)=>{assert(x);checks++;};
const req=(name:string,method='GET',body?:unknown,origin='https://pc-prac-availability.netlify.app')=>new Request(`https://pc-prac-availability.netlify.app/.netlify/functions/${name}`,{method,headers:{'content-type':'application/json',Origin:origin},...(body===undefined?{}:{body:JSON.stringify(body)})});
for(const method of ['GET','PUT']){check((await ages(req('staff-ages',method,method==='PUT'?{}:undefined))).status===401);check(reads===0&&writes===0);}
const good={id:ANNA_ID,email:ANNA_EMAIL,confirmedAt:'2026-11-04',roles:['staff-age']};
const recoveryResponse=await session(req('staff-session','POST',{action:'request-recovery',email:ANNA_EMAIL}));
check(recoveryResponse.status===200);check(recoveryRequests===1);
const genericBody=await recoveryResponse.text();
check(recoveryResponse.headers.get('cache-control')!.includes('no-store'));
check((await (await session(req('staff-session','POST',{action:'request-recovery',email:'not-invited@example.invalid'}))).text())===genericBody);check(recoveryRequests===1);
failRecovery=true;
check((await (await session(req('staff-session','POST',{action:'request-recovery',email:ANNA_EMAIL}))).text())===genericBody);check(recoveryRequests===2);
check(!genericBody.includes('provider-private-error'));failRecovery=false;
check((await session(req('staff-session','POST',{action:'request-recovery',email:ANNA_EMAIL},'https://evil.invalid'))).status!==200);check(recoveryRequests===2);
check((await session(req('staff-session','POST',{action:'request-recovery',email:42}))).status===400);
check(reads===0&&writes===0);check(user===null);
user=good;
for(const action of ['invite','recovery']){
 check((await session(req('staff-session','POST',{action,token:'local-fixture-only',password:'test-fixture-password'}))).status===200);
 check((await session(req('staff-session','POST',{action,token:'local-fixture-only',password:'short'}))).status===400);
 check((await session(req('staff-session','POST',{action,token:'',password:'test-fixture-password'}))).status===400);
}
check(inviteRedeems===1&&recoveryRedeems===1);
for(const bad of [{...good,id:'unapproved'}, {...good,roles:[]}, {...good,confirmedAt:undefined}, {...good,email:'other@psychologycare.com.au'}, {...good,roles:[],userMetadata:{roles:['staff-age']}}]){user=bad;check((await ages(req('staff-ages'))).status===403);check(reads===0&&writes===0);}
user=good;
check((await session(req('staff-session'))).status===200);
let r=await ages(req('staff-ages'));check(r.status===200);check((await r.json()).refreshRequired===true);
stored={asOfDay:'2000-01-01',ages:[{id:'fixture-only',age:40}]};
r=await ages(req('staff-ages'));check((await r.json()).ages.length===0);
const today=melbourneDay();
check((await ages(req('staff-ages','PUT',{asOfDay:today,ages:[]}))).status===200);check(writes===1);check(stored.ages.length===0);
check((await ages(req('staff-ages','PUT',{asOfDay:today,ages:[],dob:'forbidden'}))).status===400);check(writes===1);
check((await ages(req('staff-ages','PUT',{asOfDay:today,ages:[]},'https://evil.invalid'))).status!==200);check(writes===1);
stored={asOfDay:today,ages:[{id:'fixture-only',age:40}]};
r=await ages(req('staff-ages'));const output=await r.json();check(JSON.stringify(output)===JSON.stringify({ages:[{id:'fixture-only',age:40}],asOfDay:today}));
check(r.headers.get('Cache-Control')!.includes('no-store'));check(!r.headers.has('Access-Control-Allow-Origin'));
process.env.STAFF_PRIVATE_ACCESS_ENABLED='false';check((await ages(req('staff-ages'))).status===503);
process.env.STAFF_PRIVATE_ACCESS_ENABLED='true';
check((await session(req('staff-session','POST',{action:'logout'}))).status===200);check(user===null);check((await ages(req('staff-ages'))).status===401);
console.log(JSON.stringify({passed:true,checks,mockedProviderOnly:true,noRealPrivateData:true}));

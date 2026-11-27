import {externalTestOrigin,permittedTestToken,testReply} from '../lib/client-test-access';
import {externalTestFixture} from '../lib/client-external-test-fixture';

export default async(req:Request)=>{
 // Uniform errors. Do not log request bodies, access tokens or form data.
 if(!externalTestOrigin(req))return testReply({error:'Test link unavailable'},404);
 if(req.method!=='POST')return testReply({error:'Method not allowed'},405);
 if(!(req.headers.get('content-type')||'').startsWith('application/json'))return testReply({error:'Invalid request'},415);
 if(Number(req.headers.get('content-length')||0)>512)return testReply({error:'Invalid request'},413);
 try{
  const text=await req.text();if(text.length>512)return testReply({error:'Invalid request'},413);
  const input=JSON.parse(text);
  if(!input||Array.isArray(input)||Object.keys(input).join(',')!=='token'||!permittedTestToken(input.token,externalTestFixture.tokenHash,externalTestFixture.expiresAt))return testReply({error:'Test link unavailable'},404);
  // Explicit client response: never return the hash, staff records or metadata.
  return testReply({mode:'external-test',clientName:'Anna Test',profiles:externalTestFixture.profiles,snapshotLabel:externalTestFixture.snapshotLabel,expiresAt:externalTestFixture.expiresAt,expiresLabel:externalTestFixture.expiresLabel});
 }catch{return testReply({error:'Test link unavailable'},404);}
};

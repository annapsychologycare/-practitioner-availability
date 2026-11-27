import React,{useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {ClientMatchingExperience} from './components/ClientMatchingExperience';
import type {ClientPreviewProfile} from './utils/clientPagePreview';
import './index.css';
import './clientExternalTest.css';

type TestData={mode:'external-test';clientName:'Anna Test';profiles:ClientPreviewProfile[];snapshotLabel:string;expiresAt:string;expiresLabel:string};
// A fragment is never sent with the initial HTML request. Remove it from the
// current history entry before loading data; retain the original link only in
// the intended recipient's email. No token or form text goes to browser storage.
const suppliedToken=new URLSearchParams(location.hash.slice(1)).get('access')||'';
history.replaceState(null,'',location.pathname);
// Email apps may reuse an already-open tab. A new fragment must be validated
// afresh, rather than retaining a previous test case or its in-memory choices.
addEventListener('hashchange',()=>{if(location.hash)location.reload();});
function ExternalTest(){
 const [data,setData]=useState<TestData|null>(null),[failed,setFailed]=useState(false);
 useEffect(()=>{const controller=new AbortController();
  if(!/^[A-Za-z0-9_-]{43}$/.test(suppliedToken)){setFailed(true);return;}
  fetch('/.netlify/functions/client-external-test',{method:'POST',credentials:'omit',cache:'no-store',referrerPolicy:'no-referrer',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:suppliedToken}),signal:controller.signal})
   .then(async response=>{if(!response.ok)throw Error('Unavailable');return response.json();})
   .then(value=>{if(value?.mode!=='external-test'||value.clientName!=='Anna Test'||!Array.isArray(value.profiles)||!value.profiles.length||value.profiles.length>5||!Number.isFinite(Date.parse(value.expiresAt))||Date.parse(value.expiresAt)<=Date.now())throw Error('Unavailable');setData(value);})
   .catch(error=>{if(error?.name!=='AbortError')setFailed(true);});
  return ()=>controller.abort();
 },[]);
 useEffect(()=>{if(!data)return;const remaining=Date.parse(data.expiresAt)-Date.now();if(remaining<=0){setData(null);setFailed(true);return;}const timer=setTimeout(()=>{setData(null);setFailed(true);},Math.min(remaining,2147483647));return()=>clearTimeout(timer);},[data]);
 if(failed)return <main className="pc-test-status"><img src="/brand/psychologycare-logo.svg" alt="PsychologyCare"/><h1>This test link is unavailable</h1><p>Please reopen the complete private link in your test email. It may have expired or been withdrawn.</p><p>Refreshing a test page does not restore selections. No preferences have been sent or booked.</p></main>;
 if(!data)return <main className="pc-test-status" role="status"><h1>Opening your test practitioner options…</h1><p>No preferences are sent or appointments booked in this test.</p></main>;
 return <main className="pc-external-shell"><ClientMatchingExperience profiles={data.profiles} age60Plus={false} clientName={data.clientName} externalTest snapshotLabel={data.snapshotLabel} expiresLabel={data.expiresLabel}/></main>;
}
createRoot(document.getElementById('root')!).render(<ExternalTest/>);

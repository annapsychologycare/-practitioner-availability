import React from 'react';
export default function PractitionerNotes({practitioner:p}: {practitioner: {alert?:string;client_note?:string}}) {
  return <>
    {p.alert && <div style={{background:'#00B8C8',color:'white',borderRadius:10,padding:'8px 14px',fontSize:13,margin:'8px 0',whiteSpace:'pre-line'}}><strong>🔒 Internal note — staff only</strong><div>{p.alert}</div></div>}
    {p.client_note && <div style={{background:'#fff8e1',color:'#7a5a00',border:'1px solid #fbbf24',borderRadius:10,padding:'8px 14px',fontSize:13,margin:'8px 0',whiteSpace:'pre-line'}}><strong>⚠️ Client-facing note — included in email</strong><div>{p.client_note}</div></div>}
  </>;
}

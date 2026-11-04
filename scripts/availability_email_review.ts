/** Email-only review. Never writes practitioner data or infers free gaps. */
export const esc = (v: unknown) => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
/** Email-safe table spacing: explicit white cell, not margin/CSS-class reliance. */
export function renderMainRows(rows: any[]) {
  const cell=(s:string)=>`<td style="padding:9px;border-bottom:1px solid #ddd;vertical-align:top;">${s}</td>`;
  let last='';
  return rows.map((r,index)=>{
    const first=r.name!==last;
    const spacer=first&&index>0?'<tr aria-hidden="true"><td colspan="3" height="16" bgcolor="#ffffff" style="height:16px;line-height:16px;font-size:0;padding:0;border:0;background:#ffffff;mso-line-height-rule:exactly;">&nbsp;</td></tr>':'';
    const name=first?`<strong style="color:#8D5273;font-size:15px;font-weight:700;">${esc(r.name)}</strong>`:'';
    last=r.name;
    const color=r.frequency==='Weekly'?'#e8f5e9':'#f3e5f5';
    return spacer+`<tr bgcolor="${color}" style="background:${color};">${cell(name)}${cell(r.representations.map((p:any)=>`${esc(p.location)} — starting ${esc(p.start)}`).join('<br>'))}${cell(`${esc(r.time)} (${esc(r.frequency)})`)}</tr>`;
  }).join('');
}
const day = (d: string) => Math.floor(Date.parse(d.slice(0,10)+'T00:00:00Z')/86400000);
const iso = (n: number) => new Date(n*86400000).toISOString().slice(0,10);
export function mainReview(result: any) {
  const groups = new Map<string, any>();
  for (const s of result.slots) {
    const [name, location, slot] = s.trim().split(' | ');
    const m = slot.match(/^(.*?) \((Weekly|Fortnightly|Monthly): Starting (.+)\)$/);
    if (!m) throw new Error('Unrecognized slot format');
    if (m[2] === 'Monthly') continue;
    const key = `${name}|${m[1]}|${m[2]}`;
    if (!groups.has(key)) groups.set(key, {name, time:m[1], frequency:m[2], representations:[]});
    const g = groups.get(key);
    if (!g.representations.some((r:any)=>r.location===location&&r.start===m[3])) g.representations.push({location,start:m[3]});
  }
  const conflicts:any[]=[];
  const rows:any[]=[];
  for (const g of groups.values()) {
    if (g.name === 'Joshua Kugel') {
      const tele = g.representations.filter((r:any)=>r.location==='Telehealth');
      const clinic = g.representations.filter((r:any)=>r.location!=='Telehealth');
      if (!tele.length) { conflicts.push({...g,reason:'Clinic-only opening: not relabelled Telehealth and excluded from main email count; please confirm.'}); continue; }
      if (clinic.length) conflicts.push({...g,reason:'Clinic representations suppressed in email only; Telehealth shown. Later clinic dates are not promised as Telehealth.'});
      rows.push({...g,representations:tele});
    } else rows.push(g);
  }
  rows.sort((a,b)=>a.name.split(' ').at(-1).localeCompare(b.name.split(' ').at(-1))||a.time.localeCompare(b.time)||a.frequency.localeCompare(b.frequency));
  return {rows,conflicts,counts:{Weekly:rows.filter(r=>r.frequency==='Weekly').length,Fortnightly:rows.filter(r=>r.frequency==='Fortnightly').length},practitioners:new Set(rows.map(r=>r.name)).size};
}
export function phaseReview(raw:any) {
  // Physical locations are NOT merged here. Duplicate locations cannot manufacture phases.
  // API exposes capacity/group, not verified clinical appointment type or recurrence end.
  const groups=new Map<string,any>();
  const from=day(raw.dateFrom),to=day(raw.dateTo);
  for(const a of raw.appointments){
    if(!['Fortnightly','Monthly'].includes(a._freqType)||day(a.date)<from||day(a.date)>to)continue;
    const name=a.practitioner?.name??'';
    if(/Krista/i.test(name)||(/Spektor/i.test(name)&&a._freqType==='Monthly'))continue;
    const duration=(Date.parse('2000-01-01T'+a.endAt+'Z')-Date.parse('2000-01-01T'+a.startAt+'Z'))/60000;
    if(!Number.isFinite(duration)||duration<=0)continue;
    const type=JSON.stringify([a.clientCapacity,a.group?.id??null,a.groupName??null]);
    const key=JSON.stringify([a.practitioner?.id,new Date(a.date.slice(0,10)+'T00:00:00Z').getUTCDay(),a.startAt,duration,type,a.location?.id,a._freqType]);
    if(!groups.has(key))groups.set(key,{name,location:a.location?.name,locationId:a.location?.id,start:a.startAt,duration,type,frequency:a._freqType,records:[]});
    groups.get(key).records.push(a);
  }
  const candidates:any[]=[],rejected:any[]=[];
  for(const g of groups.values()){
    const period=g.frequency==='Fortnightly'?14:28,step=period/2;
    const pending=g.records.filter((a:any)=>a.attendanceState==='Pending'&&a.isActive!==false);
    const phases=new Map<number,Set<number>>();
    for(const a of pending){const n=day(a.date);const r=n%period;if(!phases.has(r))phases.set(r,new Set());phases.get(r)!.add(n);}
    for(const [r,dates] of phases){
      const other=(r+step)%period;if(r>other||!phases.has(other))continue;
      const p1=[...dates].sort((a,b)=>a-b),p2=[...phases.get(other)!].sort((a,b)=>a-b);
      const union=[...new Set([...p1,...p2])].sort((a,b)=>a-b);
      const expected:number[]=[];for(let n=from;n<=to;n++)if(n%period===r||n%period===other)expected.push(n);
      const missing=expected.filter(n=>!union.includes(n));
      const interiorMissing=expected.filter(n=>n>=union[0]&&n<=union.at(-1)!&&!union.includes(n));
      // Check all frequencies at this physical location/time for booked/cancelled overlaps.
      const related=raw.appointments.filter((a:any)=>a.practitioner?.name===g.name&&a.location?.id===g.locationId&&a.startAt===g.start&&expected.includes(day(a.date)));
      const blockers=related.filter((a:any)=>a.attendanceState!=='Pending'&&a.isActive!==false);
      const interiorBlockers=blockers.filter((a:any)=>day(a.date)>=union[0]&&day(a.date)<=union.at(-1)!);
      const evidence={name:g.name,location:g.location,start:g.start,duration:g.duration,type:g.type,frequency:g.frequency,potential:g.frequency==='Fortnightly'?'Weekly':'Fortnightly',phaseDates:[p1.map(iso),p2.map(iso)],observedInterval:{from:iso(union[0]),to:iso(union.at(-1)!)},scope:missing.length?'Limited-window alignment ONLY; not an ongoing recurrence recommendation':'Full extract window only; ongoing recurrence not verified',missingDates:missing.map(iso),blockedDates:[...new Set(blockers.map((a:any)=>`${a.date.slice(0,10)} (${a.attendanceState})`))],excludedInactiveRecords:related.filter((a:any)=>a.isActive===false).length};
      if(p1.length>=2&&p2.length>=2&&!interiorMissing.length&&!interiorBlockers.length)candidates.push(evidence);
      else rejected.push({...evidence,reason:'Insufficient repeats, missing boundary/interior dates, or non-pending/inactive evidence; not a consolidation suggestion.'});
    }
  }
  return {window:{from:raw.dateFrom,to:raw.dateTo},candidates,rejected,groupsExamined:groups.size,caveat:'Read-only suggestion, not confirmed capacity. Review clinical session type, recurrence IDs/end dates, all booked diaries, leave and location compatibility in Zanda before changing anything. API capacity/group fields are only type proxies; actual recurrence definitions/end dates and non-placeholder booked clients are not present in this extract. No inference beyond this finite window. Monthly means a tested 28-day phase, not calendar-month recurrence.'};
}

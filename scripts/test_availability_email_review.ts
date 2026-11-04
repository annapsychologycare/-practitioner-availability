import {test,expect} from 'bun:test';
import {mainReview,phaseReview} from './availability_email_review';
const slot=(name:string,location:string,freq='Fortnightly',start='10th Nov')=>`${name} | ${location} | Tuesdays at 1pm (${freq}: Starting ${start})`;
test('Monthly never main; mirrored locations and dates one row and one count',()=>{
 const r=mainReview({slots:[slot('A Test','Clinic'),slot('A Test','Telehealth','Fortnightly','24th Nov'),slot('A Test','Clinic','Monthly')]});
 expect(r.rows.length).toBe(1);expect(r.counts.Fortnightly).toBe(1);expect(r.rows[0].representations.length).toBe(2);
});
test('Josh telehealth only; clinic-only unique opening flagged, never relabelled',()=>{
 const r=mainReview({slots:[slot('Joshua Kugel','Clinic'),slot('Joshua Kugel','Telehealth'),slot('Joshua Kugel','Clinic','Weekly')]});
 expect(r.rows.length).toBe(1);expect(r.rows[0].representations).toEqual([{location:'Telehealth',start:'10th Nov'}]);expect(r.conflicts.length).toBe(2);expect(r.counts.Weekly).toBe(0);
});
const appt=(date:string,extra:any={})=>({date,startAt:'13:00:00',endAt:'14:00:00',practitioner:{id:1,name:'A Test'},location:{id:1,name:'Clinic'},_freqType:'Fortnightly',attendanceState:'Pending',isActive:true,clientCapacity:'Client Appointment',...extra});
const raw=(a:any[],to='2026-12-01')=>({dateFrom:'2026-11-10',dateTo:to,appointments:a});
const dates=['2026-11-10','2026-11-17','2026-11-24','2026-12-01'];
test('opposite fortnightly phases with repeated exact dates suggest Weekly',()=>{expect(phaseReview(raw(dates.map(d=>appt(d)))).candidates.length).toBe(1)});
test('same date duplicate locations cannot create an opposite phase',()=>{expect(phaseReview(raw(['2026-11-10','2026-11-24'].flatMap(d=>[appt(d),appt(d,{location:{id:2,name:'Telehealth'}})]))).candidates.length).toBe(0)});
test('different duration/type/location are nonmatches',()=>{
 for(const change of [{endAt:'13:30:00'},{clientCapacity:'Group Appointment'},{location:{id:2,name:'Other'}}]){
  expect(phaseReview(raw(dates.map((d,i)=>appt(d,i%2?change:{})))).candidates.length).toBe(0);
 }
});
test('booked/cancelled or missing internal date prevents suggestion',()=>{
 expect(phaseReview(raw([...dates.map(d=>appt(d)),appt('2026-11-24',{attendanceState:'Confirmed'})])).candidates.length).toBe(0);
 const gaps=['2026-11-10','2026-11-17','2026-12-01','2026-12-08'];expect(phaseReview(raw(gaps.map(d=>appt(d)),'2026-12-08')).candidates.length).toBe(0);
});
test('partial boundaries explicitly limited; inactive historical duplicates excluded',()=>{
 const r=phaseReview({...raw([...dates.map(d=>appt(d)),appt('2026-11-24',{isActive:false})],'2026-12-08')});
 expect(r.candidates[0].scope).toContain('Limited-window');expect(r.candidates[0].missingDates).toEqual(['2026-12-08']);expect(r.candidates[0].excludedInactiveRecords).toBe(1);
});
test('28-day Monthly phases 14 days apart can suggest Fortnightly, never main',()=>{
 const r=phaseReview(raw(['2026-11-10','2026-11-24','2026-12-08','2026-12-22'].map(d=>appt(d,{_freqType:'Monthly'})),'2026-12-22'));
 expect(r.candidates.length).toBe(1);expect(r.candidates[0].potential).toBe('Fortnightly');
});
test('single occurrence phases are not enough; suppressed Krista never suggested',()=>{
 expect(phaseReview(raw(dates.slice(0,2).map(d=>appt(d)))).candidates.length).toBe(0);
 expect(phaseReview(raw(dates.map(d=>appt(d,{practitioner:{id:2,name:'Krista De Castella'}})))).candidates.length).toBe(0);
});

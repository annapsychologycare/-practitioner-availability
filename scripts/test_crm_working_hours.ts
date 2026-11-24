import {test,expect} from 'bun:test';
import {mapCrmWorkingHours,applyCrmWorkingHours,WORKING_HOURS_FIELDS} from './crm_working_hours';
import approved from './internal_practitioners.json';
import {buildEmailHtml} from '../apps/practitioner-availability/utils/emailBuilder';
const blank=()=>({Full_Name:'Test',...Object.fromEntries(WORKING_HOURS_FIELDS.map(([k])=>[k,null]))});
test('CRM hours use stable API fields and preserve literal text/location without inferred clocks',()=>{
 expect(mapCrmWorkingHours({...blank(),Availability:'Monday 8am–2pm',Working_Days_and_Hours_185A_Greville_St:'Thursday - Mid Day'})).toBe('Camberwell: Monday 8am–2pm\nGreville St, Prahran: Thursday - Mid Day');
});
test('all blank hours hold existing profile; missing or invalid source fails closed',()=>{
 expect(mapCrmWorkingHours(blank())).toBeNull();
 expect(()=>mapCrmWorkingHours({Full_Name:'Test'})).toThrow();
 expect(()=>mapCrmWorkingHours({...blank(),Availability:4})).toThrow();
 const p=[{name:approved[0].name,working_hours:'existing'}];
 const c=[{...blank(),id:approved[0].id}];
 expect(applyCrmWorkingHours(p,c)[0].status).toBe('held_blank');expect(p[0].working_hours).toBe('existing');
 expect(()=>applyCrmWorkingHours(p,[])).toThrow();
});
test('Krista pause still withholds populated hours',()=>{
 expect(mapCrmWorkingHours({...blank(),Full_Name:'Dr. Krista De Castella',Working_Days_and_Hours_Telehealth:'Tuesdays 9am'})).toBe('');
});
test('client email escapes CRM hours and preserves line breaks; no staff notes',()=>{
 const html=buildEmailHtml('Preview','','Team',[{name:'Test',title:'Psychologist',fees:'',medicare_rebate:'',link_to_bio:'',availabilityLocations:[],working_hours:'Monday <script>alert(1)</script> & test\nFriday 8am',alert:'PRIVATE_STAFF_MARKER'} as any]);
 expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt; &amp; test<br />Friday 8am');
 expect(html).not.toContain('<script>');expect(html).not.toContain('PRIVATE_STAFF_MARKER');
});

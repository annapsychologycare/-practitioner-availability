export interface PreferenceState {
 selected:string[]; slots:Record<string,string[]>; differentTime:Record<string,boolean>; questions:Record<string,string>;
 ranked:boolean; support:string[]; contact:string; callback:string; days:string; timeOfDay:string; location:string; message:string;
}
export const emptyPreferences=():PreferenceState=>({selected:[],slots:{},differentTime:{},questions:{},ranked:true,support:[],contact:'',callback:'',days:'',timeOfDay:'',location:'',message:''});
export type PreferenceAction=
 |{type:'select'|'remove';key:string}
 |{type:'slot';key:string;slot:string}
 |{type:'different';key:string;value:boolean}
 |{type:'question';key:string;value:string}
 |{type:'move';key:string;direction:number}
 |{type:'rank';value:boolean}
 |{type:'support';value:string}
 |{type:'field';key:'contact'|'callback'|'days'|'timeOfDay'|'location'|'message';value:string};
export function preferenceReducer(s:PreferenceState,a:PreferenceAction):PreferenceState{
 const add=(key:string)=>s.selected.includes(key)?s.selected:[...s.selected,key];
 switch(a.type){
 case 'select':return {...s,selected:add(a.key)};
 case 'remove':return {...s,selected:s.selected.filter(k=>k!==a.key),slots:{...s.slots,[a.key]:[]},differentTime:{...s.differentTime,[a.key]:false}};
 case 'slot':{const values=s.slots[a.key]||[];return {...s,selected:add(a.key),slots:{...s.slots,[a.key]:values.includes(a.slot)?values.filter(k=>k!==a.slot):[...values,a.slot]}};}
 case 'different':return {...s,selected:a.value?add(a.key):s.selected,differentTime:{...s.differentTime,[a.key]:a.value}};
 case 'question':return {...s,questions:{...s.questions,[a.key]:a.value}};
 case 'move':{const i=s.selected.indexOf(a.key),j=i+a.direction;if(i<0||j<0||j>=s.selected.length)return s;const next=[...s.selected];[next[i],next[j]]=[next[j],next[i]];return {...s,selected:next};}
 case 'rank':return {...s,ranked:a.value};
 case 'support':return {...s,support:s.support.includes(a.value)?s.support.filter(x=>x!==a.value):[...s.support,a.value]};
 case 'field':return {...s,[a.key]:a.value};
 }
}
export const preferenceLabel=(index:number)=>['First preference','Second preference','Third preference'][index]||`Preference ${index+1}`;
export function hasPreferenceRequest(s:PreferenceState){return !!(s.selected.length||s.support.length||s.message.trim()||Object.values(s.questions).some(q=>q.trim()));}

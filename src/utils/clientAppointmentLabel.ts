export function clientAppointmentLabel(line:{day:string|null;time:string|null;text:string;frequency:string}){
 const frequency=line.frequency.charAt(0).toUpperCase()+line.frequency.slice(1);
 if(!line.day||!line.time)return `${line.text} (${frequency})`;
 const time=line.time.replace(/:00\b/,'').replace(/\s+(am|pm)$/i,'$1');
 return `${line.day}s at ${time} (${frequency})`;
}

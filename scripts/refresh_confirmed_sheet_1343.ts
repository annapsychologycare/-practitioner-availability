import {invokeTool} from '@tasklet/tools/v2';
import {mkdir,writeFile} from 'node:fs/promises';
const dir='/tasklet/threads/a_cwa98xzh47ey9rcvmmh4/work/upcoming_leave_2026-11-04/reconfirmed_1343';
await mkdir(dir,{recursive:true});
const r=await invokeTool({connectionId:'conn_1wwngrqavhj6gxhh1rxa',toolName:'google_drive_get_spreadsheet',args:{spreadsheetId:'1Q6rUWV5H5TcHtsZRc_88G6ef4HM-ARzqCSof03-bmpw',range:"'Christmas Leave Dashboard'!A1:F35"}});
if(!r.ok)throw Error(r.error);const s:any=await r.json();await writeFile(`${dir}/sheet_fresh.json`,JSON.stringify(s,null,2));
console.log(JSON.stringify({sheet:s.sheet,rows:Array.from({length:32},(_,i)=>{const row=i+4;return {row,...Object.fromEntries('ABCDEF'.split('').map(c=>[c,s.cells[c+row]??'']))};}).filter(r=>r.A)},null,2));

import {build} from '/tmp/prac-vite-build/node_modules/esbuild/lib/main.js';
import {cpSync,readdirSync,mkdirSync} from 'node:fs';
const root='/tasklet/threads/a_cwa98xzh47ey9rcvmmh4/work';
for(const [src,dst] of [['apps/practitioner-availability','/tmp/crm22-app'],['deploy','/tmp/prac-vite-build']]){
 mkdirSync(dst,{recursive:true});for(const n of readdirSync(`${root}/${src}`))if(!['node_modules','.git','dist'].includes(n))cpSync(`${root}/${src}/${n}`,`${dst}/${n}`,{recursive:true});
}
for(const [entry,out] of [['/tmp/crm22-app/app.tsx','apps/practitioner-availability/bundle.js'],['/tmp/prac-vite-build/src/App.tsx','deploy/src/bundle.js']])await build({entryPoints:[entry],bundle:true,format:'iife',platform:'browser',target:'es2020',outfile:`${root}/${out}`,nodePaths:['/tmp/prac-vite-build/node_modules'],define:{'process.env.NODE_ENV':'"production"'}});
console.log('Both current app/deploy bundles built.');

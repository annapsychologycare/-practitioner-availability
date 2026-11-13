import {build} from '/tmp/pc-alex-build/node_modules/esbuild/lib/main.js';
const root='/tasklet/threads/a_cwa98xzh47ey9rcvmmh4/work';
for(const [entry,out] of [['apps/practitioner-availability/app.tsx','apps/practitioner-availability/bundle.js'],['deploy/src/App.tsx','deploy/src/bundle.js']])await build({entryPoints:[`${root}/${entry}`],bundle:true,format:'iife',platform:'browser',target:'es2020',outfile:`${root}/${out}`,nodePaths:['/tmp/pc-alex-build/node_modules',`${root}/deploy/node_modules`],define:{'process.env.NODE_ENV':'"production"'}});
console.log('Both Tasklet and deploy IIFE bundles built from current sources.');

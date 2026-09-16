// Windows fallback for package-site.sh: stage only this custom Worker's output.
import {mkdir,cp,readFile,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {spawnSync} from 'node:child_process';
const root=process.cwd(),stage=resolve(root,'.release','stage-'+Date.now()),dist=join(stage,'dist');
if(!stage.startsWith(resolve(root,'.release')+ '\\'))throw Error('Invalid staging path');
await mkdir(dist,{recursive:true});await cp(join(root,'dist/server'),join(dist,'server'),{recursive:true});await cp(join(root,'dist/.openai'),join(dist,'.openai'),{recursive:true});
const config=JSON.parse(await readFile(join(dist,'.openai/hosting.json'),'utf8'));if(config.d1!=='DB'||!config.project_id)throw Error('Invalid hosting metadata');
const archive=resolve(root,'.release','gramin.tar.gz');const r=spawnSync('tar.exe',['-czf',archive,'-C',stage,'dist'],{encoding:'utf8'});if(r.status!==0)throw Error(r.stderr||r.error?.message);
const check=spawnSync('tar.exe',['-tzf',archive],{encoding:'utf8'});if(check.status!==0||!check.stdout.includes('dist/server/index.js')||!check.stdout.includes('dist/.openai/hosting.json')||!check.stdout.includes('0000_wakeful_corsair.sql'))throw Error('Archive validation failed');
await writeFile(join(root,'.release/archive-path.txt'),archive);console.log('Validated Worker archive, assets and database migration.');

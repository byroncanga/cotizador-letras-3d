import { spawn,spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve,dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const local=resolve(root,'.runtime/bin/php');
const php=existsSync(local)?local:'php';
if(spawnSync(php,['--version'],{stdio:'ignore'}).error){console.error('Se requiere PHP 8.5. Consulta README.md para preparar la API.');process.exit(1);}
const args=process.argv.slice(2);
const child=spawn(php,['artisan',...(args.length?args:['serve','--host=127.0.0.1','--port=8000'])],{cwd:resolve(root,'apps/api'),stdio:'inherit',env:{...process.env,PATH:`${dirname(php)}:${process.env.PATH}`}});
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>child.kill(signal));
child.on('exit',code=>process.exit(code??0));

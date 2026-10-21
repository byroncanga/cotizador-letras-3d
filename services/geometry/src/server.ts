import { createServer } from 'node:http';
import { Worker } from 'node:worker_threads';
import type { AnalysisInput } from './analyze.js';
import { materialPlanRequestSchema } from '@taller/contracts';
import { toPlan } from './stock-planner.js';

let active=0;
const port=Number(process.env.PORT||4100);
const server=createServer(async(req,res)=>{
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('Cache-Control','no-store');
  res.setHeader('X-Content-Type-Options','nosniff');
  if(req.method==='GET'&&req.url==='/health'){res.end(JSON.stringify({status:'ok',version:'1.0',service:'geometry'}));return;}
  if(req.method!=='POST'||!['/analyze','/plan'].includes(req.url||'')){res.writeHead(404);res.end(JSON.stringify({message:'Ruta no disponible.'}));return;}
  if(active>=2){res.writeHead(503);res.end(JSON.stringify({message:'El analizador está ocupado. Vuelve a intentarlo.'}));return;}
  let size=0;const chunks:Buffer[]=[];
  try{
    for await (const chunk of req){size+=chunk.length;if(size>2_200_000){res.writeHead(413);res.end(JSON.stringify({message:'El SVG supera los 2 MB permitidos.'}));return;}chunks.push(chunk);}
    const input=JSON.parse(Buffer.concat(chunks).toString());
    if(req.url==='/plan'){const parsed=materialPlanRequestSchema.safeParse(input);if(!parsed.success){res.writeHead(422);res.end(JSON.stringify({message:'Faltan medidas geométricas, materiales o parámetros de plancha válidos.'}));return;}res.writeHead(200);const prices=Object.fromEntries(parsed.data.materials.map(material=>[material.materialId,material.purchasePrice]));res.end(JSON.stringify({data:toPlan({...parsed.data,prices})}));return;}
    const analysisInput=input as AnalysisInput;
    if(typeof analysisInput.svg!=='string'||typeof analysisInput.fileName!=='string')throw new Error('Envía un SVG y un nombre de archivo.');
    active++;
    try{
      const result=await new Promise<{ok:boolean;data?:unknown;error?:string}>((resolve,reject)=>{
        const worker=new Worker(new URL('./thread.ts',import.meta.url),{workerData:analysisInput,execArgv:['--import','tsx'],resourceLimits:{maxOldGenerationSizeMb:128}});
        let settled=false;
        const timer=setTimeout(()=>{worker.terminate();if(!settled){settled=true;reject(new Error('El análisis superó el tiempo permitido. Simplifica o divide el SVG.'));}},8000);
        worker.once('message',value=>{settled=true;clearTimeout(timer);worker.terminate();resolve(value);});
        worker.once('error',error=>{if(!settled){settled=true;clearTimeout(timer);worker.terminate();reject(error);}});
        worker.once('exit',code=>{if(!settled){settled=true;clearTimeout(timer);reject(new Error(`El analizador se detuvo (${code}). Simplifica el archivo.`));}});
        res.once('close',()=>{if(!settled){settled=true;clearTimeout(timer);worker.terminate();reject(new Error('La solicitud se canceló.'));}});
      });
      res.writeHead(result.ok?200:422);res.end(JSON.stringify(result.ok?{data:result.data}:{message:result.error}));
    }finally{active--;}
  }catch(error){if(!res.writableEnded&&!res.destroyed){res.writeHead(422);res.end(JSON.stringify({message:error instanceof Error?error.message:'No se pudo procesar el SVG.'}));}}
});
server.listen(port,process.env.GEOMETRY_HOST||'127.0.0.1',()=>process.stdout.write(`Geometría SVG: http://127.0.0.1:${port}\n`));

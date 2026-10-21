import { parentPort,workerData } from 'node:worker_threads';
import { analyzeSvg } from './analyze.js';
try{parentPort?.postMessage({ok:true,data:analyzeSvg(workerData)});}catch(error){parentPort?.postMessage({ok:false,error:error instanceof Error?error.message:'No se pudo analizar el archivo.'});}

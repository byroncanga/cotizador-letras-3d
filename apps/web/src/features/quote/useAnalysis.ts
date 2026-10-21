import { useEffect,useRef,useState } from 'react';
import { analysisSchema,type Operation } from '@taller/contracts';
import { useWorkspace } from '../../state/workspace';
import { getSource,saveSource } from '../../lib/sources';
export function useAnalysis(){
  const {actions,meta:{activeDraft}}=useWorkspace();const [loading,setLoading]=useState(false);const [error,setError]=useState('');const controller=useRef<AbortController|null>(null);const sequence=useRef(0);const activeId=useRef(activeDraft.id);activeId.current=activeDraft.id;
  useEffect(()=>{controller.current?.abort();sequence.current++;setLoading(false);setError('');return()=>{controller.current?.abort();sequence.current++;};},[activeDraft.id]);
  async function analyze(svg:string,fileName:string,isExample:boolean,options?:{confirmedWidthMm?:number;operations?:Record<string,Operation>}){
    const id=activeId.current;const request=++sequence.current;controller.current?.abort();const abort=new AbortController();controller.current=abort;setLoading(true);setError('');
    try{
      const response=await fetch(`${import.meta.env.VITE_GEOMETRY_URL||'/geometry'}/analyze`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({svg,fileName,...options}),signal:abort.signal});
      const body=await response.json();if(!response.ok)throw new Error(body.message||'No se pudo analizar el SVG.');
      const analysis=analysisSchema.parse(body.data);
      if(request!==sequence.current||id!==activeId.current)return;
      try{await saveSource(analysis.sourceHash,svg);}catch{setError('Las medidas se calcularon, pero no se guardó el archivo original. Conserva una copia del SVG.');}
      if(request!==sequence.current||id!==activeId.current)return;
      actions.patchDraft({analysis,isExample});
    }catch(e){if(!abort.signal.aborted&&request===sequence.current)setError(e instanceof Error&&e.message!=='Failed to fetch'?e.message:'El analizador no está disponible. Inicia el proyecto con npm run dev y vuelve a cargar el SVG.');}
    finally{if(request===sequence.current)setLoading(false);}
  }
  async function upload(file:File){if(file.size>2_000_000){setError('El SVG debe ocupar menos de 2 MB. Divide el diseño antes de cargarlo.');return;}if(!/\.svg$/i.test(file.name)){setError('Selecciona un archivo SVG. Los formatos PDF, AI y EPS se incorporarán en otra etapa.');return;}await analyze(await file.text(),file.name,false);}
  async function example(){try{const response=await fetch('/samples/geometria-demo.svg');if(!response.ok)throw Error();await analyze(await response.text(),'geometria-demo.svg',true);}catch{setError('No se pudo abrir el ejemplo. Recarga la página e inténtalo de nuevo.');}}
  async function reanalyze(options:{confirmedWidthMm?:number;operations?:Record<string,Operation>}){
    if(!activeDraft.analysis)return;
    try{const source=await getSource(activeDraft.analysis.sourceHash);if(!source){setError('Vuelve a cargar el SVG original para modificar su escala u operaciones.');return;}
      const operations=Object.fromEntries(activeDraft.analysis.contours.map(c=>[c.elementId,c.operation]));
      await analyze(source,activeDraft.analysis.fileName,activeDraft.isExample,{operations,confirmedWidthMm:activeDraft.analysis.scaleSource==='operator'?activeDraft.analysis.widthMm:undefined,...options});
    }catch{setError('No se pudo recuperar el SVG original. Vuelve a cargar el archivo.');}
  }
  return {loading,error,upload,example,reanalyze,clearError:()=>setError('')};
}

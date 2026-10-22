import { useEffect, useMemo, useState } from 'react';
import { materialPlanResponseSchema, materialPlanRequestSchema, type MaterialPlanResponse, type QuoteDraft, type Workspace } from '@taller/contracts';

export function useMaterialPlan(draft:QuoteDraft,state:Workspace){
  const prepared=useMemo(()=>{
    const analysis=draft.analysis;
    const ids=[...new Set([draft.frontMaterialId,draft.backMaterialId,draft.edgeMaterialId].filter(Boolean))];
    const materials=ids.map(id=>state.materials.find(item=>item.id===id)).filter((item):item is NonNullable<typeof item>=>Boolean(item));
    if(!analysis||!analysis.scaleConfirmed||!materials.length)return {key:'',missing:['Sube un SVG con escala confirmada y asigna el material que quieres revisar.']};
    const profiles=materials.flatMap(material=>{
      const matches=state.profiles.filter(profile=>profile.materialId===material.id);
      const selected=draft.costs.profileSelections[material.id];
      const profile=selected?matches.find(item=>item.id===selected):matches.length===1?matches[0]:undefined;
      if(matches.length!==1&&!profile)return [];
      return profile?[{materialId:material.id,profileId:profile.id,name:profile.name,kerfMm:profile.kerfMm,spacingMm:profile.spacingMm,ratePerMeter:profile.ratePerMeter,setupCost:profile.setupCost,minimumCost:profile.minimumCost}]:[];
    });
    const payload={analysis,materials:materials.map(m=>({materialId:m.id,name:`${m.name} · ${m.color} · ${m.thicknessMm} mm`,widthMm:m.widthMm,heightMm:m.heightMm,marginMm:m.marginMm,directional:m.directional,purchasePrice:m.purchasePrice})),profiles,frontMaterialId:draft.frontMaterialId,backMaterialId:draft.backMaterialId||null,edgeMaterialId:draft.edgeMaterialId,depthMm:draft.depthMm,minReusableOffcutMm:state.settings.minLinearOffcutMm};
    const parsed=materialPlanRequestSchema.safeParse(payload);
    return parsed.success?{key:JSON.stringify(parsed.data),missing:[] as string[]}:{key:'',missing:['Completa la configuración geométrica de materiales y perfiles.']};
  },[draft.analysis,draft.frontMaterialId,draft.backMaterialId,draft.edgeMaterialId,draft.depthMm,draft.costs.profileSelections,state.materials,state.profiles,state.settings.minLinearOffcutMm]);
  const [attempt,setAttempt]=useState(0);const [response,setResponse]=useState<{key:string;data:MaterialPlanResponse|null;error:string}>({key:'',data:null,error:''});
  useEffect(()=>{if(!prepared.key)return;const key=prepared.key;const controller=new AbortController();let current=true;const timer=setTimeout(async()=>{try{const result=await fetch('/geometry/plan',{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},body:key,signal:AbortSignal.any([controller.signal,AbortSignal.timeout(10000)])});const json=await result.json().catch(()=>null);if(!result.ok)throw new Error(json?.message||'No se pudo calcular el aprovechamiento de planchas.');const data=materialPlanResponseSchema.parse(json.data);if(current)setResponse({key,data,error:''});}catch(error){if(current&&!controller.signal.aborted)setResponse({key,data:null,error:error instanceof Error?error.message:'No se pudo calcular el plano.'});}},150);return()=>{current=false;clearTimeout(timer);controller.abort();};},[prepared.key,attempt]);
  const matches=Boolean(prepared.key)&&response.key===prepared.key;
  return {plan:matches?response.data:null,missing:prepared.missing,error:matches?response.error:'',loading:Boolean(prepared.key)&&!matches,retry:()=>{setResponse({key:'',data:null,error:''});setAttempt(value=>value+1);}};
}

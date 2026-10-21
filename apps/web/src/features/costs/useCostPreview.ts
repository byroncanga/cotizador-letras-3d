import { useEffect, useMemo, useState } from 'react';
import { costPreviewSchema, costPreviewRequestSchema, decimalInputSchema, type CostPreview, type MaterialPlanResponse, type QuoteDraft, type Workspace } from '@taller/contracts';
import { supplyQuantity } from './supplyConsumption';
import { totalLedRouteMeters } from '../quote/ledConsumption';
export function geometryCostKey(draft:QuoteDraft){const a=draft.analysis;return a?`${a.sourceHash}:${a.widthMm}:${a.heightMm}:${a.metrics.assignedCutLengthMm}:${a.metrics.closedLengthMm}:${draft.depthMm}:${draft.frontMaterialId}:${draft.backMaterialId}:${draft.edgeMaterialId}`:'';}
export function useCostPreview(draft:QuoteDraft,state:Workspace,plan:MaterialPlanResponse|null,planLoading=false,planMissing:string[]=[]){
  const prepared=useMemo(()=>{
    const missing:string[]=[];const cost=draft.costs;const settings=state.settings.costing;const a=draft.analysis;
    if(!a?.scaleConfirmed||a.issues.some(issue=>issue.severity==='blocking'))missing.push('Valida el SVG y su escala.');
    if(draft.isExample)missing.push('Carga el diseño final del cliente para calcular un precio comercial.');
    if(!plan&&!planLoading)missing.push(...(planMissing.length?planMissing:['No se pudo generar un plano de materiales válido.']));
    if(planLoading)missing.push('Calculando planchas, tiras y frentes desde el SVG.');
    if(plan?.blocking.length)missing.push(...plan.blocking);
    const valid=(value:string|null|undefined)=>value!==null&&value!==undefined&&decimalInputSchema.safeParse(value).success;
    const materials=(plan?.plans||[]).map(item=>{
      const quantity=draft.billingMode==='full_sheet'?String(item.sheetCount):item.sheetAreaMm2>0?(item.usedAreaMm2/item.sheetAreaMm2).toFixed(6):'0';
      const price=item.unitPrice;
      if(item.sheetCount===0||!valid(quantity)||Number(quantity)<=0)missing.push(`No se pudo calcular la cantidad de plancha para ${item.materialName}.`);
      if(!valid(price))missing.push(`Configura el precio por plancha de ${item.materialName}.`);
      return {label:item.materialName,quantity:quantity||'0',unitPrice:price??''};
    });
    const profiles=new Map(state.profiles.map(profile=>[profile.id,profile]));const cutAmounts=new Map<string,number>();
    for(const item of plan?.plans||[]){if(!item.profileId)continue;const profile=profiles.get(item.profileId);if(!profile)continue;let length=0;
      const placements=item.sheets.flatMap(sheet=>sheet.placements);
      length+=placements.filter(place=>place.component==='front'||place.component==='back').reduce((sum,place)=>sum+(a?.contours.filter(contour=>place.contourIds.includes(contour.id)&&contour.operation==='cut'&&!contour.duplicateOf).reduce((subtotal,contour)=>subtotal+contour.lengthMm,0)||0),0);
      cutAmounts.set(item.profileId,(cutAmounts.get(item.profileId)||0)+length/1000);
    }
    const cuts=[...cutAmounts].map(([profileId,length])=>{const profile=profiles.get(profileId);if(!profile||![profile.ratePerMeter,profile.setupCost,profile.minimumCost].every(valid))missing.push(`Completa tarifa por metro, preparación y mínimo del perfil ${profile?.name||profileId}.`);if(length<=0)missing.push(`El recorrido calculado para ${profile?.name||'perfil de corte'} está vacío.`);return {profileId,label:profile?.name||'Corte calculado desde el SVG',lengthMeters:length.toFixed(6),ratePerMeter:profile?.ratePerMeter??'',setupCost:profile?.setupCost??'',minimumCost:profile?.minimumCost??''};});
    if(!cuts.length)missing.push('Selecciona y configura un perfil de máquina para cada material utilizado.');
    if(!cost.noLabor&&!cost.labor.length)missing.push('Añade operaciones de mano de obra o confirma que no se cobra.');
    const labor=cost.noLabor?[]:cost.labor.map(line=>{const rate=settings.laborRates.find(item=>item.id===line.rateId);if(!rate||!valid(rate.ratePerHour)||!valid(line.minutes)||Number(line.minutes)<=0||!valid(line.complexity)||Number(line.complexity)<1||Number(line.complexity)>100)missing.push('Completa operación, tarifa por hora, minutos y factor de mano de obra.');return {label:rate?.name||'Mano de obra',ratePerHour:rate?.ratePerHour??'',minutes:line.minutes??'',complexity:line.complexity};});
    const fields=[['vinylCost','Vinil de cantos',cost.vinylCost],['indirectCost','Costos indirectos',settings.indirectCost],['markupPercent','Ganancia sobre costo',settings.markupPercent],['taxPercent','Impuesto',settings.taxPercent],['commercialMinimum','Precio mínimo',settings.commercialMinimum]] as const;
    for(const [,label,value] of fields)if(!valid(value))missing.push(`Configura ${label.toLowerCase()} (0 si corresponde).`);
    if(settings.taxPercent!==null&&Number(settings.taxPercent)>100)missing.push('Revisa el porcentaje de impuesto.');
    const supplies=(settings.supplies||[]).flatMap(rate=>{const automatic=supplyQuantity(rate,a);const quantity=rate.consumptionMode==='per_edge_meter'?automatic:rate.id in (cost.supplyQuantities||{})?cost.supplyQuantities[rate.id]:rate.defaultQuantity;if(!valid(quantity)){missing.push(rate.consumptionMode==='per_edge_meter'?`Configura el consumo por metro de ${rate.name}.`:`Indica la cantidad de ${rate.name}.`);return [];}if(Number(quantity)===0)return [];if(!valid(rate.unitPrice))missing.push(`Configura el precio por ${rate.unit} de ${rate.name}.`);return [{label:`${rate.name} (${quantity} ${rate.unit})`,quantity:quantity!,unitPrice:rate.unitPrice??''}];});
    if(draft.lightVariantId){const light=state.lights.find(item=>item.id===draft.lightVariantId);if(!light)missing.push('Selecciona una configuración válida de luces LED.');else{const meters=totalLedRouteMeters(draft.ledRoutes,a);const rate=settings.ledRates[light.id];if(!valid(rate))missing.push(`Configura el costo por metro de ruta LED para ${light.name} en Costos generales.`);if(meters<=0)missing.push('Dibuja la ruta LED dentro de las letras para calcular sus metros.');if(meters>0&&valid(rate))supplies.push({label:`Ruta LED ${light.name} · ${meters.toFixed(6)} m`,quantity:meters.toFixed(6),unitPrice:rate!});}}
    const payload={materials,cuts,labor,supplies,noLabor:cost.noLabor,vinylCost:cost.vinylCost,...Object.fromEntries(fields.slice(1).map(([key,,value])=>[key,value]))};
    const request=missing.length?null:costPreviewRequestSchema.safeParse(payload);if(request&&!request.success)missing.push('Revisa el formato y la longitud de los datos de costos.');
    return {missing:[...new Set(missing)],key:request?.success?JSON.stringify(request.data):''};
  },[draft,state.profiles,state.lights,state.settings.costing,plan,planLoading,planMissing]);
  const [attempt,setAttempt]=useState(0);const [response,setResponse]=useState<{key:string;data:CostPreview|null;error:string}>({key:'',data:null,error:''});
  useEffect(()=>{if(!prepared.key)return;const key=prepared.key;const controller=new AbortController();let current=true;const timer=setTimeout(async()=>{try{const result=await fetch('/local/cost-preview',{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},body:key,signal:AbortSignal.any([controller.signal,AbortSignal.timeout(8000)])});const json=await result.json().catch(()=>null);if(!result.ok)throw new Error(result.status===422?Object.values(json?.errors||{}).flat().join(' ')||'Revisa los campos de costos.':'No se pudo calcular en Laravel. Inicia la aplicación con npm run dev.');const data=costPreviewSchema.parse(json.data);if(current)setResponse({key,data,error:''});}catch(error){if(current&&!controller.signal.aborted)setResponse({key,data:null,error:error instanceof Error&&error.name==='TimeoutError'?'Laravel tardó demasiado. Reintenta el cálculo.':error instanceof Error?error.message:'No se pudo calcular el precio.'});}},250);return()=>{current=false;clearTimeout(timer);controller.abort();};},[prepared.key,attempt]);
  const matches=Boolean(prepared.key)&&response.key===prepared.key;return {missing:prepared.missing,data:matches?response.data:null,error:matches?response.error:'',retry:()=>{setResponse({key:'',data:null,error:''});setAttempt(value=>value+1);},loading:Boolean(prepared.key)&&!matches};
}

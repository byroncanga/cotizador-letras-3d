import type { SvgAnalysis, MaterialPlanResponse, StockSheet, StockPlacement } from '@taller/contracts';
export interface PlanMaterial {materialId:string;name:string;widthMm:number;heightMm:number;marginMm:number|null;directional:boolean}
export interface PlanProfile {materialId:string;profileId:string;name:string;kerfMm:number|null;spacingMm:number|null;ratePerMeter:string|null;setupCost:string|null;minimumCost:string|null}
export interface StockPlanInput {analysis:SvgAnalysis;prices:Record<string,string|null>;materials:PlanMaterial[];profiles:PlanProfile[];frontMaterialId:string;backMaterialId:string|null;edgeMaterialId:string;depthMm:number;minReusableOffcutMm:number}
interface Part {id:string;label:string;component:'front'|'back';width:number;height:number;area:number;contourIds:string[];rotatable:boolean}
interface FreeRect {x:number;y:number;width:number;height:number}
interface MutableSheet {index:number;width:number;height:number;stripCount:number;placements:StockPlacement[];free:FreeRect[];used:number}
const eps=1e-7;
function splitFree(node:FreeRect,used:FreeRect):FreeRect[]{
 if(used.x>=node.x+node.width-eps||used.x+used.width<=node.x+eps||used.y>=node.y+node.height-eps||used.y+used.height<=node.y+eps)return [node];
 const result:FreeRect[]=[];
 if(used.x>node.x+eps)result.push({x:node.x,y:node.y,width:used.x-node.x,height:node.height});
 if(used.x+used.width<node.x+node.width-eps)result.push({x:used.x+used.width,y:node.y,width:node.x+node.width-used.x-used.width,height:node.height});
 if(used.y>node.y+eps)result.push({x:node.x,y:node.y,width:node.width,height:used.y-node.y});
 if(used.y+used.height<node.y+node.height-eps)result.push({x:node.x,y:used.y+used.height,width:node.width,height:node.y+node.height-used.y-used.height});
 return result.filter(r=>r.width>eps&&r.height>eps);
}
function contains(a:FreeRect,b:FreeRect){return b.x>=a.x-eps&&b.y>=a.y-eps&&b.x+b.width<=a.x+a.width+eps&&b.y+b.height<=a.y+a.height+eps;}
function place(sheet:MutableSheet,part:Part,gap:number):boolean{
 let best:{rect:FreeRect;w:number;h:number;rotation:0|90;score:number}|null=null;
 for(const r of sheet.free){for(const rotation of (part.rotatable?[0,90] as const:[0] as const)){
  const rawW=rotation===0?part.width:part.height,rawH=rotation===0?part.height:part.width,w=rawW+gap,h=rawH+gap;
  if(w>r.width+eps||h>r.height+eps)continue;
  const score=Math.min(r.width-w,r.height-h)*1000000+Math.max(r.width-w,r.height-h);
  if(!best||score<best.score)best={rect:r,w,h,rotation,score};
 }}
 if(!best)return false;
 const area={x:best.rect.x,y:best.rect.y,width:best.w,height:best.h};let next=sheet.free.flatMap(r=>splitFree(r,area));
 next=next.filter((r,i)=>!next.some((other,j)=>i!==j&&contains(other,r)));sheet.free=next;
 const actualW=best.rotation===0?part.width:part.height,actualH=best.rotation===0?part.height:part.width;
 sheet.placements.push({id:part.id,label:part.label,component:part.component,xMm:area.x+gap/2,yMm:area.y+gap/2,widthMm:actualW,heightMm:actualH,rotation:best.rotation,contourIds:part.contourIds});sheet.used+=part.area;return true;
}
function optimizeFaces(parts:Part[],seed:MutableSheet[],width:number,height:number,margin:number,gap:number):{sheets:MutableSheet[];blocking:string[]}{
 const orders:Array<(a:Part,b:Part)=>number>=[
  (a,b)=>Math.max(b.width,b.height)-Math.max(a.width,a.height)||b.area-a.area,
  (a,b)=>b.area-a.area||Math.max(b.width,b.height)-Math.max(a.width,a.height),
  (a,b)=>Math.max(b.width,b.height)-Math.max(a.width,a.height)||Math.min(b.width,b.height)-Math.min(a.width,a.height),
  (a,b)=>b.height-a.height||b.width-a.width||b.area-a.area,
  (a,b)=>b.width-a.width||b.height-a.height||b.area-a.area,
  (a,b)=>Math.min(b.width,b.height)-Math.min(a.width,a.height)||b.area-a.area,
 ];
 let best:{sheets:MutableSheet[];blocking:string[];score:number}|null=null;
 for(const compare of orders){
  const sheets=seed.map(sheet=>({...sheet,placements:[...sheet.placements],free:sheet.free.map(rect=>({...rect}))}));const blocking:string[]=[];
  for(const part of [...parts].sort(compare)){
   let packed=sheets.some(sheet=>place(sheet,part,gap));
   while(!packed&&sheets.length<200){const sheet:MutableSheet={index:sheets.length+1,width,height,stripCount:0,placements:[],free:[{x:margin,y:margin,width:width-2*margin,height:height-2*margin}],used:0};sheets.push(sheet);packed=place(sheet,part,gap);if(!packed){blocking.push(`«${part.label}» excede la presentación de plancha configurada.`);break;}}
  }
  const score=sheets.reduce((sum,sheet)=>sum+sheet.free.reduce((area,rect)=>area+rect.width*rect.height*rect.width*rect.height,0),0);
  if(!best||sheets.length<best.sheets.length||sheets.length===best.sheets.length&&score>best.score)best={sheets,blocking,score};
 }
 return best?{sheets:best.sheets,blocking:best.blocking}:{sheets:seed,blocking:[]};
}
function stripSegments(analysis:SvgAnalysis):{contourId:string;lengthMm:number;jointSuggestedBeforeMm:number|null}[]{
 const out:{contourId:string;lengthMm:number;jointSuggestedBeforeMm:number|null}[]=[];
 for(const contour of analysis.contours.filter(c=>c.closed&&!c.duplicateOf&&c.operation==='cut').sort((a,b)=>b.lengthMm-a.lengthMm)){
  const count=Math.max(1,Math.ceil(contour.lengthMm/1200));const segment=contour.lengthMm/count;
  for(let i=0;i<count;i++)out.push({contourId:contour.id,lengthMm:segment,jointSuggestedBeforeMm:i?segment*i:null});
 }
 return out.sort((a,b)=>b.lengthMm-a.lengthMm);
}
function packStrips(segments:{contourId:string;lengthMm:number;jointSuggestedBeforeMm:number|null}[]):{segments:typeof segments;used:number}[]{
 const bins:{segments:typeof segments;used:number}[]=[];
 for(const segment of segments){const bin=bins.filter(item=>item.used+segment.lengthMm<=1200+eps).sort((a,b)=>b.used-a.used)[0];if(bin){bin.segments.push(segment);bin.used+=segment.lengthMm;}else bins.push({segments:[segment],used:segment.lengthMm});}
 return bins;
}
function toPlan(input:StockPlanInput):MaterialPlanResponse{
 const globalBlocking:string[]=[];const materials=new Map(input.materials.map(item=>[item.materialId,item]));
 const assigned=new Map<string,{faces:Part[];edge:boolean}>();
 const append=(materialId:string,part:Part|null,edge=false)=>{const group=assigned.get(materialId)||{faces:[],edge:false};if(part)group.faces.push(part);if(edge)group.edge=true;assigned.set(materialId,group);};
 const front=materials.get(input.frontMaterialId),edge=materials.get(input.edgeMaterialId),back=input.backMaterialId?materials.get(input.backMaterialId):null;
 if(!input.analysis.scaleConfirmed||input.analysis.status!=='geometry_valid'||input.analysis.metrics.netAreaMm2===null)globalBlocking.push('Valida la escala, el área y todas las observaciones del SVG.');
 if(!front||!edge||input.backMaterialId&&!back)globalBlocking.push('Asigna variantes disponibles para frente, fondo y cantos.');
 if(front)for(const p of input.analysis.pieces)append(front.materialId,{id:`${p.id}:frente`,label:`${p.name} · frente`,component:'front',width:p.widthMm,height:p.heightMm,area:p.areaMm2,contourIds:p.contourIds,rotatable:!front.directional});
 if(back)for(const p of input.analysis.pieces)append(back.materialId,{id:`${p.id}:fondo`,label:`${p.name} · fondo`,component:'back',width:p.widthMm,height:p.heightMm,area:p.areaMm2,contourIds:p.contourIds,rotatable:!back.directional});
 if(edge)append(edge.materialId,null,true);
 if(!input.analysis.pieces.length)globalBlocking.push('El SVG no contiene caras cerradas listas para anidar.');
 const segments=stripSegments(input.analysis),bins=packStrips(segments);
 const plans:MaterialPlanResponse['plans']=[];
 for(const [materialId,group] of assigned){
  const material=materials.get(materialId);const blocking:string[]=[];if(!material)continue;
  const profileChoices=input.profiles.filter(p=>p.materialId===materialId&&p.kerfMm!==null&&p.spacingMm!==null);
  if(!profileChoices.length)blocking.push(`Configura kerf y separación para «${material.name}».`);
  if(profileChoices.length>1)blocking.push(`Selecciona el perfil de máquina para «${material.name}».`);
  const profile=profileChoices[0];const margin=material.marginMm;
  if(margin===null)blocking.push(`Define el margen de plancha para «${material.name}».`);
  const m=margin??0,gap=profile?profile.kerfMm!+profile.spacingMm!:0;
  const useEdges=group.edge,materialStrips=useEdges?bins:[];const count=materialStrips.length;
  const separation=gap;const usableHeight=material.heightMm-2*m;const laneCapacity=input.depthMm>0?Math.max(0,Math.floor((usableHeight+separation+eps)/(input.depthMm+separation))):0;
  if(useEdges&&laneCapacity===0)blocking.push(`No cabe una tira de ${input.depthMm} mm de ancho en «${material.name}».`);
  const sheetCountForStrips=useEdges&&laneCapacity?Math.ceil(count/laneCapacity):0;
  const sheets:MutableSheet[]=[];let laneIndex=0;
  for(let i=0;i<sheetCountForStrips;i++){
   const lanes=Math.min(laneCapacity,count-laneIndex);const band=lanes*input.depthMm+Math.max(0,lanes-1)*separation;
   const placements:StockPlacement[]=materialStrips.slice(laneIndex,laneIndex+lanes).map((bin,j)=>({id:`tira-${laneIndex+j+1}`,label:`Tira 1200 mm · ${bin.segments.length} tramo(s)`,component:'edge',xMm:0,yMm:m+j*(input.depthMm+separation),widthMm:material.widthMm,heightMm:input.depthMm,rotation:0,contourIds:bin.segments.map(s=>s.contourId)}));
   const usableW=material.widthMm-2*m,freeH=usableHeight-band-separation;const sheet:MutableSheet={index:i+1,width:material.widthMm,height:material.heightMm,stripCount:lanes,placements,free:freeH>eps&&usableW>eps?[{x:m,y:m+band+separation,width:usableW,height:freeH}]:[],used:placements.length*material.widthMm*input.depthMm};sheets.push(sheet);laneIndex+=lanes;
  }
  const optimized=optimizeFaces(group.faces,sheets,material.widthMm,material.heightMm,m,gap);sheets.splice(0,sheets.length,...optimized.sheets);blocking.push(...optimized.blocking);
  if(sheets.length>=200)blocking.push('El plano supera el límite de 200 planchas por variante.');
  const sheetArea=material.widthMm*material.heightMm;const sheetPlans:StockSheet[]=sheets.map(sheet=>({index:sheet.index,widthMm:sheet.width,heightMm:sheet.height,stripCount:sheet.stripCount,placements:sheet.placements,usedAreaMm2:Math.min(sheetArea,sheet.used),scrapAreaMm2:Math.max(0,sheetArea-sheet.used),utilizationPercent:sheetArea?Math.min(100,sheet.used/sheetArea*100):0}));
  plans.push({materialId,materialName:material.name,profileId:profile?.profileId??null,unitPrice:input.prices[materialId]??null,sheetCount:sheets.length,sheetAreaMm2:sheetArea,usedAreaMm2:group.faces.reduce((sum,p)=>sum+p.area,0)+materialStrips.reduce((sum,b)=>{const tail=Math.max(0,1200-b.used);return sum+(b.used+(tail+eps<input.minReusableOffcutMm?tail:0))*input.depthMm;},0),stripsRequired:count,stripLengthMm:1200,stripDepthMm:useEdges?input.depthMm:0,faceCount:group.faces.length,reusableOffcutsMm:useEdges?materialStrips.map(bin=>Math.max(0,1200-bin.used)).filter(length=>length+eps>=input.minReusableOffcutMm):[],discardedOffcutMm:useEdges?materialStrips.map(bin=>Math.max(0,1200-bin.used)).filter(length=>length+eps<input.minReusableOffcutMm).reduce((sum,length)=>sum+length,0):0,sheets:sheetPlans,cutSegments:useEdges?segments:[],blocking});
  globalBlocking.push(...blocking);
 }
 return {version:'1.0',sourceHash:input.analysis.sourceHash,plans,blocking:[...new Set(globalBlocking)]};
}
export {toPlan};

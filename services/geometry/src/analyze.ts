import { DOMParser, type Element } from '@xmldom/xmldom';
import svgpath from 'svgpath';
import paper from 'paper';
import { svgPathProperties } from 'svg-path-properties';
import { createHash } from 'node:crypto';
import type { Contour, GeometryIssue, Operation, SvgAnalysis } from '@taller/contracts';

export interface AnalysisInput { svg:string; fileName:string; confirmedWidthMm?:number; operations?:Record<string,Operation> }
const MAX_BYTES=2_000_000, MAX_CONTOURS=300, MAX_SEGMENTS=12_000;
const factor:Record<string,number>={mm:1,cm:10,in:25.4,pt:25.4/72,pc:25.4/6,px:25.4/96};
const operationNames:Record<string,Operation>={cut:'cut',corte:'cut',engrave:'engrave',grabado:'engrave',mark:'mark',marcado:'mark'};
const number=(v:string|null)=>{
  if(!v)return 0;
  if(/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(v.trim()))return Number(v);
  const mm=physical(v);
  if(mm!==null)return mm*96/25.4;
  throw new Error('Convierte las medidas porcentuales o relativas de las formas SVG a contornos con dimensiones explícitas.');
};
function splitPaths(d:string):string[]{const result:string[]=[];let current='';svgpath(d).abs().iterate(segment=>{if(segment[0]==='M'&&current){result.push(current);current='';}current+=segment[0]+segment.slice(1).join(' ')+' ';});if(current)result.push(current);return result;}
function physical(value:string|null):number|null {
  if(!value) return null;
  const m=value.trim().match(/^([+]?(?:\d+\.?\d*|\.\d+))(mm|cm|in|pt|pc|px)$/i);
  return m&&Number(m[1])>0?Number(m[1])*factor[m[2].toLowerCase()]:null;
}
function shapePath(node:Element):string|null {
  const a=(key:string)=>number(node.getAttribute(key));
  switch(node.localName){
    case 'path': return node.getAttribute('d');
    case 'rect': {
      const x=a('x'),y=a('y'),w=a('width'),h=a('height');
      if(w<=0||h<=0)return null;
      const rx=Math.min(w/2,Math.max(0,a('rx')||a('ry'))),ry=Math.min(h/2,Math.max(0,a('ry')||a('rx')));
      return rx&&ry?`M${x+rx} ${y}H${x+w-rx}A${rx} ${ry} 0 0 1 ${x+w} ${y+ry}V${y+h-ry}A${rx} ${ry} 0 0 1 ${x+w-rx} ${y+h}H${x+rx}A${rx} ${ry} 0 0 1 ${x} ${y+h-ry}V${y+ry}A${rx} ${ry} 0 0 1 ${x+rx} ${y}Z`:`M${x} ${y}h${w}v${h}h${-w}Z`;
    }
    case 'circle':case 'ellipse': {
      const cx=a('cx'),cy=a('cy'),rx=node.localName==='circle'?a('r'):a('rx'),ry=node.localName==='circle'?a('r'):a('ry');
      return rx>0&&ry>0?`M${cx-rx} ${cy}a${rx} ${ry} 0 1 0 ${rx*2} 0a${rx} ${ry} 0 1 0 ${-rx*2} 0Z`:null;
    }
    case 'line':return `M${a('x1')} ${a('y1')}L${a('x2')} ${a('y2')}`;
    case 'polygon':case 'polyline': {
      const points=(node.getAttribute('points')||'').trim().split(/[\s,]+/).map(Number);
      if(points.length<4||points.length%2||points.some(v=>!Number.isFinite(v))) throw new Error('Hay una lista de puntos inválida en el SVG.');
      return `M${points[0]} ${points[1]}${points.slice(2).map((v,i)=>i%2?' '+v:'L'+v).join('')}${node.localName==='polygon'?'Z':''}`;
    }
    default:return null;
  }
}

export function analyzeSvg(input:AnalysisInput):SvgAnalysis {
  if(typeof input.svg!=='string'||Buffer.byteLength(input.svg)>MAX_BYTES) throw new Error('El SVG debe ocupar menos de 2 MB.');
  if(/<!DOCTYPE|<!ENTITY/i.test(input.svg))throw new Error('No se permiten declaraciones DTD ni entidades externas. Exporta un SVG simple.');
  if(input.confirmedWidthMm!==undefined&&(!Number.isFinite(input.confirmedWidthMm)||input.confirmedWidthMm<=0||input.confirmedWidthMm>100_000))throw new Error('El ancho confirmado debe ser mayor que cero y no superar 100 000 mm.');
  const doc=new DOMParser({onError:(level,message)=>{if(level!=='warning')throw new Error(message);}}).parseFromString(input.svg,'image/svg+xml');
  const root=doc.documentElement;
  if(!root||root.localName!=='svg')throw new Error('El archivo debe tener un elemento SVG válido.');
  const issues:GeometryIssue[]=[];
  const issue=(code:string,message:string,elementId?:string,severity:'blocking'|'warning'='blocking')=>issues.push({code,message,elementId,severity});
  const vb=(root.getAttribute('viewBox')||'').trim().split(/[\s,]+/).map(Number);
  const hasVb=vb.length===4&&vb.every(Number.isFinite)&&vb[2]>0&&vb[3]>0;
  const pw=physical(root.getAttribute('width')),ph=physical(root.getAttribute('height'));
  const unitless=(v:string|null)=>v&&/^\d+(\.\d+)?$/.test(v)?Number(v):null;
  const vw=hasVb?vb[2]:pw?pw*96/25.4:unitless(root.getAttribute('width'))||100;
  const vh=hasVb?vb[3]:ph?ph*96/25.4:unitless(root.getAttribute('height'))||100;
  const physicalKnown=Boolean(pw||ph);
  let sx=pw?pw/vw:ph?ph/vh:1,sy=ph?ph/vh:sx;
  if(!pw&&ph)sx=sy;
  if(!hasVb&&physicalKnown)sx=sy=25.4/96;
  const aspect=root.getAttribute('preserveAspectRatio')||'xMidYMid meet';
  let tx=hasVb?-vb[0]*sx:0,ty=hasVb?-vb[1]*sy:0;
  if(pw&&ph&&!aspect.includes('none')){
    const s=aspect.includes('slice')?Math.max(sx,sy):Math.min(sx,sy);
    tx=(hasVb?-vb[0]*s:0)+(aspect.includes('xMin')?0:aspect.includes('xMax')?pw-vw*s:(pw-vw*s)/2);
    ty=(hasVb?-vb[1]*s:0)+(aspect.includes('YMin')?0:aspect.includes('YMax')?ph-vh*s:(ph-vh*s)/2);
    sx=sy=s;
  }
  if(!physicalKnown&&!input.confirmedWidthMm)issue('AMBIGUOUS_SCALE','Confirma el ancho físico del diseño para convertir sus medidas a milímetros.');
  const scope=new paper.PaperScope();scope.setup(new scope.Size(1,1));
  const paths:{path:paper.Path;contour:Contour;fillRule:string;filled:boolean;repairFailed:boolean}[]=[];
  let nodes=0,segments=0;
  const ids=new Set<string>();
  try{
    const walk=(node:Element,parentTransform:string,inheritedOperation:Operation,inheritedFill:string,inheritedRule:string)=>{
      if(++nodes>2500)throw new Error('El SVG supera el límite de 2500 elementos. Divide el diseño.');
      const tag=node.localName||node.tagName;
      if(tag==='svg'&&node!==root){issue('NESTED_VIEWPORT','Convierte los SVG anidados a un único conjunto de contornos antes de cotizar.');return;}
      if(['script','foreignObject','image','use','filter','clipPath','mask','text','style','symbol'].includes(tag)){
        issue(tag==='text'?'LIVE_TEXT':'UNSUPPORTED_ELEMENT',tag==='text'?'Convierte el texto a contornos antes de cotizar.':`El elemento «${tag}» necesita revisión o conversión a trazados simples.`);return;
      }
      if(['defs','title','desc','metadata','namedview'].includes(tag))return;
      for(let i=0;i<node.attributes.length;i++){
        const attr=node.attributes.item(i)!;
        if(/^on/i.test(attr.name)||/(^|:)href$/i.test(attr.name)||/url\s*\(/i.test(attr.value))throw new Error('El SVG contiene scripts o referencias no permitidas. Exporta solo contornos.');
      }
      const style=node.getAttribute('style')||'';
      if(/(?:^|;)\s*(?:display\s*:\s*none|visibility\s*:\s*hidden)/i.test(style)||node.getAttribute('display')==='none'||node.getAttribute('visibility')==='hidden')return;
      if(/(?:transform|clip-path|mask|filter)\s*:/i.test(style))issue('UNSUPPORTED_STYLE','Convierte las transformaciones CSS, máscaras y filtros a contornos antes de cotizar.');
      const transform=`${parentTransform} ${node.getAttribute('transform')||''}`;
      const label=(node.getAttribute('data-operation')||node.getAttribute('inkscape:label')||node.getAttribute('id')||'').toLowerCase().trim();
      const op=operationNames[label]||inheritedOperation;
      const fill=node.getAttribute('fill')||style.match(/(?:^|;)\s*fill\s*:\s*([^;]+)/)?.[1]?.trim()||inheritedFill;
      const fillRule=node.getAttribute('fill-rule')||style.match(/fill-rule\s*:\s*([^;]+)/)?.[1]?.trim()||inheritedRule;
      const d=shapePath(node);
      if(d){
        const rawId=node.getAttribute('id')||`elemento-${nodes}`;
        const elementId=ids.has(rawId)?`${rawId}-${nodes}`:rawId;ids.add(elementId);
        const normalized=svgpath(d).transform(transform).abs().unshort().toString();
        const sourcePaths=splitPaths(normalized);
        const shape=scope.PathItem.create(normalized);
        const rawChildren=shape instanceof scope.CompoundPath?shape.children as paper.Path[]:[shape as paper.Path];
        const children=rawChildren.flatMap((path,index)=>{
          if(!path.getCrossings(path).length)return [{path,sourcePath:sourcePaths[index]||path.pathData,repaired:false,repairFailed:false}];
          try{
            const repairedPath=path.unite(path,{insert:false});
            const repairedChildren=repairedPath instanceof scope.CompoundPath?repairedPath.children as paper.Path[]:[repairedPath as paper.Path];
            // Boolean resolution can leave floating-point slivers at near-tangent joins.
            // Drop only components below a scale-relative numerical area epsilon, then
            // require every retained manufacturing contour to be closed and simple.
            const numericalAreaEpsilon=Math.max(1,path.bounds.width*path.bounds.height)*1e-10;
            const usable=repairedChildren.filter(child=>child.closed&&child.length>0&&Math.abs(child.area)>numericalAreaEpsilon);
            if(usable.length&&usable.every(child=>child.getCrossings(child).length===0))return usable.map(child=>({path:child,sourcePath:child.pathData,repaired:true,repairFailed:false}));
          }catch{}
          return [{path,sourcePath:sourcePaths[index]||path.pathData,repaired:false,repairFailed:true}];
        });
        let repairedIndex=0;
        for(const normalizedPath of children){
          const path=normalizedPath.path;
          segments+=path.segments.length;
          if(paths.length>=MAX_CONTOURS||segments>MAX_SEGMENTS)throw new Error('El diseño es demasiado complejo para este análisis. Divide el diseño en archivos más pequeños.');
          if(!Number.isFinite(path.length)||path.length<=0)continue;
          const bounds=path.bounds;
          const sourcePath=normalizedPath.sourcePath;
          if(normalizedPath.repaired)issue('SELF_INTERSECTION_REPAIRED',`Se reparó automáticamente el contorno «${rawId}» y se conservaron sus regiones de corte.`,elementId,'warning');
          if(normalizedPath.repairFailed)issue('SELF_INTERSECTION',`«${rawId}» tiene cruces que no se pudieron corregir con seguridad. Revisa el trazado original.`,elementId);
          paths.push({path,fillRule:normalizedPath.repaired?'nonzero':fillRule,filled:normalizedPath.repaired||fill!=='none',repairFailed:normalizedPath.repairFailed,contour:{id:`${elementId}:${++repairedIndex}`,elementId,name:rawId,path:sourcePath,fillRule:normalizedPath.repaired?'nonzero':fillRule==='evenodd'?'evenodd':'nonzero',closed:path.closed,duplicateOf:null,operation:input.operations?.[elementId]||op,lengthMm:new svgPathProperties(sourcePath).getTotalLength(),signedAreaMm2:path.closed?path.area:0,bounds:{x:bounds.x,y:bounds.y,width:bounds.width,height:bounds.height}}});
        }
      }
      for(let child=node.firstChild;child;child=child.nextSibling)if(child.nodeType===1)walk(child as Element,transform,op,fill,fillRule);
    };
    walk(root,`matrix(${sx} 0 0 ${sy} ${tx} ${ty})`,'unassigned','black','nonzero');
    if(input.confirmedWidthMm&&paths.length){
      let union=paths[0].path.bounds.clone();for(const item of paths.slice(1))union=union.unite(item.path.bounds);
      if(union.width<=0)throw new Error('No se puede confirmar el ancho de un diseño sin extensión horizontal.');
      const scale=input.confirmedWidthMm/union.width;
      for(const item of paths){item.path.scale(scale,new scope.Point(0,0));const b=item.path.bounds;Object.assign(item.contour,{path:svgpath(item.contour.path).scale(scale).toString(),lengthMm:item.contour.lengthMm*scale,signedAreaMm2:item.path.closed?item.path.area:0,bounds:{x:b.x,y:b.y,width:b.width,height:b.height}});}
    }
    let area=0,pieces=0,areaReliable=true;const partAreas=new Map<string,number>();const partBounds=new Map<string,paper.Rectangle>();const partContourIds=new Map<string,string[]>();
    for(let i=0;i<paths.length;i++){
      const item=paths[i],c=item.contour;
      for(let j=0;j<i;j++)if(item.path.compare(paths[j].path)){c.duplicateOf=paths[j].contour.id;break;}
      if(c.duplicateOf){issue('DUPLICATE_PATH',`Se excluyó automáticamente el contorno duplicado «${c.name}».`,c.elementId,'warning');continue;}
      if(c.operation==='unassigned')issue('UNASSIGNED_OPERATION',`Asigna una operación a «${c.name}».`,c.elementId);
      if(!c.closed){issue('OPEN_PATH',`«${c.name}» está abierto; confirma su operación antes de fabricar.`,c.elementId);continue;}
      if(item.repairFailed||item.path.getCrossings(item.path).length){areaReliable=false;if(!item.repairFailed)issue('SELF_INTERSECTION',`«${c.name}» tiene cruces que no se pudieron corregir con seguridad. Revisa el trazado original.`,c.elementId);}
      const containers=paths.filter(other=>other!==item&&other.contour.closed&&!other.contour.duplicateOf&&Math.abs(other.path.area)>Math.abs(item.path.area)&&other.path.contains(item.path.interiorPoint));
      for(const other of paths.slice(0,i))if(!other.contour.duplicateOf&&other.contour.closed&&item.path.getCrossings(other.path).length){areaReliable=false;issue('OVERLAPPING_CONTOURS','Hay contornos que se cruzan. Revisa las piezas antes de calcular el área.',c.elementId);break;}
      const sameElement=containers.filter(other=>other.contour.elementId===c.elementId);
      const differentElement=containers.some(other=>other.contour.elementId!==c.elementId);
      if(differentElement){areaReliable=false;issue('NESTED_ELEMENTS','Hay elementos independientes uno dentro de otro. Confirma si son piezas o huecos.',c.elementId);}
      let contribution=Math.abs(item.path.area);
      if(item.fillRule==='evenodd'||!item.filled){contribution*=sameElement.length%2?-1:1;}
      else if(sameElement.length){
        const parent=sameElement.sort((a,b)=>Math.abs(a.path.area)-Math.abs(b.path.area))[0];
        contribution=Math.sign(parent.path.area)!==Math.sign(item.path.area)?-contribution:0;
      }
      area+=contribution;if(!differentElement){partAreas.set(c.elementId,(partAreas.get(c.elementId)||0)+contribution);partBounds.set(c.elementId,partBounds.has(c.elementId)?partBounds.get(c.elementId)!.unite(item.path.bounds):item.path.bounds.clone());partContourIds.set(c.elementId,[...(partContourIds.get(c.elementId)||[]),c.id]);}if(!sameElement.length&&!differentElement)pieces++;
    }
    if(!paths.length)issue('EMPTY_GEOMETRY','No se encontraron contornos medibles. Exporta el diseño como trazados SVG.');
    const contours=paths.map(item=>item.contour),unique=contours.filter(c=>!c.duplicateOf);
    const pieceData=[...partAreas].flatMap(([id,area])=>{const b=partBounds.get(id)!;const relevant=unique.filter(c=>c.elementId===id);if(area<=0||!relevant.some(c=>c.operation==='cut'))return [];return [{id,name:relevant[0]?.name||id,widthMm:b.width,heightMm:b.height,areaMm2:area,perimeterMm:relevant.filter(c=>c.closed).reduce((sum,c)=>sum+c.lengthMm,0),contourIds:partContourIds.get(id)||[]}];});
    const uniqueIssues=Array.from(new Map(issues.map(v=>[`${v.code}:${v.elementId||''}`,v])).values());
    let bounds=paths.length?paths[0].path.bounds.clone():new scope.Rectangle(0,0,vw,vh);for(const item of paths.slice(1))bounds=bounds.unite(item.path.bounds);
    return {version:'1.0',fileName:input.fileName.slice(0,200),sourceHash:createHash('sha256').update(input.svg).digest('hex'),scaleConfirmed:physicalKnown||Boolean(input.confirmedWidthMm),scaleSource:input.confirmedWidthMm?'operator':physicalKnown?'physical_units':'unknown',widthMm:bounds.width,heightMm:bounds.height,pieces:pieceData,viewBox:[bounds.x,bounds.y,Math.max(bounds.width,1),Math.max(bounds.height,1)],contours,metrics:{closedLengthMm:unique.filter(c=>c.closed).reduce((s,c)=>s+c.lengthMm,0),openLengthMm:unique.filter(c=>!c.closed).reduce((s,c)=>s+c.lengthMm,0),assignedCutLengthMm:unique.filter(c=>c.operation==='cut').reduce((s,c)=>s+c.lengthMm,0),duplicateLengthMm:contours.filter(c=>c.duplicateOf).reduce((s,c)=>s+c.lengthMm,0),netAreaMm2:areaReliable?Math.max(0,area):null,pieceCount:pieces,contourCount:contours.length,openCount:unique.filter(c=>!c.closed).length,duplicateCount:contours.filter(c=>c.duplicateOf).length},issues:uniqueIssues,status:uniqueIssues.some(i=>i.severity==='blocking')?'review_required':'geometry_valid'};
  } finally { scope.project.remove(); }
}

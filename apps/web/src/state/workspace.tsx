import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { workspaceSchema, quoteCostsSchema, costingSettingsSchema, componentColorsSchema, type Workspace, type QuoteDraft, type Material, type Supplier, type CutProfile, type LightVariant } from '@taller/contracts';

const KEY='taller.workspace.v1';
function newDraft(index:number):QuoteDraft{return {id:crypto.randomUUID(),number:`BOR-${String(index).padStart(3,'0')}`,title:'Letras corpóreas de acrílico',customer:'',depthMm:50,componentColors:componentColorsSchema.parse({}),printedElementIds:[],frontMaterialId:'',backMaterialId:'',edgeMaterialId:'',lightVariantId:'',ledRoutes:[],billingMode:'full_sheet',notes:'',costs:quoteCostsSchema.parse({}),analysis:null,isExample:false,updatedAt:new Date().toISOString()};}
function nextDraftNumber(drafts:QuoteDraft[]):number{return Math.max(0,...drafts.map(d=>Number(/^BOR-(\d+)$/.exec(d.number)?.[1]||0)))+1;}
function upgrade(data:unknown):unknown{
  if(!data||typeof data!=='object')return data;
  const raw=data as Record<string,unknown>;
  const withLights=Array.isArray(raw.lights)?raw:{...raw,lights:[{id:'light-normal-default',name:'Luz normal',kind:'normal',modulesPerMeter:'18',updatedAt:new Date().toISOString()}]};
  if(!raw.settings||typeof raw.settings!=='object')return withLights;
  const settings=withLights.settings as Record<string,unknown>;
  if(!settings.costing||typeof settings.costing!=='object')return withLights;
  const costing=settings.costing as Record<string,unknown>;
  if(!('markupPercent' in costing)){
    const margin=costing.marginPercent;const n=Number(margin);
    return {...withLights,settings:{...settings,costing:{...costing,markupPercent:margin!==null&&margin!==undefined&&Number.isFinite(n)&&n>=0&&n<100?String(Number((100*n/(100-n)).toFixed(6))):null}}};
  }
  return withLights;
}
function initial(key:string,allowLegacy:boolean):{workspace:Workspace;error:string|null}{
  try{const raw=localStorage.getItem(key)||(allowLegacy?localStorage.getItem(KEY):null);if(raw){const parsed=workspaceSchema.parse(upgrade(JSON.parse(raw)));return {workspace:parsed,error:null};}}
  catch{return {workspace:empty(),error:'No se pudo leer el guardado anterior. Descarga o recupera una copia antes de reemplazarlo.'};}
  return {workspace:empty(),error:null};
}
function empty():Workspace{const draft=newDraft(1);return {version:1,drafts:[draft],activeDraftId:draft.id,materials:[],lights:[{id:'light-normal-default',name:'Luz normal',kind:'normal',modulesPerMeter:'18',updatedAt:new Date().toISOString()}],suppliers:[],profiles:[],settings:{businessName:'',companyLogoDataUrl:null,validDays:null,minLinearOffcutMm:300,costing:costingSettingsSchema.parse({})}};}
interface Context {state:Workspace;actions:{patchDraft:(patch:Partial<QuoteDraft>)=>void;createDraft:()=>string;openDraft:(id:string)=>void;duplicateDraft:(id:string)=>void;removeDraft:(id:string)=>void;saveMaterial:(item:Material)=>void;saveLight:(item:LightVariant)=>void;removeLight:(id:string)=>void;saveSupplier:(item:Supplier)=>void;saveProfile:(item:CutProfile)=>void;patchSettings:(patch:Partial<Workspace['settings']>)=>void;restore:(data:unknown)=>void;persist:()=>void};meta:{saveStatus:'saved'|'saving'|'error';storageError:string|null;activeDraft:QuoteDraft;restoreWarning:string|null};}
const WorkspaceContext=createContext<Context|null>(null);
export function WorkspaceProvider({children,userId,isOwner}:{children:ReactNode;userId:number;isOwner:boolean}){
  const storageKey=`${KEY}.${userId}`;
  const [loaded]=useState(()=>initial(storageKey,isOwner));const [state,setState]=useState(loaded.workspace);const [storageError,setStorageError]=useState<string|null>(loaded.error);const [saveStatus,setSaveStatus]=useState<'saved'|'saving'|'error'>(loaded.error?'error':'saved');const [restoreWarning,setRestoreWarning]=useState(loaded.error);
  const initialRef=useRef(true);
  useEffect(()=>{if(state.settings.costing.markupPercent===undefined)setState(workspaceSchema.parse(upgrade(state)));},[state]);
  function persist(){try{localStorage.setItem(storageKey,JSON.stringify(state));setSaveStatus('saved');setStorageError(null);setRestoreWarning(null);}catch{setSaveStatus('error');setStorageError('El navegador no pudo guardar. Descarga una copia de tu espacio de trabajo.');}}
  useEffect(()=>{if(initialRef.current){initialRef.current=false;return;}if(restoreWarning)return;setSaveStatus('saving');const timer=setTimeout(()=>{try{localStorage.setItem(storageKey,JSON.stringify(state));setSaveStatus('saved');setStorageError(null);}catch{setSaveStatus('error');setStorageError('No se pudo guardar en este navegador. Descarga una copia de seguridad.');}},350);return()=>clearTimeout(timer);},[state,restoreWarning,storageKey]);
  const activeDraft=state.drafts.find(d=>d.id===state.activeDraftId)||state.drafts[0];
  const value:Context={state,meta:{saveStatus,storageError,activeDraft,restoreWarning},actions:{
    patchDraft:patch=>setState(s=>({...s,drafts:s.drafts.map(d=>d.id===s.activeDraftId?{...d,...patch,updatedAt:new Date().toISOString()}:d)})),
    createDraft:()=>{const draft=newDraft(nextDraftNumber(state.drafts));setState(s=>({...s,drafts:[draft,...s.drafts],activeDraftId:draft.id}));return draft.id;},
    openDraft:id=>setState(s=>({...s,activeDraftId:id})),
    duplicateDraft:id=>setState(s=>{const original=s.drafts.find(d=>d.id===id);if(!original)return s;const draft={...original,id:crypto.randomUUID(),number:`BOR-${String(nextDraftNumber(s.drafts)).padStart(3,'0')}`,title:`${original.title} (copia)`,updatedAt:new Date().toISOString()};return {...s,drafts:[draft,...s.drafts],activeDraftId:draft.id};}),
    removeDraft:id=>setState(s=>{const drafts=s.drafts.filter(d=>d.id!==id);if(!drafts.length)drafts.push(newDraft(1));return {...s,drafts,activeDraftId:s.activeDraftId===id?drafts[0].id:s.activeDraftId};}),
    saveMaterial:item=>setState(s=>({...s,materials:s.materials.some(i=>i.id===item.id)?s.materials.map(i=>i.id===item.id?item:i):[...s.materials,item]})),
    saveLight:item=>setState(s=>({...s,lights:s.lights.some(i=>i.id===item.id)?s.lights.map(i=>i.id===item.id?item:i):[...s.lights,item]})),
    removeLight:id=>setState(s=>({...s,lights:s.lights.filter(i=>i.id!==id),drafts:s.drafts.map(d=>d.lightVariantId===id?{...d,lightVariantId:'',updatedAt:new Date().toISOString()}:d)})),
    saveSupplier:item=>setState(s=>({...s,suppliers:s.suppliers.some(i=>i.id===item.id)?s.suppliers.map(i=>i.id===item.id?item:i):[...s.suppliers,item]})),
    saveProfile:item=>setState(s=>({...s,profiles:s.profiles.some(i=>i.id===item.id)?s.profiles.map(i=>i.id===item.id?item:i):[...s.profiles,item]})),
    patchSettings:patch=>setState(s=>({...s,settings:{...s.settings,...patch}})),
    restore:data=>{const validated=workspaceSchema.parse(upgrade(data));setRestoreWarning(null);setState(validated);},persist,
  }};
  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}
export function useWorkspace(){const value=useContext(WorkspaceContext);if(!value)throw new Error('Falta WorkspaceProvider.');return value;}

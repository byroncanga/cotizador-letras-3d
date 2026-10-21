export const num=(v:number,digits=3)=>new Intl.NumberFormat('es-EC',{minimumFractionDigits:0,maximumFractionDigits:digits}).format(v);
export const meters=(mm:number)=>new Intl.NumberFormat('es-EC',{minimumFractionDigits:6,maximumFractionDigits:6}).format(mm/1000);
export const money=(v:string|null)=>v===null?'Sin configurar':new Intl.NumberFormat('es-EC',{style:'currency',currency:'USD'}).format(Number(v));
export const date=(v:string)=>new Intl.DateTimeFormat('es-EC',{day:'2-digit',month:'short',year:'numeric',timeZone:'America/Guayaquil'}).format(new Date(v));
export function downloadJson(value:unknown,name:string){const url=URL.createObjectURL(new Blob([JSON.stringify(value,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}

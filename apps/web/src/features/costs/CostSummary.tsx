import { ArrowRight, ChevronDown, Coins, RefreshCw, Settings2, ShieldCheck } from 'lucide-react';
import { Badge, Button } from '../../components/ui';
import { money } from '../../lib/format';
import type { useCostPreview } from './useCostPreview';

type PreviewState=ReturnType<typeof useCostPreview>;
export function CostSummary({preview,onInputs,onSettings}:{preview:PreviewState;onInputs:()=>void;onSettings:()=>void}){
  const {data,missing,error,loading}=preview;
  const groups=data?[
    {label:'Materiales y vinil',amount:data.materialTotal,lines:[...data.materials,{label:'Vinil de cantos',amount:data.vinylCost}]},
    {label:'Corte y preparación',amount:data.cutTotal,lines:data.cuts},
    {label:'Insumos y energía',amount:data.suppliesTotal,lines:data.supplies},
    {label:'Mano de obra',amount:data.laborTotal,lines:data.labor},
    {label:'Costos indirectos',amount:data.indirectCost,lines:[{label:'Importe por trabajo',amount:data.indirectCost}]},
  ]:[];
  return <><div className="summary-price" aria-live="polite"><span>Total con impuestos</span><div>{data?money(data.total):'—'}{!data?<small>USD</small>:null}</div><Badge tone={data?'teal':'amber'}>{data?'Precio calculado':loading?'Calculando…':'Completa los costos'}</Badge><p>{data?'Precio calculado con planchas y recorridos derivados del SVG.':'El precio aparece al completar el plano, las tarifas y los costos del trabajo.'}</p></div><div className="summary-content">
    {error?<div className="cost-error" role="alert"><p>{error}</p><Button variant="secondary" onClick={preview.retry}><RefreshCw size={13}/>Reintentar cálculo</Button></div>:null}
    {missing.length?<section className="cost-pending"><h3><Coins size={14}/>Para calcular el precio</h3><ul>{missing.map(item=><li key={item}>{item}</li>)}</ul><Button variant="secondary" onClick={onInputs}>Completar costos del trabajo<ArrowRight size={13}/></Button></section>:null}
    {data?<><div className="cost-breakdown">{groups.map(group=><details key={group.label}><summary><span>{group.label}</span><b>{group.label==='Materiales y vinil'?money(data.materialAndVinylTotal):money(group.amount)}</b><ChevronDown size={13}/></summary><div className="cost-detail-lines">{group.lines.length?group.lines.map((line,index)=><div key={`${line.label}-${index}`}><span>{line.label}</span><b>{money(line.amount)}</b></div>):<p>{group.label==='Insumos y energía'?'No hay insumos adicionales configurados.':'Sin cobro de mano de obra en este trabajo.'}</p>}</div></details>)}</div><div className="summary-total"><span>Costo total</span><b>{money(data.totalCost)}</b></div><div className="summary-total subtle"><span>Ganancia sobre costo</span><b>{data.markupPercent} %</b></div>{data.minimumApplied?<p className="cost-help">Se aplicó el precio mínimo comercial.</p>:null}<div className="summary-total"><span>Venta sin impuestos</span><b>{money(data.net)}</b></div><div className="summary-total subtle"><span>Impuesto ({data.taxPercent} %)</span><b>{money(data.tax)}</b></div><div className="summary-total cost-grand-total"><span>Total a cobrar</span><b>{money(data.total)}</b></div></>:null}
  </div><div className="summary-bottom"><Button variant="secondary" onClick={onSettings}><Settings2 size={15}/>Configurar costos y tarifas<ArrowRight size={14}/></Button><span><ShieldCheck size={12}/>Borrador interno · cotización lista para exportar</span></div></>;
}

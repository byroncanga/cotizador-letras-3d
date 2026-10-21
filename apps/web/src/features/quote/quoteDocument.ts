import type { CostPreview, LightVariant, Material, QuoteDraft, Workspace } from '@taller/contracts';
import { money, num } from '../../lib/format';

export interface CommercialQuoteInput {
  draft: QuoteDraft;
  settings: Workspace['settings'];
  materials: Material[];
  lights: LightVariant[];
  preview: CostPreview;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!);
}

function materialLabel(materials: Material[], id: string): string {
  const material = materials.find(item => item.id === id);
  return material ? `${material.name} · ${num(material.thicknessMm)} mm` : 'Sin asignar';
}

export function openCommercialQuote({ draft, settings, materials, lights, preview }: CommercialQuoteInput): boolean {
  const printWindow = window.open('', '_blank', 'width=900,height=760');
  if (!printWindow) return false;

  const analysis = draft.analysis;
  const light = lights.find(item => item.id === draft.lightVariantId);
  const printed = [...new Set((analysis?.contours || []).filter(contour => draft.printedElementIds?.includes(contour.elementId)).map(contour => contour.name))];
  const specifications = [
    analysis?.scaleConfirmed ? `Medidas generales: ${num(analysis.widthMm)} × ${num(analysis.heightMm)} mm` : '',
    `Profundidad: ${num(draft.depthMm)} mm`,
    `Frente: ${materialLabel(materials, draft.frontMaterialId)}`,
    draft.backMaterialId ? `Fondo: ${materialLabel(materials, draft.backMaterialId)}` : '',
    `Cantos: ${materialLabel(materials, draft.edgeMaterialId)}`,
    light ? `Iluminación: ${light.name} · ${light.kind === 'rgb' ? 'RGB' : 'normal'}` : '',
    printed.length ? `Impresión en: ${[...new Set(printed)].join(', ')}` : '',
  ].filter(Boolean);
  const today = new Intl.DateTimeFormat('es-EC', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'America/Guayaquil' }).format(new Date());
  const dueDate = settings.validDays ? new Date(Date.now() + settings.validDays * 86_400_000) : null;
  const validity = dueDate ? new Intl.DateTimeFormat('es-EC', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'America/Guayaquil' }).format(dueDate) : '';
  const logo = settings.companyLogoDataUrl ? `<img class="logo" src="${settings.companyLogoDataUrl}" alt="Logo de ${escapeHtml(settings.businessName || 'la empresa')}">` : '';
  const notes = draft.notes.trim() ? `<section class="notes"><h2>Notas</h2><p>${escapeHtml(draft.notes).replace(/\n/g, '<br>')}</p></section>` : '';
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Cotización ${escapeHtml(draft.number)}</title><style>
    @page{size:A4;margin:16mm}*{box-sizing:border-box}body{margin:0;color:#24362e;font:14px/1.55 Arial,Helvetica,sans-serif;background:#fff}.page{max-width:780px;margin:0 auto}.top{display:flex;align-items:center;justify-content:space-between;gap:28px;padding-bottom:24px;border-bottom:2px solid #dce8dc}.identity{display:flex;align-items:center;gap:18px;min-width:0}.logo{width:112px;height:78px;object-fit:contain}.identity h1{margin:0;font-size:23px;line-height:1.2;overflow-wrap:anywhere}.identity p{margin:5px 0 0;color:#64766a}.document-tag{text-align:right;color:#66816c;font-size:11px;font-weight:700;letter-spacing:.14em}.document-tag strong{display:block;margin-top:5px;color:#263a2f;font-size:20px;letter-spacing:0}.parties{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin:28px 0}.parties h2,.notes h2{margin:0 0 7px;color:#718071;font-size:11px;text-transform:uppercase;letter-spacing:.1em}.parties p{margin:0;font-size:15px}.muted{color:#718071;font-size:12px!important}.quote-table{width:100%;border-collapse:collapse;margin-top:25px}.quote-table th{text-align:left;color:#758474;font-size:11px;text-transform:uppercase;letter-spacing:.08em;padding:11px;border-bottom:1px solid #dce5dc}.quote-table td{vertical-align:top;padding:16px 11px;border-bottom:1px solid #e7ede5}.quote-table th:last-child,.quote-table td:last-child{text-align:right;white-space:nowrap}.quote-title{display:block;margin-bottom:4px;font-weight:700}.specs{color:#657569;font-size:12px;line-height:1.75}.totals{width:min(330px,100%);margin:18px 0 0 auto}.total-row{display:flex;justify-content:space-between;gap:16px;padding:6px 0;color:#657569}.grand{margin-top:7px;padding:13px 0;border-top:2px solid #263b30;color:#263b30;font-size:17px;font-weight:700}.validity{margin-top:25px;padding:12px 15px;border-radius:6px;background:#f4f7f1;color:#627265;font-size:12px}.notes{margin-top:24px;padding-top:16px;border-top:1px solid #e7ede5}.notes p{margin:0;color:#53655a;font-size:12px}.footer{margin-top:54px;padding-top:13px;border-top:1px solid #e7ede5;color:#8a9589;font-size:10px;text-align:center}@media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact}.page{max-width:none}.footer{position:fixed;bottom:0;left:0;right:0}}
    </style></head><body><main class="page"><header class="top"><div class="identity">${logo}<div><h1>${escapeHtml(settings.businessName || 'Cotización comercial')}</h1><p>Fabricación de letreros y letras corpóreas</p></div></div><div class="document-tag">COTIZACIÓN<strong>${escapeHtml(draft.number)}</strong></div></header><section class="parties"><div><h2>Cliente</h2><p>${escapeHtml(draft.customer.trim() || 'Cliente')}</p><p class="muted">${escapeHtml(draft.title)}</p></div><div><h2>Emisión</h2><p>${escapeHtml(today)}</p>${validity ? `<p class="muted">Válida hasta ${escapeHtml(validity)}</p>` : ''}</div></section><table class="quote-table"><thead><tr><th>Descripción</th><th>Cantidad</th><th>Importe</th></tr></thead><tbody><tr><td><span class="quote-title">${escapeHtml(draft.title)}</span><span class="specs">${specifications.map(escapeHtml).join('<br>')}</span></td><td>1 trabajo</td><td>${money(preview.net)}</td></tr></tbody></table><section class="totals"><div class="total-row"><span>Subtotal</span><strong>${money(preview.net)}</strong></div><div class="total-row"><span>Impuestos (${escapeHtml(preview.taxPercent)} %)</span><strong>${money(preview.tax)}</strong></div><div class="total-row grand"><span>Total a pagar</span><strong>${money(preview.total)}</strong></div></section>${notes}<p class="validity">Esta propuesta comercial incluye la fabricación descrita y tiene un precio total de <strong>${money(preview.total)}</strong>.</p><footer class="footer">${escapeHtml(settings.businessName || 'Gracias por su confianza')} · ${escapeHtml(draft.number)}</footer></main><script>window.addEventListener('load',function(){setTimeout(function(){window.focus();window.print()},350)});window.addEventListener('afterprint',function(){window.close()});</script></body></html>`;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  return true;
}

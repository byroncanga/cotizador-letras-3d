import type { SupplyRate, SvgAnalysis } from '@taller/contracts';

/** Returns the measurable quantity for automatic consumables without calculating money. */
export function supplyQuantity(rate:SupplyRate,analysis:SvgAnalysis|null|undefined):string|null{
  if(rate.consumptionMode!=='per_edge_meter'||!analysis?.scaleConfirmed||rate.consumptionPerMeter===null||!/^\d{1,12}(\.\d{1,6})?$/.test(rate.consumptionPerMeter))return null;
  const cutEdgeLengthMm=analysis.contours
    .filter(contour=>contour.closed&&!contour.duplicateOf&&contour.operation==='cut')
    .reduce((total,contour)=>total+contour.lengthMm,0);
  return (cutEdgeLengthMm/1000*Number(rate.consumptionPerMeter)).toFixed(6);
}

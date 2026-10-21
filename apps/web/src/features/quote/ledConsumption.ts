import type { LedRoute, SvgAnalysis } from '@taller/contracts';

export interface ElementLedConsumption {
  elementId: string;
  name: string;
  heightMm: number;
  modules: number;
}

/** Each cut element is illuminated independently; fractional modules round up. */
export function ledModulesByElement(
  analysis: SvgAnalysis | null | undefined,
  modulesPerMeter: string | null | undefined,
): ElementLedConsumption[] {
  const density = Number(modulesPerMeter);
  if (!analysis?.scaleConfirmed || !Number.isFinite(density) || density <= 0) return [];

  const elements = new Map<string, { name: string; minY: number; maxY: number }>();
  for (const contour of analysis.contours) {
    if (!contour.closed || contour.duplicateOf || contour.operation !== 'cut' || contour.bounds.height <= 0) continue;
    const current = elements.get(contour.elementId);
    const minY = Math.min(current?.minY ?? contour.bounds.y, contour.bounds.y);
    const maxY = Math.max(current?.maxY ?? contour.bounds.y + contour.bounds.height, contour.bounds.y + contour.bounds.height);
    elements.set(contour.elementId, { name: contour.name, minY, maxY });
  }

  return [...elements].flatMap(([elementId, item]) => {
    const heightMm = item.maxY - item.minY;
    const modules = Math.ceil((heightMm / 1000) * density);
    return heightMm > 0 && modules > 0 ? [{ elementId, name: item.name, heightMm, modules }] : [];
  });
}

export function totalLedModules(analysis: SvgAnalysis | null | undefined, modulesPerMeter: string | null | undefined): number {
  return ledModulesByElement(analysis, modulesPerMeter).reduce((total, item) => total + item.modules, 0);
}

export function ledRouteLengthMm(route: LedRoute): number {
  return route.points.slice(1).reduce((total, point, index) => {
    const previous = route.points[index];
    return total + Math.hypot(point[0] - previous[0], point[1] - previous[1]);
  }, 0);
}

/** Draw a hand-drawn route with softened corners while keeping its measured points unchanged. */
export function ledRoutePath(points: [number, number][]): string {
  if (points.length < 3) return points.map((point, index) => `${index ? 'L' : 'M'}${point[0]} ${point[1]}`).join(' ');
  const parts = [`M${points[0][0]} ${points[0][1]}`];
  for (let index = 1; index < points.length - 1; index++) {
    const current = points[index];
    const next = points[index + 1];
    const midpointX = (current[0] + next[0]) / 2;
    const midpointY = (current[1] + next[1]) / 2;
    parts.push(`Q${current[0]} ${current[1]} ${midpointX} ${midpointY}`);
  }
  const previous = points[points.length - 2];
  const last = points[points.length - 1];
  parts.push(`Q${previous[0]} ${previous[1]} ${last[0]} ${last[1]}`);
  return parts.join(' ');
}

export function ledRouteMetersByElement(routes: LedRoute[] | undefined, analysis: SvgAnalysis | null | undefined) {
  if (!analysis?.scaleConfirmed) return [];
  const scale = analysis.widthMm / analysis.viewBox[2] / 1000;
  const elements = new Map(analysis.pieces.map(piece => [piece.id, piece.name]));
  return (routes || []).filter(route => route.sourceHash === analysis.sourceHash && elements.has(route.elementId)).map(route => ({
    routeId: route.id,
    elementId: route.elementId,
    name: elements.get(route.elementId) || route.elementId,
    meters: ledRouteLengthMm(route) * scale,
  }));
}

export function totalLedRouteMeters(routes: LedRoute[] | undefined, analysis: SvgAnalysis | null | undefined): number {
  return ledRouteMetersByElement(routes, analysis).reduce((total, route) => total + route.meters, 0);
}

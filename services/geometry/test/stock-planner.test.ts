import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyzeSvg } from '../src/analyze.js';
import { toPlan } from '../src/stock-planner.js';
import type { SvgAnalysis } from '@taller/contracts';
const material={materialId:'acrilico',name:'Acrílico blanco 4 mm',widthMm:1200,heightMm:2400,marginMm:0,directional:false};
const profile={materialId:'acrilico',profileId:'laser',name:'Laser',kerfMm:.2,spacingMm:1,ratePerMeter:'2',setupCost:'1',minimumCost:'5'};
function analysis(content:string):SvgAnalysis{return analyzeSvg({svg:`<svg xmlns="http://www.w3.org/2000/svg" width="1200mm" height="2400mm" viewBox="0 0 1200 2400"><g data-operation="cut">${content}</g></svg>`,fileName:'fixture.svg'});}
function plan(a:SvgAnalysis){return toPlan({analysis:a,materials:[material],prices:{acrilico:'20'},profiles:[profile],frontMaterialId:'acrilico',backMaterialId:null,edgeMaterialId:'acrilico',depthMm:50,minReusableOffcutMm:300});}
function noOverlap(rects:{xMm:number;yMm:number;widthMm:number;heightMm:number}[]){for(let i=0;i<rects.length;i++)for(let j=i+1;j<rects.length;j++){const a=rects[i],b=rects[j];assert.ok(a.xMm+a.widthMm<=b.xMm+1e-7||b.xMm+b.widthMm<=a.xMm+1e-7||a.yMm+a.heightMm<=b.yMm+1e-7||b.yMm+b.heightMm<=a.yMm+1e-7,`placements ${i} and ${j} overlap`);}}
test('calculates sheets and preserves the full 1200 mm strip against the original sheet edge',()=>{
 const a=analysis('<rect id="A" width="100" height="50"/>');const result=plan(a);const item=result.plans[0];assert.equal(item.sheetCount,1);assert.equal(item.stripsRequired,1);assert.equal(item.stripLengthMm,1200);assert.equal(item.stripDepthMm,50);assert.equal(item.sheets[0].placements[0].xMm,0);assert.equal(item.sheets[0].placements[0].widthMm,1200);assert.equal(item.blocking.length,0);noOverlap(item.sheets[0].placements);
});
test('splits edge runs into reusable 1200 mm strips and proposes joints for long contours',()=>{
 const a=analysis('<rect id="A" width="400" height="300"/><rect id="B" x="500" width="300" height="100"/>');const item=plan(a).plans[0];assert.ok(item.stripsRequired>=2);assert.ok(item.cutSegments.some(segment=>segment.jointSuggestedBeforeMm!==null));for(const sheet of item.sheets){for(const strip of sheet.placements.filter(place=>place.component==='edge')){assert.equal(strip.widthMm,1200);assert.equal(strip.heightMm,50);assert.equal(strip.xMm,0);}noOverlap(sheet.placements);}
});
test('rejects invalid scale and profile configuration instead of presenting a priced plan',()=>{
 const unscaled=analyzeSvg({svg:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="40" height="30" data-operation="cut"/></svg>',fileName:'unknown.svg'});const result=toPlan({analysis:unscaled,materials:[material],prices:{acrilico:'20'},profiles:[],frontMaterialId:'acrilico',backMaterialId:null,edgeMaterialId:'acrilico',depthMm:50,minReusableOffcutMm:300});assert.ok(result.blocking.some(message=>message.includes('escala')));assert.ok(result.blocking.some(message=>message.includes('kerf')));assert.ok(result.plans[0].blocking.length>0);
});
test('reuses a linear offcut of exactly 300 mm and discards one below the configured minimum',()=>{
 const reusable=plan(analysis('<rect id="A" width="300" height="150"/>')).plans[0];assert.ok(reusable.reusableOffcutsMm.includes(300));assert.equal(reusable.discardedOffcutMm,0);
 const discarded=plan(analysis('<rect id="B" width="300" height="175"/>')).plans[0];assert.equal(discarded.reusableOffcutsMm.length,0);assert.equal(discarded.discardedOffcutMm,250);
});
test('nests every face as an independent adjustable placement without rectangle overlap',()=>{
 const item=plan(analysis('<rect id="A" width="420" height="260"/><rect id="B" x="500" width="380" height="310"/><rect id="C" y="400" width="240" height="520"/><circle id="D" cx="1040" cy="180" r="110"/>')).plans[0];
 const faces=item.sheets.flatMap(sheet=>sheet.placements.filter(placement=>placement.component==='front'));
 assert.equal(faces.length,4);assert.equal(new Set(faces.map(placement=>placement.id)).size,4);assert.ok(item.sheetCount<=2);
 for(const sheet of item.sheets)noOverlap(sheet.placements);
});

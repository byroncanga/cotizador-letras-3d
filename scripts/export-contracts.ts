import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { analysisSchema,materialSchema,supplierSchema,cutProfileSchema,quoteDraftSchema,costPreviewSchema,costingSettingsSchema,quoteCostsSchema,costPreviewRequestSchema } from '@taller/contracts';
const schemas={SvgAnalysis:z.toJSONSchema(analysisSchema),Material:z.toJSONSchema(materialSchema),Supplier:z.toJSONSchema(supplierSchema),CutProfile:z.toJSONSchema(cutProfileSchema),QuoteDraft:z.toJSONSchema(quoteDraftSchema),CostPreviewRequest:z.toJSONSchema(costPreviewRequestSchema),CostPreview:z.toJSONSchema(costPreviewSchema),CostingSettings:z.toJSONSchema(costingSettingsSchema),QuoteCosts:z.toJSONSchema(quoteCostsSchema)};
const output=JSON.stringify({version:'1.0',units:{geometry:'mm',area:'mm²',currency:'USD',money:'decimal string'},schemas},null,2)+'\n';
const path=fileURLToPath(new URL('../packages/contracts/schema.json',import.meta.url));
if(process.argv.includes('--check')){if(!fs.existsSync(path)||fs.readFileSync(path,'utf8')!==output){console.error('Los contratos generados están desactualizados. Ejecuta npm run contracts.');process.exit(1);}console.log('Contratos sincronizados.');}else{fs.writeFileSync(path,output);console.log('Contratos JSON Schema generados.');}

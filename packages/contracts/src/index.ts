import { z } from 'zod';

export const operationSchema = z.enum(['cut','engrave','mark','unassigned']);
export type Operation = z.infer<typeof operationSchema>;
export const issueSchema = z.object({code:z.string(),message:z.string(),severity:z.enum(['warning','blocking']),elementId:z.string().optional()});
export type GeometryIssue = z.infer<typeof issueSchema>;
export const contourSchema = z.object({id:z.string(),elementId:z.string(),name:z.string(),path:z.string(),fillRule:z.enum(['evenodd','nonzero']),closed:z.boolean(),duplicateOf:z.string().nullable(),operation:operationSchema,lengthMm:z.number(),signedAreaMm2:z.number(),bounds:z.object({x:z.number(),y:z.number(),width:z.number(),height:z.number()})});
export type Contour = z.infer<typeof contourSchema>;
export const svgPieceSchema=z.object({id:z.string(),name:z.string(),widthMm:z.number().positive(),heightMm:z.number().positive(),areaMm2:z.number().positive(),perimeterMm:z.number().nonnegative(),contourIds:z.array(z.string())});
export type SvgPiece=z.infer<typeof svgPieceSchema>;
export const analysisSchema = z.object({version:z.literal('1.0'),fileName:z.string(),sourceHash:z.string(),scaleConfirmed:z.boolean(),scaleSource:z.enum(['physical_units','operator','unknown']),widthMm:z.number(),heightMm:z.number(),viewBox:z.tuple([z.number(),z.number(),z.number(),z.number()]),contours:z.array(contourSchema),pieces:z.array(svgPieceSchema).default([]),metrics:z.object({closedLengthMm:z.number(),openLengthMm:z.number(),assignedCutLengthMm:z.number(),duplicateLengthMm:z.number(),netAreaMm2:z.number().nullable(),pieceCount:z.number(),contourCount:z.number(),openCount:z.number(),duplicateCount:z.number()}),issues:z.array(issueSchema),status:z.enum(['review_required','geometry_valid'])});
export type SvgAnalysis = z.infer<typeof analysisSchema>;

export const materialSchema = z.object({id:z.string(),name:z.string().min(1),family:z.string().min(1),color:z.string().min(1),colorHex:z.string().regex(/^#[0-9a-fA-F]{6}$/).nullable().default(null),thicknessMm:z.number().positive(),widthMm:z.number().positive(),heightMm:z.number().positive(),supplier:z.string(),purchasePrice:z.string().regex(/^\d+(\.\d{1,4})?$/).nullable(),marginMm:z.number().nonnegative().nullable(),directional:z.boolean(),updatedAt:z.string()});
export type Material = z.infer<typeof materialSchema>;
export const decimalInputSchema = z.string().regex(/^\d{1,12}(\.\d{1,6})?$/).nullable();
export const lightVariantSchema=z.object({id:z.string(),name:z.string().min(1).max(150),kind:z.enum(['normal','rgb']),modulesPerMeter:decimalInputSchema,updatedAt:z.string()});
export type LightVariant=z.infer<typeof lightVariantSchema>;
export const supplierSchema = z.object({id:z.string(),name:z.string().min(1),contact:z.string(),email:z.string(),phone:z.string(),notes:z.string(),updatedAt:z.string()});
export type Supplier = z.infer<typeof supplierSchema>;
export const cutProfileSchema = z.object({id:z.string(),name:z.string().min(1),machineName:z.string().min(1),materialId:z.string(),kerfMm:z.number().nonnegative().nullable(),spacingMm:z.number().nonnegative().nullable(),ratePerMeter:z.string().nullable(),setupCost:z.string().nullable(),minimumCost:z.string().nullable(),calibratedOn:z.string(),updatedAt:z.string()});
export type CutProfile = z.infer<typeof cutProfileSchema>;
export const laborRateSchema = z.object({id:z.string(),name:z.string().min(1),ratePerHour:decimalInputSchema});
export type LaborRate = z.infer<typeof laborRateSchema>;
export const supplyRateSchema=z.object({id:z.string(),name:z.string().min(1).max(150),unit:z.string().min(1).max(30),unitPrice:decimalInputSchema,defaultQuantity:decimalInputSchema,consumptionMode:z.enum(['per_job','per_edge_meter']).default('per_job'),consumptionPerMeter:decimalInputSchema.default(null)});
export type SupplyRate=z.infer<typeof supplyRateSchema>;
export const costingSettingsSchema = z.object({laborRates:z.array(laborRateSchema).max(50).default([]),supplies:z.array(supplyRateSchema).max(100).default([]),ledRates:z.record(z.string(),decimalInputSchema).default({}),markupPercent:decimalInputSchema.default(null),taxPercent:decimalInputSchema.default(null),commercialMinimum:decimalInputSchema.default(null),indirectCost:decimalInputSchema.default(null)});
export const quoteCostsSchema = z.object({
  materialAssignments:z.array(z.object({materialId:z.string(),quantity:z.string().max(32).nullable(),manualCost:z.string().max(32).nullable()})).default([]),
  materialReason:z.string().default(''),
  profileSelections:z.record(z.string(),z.string()).default({}),
  cuts:z.array(z.object({id:z.string(),profileId:z.string(),lengthMeters:z.string().max(32).nullable()})).max(30).default([]),
  cutConfirmed:z.boolean().default(false),geometryKey:z.string().default(''),
  labor:z.array(z.object({id:z.string(),rateId:z.string(),minutes:z.string().max(32).nullable(),complexity:z.string().max(32).default('1')})).max(50).default([]),
  supplyQuantities:z.record(z.string(),decimalInputSchema).default({}),
  noLabor:z.boolean().default(false),vinylCost:z.string().max(32).nullable().default(null),
});
export type QuoteCosts = z.infer<typeof quoteCostsSchema>;
export const costPreviewRequestSchema=z.object({
  materials:z.array(z.object({label:z.string().min(1).max(180),quantity:decimalInputSchema.unwrap(),unitPrice:decimalInputSchema.unwrap()})).min(1).max(30),
  cuts:z.array(z.object({profileId:z.string().min(1).max(100),label:z.string().min(1).max(180),lengthMeters:decimalInputSchema.unwrap(),ratePerMeter:decimalInputSchema.unwrap(),setupCost:decimalInputSchema.unwrap(),minimumCost:decimalInputSchema.unwrap()})).min(1).max(30),
  labor:z.array(z.object({label:z.string().min(1).max(180),minutes:decimalInputSchema.unwrap(),ratePerHour:decimalInputSchema.unwrap(),complexity:decimalInputSchema.unwrap()})).max(50),
  supplies:z.array(z.object({label:z.string().min(1).max(180),quantity:decimalInputSchema.unwrap(),unitPrice:decimalInputSchema.unwrap()})).max(100).default([]),
  noLabor:z.boolean(),cutConfirmed:z.boolean().optional(),vinylCost:decimalInputSchema.unwrap(),indirectCost:decimalInputSchema.unwrap(),markupPercent:decimalInputSchema.unwrap(),taxPercent:decimalInputSchema.unwrap(),commercialMinimum:decimalInputSchema.unwrap(),
});
export type CostPreviewRequest=z.infer<typeof costPreviewRequestSchema>;
export const stockPlacementSchema=z.object({id:z.string(),label:z.string(),component:z.enum(['front','back','edge']),xMm:z.number(),yMm:z.number(),widthMm:z.number(),heightMm:z.number(),rotation:z.union([z.literal(0),z.literal(90)]),contourIds:z.array(z.string())});
export const stockSheetSchema=z.object({index:z.number().int().positive(),widthMm:z.number().positive(),heightMm:z.number().positive(),stripCount:z.number().int().nonnegative(),placements:z.array(stockPlacementSchema),usedAreaMm2:z.number().nonnegative(),scrapAreaMm2:z.number().nonnegative(),utilizationPercent:z.number().min(0).max(100)});
export const materialPlanSchema=z.object({materialId:z.string(),materialName:z.string(),profileId:z.string().nullable().default(null),unitPrice:z.string().nullable(),sheetCount:z.number().int().nonnegative(),sheetAreaMm2:z.number().nonnegative(),usedAreaMm2:z.number().nonnegative(),stripsRequired:z.number().int().nonnegative(),stripLengthMm:z.literal(1200),stripDepthMm:z.number().nonnegative(),faceCount:z.number().int().nonnegative(),reusableOffcutsMm:z.array(z.number().nonnegative()).default([]),discardedOffcutMm:z.number().nonnegative().default(0),sheets:z.array(stockSheetSchema),cutSegments:z.array(z.object({contourId:z.string(),lengthMm:z.number().positive(),jointSuggestedBeforeMm:z.number().nonnegative().nullable()})),blocking:z.array(z.string())});
export type StockPlacement=z.infer<typeof stockPlacementSchema>;
export type StockSheet=z.infer<typeof stockSheetSchema>;
export const materialPlanResponseSchema=z.object({version:z.literal('1.0'),sourceHash:z.string(),plans:z.array(materialPlanSchema),blocking:z.array(z.string())});
export type MaterialPlanResponse=z.infer<typeof materialPlanResponseSchema>;
export const materialPlanRequestSchema=z.object({analysis:analysisSchema,materials:z.array(z.object({materialId:z.string(),name:z.string(),widthMm:z.number().positive(),heightMm:z.number().positive(),marginMm:z.number().nonnegative().nullable(),directional:z.boolean(),purchasePrice:decimalInputSchema})).max(3),profiles:z.array(z.object({materialId:z.string(),profileId:z.string(),name:z.string(),kerfMm:z.number().nonnegative().nullable(),spacingMm:z.number().nonnegative().nullable(),ratePerMeter:z.string().nullable(),setupCost:z.string().nullable(),minimumCost:z.string().nullable()})).max(30),frontMaterialId:z.string(),backMaterialId:z.string().nullable(),edgeMaterialId:z.string(),depthMm:z.number().positive(),minReusableOffcutMm:z.number().positive()});
export const costLineSchema=z.object({label:z.string(),amount:z.string()});
export const costPreviewSchema=z.object({version:z.literal('1.0'),materials:z.array(costLineSchema),cuts:z.array(costLineSchema),labor:z.array(costLineSchema),supplies:z.array(costLineSchema),suppliesTotal:z.string(),materialTotal:z.string(),materialAndVinylTotal:z.string(),cutTotal:z.string(),laborTotal:z.string(),vinylCost:z.string(),indirectCost:z.string(),totalCost:z.string(),net:z.string(),tax:z.string(),total:z.string(),markupPercent:z.string(),taxPercent:z.string(),minimumApplied:z.boolean()});
export type CostPreview=z.infer<typeof costPreviewSchema>;
export const componentColorsSchema=z.object({front:z.string().regex(/^#[0-9a-fA-F]{6}$/).nullable().default(null),back:z.string().regex(/^#[0-9a-fA-F]{6}$/).nullable().default(null),edge:z.string().regex(/^#[0-9a-fA-F]{6}$/).nullable().default(null)});
export type ComponentColors=z.infer<typeof componentColorsSchema>;
export const ledRouteSchema=z.object({id:z.string(),elementId:z.string(),sourceHash:z.string(),points:z.array(z.tuple([z.number(),z.number()])).min(2).max(10000)});
export type LedRoute=z.infer<typeof ledRouteSchema>;
export const quoteDraftSchema = z.object({id:z.string(),number:z.string(),title:z.string(),customer:z.string(),depthMm:z.number().positive(),frontMaterialId:z.string(),backMaterialId:z.string(),edgeMaterialId:z.string(),lightVariantId:z.string().default(''),ledRoutes:z.array(ledRouteSchema).default([]),componentColors:componentColorsSchema.default(()=>componentColorsSchema.parse({})),printedElementIds:z.array(z.string()).default([]),billingMode:z.enum(['proportional','full_sheet','manual']),notes:z.string(),costs:quoteCostsSchema.default(()=>quoteCostsSchema.parse({})),analysis:analysisSchema.nullable(),isExample:z.boolean(),updatedAt:z.string()});
export type QuoteDraft = z.infer<typeof quoteDraftSchema>;
export const workspaceSchema = z.object({version:z.literal(1),drafts:z.array(quoteDraftSchema).min(1),activeDraftId:z.string(),materials:z.array(materialSchema),lights:z.array(lightVariantSchema).default([]),suppliers:z.array(supplierSchema),profiles:z.array(cutProfileSchema),settings:z.object({businessName:z.string(),companyLogoDataUrl:z.string().max(1_500_000).regex(/^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/]+=*$/).nullable().default(null),validDays:z.number().int().positive().nullable(),minLinearOffcutMm:z.number().positive(),costing:costingSettingsSchema.default(()=>costingSettingsSchema.parse({}))})});
export type Workspace = z.infer<typeof workspaceSchema>;
export const operationLabels:Record<Operation,string>={cut:'Corte',engrave:'Grabado',mark:'Marcado',unassigned:'Sin asignar'};

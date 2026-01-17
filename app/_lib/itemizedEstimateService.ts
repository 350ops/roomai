// reForma Itemized Estimate Calculation Service
// Handles Bill of Quantities with detailed line items

import { supabase, isSupabaseConfigured } from './supabase';
import {
    PRICING_VERSION,
    BASE_RATE_PER_M2,
    MIN_ROOM_FEE,
    DEFAULT_CURRENCY,
    LOCATION_MULTIPLIERS,
    PROPERTY_AGE_MULTIPLIERS,
    PROPERTY_TYPE_MULTIPLIERS,
    PROPERTY_CONDITION_MULTIPLIERS,
    ACCESS_DIFFICULTY_MULTIPLIERS,
    URGENCY_MULTIPLIERS,
    CEILING_HEIGHT_MULTIPLIERS,
    ELECTRICAL_SCOPE_MULTIPLIERS,
    PLUMBING_SCOPE_MULTIPLIERS,
    getLocationMultiplier,
} from './pricing';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================
// TYPES
// ============================================

export interface RoomInput {
    roomType: string;
    width: number;
    length: number;
    ceilingHeight?: string;  // Optional, defaults to 'Standard (2.4 - 2.7m)'
    floorFinish: string;
    wallFinish: string;
    builtInFurniture: string;
    electricalScope?: string;
    plumbingScope?: string;
}

export interface ProjectInput {
    propertyLocation: string;  // Country
    propertyCity: string;      // City within country
    propertyAge: string;
    propertyType: string;      // Apartment, House, etc.
    propertyCondition: string; // Current condition
    accessDifficulty: string;  // Access for workers/materials
    urgency: string;           // Timeline
    rooms: RoomInput[];
}

export interface LineItem {
    id?: string;
    code: string;
    name: string;
    costType: 'material' | 'labor' | 'equipment' | 'subcontract' | 'tax' | 'overhead';
    unit: string;
    quantity: number;
    baseUnitCost: number;
    locationFactor: number;
    ageFactor: number;
    unitCostFinal: number;
    costBeforeWaste: number;
    wastePct: number;
    wasteAmount: number;
    costBeforeTax: number;
    taxRate: number;
    taxAmount: number;
    totalCost: number;
    assemblyCode?: string;
    roomIndex?: number;
}

export interface RoomBreakdown {
    roomIndex: number;
    roomType: string;
    areaM2: number;
    perimeterLm: number;
    wallAreaM2: number;
    ceilingAreaM2: number;
    lineItems: LineItem[];
    materialsCost: number;
    laborCost: number;
    subtotal: number;
}

export interface EstimateSummary {
    materials: number;
    labor: number;
    equipment: number;
    overhead: number;
    contingency: number;
    taxTotal: number;
    subtotal: number;
    total: number;
}

export interface ItemizedEstimateResult {
    pricingVersion: string;
    currency: string;
    assumptions: {
        defaultCeilingHeightM: number;
        wallOpeningsPct: number;
        overheadPct: number;
        contingencyPct: number;
        taxRate: number;
    };
    summary: EstimateSummary;
    rooms: RoomBreakdown[];
    projectLineItems: LineItem[];  // Site setup, cleanup, etc.
    allLineItems: LineItem[];      // Flat list of all items
    multipliers: {
        location: { name: string; city: string; value: number };
        propertyAge: { label: string; value: number };
        propertyType: { label: string; value: number };
        propertyCondition: { label: string; value: number };
        accessDifficulty: { label: string; value: number };
        urgency: { label: string; value: number };
    };
    inputSummary: {
        country: string;
        city: string;
        propertyAge: string;
        propertyType: string;
        propertyCondition: string;
        accessDifficulty: string;
        urgency: string;
        totalArea: number;
        roomCount: number;
    };
}

// ============================================
// LOCAL CATALOG (fallback when Supabase not available)
// ============================================

interface CatalogItem {
    code: string;
    name: string;
    unit: string;
    costType: 'material' | 'labor' | 'equipment' | 'subcontract' | 'tax' | 'overhead';
    baseUnitCost: number;
    defaultWastePct: number;
}

interface Assembly {
    code: string;
    name: string;
    appliesTo: 'floorFinish' | 'wallFinish' | 'builtInFurniture' | 'roomType' | 'project';
    appliesToValue: string;
    items: AssemblyItem[];
}

interface AssemblyItem {
    catalogCode: string;
    qtyFormula: 'area_m2' | 'perimeter_lm' | 'wall_area_m2' | 'ceiling_area_m2' | 'fixed' | 'room_count';
    qtyMultiplier: number;
    includeWaste: boolean;
}

// Local catalog data (mirrors database)
const LOCAL_CATALOG: CatalogItem[] = [
    // Flooring
    { code: 'FLOOR_DEMO', name: 'Floor demolition & disposal', unit: 'm2', costType: 'labor', baseUnitCost: 12.00, defaultWastePct: 0 },
    { code: 'FLOOR_PREP', name: 'Floor surface preparation', unit: 'm2', costType: 'labor', baseUnitCost: 8.00, defaultWastePct: 0 },
    { code: 'FLOOR_UNDERLAY', name: 'Floor underlay material', unit: 'm2', costType: 'material', baseUnitCost: 4.50, defaultWastePct: 0.05 },
    { code: 'FLOOR_HARDWOOD_SUPPLY', name: 'Hardwood flooring supply', unit: 'm2', costType: 'material', baseUnitCost: 55.00, defaultWastePct: 0.10 },
    { code: 'FLOOR_HARDWOOD_LABOR', name: 'Hardwood installation labor', unit: 'm2', costType: 'labor', baseUnitCost: 28.00, defaultWastePct: 0 },
    { code: 'FLOOR_LAMINATE_SUPPLY', name: 'Laminate flooring supply', unit: 'm2', costType: 'material', baseUnitCost: 22.00, defaultWastePct: 0.08 },
    { code: 'FLOOR_LAMINATE_LABOR', name: 'Laminate installation labor', unit: 'm2', costType: 'labor', baseUnitCost: 18.00, defaultWastePct: 0 },
    { code: 'FLOOR_TILE_SUPPLY', name: 'Floor tile supply', unit: 'm2', costType: 'material', baseUnitCost: 35.00, defaultWastePct: 0.12 },
    { code: 'FLOOR_TILE_ADHESIVE', name: 'Tile adhesive & grout', unit: 'm2', costType: 'material', baseUnitCost: 8.00, defaultWastePct: 0.05 },
    { code: 'FLOOR_TILE_LABOR', name: 'Floor tile installation labor', unit: 'm2', costType: 'labor', baseUnitCost: 35.00, defaultWastePct: 0 },
    { code: 'FLOOR_VINYL_SUPPLY', name: 'Vinyl flooring supply', unit: 'm2', costType: 'material', baseUnitCost: 18.00, defaultWastePct: 0.08 },
    { code: 'FLOOR_VINYL_LABOR', name: 'Vinyl installation labor', unit: 'm2', costType: 'labor', baseUnitCost: 15.00, defaultWastePct: 0 },
    { code: 'FLOOR_CARPET_SUPPLY', name: 'Carpet supply', unit: 'm2', costType: 'material', baseUnitCost: 25.00, defaultWastePct: 0.10 },
    { code: 'FLOOR_CARPET_UNDERPAD', name: 'Carpet underpad', unit: 'm2', costType: 'material', baseUnitCost: 6.00, defaultWastePct: 0.05 },
    { code: 'FLOOR_CARPET_LABOR', name: 'Carpet installation labor', unit: 'm2', costType: 'labor', baseUnitCost: 12.00, defaultWastePct: 0 },
    { code: 'FLOOR_CONCRETE_POLISH', name: 'Concrete polishing', unit: 'm2', costType: 'labor', baseUnitCost: 45.00, defaultWastePct: 0 },
    { code: 'FLOOR_CONCRETE_SEALER', name: 'Concrete sealer', unit: 'm2', costType: 'material', baseUnitCost: 8.00, defaultWastePct: 0.05 },
    { code: 'FLOOR_MARBLE_SUPPLY', name: 'Marble flooring supply', unit: 'm2', costType: 'material', baseUnitCost: 120.00, defaultWastePct: 0.12 },
    { code: 'FLOOR_MARBLE_LABOR', name: 'Marble installation labor', unit: 'm2', costType: 'labor', baseUnitCost: 55.00, defaultWastePct: 0 },
    { code: 'FLOOR_ENGWOOD_SUPPLY', name: 'Engineered wood flooring supply', unit: 'm2', costType: 'material', baseUnitCost: 42.00, defaultWastePct: 0.10 },
    { code: 'FLOOR_ENGWOOD_LABOR', name: 'Engineered wood installation labor', unit: 'm2', costType: 'labor', baseUnitCost: 24.00, defaultWastePct: 0 },
    { code: 'FLOOR_SKIRTING_SUPPLY', name: 'Skirting/baseboard supply', unit: 'lm', costType: 'material', baseUnitCost: 8.00, defaultWastePct: 0.08 },
    { code: 'FLOOR_SKIRTING_LABOR', name: 'Skirting installation labor', unit: 'lm', costType: 'labor', baseUnitCost: 6.00, defaultWastePct: 0 },
    
    // Walls
    { code: 'WALL_PREP', name: 'Wall surface preparation', unit: 'm2', costType: 'labor', baseUnitCost: 6.00, defaultWastePct: 0 },
    { code: 'WALL_PRIMER', name: 'Wall primer', unit: 'm2', costType: 'material', baseUnitCost: 3.50, defaultWastePct: 0.07 },
    { code: 'WALL_PAINT_SUPPLY', name: 'Wall paint supply', unit: 'm2', costType: 'material', baseUnitCost: 4.00, defaultWastePct: 0.07 },
    { code: 'WALL_PAINT_LABOR', name: 'Wall painting labor (2 coats)', unit: 'm2', costType: 'labor', baseUnitCost: 8.00, defaultWastePct: 0 },
    { code: 'WALL_PAPER_SUPPLY', name: 'Wallpaper supply', unit: 'm2', costType: 'material', baseUnitCost: 18.00, defaultWastePct: 0.10 },
    { code: 'WALL_PAPER_ADHESIVE', name: 'Wallpaper adhesive', unit: 'm2', costType: 'material', baseUnitCost: 2.00, defaultWastePct: 0.05 },
    { code: 'WALL_PAPER_LABOR', name: 'Wallpaper installation labor', unit: 'm2', costType: 'labor', baseUnitCost: 15.00, defaultWastePct: 0 },
    { code: 'WALL_TILE_SUPPLY', name: 'Wall tile supply', unit: 'm2', costType: 'material', baseUnitCost: 32.00, defaultWastePct: 0.12 },
    { code: 'WALL_TILE_ADHESIVE', name: 'Wall tile adhesive & grout', unit: 'm2', costType: 'material', baseUnitCost: 7.00, defaultWastePct: 0.05 },
    { code: 'WALL_TILE_LABOR', name: 'Wall tile installation labor', unit: 'm2', costType: 'labor', baseUnitCost: 38.00, defaultWastePct: 0 },
    { code: 'WALL_PANEL_SUPPLY', name: 'Wood paneling supply', unit: 'm2', costType: 'material', baseUnitCost: 45.00, defaultWastePct: 0.10 },
    { code: 'WALL_PANEL_LABOR', name: 'Wood paneling installation labor', unit: 'm2', costType: 'labor', baseUnitCost: 28.00, defaultWastePct: 0 },
    { code: 'WALL_BRICK_EXPOSE', name: 'Brick exposure work', unit: 'm2', costType: 'labor', baseUnitCost: 35.00, defaultWastePct: 0 },
    { code: 'WALL_BRICK_SEAL', name: 'Brick sealer', unit: 'm2', costType: 'material', baseUnitCost: 6.00, defaultWastePct: 0.05 },
    { code: 'WALL_PLASTER_SUPPLY', name: 'Textured plaster supply', unit: 'm2', costType: 'material', baseUnitCost: 12.00, defaultWastePct: 0.08 },
    { code: 'WALL_PLASTER_LABOR', name: 'Textured plaster application', unit: 'm2', costType: 'labor', baseUnitCost: 22.00, defaultWastePct: 0 },
    { code: 'WALL_STONE_SUPPLY', name: 'Stone veneer supply', unit: 'm2', costType: 'material', baseUnitCost: 65.00, defaultWastePct: 0.10 },
    { code: 'WALL_STONE_LABOR', name: 'Stone veneer installation', unit: 'm2', costType: 'labor', baseUnitCost: 45.00, defaultWastePct: 0 },
    
    // Built-ins
    { code: 'BUILTIN_BASIC_CABINET', name: 'Basic cabinet supply', unit: 'lm', costType: 'material', baseUnitCost: 180.00, defaultWastePct: 0 },
    { code: 'BUILTIN_BASIC_INSTALL', name: 'Basic cabinet installation', unit: 'lm', costType: 'labor', baseUnitCost: 85.00, defaultWastePct: 0 },
    { code: 'BUILTIN_CLOSET_SYSTEM', name: 'Custom closet system', unit: 'm2', costType: 'material', baseUnitCost: 220.00, defaultWastePct: 0 },
    { code: 'BUILTIN_CLOSET_INSTALL', name: 'Custom closet installation', unit: 'm2', costType: 'labor', baseUnitCost: 95.00, defaultWastePct: 0 },
    { code: 'BUILTIN_SHELF_SUPPLY', name: 'Built-in shelving supply', unit: 'lm', costType: 'material', baseUnitCost: 65.00, defaultWastePct: 0 },
    { code: 'BUILTIN_SHELF_INSTALL', name: 'Built-in shelving installation', unit: 'lm', costType: 'labor', baseUnitCost: 45.00, defaultWastePct: 0 },
    { code: 'BUILTIN_KITCHEN_CAB', name: 'Kitchen cabinet supply', unit: 'lm', costType: 'material', baseUnitCost: 350.00, defaultWastePct: 0 },
    { code: 'BUILTIN_KITCHEN_INSTALL', name: 'Kitchen cabinet installation', unit: 'lm', costType: 'labor', baseUnitCost: 120.00, defaultWastePct: 0 },
    { code: 'BUILTIN_VANITY_SUPPLY', name: 'Bathroom vanity supply', unit: 'item', costType: 'material', baseUnitCost: 450.00, defaultWastePct: 0 },
    { code: 'BUILTIN_VANITY_INSTALL', name: 'Bathroom vanity installation', unit: 'item', costType: 'labor', baseUnitCost: 180.00, defaultWastePct: 0 },
    { code: 'BUILTIN_ENTERTAIN_UNIT', name: 'Entertainment center', unit: 'lm', costType: 'material', baseUnitCost: 280.00, defaultWastePct: 0 },
    { code: 'BUILTIN_ENTERTAIN_INSTALL', name: 'Entertainment center installation', unit: 'lm', costType: 'labor', baseUnitCost: 110.00, defaultWastePct: 0 },
    { code: 'BUILTIN_CUSTOM_JOINERY', name: 'Full custom joinery', unit: 'm2', costType: 'material', baseUnitCost: 450.00, defaultWastePct: 0 },
    { code: 'BUILTIN_CUSTOM_INSTALL', name: 'Full custom installation', unit: 'm2', costType: 'labor', baseUnitCost: 180.00, defaultWastePct: 0 },
    
    // Project-level
    { code: 'PROJ_SITE_SETUP', name: 'Site setup & protection', unit: 'fixed', costType: 'labor', baseUnitCost: 250.00, defaultWastePct: 0 },
    { code: 'PROJ_PROTECTION', name: 'Surface protection materials', unit: 'm2', costType: 'material', baseUnitCost: 2.50, defaultWastePct: 0 },
    { code: 'PROJ_CLEANUP', name: 'Final cleanup & disposal', unit: 'm2', costType: 'labor', baseUnitCost: 4.00, defaultWastePct: 0 },
];

// Local assemblies
const LOCAL_ASSEMBLIES: Assembly[] = [
    // Flooring
    {
        code: 'FLOOR_HARDWOOD', name: 'Hardwood Floor Installation',
        appliesTo: 'floorFinish', appliesToValue: 'Hardwood',
        items: [
            { catalogCode: 'FLOOR_DEMO', qtyFormula: 'area_m2', qtyMultiplier: 1.0, includeWaste: false },
            { catalogCode: 'FLOOR_PREP', qtyFormula: 'area_m2', qtyMultiplier: 1.0, includeWaste: false },
            { catalogCode: 'FLOOR_UNDERLAY', qtyFormula: 'area_m2', qtyMultiplier: 1.0, includeWaste: true },
            { catalogCode: 'FLOOR_HARDWOOD_SUPPLY', qtyFormula: 'area_m2', qtyMultiplier: 1.0, includeWaste: true },
            { catalogCode: 'FLOOR_HARDWOOD_LABOR', qtyFormula: 'area_m2', qtyMultiplier: 1.0, includeWaste: false },
            { catalogCode: 'FLOOR_SKIRTING_SUPPLY', qtyFormula: 'perimeter_lm', qtyMultiplier: 1.0, includeWaste: true },
            { catalogCode: 'FLOOR_SKIRTING_LABOR', qtyFormula: 'perimeter_lm', qtyMultiplier: 1.0, includeWaste: false },
        ]
    },
    {
        code: 'FLOOR_LAMINATE', name: 'Laminate Floor Installation',
        appliesTo: 'floorFinish', appliesToValue: 'Laminate',
        items: [
            { catalogCode: 'FLOOR_DEMO', qtyFormula: 'area_m2', qtyMultiplier: 1.0, includeWaste: false },
            { catalogCode: 'FLOOR_UNDERLAY', qtyFormula: 'area_m2', qtyMultiplier: 1.0, includeWaste: true },
            { catalogCode: 'FLOOR_LAMINATE_SUPPLY', qtyFormula: 'area_m2', qtyMultiplier: 1.0, includeWaste: true },
            { catalogCode: 'FLOOR_LAMINATE_LABOR', qtyFormula: 'area_m2', qtyMultiplier: 1.0, includeWaste: false },
            { catalogCode: 'FLOOR_SKIRTING_SUPPLY', qtyFormula: 'perimeter_lm', qtyMultiplier: 1.0, includeWaste: true },
            { catalogCode: 'FLOOR_SKIRTING_LABOR', qtyFormula: 'perimeter_lm', qtyMultiplier: 1.0, includeWaste: false },
        ]
    },
    {
        code: 'FLOOR_TILE_CERAMIC', name: 'Ceramic Tile Floor Installation',
        appliesTo: 'floorFinish', appliesToValue: 'Tile (Ceramic)',
        items: [
            { catalogCode: 'FLOOR_DEMO', qtyFormula: 'area_m2', qtyMultiplier: 1.0, includeWaste: false },
            { catalogCode: 'FLOOR_PREP', qtyFormula: 'area_m2', qtyMultiplier: 1.0, includeWaste: false },
            { catalogCode: 'FLOOR_TILE_SUPPLY', qtyFormula: 'area_m2', qtyMultiplier: 1.0, includeWaste: true },
            { catalogCode: 'FLOOR_TILE_ADHESIVE', qtyFormula: 'area_m2', qtyMultiplier: 1.0, includeWaste: true },
            { catalogCode: 'FLOOR_TILE_LABOR', qtyFormula: 'area_m2', qtyMultiplier: 1.0, includeWaste: false },
        ]
    },
    {
        code: 'FLOOR_TILE_PORCELAIN', name: 'Porcelain Tile Floor Installation',
        appliesTo: 'floorFinish', appliesToValue: 'Tile (Porcelain)',
        items: [
            { catalogCode: 'FLOOR_DEMO', qtyFormula: 'area_m2', qtyMultiplier: 1.0, includeWaste: false },
            { catalogCode: 'FLOOR_PREP', qtyFormula: 'area_m2', qtyMultiplier: 1.0, includeWaste: false },
            { catalogCode: 'FLOOR_TILE_SUPPLY', qtyFormula: 'area_m2', qtyMultiplier: 1.15, includeWaste: true },  // Porcelain is more expensive
            { catalogCode: 'FLOOR_TILE_ADHESIVE', qtyFormula: 'area_m2', qtyMultiplier: 1.0, includeWaste: true },
            { catalogCode: 'FLOOR_TILE_LABOR', qtyFormula: 'area_m2', qtyMultiplier: 1.1, includeWaste: false },  // Slightly more labor
        ]
    },
    {
        code: 'FLOOR_VINYL', name: 'Vinyl / LVT Floor Installation',
        appliesTo: 'floorFinish', appliesToValue: 'Vinyl / LVT',
        items: [
            { catalogCode: 'FLOOR_DEMO', qtyFormula: 'area_m2', qtyMultiplier: 1.0, includeWaste: false },
            { catalogCode: 'FLOOR_VINYL_SUPPLY', qtyFormula: 'area_m2', qtyMultiplier: 1.0, includeWaste: true },
            { catalogCode: 'FLOOR_VINYL_LABOR', qtyFormula: 'area_m2', qtyMultiplier: 1.0, includeWaste: false },
        ]
    },
    {
        code: 'FLOOR_CARPET', name: 'Carpet Installation',
        appliesTo: 'floorFinish', appliesToValue: 'Carpet',
        items: [
            { catalogCode: 'FLOOR_DEMO', qtyFormula: 'area_m2', qtyMultiplier: 1.0, includeWaste: false },
            { catalogCode: 'FLOOR_CARPET_SUPPLY', qtyFormula: 'area_m2', qtyMultiplier: 1.0, includeWaste: true },
            { catalogCode: 'FLOOR_CARPET_UNDERPAD', qtyFormula: 'area_m2', qtyMultiplier: 1.0, includeWaste: true },
            { catalogCode: 'FLOOR_CARPET_LABOR', qtyFormula: 'area_m2', qtyMultiplier: 1.0, includeWaste: false },
        ]
    },
    {
        code: 'FLOOR_CONCRETE', name: 'Polished Concrete Floor',
        appliesTo: 'floorFinish', appliesToValue: 'Polished Concrete',
        items: [
            { catalogCode: 'FLOOR_CONCRETE_POLISH', qtyFormula: 'area_m2', qtyMultiplier: 1.0, includeWaste: false },
            { catalogCode: 'FLOOR_CONCRETE_SEALER', qtyFormula: 'area_m2', qtyMultiplier: 1.0, includeWaste: true },
        ]
    },
    {
        code: 'FLOOR_MARBLE', name: 'Marble Floor Installation',
        appliesTo: 'floorFinish', appliesToValue: 'Marble',
        items: [
            { catalogCode: 'FLOOR_DEMO', qtyFormula: 'area_m2', qtyMultiplier: 1.0, includeWaste: false },
            { catalogCode: 'FLOOR_PREP', qtyFormula: 'area_m2', qtyMultiplier: 1.0, includeWaste: false },
            { catalogCode: 'FLOOR_MARBLE_SUPPLY', qtyFormula: 'area_m2', qtyMultiplier: 1.0, includeWaste: true },
            { catalogCode: 'FLOOR_MARBLE_LABOR', qtyFormula: 'area_m2', qtyMultiplier: 1.0, includeWaste: false },
        ]
    },
    {
        code: 'FLOOR_ENGWOOD', name: 'Engineered Wood Installation',
        appliesTo: 'floorFinish', appliesToValue: 'Engineered Wood',
        items: [
            { catalogCode: 'FLOOR_DEMO', qtyFormula: 'area_m2', qtyMultiplier: 1.0, includeWaste: false },
            { catalogCode: 'FLOOR_UNDERLAY', qtyFormula: 'area_m2', qtyMultiplier: 1.0, includeWaste: true },
            { catalogCode: 'FLOOR_ENGWOOD_SUPPLY', qtyFormula: 'area_m2', qtyMultiplier: 1.0, includeWaste: true },
            { catalogCode: 'FLOOR_ENGWOOD_LABOR', qtyFormula: 'area_m2', qtyMultiplier: 1.0, includeWaste: false },
            { catalogCode: 'FLOOR_SKIRTING_SUPPLY', qtyFormula: 'perimeter_lm', qtyMultiplier: 1.0, includeWaste: true },
            { catalogCode: 'FLOOR_SKIRTING_LABOR', qtyFormula: 'perimeter_lm', qtyMultiplier: 1.0, includeWaste: false },
        ]
    },
    {
        code: 'FLOOR_NATURAL_STONE', name: 'Natural Stone Floor Installation',
        appliesTo: 'floorFinish', appliesToValue: 'Natural Stone',
        items: [
            { catalogCode: 'FLOOR_DEMO', qtyFormula: 'area_m2', qtyMultiplier: 1.0, includeWaste: false },
            { catalogCode: 'FLOOR_PREP', qtyFormula: 'area_m2', qtyMultiplier: 1.0, includeWaste: false },
            { catalogCode: 'FLOOR_MARBLE_SUPPLY', qtyFormula: 'area_m2', qtyMultiplier: 0.9, includeWaste: true },  // Slightly cheaper than marble
            { catalogCode: 'FLOOR_MARBLE_LABOR', qtyFormula: 'area_m2', qtyMultiplier: 1.0, includeWaste: false },
        ]
    },
    {
        code: 'FLOOR_MICROCEMENT', name: 'Microcement Floor Installation',
        appliesTo: 'floorFinish', appliesToValue: 'Microcement',
        items: [
            { catalogCode: 'FLOOR_PREP', qtyFormula: 'area_m2', qtyMultiplier: 1.5, includeWaste: false },  // More prep needed
            { catalogCode: 'WALL_PLASTER_SUPPLY', qtyFormula: 'area_m2', qtyMultiplier: 1.3, includeWaste: true },  // Similar to textured plaster
            { catalogCode: 'WALL_PLASTER_LABOR', qtyFormula: 'area_m2', qtyMultiplier: 1.5, includeWaste: false },  // Specialized labor
            { catalogCode: 'FLOOR_CONCRETE_SEALER', qtyFormula: 'area_m2', qtyMultiplier: 2.0, includeWaste: true },  // Multiple sealer coats
        ]
    },
    {
        code: 'FLOOR_TERRAZZO', name: 'Terrazzo Floor Installation',
        appliesTo: 'floorFinish', appliesToValue: 'Terrazzo',
        items: [
            { catalogCode: 'FLOOR_DEMO', qtyFormula: 'area_m2', qtyMultiplier: 1.0, includeWaste: false },
            { catalogCode: 'FLOOR_PREP', qtyFormula: 'area_m2', qtyMultiplier: 1.0, includeWaste: false },
            { catalogCode: 'FLOOR_MARBLE_SUPPLY', qtyFormula: 'area_m2', qtyMultiplier: 1.1, includeWaste: true },  // Similar cost to marble
            { catalogCode: 'FLOOR_MARBLE_LABOR', qtyFormula: 'area_m2', qtyMultiplier: 1.2, includeWaste: false },  // Specialized labor
            { catalogCode: 'FLOOR_CONCRETE_POLISH', qtyFormula: 'area_m2', qtyMultiplier: 0.8, includeWaste: false },  // Polishing
        ]
    },
    
    // Walls
    {
        code: 'WALL_PAINT_STANDARD', name: 'Wall Painting (Standard)',
        appliesTo: 'wallFinish', appliesToValue: 'Paint (Standard)',
        items: [
            { catalogCode: 'WALL_PREP', qtyFormula: 'wall_area_m2', qtyMultiplier: 1.0, includeWaste: false },
            { catalogCode: 'WALL_PRIMER', qtyFormula: 'wall_area_m2', qtyMultiplier: 1.0, includeWaste: true },
            { catalogCode: 'WALL_PAINT_SUPPLY', qtyFormula: 'wall_area_m2', qtyMultiplier: 2.0, includeWaste: true },  // 2 coats
            { catalogCode: 'WALL_PAINT_LABOR', qtyFormula: 'wall_area_m2', qtyMultiplier: 1.0, includeWaste: false },
        ]
    },
    {
        code: 'WALL_PAINT_PREMIUM', name: 'Wall Painting (Premium)',
        appliesTo: 'wallFinish', appliesToValue: 'Paint (Premium)',
        items: [
            { catalogCode: 'WALL_PREP', qtyFormula: 'wall_area_m2', qtyMultiplier: 1.0, includeWaste: false },
            { catalogCode: 'WALL_PRIMER', qtyFormula: 'wall_area_m2', qtyMultiplier: 1.0, includeWaste: true },
            { catalogCode: 'WALL_PAINT_SUPPLY', qtyFormula: 'wall_area_m2', qtyMultiplier: 2.5, includeWaste: true },  // More paint, better quality
            { catalogCode: 'WALL_PAINT_LABOR', qtyFormula: 'wall_area_m2', qtyMultiplier: 1.2, includeWaste: false },  // More careful work
        ]
    },
    {
        code: 'WALL_WALLPAPER', name: 'Wallpaper Installation',
        appliesTo: 'wallFinish', appliesToValue: 'Wallpaper',
        items: [
            { catalogCode: 'WALL_PREP', qtyFormula: 'wall_area_m2', qtyMultiplier: 1.0, includeWaste: false },
            { catalogCode: 'WALL_PAPER_SUPPLY', qtyFormula: 'wall_area_m2', qtyMultiplier: 1.0, includeWaste: true },
            { catalogCode: 'WALL_PAPER_ADHESIVE', qtyFormula: 'wall_area_m2', qtyMultiplier: 1.0, includeWaste: true },
            { catalogCode: 'WALL_PAPER_LABOR', qtyFormula: 'wall_area_m2', qtyMultiplier: 1.0, includeWaste: false },
        ]
    },
    {
        code: 'WALL_TILE', name: 'Wall Tiling',
        appliesTo: 'wallFinish', appliesToValue: 'Tile',
        items: [
            { catalogCode: 'WALL_PREP', qtyFormula: 'wall_area_m2', qtyMultiplier: 1.0, includeWaste: false },
            { catalogCode: 'WALL_TILE_SUPPLY', qtyFormula: 'wall_area_m2', qtyMultiplier: 1.0, includeWaste: true },
            { catalogCode: 'WALL_TILE_ADHESIVE', qtyFormula: 'wall_area_m2', qtyMultiplier: 1.0, includeWaste: true },
            { catalogCode: 'WALL_TILE_LABOR', qtyFormula: 'wall_area_m2', qtyMultiplier: 1.0, includeWaste: false },
        ]
    },
    {
        code: 'WALL_WOOD_PANEL', name: 'Wood Paneling',
        appliesTo: 'wallFinish', appliesToValue: 'Wood Paneling',
        items: [
            { catalogCode: 'WALL_PREP', qtyFormula: 'wall_area_m2', qtyMultiplier: 1.0, includeWaste: false },
            { catalogCode: 'WALL_PANEL_SUPPLY', qtyFormula: 'wall_area_m2', qtyMultiplier: 1.0, includeWaste: true },
            { catalogCode: 'WALL_PANEL_LABOR', qtyFormula: 'wall_area_m2', qtyMultiplier: 1.0, includeWaste: false },
        ]
    },
    {
        code: 'WALL_EXPOSED_BRICK', name: 'Exposed Brick',
        appliesTo: 'wallFinish', appliesToValue: 'Exposed Brick',
        items: [
            { catalogCode: 'WALL_BRICK_EXPOSE', qtyFormula: 'wall_area_m2', qtyMultiplier: 1.0, includeWaste: false },
            { catalogCode: 'WALL_BRICK_SEAL', qtyFormula: 'wall_area_m2', qtyMultiplier: 1.0, includeWaste: true },
        ]
    },
    {
        code: 'WALL_TEXTURED_PLASTER', name: 'Textured Plaster',
        appliesTo: 'wallFinish', appliesToValue: 'Textured Plaster',
        items: [
            { catalogCode: 'WALL_PREP', qtyFormula: 'wall_area_m2', qtyMultiplier: 1.0, includeWaste: false },
            { catalogCode: 'WALL_PLASTER_SUPPLY', qtyFormula: 'wall_area_m2', qtyMultiplier: 1.0, includeWaste: true },
            { catalogCode: 'WALL_PLASTER_LABOR', qtyFormula: 'wall_area_m2', qtyMultiplier: 1.0, includeWaste: false },
        ]
    },
    {
        code: 'WALL_STONE_VENEER', name: 'Stone Veneer',
        appliesTo: 'wallFinish', appliesToValue: 'Stone Veneer',
        items: [
            { catalogCode: 'WALL_PREP', qtyFormula: 'wall_area_m2', qtyMultiplier: 1.0, includeWaste: false },
            { catalogCode: 'WALL_STONE_SUPPLY', qtyFormula: 'wall_area_m2', qtyMultiplier: 1.0, includeWaste: true },
            { catalogCode: 'WALL_STONE_LABOR', qtyFormula: 'wall_area_m2', qtyMultiplier: 1.0, includeWaste: false },
        ]
    },
    {
        code: 'WALL_MICROCEMENT', name: 'Microcement Wall Finish',
        appliesTo: 'wallFinish', appliesToValue: 'Microcement',
        items: [
            { catalogCode: 'WALL_PREP', qtyFormula: 'wall_area_m2', qtyMultiplier: 1.2, includeWaste: false },
            { catalogCode: 'WALL_PLASTER_SUPPLY', qtyFormula: 'wall_area_m2', qtyMultiplier: 1.3, includeWaste: true },
            { catalogCode: 'WALL_PLASTER_LABOR', qtyFormula: 'wall_area_m2', qtyMultiplier: 1.4, includeWaste: false },  // Specialized labor
            { catalogCode: 'WALL_BRICK_SEAL', qtyFormula: 'wall_area_m2', qtyMultiplier: 2.0, includeWaste: true },  // Multiple sealer coats
        ]
    },
    {
        code: 'WALL_ACOUSTIC', name: 'Acoustic Panels',
        appliesTo: 'wallFinish', appliesToValue: 'Acoustic Panels',
        items: [
            { catalogCode: 'WALL_PREP', qtyFormula: 'wall_area_m2', qtyMultiplier: 0.5, includeWaste: false },
            { catalogCode: 'WALL_PANEL_SUPPLY', qtyFormula: 'wall_area_m2', qtyMultiplier: 1.1, includeWaste: true },  // Acoustic panels cost more
            { catalogCode: 'WALL_PANEL_LABOR', qtyFormula: 'wall_area_m2', qtyMultiplier: 0.9, includeWaste: false },  // Easier to install
        ]
    },
    
    // Built-ins
    {
        code: 'BUILTIN_BASIC', name: 'Basic Cabinets',
        appliesTo: 'builtInFurniture', appliesToValue: 'Basic Cabinets',
        items: [
            { catalogCode: 'BUILTIN_BASIC_CABINET', qtyFormula: 'perimeter_lm', qtyMultiplier: 0.3, includeWaste: false },
            { catalogCode: 'BUILTIN_BASIC_INSTALL', qtyFormula: 'perimeter_lm', qtyMultiplier: 0.3, includeWaste: false },
        ]
    },
    {
        code: 'BUILTIN_CLOSET', name: 'Custom Closets',
        appliesTo: 'builtInFurniture', appliesToValue: 'Custom Closets',
        items: [
            { catalogCode: 'BUILTIN_CLOSET_SYSTEM', qtyFormula: 'area_m2', qtyMultiplier: 0.15, includeWaste: false },
            { catalogCode: 'BUILTIN_CLOSET_INSTALL', qtyFormula: 'area_m2', qtyMultiplier: 0.15, includeWaste: false },
        ]
    },
    {
        code: 'BUILTIN_SHELVING', name: 'Built-in Shelving',
        appliesTo: 'builtInFurniture', appliesToValue: 'Built-in Shelving',
        items: [
            { catalogCode: 'BUILTIN_SHELF_SUPPLY', qtyFormula: 'perimeter_lm', qtyMultiplier: 0.25, includeWaste: false },
            { catalogCode: 'BUILTIN_SHELF_INSTALL', qtyFormula: 'perimeter_lm', qtyMultiplier: 0.25, includeWaste: false },
        ]
    },
    {
        code: 'BUILTIN_KITCHEN_STD', name: 'Kitchen Cabinets (Standard)',
        appliesTo: 'builtInFurniture', appliesToValue: 'Kitchen Cabinets (Standard)',
        items: [
            { catalogCode: 'BUILTIN_KITCHEN_CAB', qtyFormula: 'perimeter_lm', qtyMultiplier: 0.5, includeWaste: false },
            { catalogCode: 'BUILTIN_KITCHEN_INSTALL', qtyFormula: 'perimeter_lm', qtyMultiplier: 0.5, includeWaste: false },
        ]
    },
    {
        code: 'BUILTIN_KITCHEN_PREM', name: 'Kitchen Cabinets (Premium)',
        appliesTo: 'builtInFurniture', appliesToValue: 'Kitchen Cabinets (Premium)',
        items: [
            { catalogCode: 'BUILTIN_KITCHEN_CAB', qtyFormula: 'perimeter_lm', qtyMultiplier: 0.7, includeWaste: false },  // More cabinets
            { catalogCode: 'BUILTIN_KITCHEN_INSTALL', qtyFormula: 'perimeter_lm', qtyMultiplier: 0.7, includeWaste: false },
        ]
    },
    {
        code: 'BUILTIN_VANITY', name: 'Bathroom Vanity',
        appliesTo: 'builtInFurniture', appliesToValue: 'Bathroom Vanity',
        items: [
            { catalogCode: 'BUILTIN_VANITY_SUPPLY', qtyFormula: 'fixed', qtyMultiplier: 1.0, includeWaste: false },
            { catalogCode: 'BUILTIN_VANITY_INSTALL', qtyFormula: 'fixed', qtyMultiplier: 1.0, includeWaste: false },
        ]
    },
    {
        code: 'BUILTIN_ENTERTAINMENT', name: 'Entertainment Center',
        appliesTo: 'builtInFurniture', appliesToValue: 'Entertainment Center',
        items: [
            { catalogCode: 'BUILTIN_ENTERTAIN_UNIT', qtyFormula: 'perimeter_lm', qtyMultiplier: 0.2, includeWaste: false },
            { catalogCode: 'BUILTIN_ENTERTAIN_INSTALL', qtyFormula: 'perimeter_lm', qtyMultiplier: 0.2, includeWaste: false },
        ]
    },
    {
        code: 'BUILTIN_HOME_OFFICE', name: 'Home Office Desk & Storage',
        appliesTo: 'builtInFurniture', appliesToValue: 'Home Office Desk & Storage',
        items: [
            { catalogCode: 'BUILTIN_SHELF_SUPPLY', qtyFormula: 'perimeter_lm', qtyMultiplier: 0.35, includeWaste: false },
            { catalogCode: 'BUILTIN_SHELF_INSTALL', qtyFormula: 'perimeter_lm', qtyMultiplier: 0.35, includeWaste: false },
            { catalogCode: 'BUILTIN_BASIC_CABINET', qtyFormula: 'perimeter_lm', qtyMultiplier: 0.2, includeWaste: false },
            { catalogCode: 'BUILTIN_BASIC_INSTALL', qtyFormula: 'perimeter_lm', qtyMultiplier: 0.2, includeWaste: false },
        ]
    },
    {
        code: 'BUILTIN_FULL_CUSTOM', name: 'Full Custom Joinery',
        appliesTo: 'builtInFurniture', appliesToValue: 'Full Custom Joinery',
        items: [
            { catalogCode: 'BUILTIN_CUSTOM_JOINERY', qtyFormula: 'area_m2', qtyMultiplier: 0.25, includeWaste: false },
            { catalogCode: 'BUILTIN_CUSTOM_INSTALL', qtyFormula: 'area_m2', qtyMultiplier: 0.25, includeWaste: false },
        ]
    },
];

// ============================================
// CALCULATION FUNCTIONS
// ============================================

const DEFAULT_CEILING_HEIGHT = 2.6;
const WALL_OPENINGS_PCT = 0.10;  // 10% for doors/windows
const OVERHEAD_PCT = 0.15;       // 15%
const CONTINGENCY_PCT = 0.08;    // 8%
const TAX_RATE = 0.21;           // 21% VAT

// Get location factor for a cost type
const getLocationFactor = (location: string, costType: string): number => {
    const baseFactor = LOCATION_MULTIPLIERS[location] || 1.0;
    if (location === 'Brazil') {
        return costType === 'labor' ? 0.65 : costType === 'material' ? 0.80 : 0.75;
    }
    if (location === 'Other') {
        return costType === 'labor' ? 1.15 : costType === 'material' ? 1.08 : 1.10;
    }
    return 1.0;  // Spain
};

// Get age factor for labor
const getAgeFactor = (propertyAge: string, costType: string): number => {
    if (costType !== 'labor') return 1.0;
    
    const ageFactors: Record<string, number> = {
        '1 - 5 Years': 1.0,
        '6 - 10 Years': 1.0,
        '11 - 15 Years': 1.05,
        '16 - 20 Years': 1.10,
        '21 - 25 Years': 1.18,
        'More than 25 Years': 1.28,
    };
    return ageFactors[propertyAge] || 1.0;
};

// Map ceiling height option to actual meters
const getCeilingHeightM = (ceilingHeightOption?: string): number => {
    const heightMap: Record<string, number> = {
        'Standard (2.4 - 2.7m)': 2.55,
        'High (2.8 - 3.2m)': 3.0,
        'Very high (3.3 - 4m)': 3.65,
        'Double height (4m+)': 4.5,
    };
    return heightMap[ceilingHeightOption || ''] || DEFAULT_CEILING_HEIGHT;
};

// Calculate room dimensions
const calculateRoomDimensions = (room: RoomInput) => {
    const areaM2 = room.width * room.length;
    const perimeterLm = 2 * (room.width + room.length);
    const ceilingHeight = getCeilingHeightM(room.ceilingHeight);
    const grossWallArea = perimeterLm * ceilingHeight;
    const wallAreaM2 = grossWallArea * (1 - WALL_OPENINGS_PCT);
    const ceilingAreaM2 = areaM2;
    
    return { areaM2, perimeterLm, wallAreaM2, ceilingAreaM2, ceilingHeight };
};

// Calculate quantity based on formula
const calculateQuantity = (
    formula: string,
    dimensions: ReturnType<typeof calculateRoomDimensions>,
    multiplier: number
): number => {
    switch (formula) {
        case 'area_m2': return dimensions.areaM2 * multiplier;
        case 'perimeter_lm': return dimensions.perimeterLm * multiplier;
        case 'wall_area_m2': return dimensions.wallAreaM2 * multiplier;
        case 'ceiling_area_m2': return dimensions.ceilingAreaM2 * multiplier;
        case 'fixed': return 1 * multiplier;
        case 'room_count': return 1 * multiplier;
        default: return 0;
    }
};

// Generate line items for an assembly
const generateAssemblyLineItems = (
    assembly: Assembly,
    dimensions: ReturnType<typeof calculateRoomDimensions>,
    location: string,
    propertyAge: string,
    roomIndex: number
): LineItem[] => {
    const lineItems: LineItem[] = [];
    
    for (const item of assembly.items) {
        const catalogItem = LOCAL_CATALOG.find(c => c.code === item.catalogCode);
        if (!catalogItem) continue;
        
        const quantity = calculateQuantity(item.qtyFormula, dimensions, item.qtyMultiplier);
        if (quantity <= 0) continue;
        
        const locationFactor = getLocationFactor(location, catalogItem.costType);
        const ageFactor = getAgeFactor(propertyAge, catalogItem.costType);
        const unitCostFinal = catalogItem.baseUnitCost * locationFactor * ageFactor;
        const costBeforeWaste = quantity * unitCostFinal;
        const wastePct = item.includeWaste ? catalogItem.defaultWastePct : 0;
        const wasteAmount = costBeforeWaste * wastePct;
        const costBeforeTax = costBeforeWaste + wasteAmount;
        const taxAmount = costBeforeTax * TAX_RATE;
        const totalCost = costBeforeTax + taxAmount;
        
        lineItems.push({
            code: catalogItem.code,
            name: catalogItem.name,
            costType: catalogItem.costType,
            unit: catalogItem.unit,
            quantity: Math.round(quantity * 100) / 100,
            baseUnitCost: catalogItem.baseUnitCost,
            locationFactor,
            ageFactor,
            unitCostFinal: Math.round(unitCostFinal * 100) / 100,
            costBeforeWaste: Math.round(costBeforeWaste * 100) / 100,
            wastePct,
            wasteAmount: Math.round(wasteAmount * 100) / 100,
            costBeforeTax: Math.round(costBeforeTax * 100) / 100,
            taxRate: TAX_RATE,
            taxAmount: Math.round(taxAmount * 100) / 100,
            totalCost: Math.round(totalCost * 100) / 100,
            assemblyCode: assembly.code,
            roomIndex,
        });
    }
    
    return lineItems;
};

// Main calculation function
export const calculateItemizedEstimate = (input: ProjectInput): ItemizedEstimateResult => {
    const rooms: RoomBreakdown[] = [];
    const allLineItems: LineItem[] = [];
    let totalFloorArea = 0;
    
    // Process each room
    for (let i = 0; i < input.rooms.length; i++) {
        const room = input.rooms[i];
        const dimensions = calculateRoomDimensions(room);
        totalFloorArea += dimensions.areaM2;
        
        const roomLineItems: LineItem[] = [];
        
        // Floor finish assembly
        const floorAssembly = LOCAL_ASSEMBLIES.find(
            a => a.appliesTo === 'floorFinish' && a.appliesToValue === room.floorFinish
        );
        if (floorAssembly) {
            roomLineItems.push(...generateAssemblyLineItems(
                floorAssembly, dimensions, input.propertyLocation, input.propertyAge, i
            ));
        }
        
        // Wall finish assembly
        const wallAssembly = LOCAL_ASSEMBLIES.find(
            a => a.appliesTo === 'wallFinish' && a.appliesToValue === room.wallFinish
        );
        if (wallAssembly) {
            roomLineItems.push(...generateAssemblyLineItems(
                wallAssembly, dimensions, input.propertyLocation, input.propertyAge, i
            ));
        }
        
        // Built-in furniture assembly
        if (room.builtInFurniture && room.builtInFurniture !== 'None') {
            const builtinAssembly = LOCAL_ASSEMBLIES.find(
                a => a.appliesTo === 'builtInFurniture' && a.appliesToValue === room.builtInFurniture
            );
            if (builtinAssembly) {
                roomLineItems.push(...generateAssemblyLineItems(
                    builtinAssembly, dimensions, input.propertyLocation, input.propertyAge, i
                ));
            }
        }
        
        // Calculate room totals
        const materialsCost = roomLineItems
            .filter(li => li.costType === 'material')
            .reduce((sum, li) => sum + li.costBeforeTax, 0);
        const laborCost = roomLineItems
            .filter(li => li.costType === 'labor')
            .reduce((sum, li) => sum + li.costBeforeTax, 0);
        const subtotal = roomLineItems.reduce((sum, li) => sum + li.costBeforeTax, 0);
        
        rooms.push({
            roomIndex: i,
            roomType: room.roomType,
            areaM2: dimensions.areaM2,
            perimeterLm: dimensions.perimeterLm,
            wallAreaM2: dimensions.wallAreaM2,
            ceilingAreaM2: dimensions.ceilingAreaM2,
            lineItems: roomLineItems,
            materialsCost: Math.round(materialsCost * 100) / 100,
            laborCost: Math.round(laborCost * 100) / 100,
            subtotal: Math.round(subtotal * 100) / 100,
        });
        
        allLineItems.push(...roomLineItems);
    }
    
    // Project-level items
    const projectLineItems: LineItem[] = [];
    const projectDimensions = {
        areaM2: totalFloorArea,
        perimeterLm: 0,
        wallAreaM2: 0,
        ceilingAreaM2: totalFloorArea,
        ceilingHeight: DEFAULT_CEILING_HEIGHT,
    };
    
    // Site setup
    const siteSetup = LOCAL_CATALOG.find(c => c.code === 'PROJ_SITE_SETUP')!;
    projectLineItems.push({
        code: siteSetup.code,
        name: siteSetup.name,
        costType: siteSetup.costType,
        unit: siteSetup.unit,
        quantity: 1,
        baseUnitCost: siteSetup.baseUnitCost,
        locationFactor: 1,
        ageFactor: 1,
        unitCostFinal: siteSetup.baseUnitCost,
        costBeforeWaste: siteSetup.baseUnitCost,
        wastePct: 0,
        wasteAmount: 0,
        costBeforeTax: siteSetup.baseUnitCost,
        taxRate: TAX_RATE,
        taxAmount: siteSetup.baseUnitCost * TAX_RATE,
        totalCost: siteSetup.baseUnitCost * (1 + TAX_RATE),
    });
    
    // Protection
    const protection = LOCAL_CATALOG.find(c => c.code === 'PROJ_PROTECTION')!;
    const protectionCost = totalFloorArea * protection.baseUnitCost;
    projectLineItems.push({
        code: protection.code,
        name: protection.name,
        costType: protection.costType,
        unit: protection.unit,
        quantity: totalFloorArea,
        baseUnitCost: protection.baseUnitCost,
        locationFactor: 1,
        ageFactor: 1,
        unitCostFinal: protection.baseUnitCost,
        costBeforeWaste: protectionCost,
        wastePct: 0,
        wasteAmount: 0,
        costBeforeTax: protectionCost,
        taxRate: TAX_RATE,
        taxAmount: protectionCost * TAX_RATE,
        totalCost: protectionCost * (1 + TAX_RATE),
    });
    
    // Cleanup
    const cleanup = LOCAL_CATALOG.find(c => c.code === 'PROJ_CLEANUP')!;
    const cleanupCost = totalFloorArea * cleanup.baseUnitCost;
    projectLineItems.push({
        code: cleanup.code,
        name: cleanup.name,
        costType: cleanup.costType,
        unit: cleanup.unit,
        quantity: totalFloorArea,
        baseUnitCost: cleanup.baseUnitCost,
        locationFactor: 1,
        ageFactor: 1,
        unitCostFinal: cleanup.baseUnitCost,
        costBeforeWaste: cleanupCost,
        wastePct: 0,
        wasteAmount: 0,
        costBeforeTax: cleanupCost,
        taxRate: TAX_RATE,
        taxAmount: cleanupCost * TAX_RATE,
        totalCost: cleanupCost * (1 + TAX_RATE),
    });
    
    allLineItems.push(...projectLineItems);
    
    // Calculate summary
    const materials = allLineItems
        .filter(li => li.costType === 'material')
        .reduce((sum, li) => sum + li.costBeforeTax, 0);
    const labor = allLineItems
        .filter(li => li.costType === 'labor')
        .reduce((sum, li) => sum + li.costBeforeTax, 0);
    const equipment = allLineItems
        .filter(li => li.costType === 'equipment')
        .reduce((sum, li) => sum + li.costBeforeTax, 0);
    
    // Calculate all project-level multipliers
    const locationMultiplier = getLocationMultiplier(input.propertyLocation, input.propertyCity || '');
    const propertyTypeMultiplier = PROPERTY_TYPE_MULTIPLIERS[input.propertyType] || 1.0;
    const conditionMultiplier = PROPERTY_CONDITION_MULTIPLIERS[input.propertyCondition] || 1.0;
    const accessMultiplier = ACCESS_DIFFICULTY_MULTIPLIERS[input.accessDifficulty] || 1.0;
    const urgencyMultiplier = URGENCY_MULTIPLIERS[input.urgency] || 1.0;
    
    // Combined project multiplier (applied to overhead/contingency/total)
    const projectMultiplier = propertyTypeMultiplier * conditionMultiplier * accessMultiplier * urgencyMultiplier;
    
    const subtotalBeforeOverhead = materials + labor + equipment;
    const adjustedSubtotal = subtotalBeforeOverhead * projectMultiplier;
    const overhead = adjustedSubtotal * OVERHEAD_PCT;
    const contingency = adjustedSubtotal * CONTINGENCY_PCT;
    const subtotalWithOverhead = adjustedSubtotal + overhead + contingency;
    const taxTotal = subtotalWithOverhead * TAX_RATE;
    const total = subtotalWithOverhead + taxTotal;
    
    return {
        pricingVersion: PRICING_VERSION,
        currency: DEFAULT_CURRENCY,
        assumptions: {
            defaultCeilingHeightM: DEFAULT_CEILING_HEIGHT,
            wallOpeningsPct: WALL_OPENINGS_PCT,
            overheadPct: OVERHEAD_PCT,
            contingencyPct: CONTINGENCY_PCT,
            taxRate: TAX_RATE,
        },
        summary: {
            materials: Math.round(materials * 100) / 100,
            labor: Math.round(labor * 100) / 100,
            equipment: Math.round(equipment * 100) / 100,
            overhead: Math.round(overhead * 100) / 100,
            contingency: Math.round(contingency * 100) / 100,
            taxTotal: Math.round(taxTotal * 100) / 100,
            subtotal: Math.round(subtotalWithOverhead * 100) / 100,
            total: Math.round(total * 100) / 100,
        },
        rooms,
        projectLineItems,
        allLineItems,
        multipliers: {
            location: { 
                name: input.propertyLocation, 
                city: input.propertyCity || '',
                value: locationMultiplier 
            },
            propertyAge: { 
                label: input.propertyAge, 
                value: PROPERTY_AGE_MULTIPLIERS[input.propertyAge] || 1.0 
            },
            propertyType: {
                label: input.propertyType || 'Apartment',
                value: propertyTypeMultiplier
            },
            propertyCondition: {
                label: input.propertyCondition || 'Average',
                value: conditionMultiplier
            },
            accessDifficulty: {
                label: input.accessDifficulty || 'Easy',
                value: accessMultiplier
            },
            urgency: {
                label: input.urgency || 'Standard',
                value: urgencyMultiplier
            },
        },
        inputSummary: {
            country: input.propertyLocation,
            city: input.propertyCity || '',
            propertyAge: input.propertyAge,
            propertyType: input.propertyType || 'Apartment',
            propertyCondition: input.propertyCondition || 'Average',
            accessDifficulty: input.accessDifficulty || 'Easy',
            urgency: input.urgency || 'Standard',
            totalArea: totalFloorArea,
            roomCount: input.rooms.length,
        },
    };
};

// Format currency
export const formatCurrency = (amount: number, currency: string = 'EUR'): string => {
    return new Intl.NumberFormat('en-EU', {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};

// Format number with unit
export const formatQuantity = (qty: number, unit: string): string => {
    const formatted = qty.toFixed(qty % 1 === 0 ? 0 : 2);
    return `${formatted} ${unit}`;
};


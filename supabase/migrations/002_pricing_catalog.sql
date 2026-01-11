-- NovaHogar Pricing Catalog & Bill of Quantities Schema
-- Run this in your Supabase SQL Editor after 001_project_estimates.sql

-- ============================================
-- PRICING CATALOG TABLES
-- ============================================

-- Catalog Items: individual materials, labor, etc.
CREATE TABLE IF NOT EXISTS pricing_catalog_items (
    id SERIAL PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,              -- e.g., FLOOR_HARDWOOD_SUPPLY
    name TEXT NOT NULL,                      -- e.g., "Hardwood flooring supply"
    description TEXT,
    unit TEXT NOT NULL,                      -- m2, lm, hour, item, fixed
    cost_type TEXT NOT NULL CHECK (cost_type IN ('material', 'labor', 'equipment', 'subcontract', 'tax', 'overhead')),
    base_unit_cost NUMERIC(10,2) NOT NULL,   -- in base currency (EUR)
    default_waste_pct NUMERIC(5,3) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Location-specific cost adjustments
CREATE TABLE IF NOT EXISTS pricing_location_factors (
    id SERIAL PRIMARY KEY,
    location_id INT NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    catalog_item_id INT NOT NULL REFERENCES pricing_catalog_items(id) ON DELETE CASCADE,
    multiplier NUMERIC(6,3) DEFAULT 1.0,
    override_unit_cost NUMERIC(10,2) NULL,   -- if set, replaces base_unit_cost
    UNIQUE(location_id, catalog_item_id)
);

-- Property age-specific adjustments (older = more prep work)
CREATE TABLE IF NOT EXISTS pricing_age_factors (
    id SERIAL PRIMARY KEY,
    property_age_id INT NOT NULL REFERENCES property_age_bands(id) ON DELETE CASCADE,
    catalog_item_id INT NOT NULL REFERENCES pricing_catalog_items(id) ON DELETE CASCADE,
    multiplier NUMERIC(6,3) DEFAULT 1.0,
    UNIQUE(property_age_id, catalog_item_id)
);

-- ============================================
-- ASSEMBLY TABLES (recipes for work)
-- ============================================

-- Assemblies: recipes that map finishes → line items
CREATE TABLE IF NOT EXISTS assemblies (
    id SERIAL PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,               -- e.g., FLOOR_HARDWOOD
    name TEXT NOT NULL,                       -- e.g., "Hardwood Floor Installation"
    applies_to TEXT NOT NULL CHECK (applies_to IN ('floorFinish', 'wallFinish', 'builtInFurniture', 'roomType', 'project')),
    applies_to_value TEXT NOT NULL,           -- e.g., "Hardwood" (matches the option name)
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Assembly Items: catalog items that make up an assembly
CREATE TABLE IF NOT EXISTS assembly_items (
    id SERIAL PRIMARY KEY,
    assembly_id INT NOT NULL REFERENCES assemblies(id) ON DELETE CASCADE,
    catalog_item_id INT NOT NULL REFERENCES pricing_catalog_items(id) ON DELETE CASCADE,
    qty_formula TEXT NOT NULL CHECK (qty_formula IN ('area_m2', 'perimeter_lm', 'wall_area_m2', 'ceiling_area_m2', 'fixed', 'room_count')),
    qty_multiplier NUMERIC(6,3) DEFAULT 1.0,  -- e.g., 2.0 for 2 coats of paint
    include_waste BOOLEAN DEFAULT true,
    is_optional BOOLEAN DEFAULT false,
    notes TEXT,
    sort_order INT DEFAULT 0
);

-- ============================================
-- ESTIMATE LINE ITEMS (actual calculated costs)
-- ============================================

-- Store individual line items for each estimate
CREATE TABLE IF NOT EXISTS estimate_line_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    estimate_id UUID NOT NULL REFERENCES estimates(id) ON DELETE CASCADE,
    project_room_id UUID REFERENCES project_rooms(id) ON DELETE CASCADE,  -- NULL for project-level costs
    catalog_item_id INT NOT NULL REFERENCES pricing_catalog_items(id),
    assembly_id INT REFERENCES assemblies(id),
    
    -- Quantity
    quantity NUMERIC(12,3) NOT NULL,
    unit TEXT NOT NULL,
    
    -- Pricing
    base_unit_cost NUMERIC(10,2) NOT NULL,
    location_factor NUMERIC(6,3) DEFAULT 1.0,
    age_factor NUMERIC(6,3) DEFAULT 1.0,
    unit_cost_final NUMERIC(10,2) NOT NULL,
    
    -- Costs
    cost_before_waste NUMERIC(12,2) NOT NULL,
    waste_pct NUMERIC(5,3) DEFAULT 0,
    waste_amount NUMERIC(12,2) DEFAULT 0,
    cost_before_tax NUMERIC(12,2) NOT NULL,
    tax_rate NUMERIC(5,3) DEFAULT 0,
    tax_amount NUMERIC(12,2) DEFAULT 0,
    total_cost NUMERIC(12,2) NOT NULL,
    
    -- Metadata
    cost_type TEXT NOT NULL,
    line_item_name TEXT NOT NULL,
    meta_json JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_catalog_items_code ON pricing_catalog_items(code);
CREATE INDEX IF NOT EXISTS idx_catalog_items_cost_type ON pricing_catalog_items(cost_type);
CREATE INDEX IF NOT EXISTS idx_assemblies_applies ON assemblies(applies_to, applies_to_value);
CREATE INDEX IF NOT EXISTS idx_assembly_items_assembly ON assembly_items(assembly_id);
CREATE INDEX IF NOT EXISTS idx_estimate_line_items_estimate ON estimate_line_items(estimate_id);
CREATE INDEX IF NOT EXISTS idx_estimate_line_items_room ON estimate_line_items(project_room_id);

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE pricing_catalog_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_location_factors ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_age_factors ENABLE ROW LEVEL SECURITY;
ALTER TABLE assemblies ENABLE ROW LEVEL SECURITY;
ALTER TABLE assembly_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimate_line_items ENABLE ROW LEVEL SECURITY;

-- Read access to catalog tables for all users
CREATE POLICY "Allow read catalog items" ON pricing_catalog_items FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "Allow read location factors" ON pricing_location_factors FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "Allow read age factors" ON pricing_age_factors FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "Allow read assemblies" ON assemblies FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "Allow read assembly items" ON assembly_items FOR SELECT TO authenticated, anon USING (true);

-- Line items follow estimate permissions
CREATE POLICY "Users can manage line items" ON estimate_line_items FOR ALL TO authenticated 
    USING (EXISTS (SELECT 1 FROM estimates e JOIN projects p ON p.id = e.project_id WHERE e.id = estimate_line_items.estimate_id AND (p.user_id = auth.uid() OR p.user_id IS NULL)));
CREATE POLICY "Anon can manage line items" ON estimate_line_items FOR ALL TO anon 
    USING (EXISTS (SELECT 1 FROM estimates e JOIN projects p ON p.id = e.project_id WHERE e.id = estimate_line_items.estimate_id AND p.user_id IS NULL));

-- ============================================
-- UPDATE TRIGGER
-- ============================================

CREATE TRIGGER update_catalog_items_updated_at
    BEFORE UPDATE ON pricing_catalog_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SEED DATA: PRICING CATALOG ITEMS
-- ============================================

-- Flooring Items
INSERT INTO pricing_catalog_items (code, name, unit, cost_type, base_unit_cost, default_waste_pct) VALUES
-- Demolition & Prep
('FLOOR_DEMO', 'Floor demolition & disposal', 'm2', 'labor', 12.00, 0),
('FLOOR_PREP', 'Floor surface preparation', 'm2', 'labor', 8.00, 0),
('FLOOR_UNDERLAY', 'Floor underlay material', 'm2', 'material', 4.50, 0.05),

-- Hardwood
('FLOOR_HARDWOOD_SUPPLY', 'Hardwood flooring supply', 'm2', 'material', 55.00, 0.10),
('FLOOR_HARDWOOD_LABOR', 'Hardwood installation labor', 'm2', 'labor', 28.00, 0),

-- Laminate
('FLOOR_LAMINATE_SUPPLY', 'Laminate flooring supply', 'm2', 'material', 22.00, 0.08),
('FLOOR_LAMINATE_LABOR', 'Laminate installation labor', 'm2', 'labor', 18.00, 0),

-- Tile
('FLOOR_TILE_SUPPLY', 'Floor tile supply', 'm2', 'material', 35.00, 0.12),
('FLOOR_TILE_ADHESIVE', 'Tile adhesive & grout', 'm2', 'material', 8.00, 0.05),
('FLOOR_TILE_LABOR', 'Floor tile installation labor', 'm2', 'labor', 35.00, 0),

-- Vinyl
('FLOOR_VINYL_SUPPLY', 'Vinyl flooring supply', 'm2', 'material', 18.00, 0.08),
('FLOOR_VINYL_LABOR', 'Vinyl installation labor', 'm2', 'labor', 15.00, 0),

-- Carpet
('FLOOR_CARPET_SUPPLY', 'Carpet supply', 'm2', 'material', 25.00, 0.10),
('FLOOR_CARPET_UNDERPAD', 'Carpet underpad', 'm2', 'material', 6.00, 0.05),
('FLOOR_CARPET_LABOR', 'Carpet installation labor', 'm2', 'labor', 12.00, 0),

-- Concrete
('FLOOR_CONCRETE_POLISH', 'Concrete polishing', 'm2', 'labor', 45.00, 0),
('FLOOR_CONCRETE_SEALER', 'Concrete sealer', 'm2', 'material', 8.00, 0.05),

-- Marble
('FLOOR_MARBLE_SUPPLY', 'Marble flooring supply', 'm2', 'material', 120.00, 0.12),
('FLOOR_MARBLE_LABOR', 'Marble installation labor', 'm2', 'labor', 55.00, 0),

-- Engineered Wood
('FLOOR_ENGWOOD_SUPPLY', 'Engineered wood flooring supply', 'm2', 'material', 42.00, 0.10),
('FLOOR_ENGWOOD_LABOR', 'Engineered wood installation labor', 'm2', 'labor', 24.00, 0),

-- Skirting/Baseboards
('FLOOR_SKIRTING_SUPPLY', 'Skirting/baseboard supply', 'lm', 'material', 8.00, 0.08),
('FLOOR_SKIRTING_LABOR', 'Skirting installation labor', 'lm', 'labor', 6.00, 0)
ON CONFLICT (code) DO UPDATE SET 
    name = EXCLUDED.name,
    base_unit_cost = EXCLUDED.base_unit_cost,
    default_waste_pct = EXCLUDED.default_waste_pct;

-- Wall Items
INSERT INTO pricing_catalog_items (code, name, unit, cost_type, base_unit_cost, default_waste_pct) VALUES
-- Prep
('WALL_PREP', 'Wall surface preparation', 'm2', 'labor', 6.00, 0),
('WALL_REPAIR', 'Wall repair & patching', 'm2', 'labor', 12.00, 0),
('WALL_PRIMER', 'Wall primer', 'm2', 'material', 3.50, 0.07),

-- Paint
('WALL_PAINT_SUPPLY', 'Wall paint supply', 'm2', 'material', 4.00, 0.07),
('WALL_PAINT_LABOR', 'Wall painting labor (2 coats)', 'm2', 'labor', 8.00, 0),

-- Wallpaper
('WALL_PAPER_SUPPLY', 'Wallpaper supply', 'm2', 'material', 18.00, 0.10),
('WALL_PAPER_ADHESIVE', 'Wallpaper adhesive', 'm2', 'material', 2.00, 0.05),
('WALL_PAPER_LABOR', 'Wallpaper installation labor', 'm2', 'labor', 15.00, 0),

-- Tile
('WALL_TILE_SUPPLY', 'Wall tile supply', 'm2', 'material', 32.00, 0.12),
('WALL_TILE_ADHESIVE', 'Wall tile adhesive & grout', 'm2', 'material', 7.00, 0.05),
('WALL_TILE_LABOR', 'Wall tile installation labor', 'm2', 'labor', 38.00, 0),

-- Wood Paneling
('WALL_PANEL_SUPPLY', 'Wood paneling supply', 'm2', 'material', 45.00, 0.10),
('WALL_PANEL_LABOR', 'Wood paneling installation labor', 'm2', 'labor', 28.00, 0),

-- Exposed Brick
('WALL_BRICK_EXPOSE', 'Brick exposure work', 'm2', 'labor', 35.00, 0),
('WALL_BRICK_SEAL', 'Brick sealer', 'm2', 'material', 6.00, 0.05),

-- Textured Plaster
('WALL_PLASTER_SUPPLY', 'Textured plaster supply', 'm2', 'material', 12.00, 0.08),
('WALL_PLASTER_LABOR', 'Textured plaster application', 'm2', 'labor', 22.00, 0),

-- Stone Veneer
('WALL_STONE_SUPPLY', 'Stone veneer supply', 'm2', 'material', 65.00, 0.10),
('WALL_STONE_LABOR', 'Stone veneer installation', 'm2', 'labor', 45.00, 0)
ON CONFLICT (code) DO UPDATE SET 
    name = EXCLUDED.name,
    base_unit_cost = EXCLUDED.base_unit_cost,
    default_waste_pct = EXCLUDED.default_waste_pct;

-- Built-in Furniture Items
INSERT INTO pricing_catalog_items (code, name, unit, cost_type, base_unit_cost, default_waste_pct) VALUES
('BUILTIN_BASIC_CABINET', 'Basic cabinet supply', 'lm', 'material', 180.00, 0),
('BUILTIN_BASIC_INSTALL', 'Basic cabinet installation', 'lm', 'labor', 85.00, 0),

('BUILTIN_CLOSET_SYSTEM', 'Custom closet system', 'm2', 'material', 220.00, 0),
('BUILTIN_CLOSET_INSTALL', 'Custom closet installation', 'm2', 'labor', 95.00, 0),

('BUILTIN_SHELF_SUPPLY', 'Built-in shelving supply', 'lm', 'material', 65.00, 0),
('BUILTIN_SHELF_INSTALL', 'Built-in shelving installation', 'lm', 'labor', 45.00, 0),

('BUILTIN_KITCHEN_CAB', 'Kitchen cabinet supply', 'lm', 'material', 350.00, 0),
('BUILTIN_KITCHEN_INSTALL', 'Kitchen cabinet installation', 'lm', 'labor', 120.00, 0),
('BUILTIN_KITCHEN_COUNTER', 'Kitchen countertop', 'lm', 'material', 180.00, 0),

('BUILTIN_VANITY_SUPPLY', 'Bathroom vanity supply', 'item', 'material', 450.00, 0),
('BUILTIN_VANITY_INSTALL', 'Bathroom vanity installation', 'item', 'labor', 180.00, 0),

('BUILTIN_ENTERTAIN_UNIT', 'Entertainment center', 'lm', 'material', 280.00, 0),
('BUILTIN_ENTERTAIN_INSTALL', 'Entertainment center installation', 'lm', 'labor', 110.00, 0),

('BUILTIN_CUSTOM_JOINERY', 'Full custom joinery', 'm2', 'material', 450.00, 0),
('BUILTIN_CUSTOM_INSTALL', 'Full custom installation', 'm2', 'labor', 180.00, 0)
ON CONFLICT (code) DO UPDATE SET 
    name = EXCLUDED.name,
    base_unit_cost = EXCLUDED.base_unit_cost;

-- Project-level Items
INSERT INTO pricing_catalog_items (code, name, unit, cost_type, base_unit_cost, default_waste_pct) VALUES
('PROJ_SITE_SETUP', 'Site setup & protection', 'fixed', 'labor', 250.00, 0),
('PROJ_PROTECTION', 'Surface protection materials', 'm2', 'material', 2.50, 0),
('PROJ_CLEANUP', 'Final cleanup & disposal', 'm2', 'labor', 4.00, 0),
('PROJ_OVERHEAD', 'Overhead & profit', 'pct', 'overhead', 0.15, 0),  -- 15%
('PROJ_CONTINGENCY', 'Contingency allowance', 'pct', 'overhead', 0.08, 0)  -- 8%
ON CONFLICT (code) DO UPDATE SET 
    name = EXCLUDED.name,
    base_unit_cost = EXCLUDED.base_unit_cost;

-- ============================================
-- SEED DATA: ASSEMBLIES
-- ============================================

-- Floor Assemblies
INSERT INTO assemblies (code, name, applies_to, applies_to_value, sort_order) VALUES
('FLOOR_HARDWOOD', 'Hardwood Floor Installation', 'floorFinish', 'Hardwood', 1),
('FLOOR_LAMINATE', 'Laminate Floor Installation', 'floorFinish', 'Laminate', 2),
('FLOOR_TILE', 'Tile Floor Installation', 'floorFinish', 'Tile', 3),
('FLOOR_VINYL', 'Vinyl Floor Installation', 'floorFinish', 'Vinyl', 4),
('FLOOR_CARPET', 'Carpet Installation', 'floorFinish', 'Carpet', 5),
('FLOOR_CONCRETE', 'Polished Concrete Floor', 'floorFinish', 'Concrete', 6),
('FLOOR_MARBLE', 'Marble Floor Installation', 'floorFinish', 'Marble', 7),
('FLOOR_ENGWOOD', 'Engineered Wood Installation', 'floorFinish', 'Engineered Wood', 8)
ON CONFLICT (code) DO NOTHING;

-- Wall Assemblies
INSERT INTO assemblies (code, name, applies_to, applies_to_value, sort_order) VALUES
('WALL_PAINT', 'Wall Painting', 'wallFinish', 'Paint', 1),
('WALL_WALLPAPER', 'Wallpaper Installation', 'wallFinish', 'Wallpaper', 2),
('WALL_TILE', 'Wall Tiling', 'wallFinish', 'Tile', 3),
('WALL_WOOD_PANEL', 'Wood Paneling', 'wallFinish', 'Wood Paneling', 4),
('WALL_EXPOSED_BRICK', 'Exposed Brick Finish', 'wallFinish', 'Exposed Brick', 5),
('WALL_TEXTURED_PLASTER', 'Textured Plaster', 'wallFinish', 'Textured Plaster', 6),
('WALL_STONE_VENEER', 'Stone Veneer', 'wallFinish', 'Stone Veneer', 7)
ON CONFLICT (code) DO NOTHING;

-- Built-in Assemblies
INSERT INTO assemblies (code, name, applies_to, applies_to_value, sort_order) VALUES
('BUILTIN_BASIC', 'Basic Cabinets', 'builtInFurniture', 'Basic Cabinets', 1),
('BUILTIN_CLOSET', 'Custom Closets', 'builtInFurniture', 'Custom Closets', 2),
('BUILTIN_SHELVING', 'Built-in Shelving', 'builtInFurniture', 'Built-in Shelving', 3),
('BUILTIN_KITCHEN', 'Kitchen Cabinets', 'builtInFurniture', 'Kitchen Cabinets', 4),
('BUILTIN_VANITY', 'Bathroom Vanity', 'builtInFurniture', 'Bathroom Vanity', 5),
('BUILTIN_ENTERTAINMENT', 'Entertainment Center', 'builtInFurniture', 'Entertainment Center', 6),
('BUILTIN_FULL_CUSTOM', 'Full Custom Joinery', 'builtInFurniture', 'Full Custom', 7)
ON CONFLICT (code) DO NOTHING;

-- Project-level Assemblies
INSERT INTO assemblies (code, name, applies_to, applies_to_value, sort_order) VALUES
('PROJ_SETUP', 'Project Setup & Protection', 'project', 'all', 1),
('PROJ_FINISH', 'Project Cleanup & Finish', 'project', 'all', 2)
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- SEED DATA: ASSEMBLY ITEMS (link assemblies to catalog items)
-- ============================================

-- Hardwood Floor Assembly
INSERT INTO assembly_items (assembly_id, catalog_item_id, qty_formula, qty_multiplier, include_waste, sort_order)
SELECT a.id, c.id, 'area_m2', 1.0, false, 1
FROM assemblies a, pricing_catalog_items c WHERE a.code = 'FLOOR_HARDWOOD' AND c.code = 'FLOOR_DEMO';
INSERT INTO assembly_items (assembly_id, catalog_item_id, qty_formula, qty_multiplier, include_waste, sort_order)
SELECT a.id, c.id, 'area_m2', 1.0, false, 2
FROM assemblies a, pricing_catalog_items c WHERE a.code = 'FLOOR_HARDWOOD' AND c.code = 'FLOOR_PREP';
INSERT INTO assembly_items (assembly_id, catalog_item_id, qty_formula, qty_multiplier, include_waste, sort_order)
SELECT a.id, c.id, 'area_m2', 1.0, true, 3
FROM assemblies a, pricing_catalog_items c WHERE a.code = 'FLOOR_HARDWOOD' AND c.code = 'FLOOR_UNDERLAY';
INSERT INTO assembly_items (assembly_id, catalog_item_id, qty_formula, qty_multiplier, include_waste, sort_order)
SELECT a.id, c.id, 'area_m2', 1.0, true, 4
FROM assemblies a, pricing_catalog_items c WHERE a.code = 'FLOOR_HARDWOOD' AND c.code = 'FLOOR_HARDWOOD_SUPPLY';
INSERT INTO assembly_items (assembly_id, catalog_item_id, qty_formula, qty_multiplier, include_waste, sort_order)
SELECT a.id, c.id, 'area_m2', 1.0, false, 5
FROM assemblies a, pricing_catalog_items c WHERE a.code = 'FLOOR_HARDWOOD' AND c.code = 'FLOOR_HARDWOOD_LABOR';
INSERT INTO assembly_items (assembly_id, catalog_item_id, qty_formula, qty_multiplier, include_waste, sort_order)
SELECT a.id, c.id, 'perimeter_lm', 1.0, true, 6
FROM assemblies a, pricing_catalog_items c WHERE a.code = 'FLOOR_HARDWOOD' AND c.code = 'FLOOR_SKIRTING_SUPPLY';
INSERT INTO assembly_items (assembly_id, catalog_item_id, qty_formula, qty_multiplier, include_waste, sort_order)
SELECT a.id, c.id, 'perimeter_lm', 1.0, false, 7
FROM assemblies a, pricing_catalog_items c WHERE a.code = 'FLOOR_HARDWOOD' AND c.code = 'FLOOR_SKIRTING_LABOR';

-- Laminate Floor Assembly
INSERT INTO assembly_items (assembly_id, catalog_item_id, qty_formula, qty_multiplier, include_waste, sort_order)
SELECT a.id, c.id, 'area_m2', 1.0, false, 1
FROM assemblies a, pricing_catalog_items c WHERE a.code = 'FLOOR_LAMINATE' AND c.code = 'FLOOR_DEMO';
INSERT INTO assembly_items (assembly_id, catalog_item_id, qty_formula, qty_multiplier, include_waste, sort_order)
SELECT a.id, c.id, 'area_m2', 1.0, true, 2
FROM assemblies a, pricing_catalog_items c WHERE a.code = 'FLOOR_LAMINATE' AND c.code = 'FLOOR_UNDERLAY';
INSERT INTO assembly_items (assembly_id, catalog_item_id, qty_formula, qty_multiplier, include_waste, sort_order)
SELECT a.id, c.id, 'area_m2', 1.0, true, 3
FROM assemblies a, pricing_catalog_items c WHERE a.code = 'FLOOR_LAMINATE' AND c.code = 'FLOOR_LAMINATE_SUPPLY';
INSERT INTO assembly_items (assembly_id, catalog_item_id, qty_formula, qty_multiplier, include_waste, sort_order)
SELECT a.id, c.id, 'area_m2', 1.0, false, 4
FROM assemblies a, pricing_catalog_items c WHERE a.code = 'FLOOR_LAMINATE' AND c.code = 'FLOOR_LAMINATE_LABOR';
INSERT INTO assembly_items (assembly_id, catalog_item_id, qty_formula, qty_multiplier, include_waste, sort_order)
SELECT a.id, c.id, 'perimeter_lm', 1.0, true, 5
FROM assemblies a, pricing_catalog_items c WHERE a.code = 'FLOOR_LAMINATE' AND c.code = 'FLOOR_SKIRTING_SUPPLY';
INSERT INTO assembly_items (assembly_id, catalog_item_id, qty_formula, qty_multiplier, include_waste, sort_order)
SELECT a.id, c.id, 'perimeter_lm', 1.0, false, 6
FROM assemblies a, pricing_catalog_items c WHERE a.code = 'FLOOR_LAMINATE' AND c.code = 'FLOOR_SKIRTING_LABOR';

-- Tile Floor Assembly
INSERT INTO assembly_items (assembly_id, catalog_item_id, qty_formula, qty_multiplier, include_waste, sort_order)
SELECT a.id, c.id, 'area_m2', 1.0, false, 1
FROM assemblies a, pricing_catalog_items c WHERE a.code = 'FLOOR_TILE' AND c.code = 'FLOOR_DEMO';
INSERT INTO assembly_items (assembly_id, catalog_item_id, qty_formula, qty_multiplier, include_waste, sort_order)
SELECT a.id, c.id, 'area_m2', 1.0, false, 2
FROM assemblies a, pricing_catalog_items c WHERE a.code = 'FLOOR_TILE' AND c.code = 'FLOOR_PREP';
INSERT INTO assembly_items (assembly_id, catalog_item_id, qty_formula, qty_multiplier, include_waste, sort_order)
SELECT a.id, c.id, 'area_m2', 1.0, true, 3
FROM assemblies a, pricing_catalog_items c WHERE a.code = 'FLOOR_TILE' AND c.code = 'FLOOR_TILE_SUPPLY';
INSERT INTO assembly_items (assembly_id, catalog_item_id, qty_formula, qty_multiplier, include_waste, sort_order)
SELECT a.id, c.id, 'area_m2', 1.0, true, 4
FROM assemblies a, pricing_catalog_items c WHERE a.code = 'FLOOR_TILE' AND c.code = 'FLOOR_TILE_ADHESIVE';
INSERT INTO assembly_items (assembly_id, catalog_item_id, qty_formula, qty_multiplier, include_waste, sort_order)
SELECT a.id, c.id, 'area_m2', 1.0, false, 5
FROM assemblies a, pricing_catalog_items c WHERE a.code = 'FLOOR_TILE' AND c.code = 'FLOOR_TILE_LABOR';

-- Paint Wall Assembly
INSERT INTO assembly_items (assembly_id, catalog_item_id, qty_formula, qty_multiplier, include_waste, sort_order)
SELECT a.id, c.id, 'wall_area_m2', 1.0, false, 1
FROM assemblies a, pricing_catalog_items c WHERE a.code = 'WALL_PAINT' AND c.code = 'WALL_PREP';
INSERT INTO assembly_items (assembly_id, catalog_item_id, qty_formula, qty_multiplier, include_waste, sort_order)
SELECT a.id, c.id, 'wall_area_m2', 1.0, true, 2
FROM assemblies a, pricing_catalog_items c WHERE a.code = 'WALL_PAINT' AND c.code = 'WALL_PRIMER';
INSERT INTO assembly_items (assembly_id, catalog_item_id, qty_formula, qty_multiplier, include_waste, sort_order)
SELECT a.id, c.id, 'wall_area_m2', 2.0, true, 3  -- 2 coats
FROM assemblies a, pricing_catalog_items c WHERE a.code = 'WALL_PAINT' AND c.code = 'WALL_PAINT_SUPPLY';
INSERT INTO assembly_items (assembly_id, catalog_item_id, qty_formula, qty_multiplier, include_waste, sort_order)
SELECT a.id, c.id, 'wall_area_m2', 1.0, false, 4
FROM assemblies a, pricing_catalog_items c WHERE a.code = 'WALL_PAINT' AND c.code = 'WALL_PAINT_LABOR';

-- Wallpaper Assembly
INSERT INTO assembly_items (assembly_id, catalog_item_id, qty_formula, qty_multiplier, include_waste, sort_order)
SELECT a.id, c.id, 'wall_area_m2', 1.0, false, 1
FROM assemblies a, pricing_catalog_items c WHERE a.code = 'WALL_WALLPAPER' AND c.code = 'WALL_PREP';
INSERT INTO assembly_items (assembly_id, catalog_item_id, qty_formula, qty_multiplier, include_waste, sort_order)
SELECT a.id, c.id, 'wall_area_m2', 1.0, true, 2
FROM assemblies a, pricing_catalog_items c WHERE a.code = 'WALL_WALLPAPER' AND c.code = 'WALL_PAPER_SUPPLY';
INSERT INTO assembly_items (assembly_id, catalog_item_id, qty_formula, qty_multiplier, include_waste, sort_order)
SELECT a.id, c.id, 'wall_area_m2', 1.0, true, 3
FROM assemblies a, pricing_catalog_items c WHERE a.code = 'WALL_WALLPAPER' AND c.code = 'WALL_PAPER_ADHESIVE';
INSERT INTO assembly_items (assembly_id, catalog_item_id, qty_formula, qty_multiplier, include_waste, sort_order)
SELECT a.id, c.id, 'wall_area_m2', 1.0, false, 4
FROM assemblies a, pricing_catalog_items c WHERE a.code = 'WALL_WALLPAPER' AND c.code = 'WALL_PAPER_LABOR';

-- Wall Tile Assembly
INSERT INTO assembly_items (assembly_id, catalog_item_id, qty_formula, qty_multiplier, include_waste, sort_order)
SELECT a.id, c.id, 'wall_area_m2', 1.0, false, 1
FROM assemblies a, pricing_catalog_items c WHERE a.code = 'WALL_TILE' AND c.code = 'WALL_PREP';
INSERT INTO assembly_items (assembly_id, catalog_item_id, qty_formula, qty_multiplier, include_waste, sort_order)
SELECT a.id, c.id, 'wall_area_m2', 1.0, true, 2
FROM assemblies a, pricing_catalog_items c WHERE a.code = 'WALL_TILE' AND c.code = 'WALL_TILE_SUPPLY';
INSERT INTO assembly_items (assembly_id, catalog_item_id, qty_formula, qty_multiplier, include_waste, sort_order)
SELECT a.id, c.id, 'wall_area_m2', 1.0, true, 3
FROM assemblies a, pricing_catalog_items c WHERE a.code = 'WALL_TILE' AND c.code = 'WALL_TILE_ADHESIVE';
INSERT INTO assembly_items (assembly_id, catalog_item_id, qty_formula, qty_multiplier, include_waste, sort_order)
SELECT a.id, c.id, 'wall_area_m2', 1.0, false, 4
FROM assemblies a, pricing_catalog_items c WHERE a.code = 'WALL_TILE' AND c.code = 'WALL_TILE_LABOR';

-- Basic Cabinets Assembly
INSERT INTO assembly_items (assembly_id, catalog_item_id, qty_formula, qty_multiplier, include_waste, sort_order)
SELECT a.id, c.id, 'perimeter_lm', 0.3, false, 1  -- ~30% of perimeter has cabinets
FROM assemblies a, pricing_catalog_items c WHERE a.code = 'BUILTIN_BASIC' AND c.code = 'BUILTIN_BASIC_CABINET';
INSERT INTO assembly_items (assembly_id, catalog_item_id, qty_formula, qty_multiplier, include_waste, sort_order)
SELECT a.id, c.id, 'perimeter_lm', 0.3, false, 2
FROM assemblies a, pricing_catalog_items c WHERE a.code = 'BUILTIN_BASIC' AND c.code = 'BUILTIN_BASIC_INSTALL';

-- Project Setup Assembly
INSERT INTO assembly_items (assembly_id, catalog_item_id, qty_formula, qty_multiplier, include_waste, sort_order)
SELECT a.id, c.id, 'fixed', 1.0, false, 1
FROM assemblies a, pricing_catalog_items c WHERE a.code = 'PROJ_SETUP' AND c.code = 'PROJ_SITE_SETUP';
INSERT INTO assembly_items (assembly_id, catalog_item_id, qty_formula, qty_multiplier, include_waste, sort_order)
SELECT a.id, c.id, 'area_m2', 1.0, false, 2
FROM assemblies a, pricing_catalog_items c WHERE a.code = 'PROJ_SETUP' AND c.code = 'PROJ_PROTECTION';

-- Project Finish Assembly
INSERT INTO assembly_items (assembly_id, catalog_item_id, qty_formula, qty_multiplier, include_waste, sort_order)
SELECT a.id, c.id, 'area_m2', 1.0, false, 1
FROM assemblies a, pricing_catalog_items c WHERE a.code = 'PROJ_FINISH' AND c.code = 'PROJ_CLEANUP';

-- ============================================
-- LOCATION FACTORS (Spain base = 1.0, Brazil cheaper, Other more expensive)
-- ============================================

-- Brazil factors (labor cheaper)
INSERT INTO pricing_location_factors (location_id, catalog_item_id, multiplier)
SELECT l.id, c.id, 
    CASE 
        WHEN c.cost_type = 'labor' THEN 0.65
        WHEN c.cost_type = 'material' THEN 0.80
        ELSE 0.75
    END
FROM locations l, pricing_catalog_items c 
WHERE l.name = 'Brazil'
ON CONFLICT (location_id, catalog_item_id) DO UPDATE SET multiplier = EXCLUDED.multiplier;

-- Other locations (typically more expensive)
INSERT INTO pricing_location_factors (location_id, catalog_item_id, multiplier)
SELECT l.id, c.id, 
    CASE 
        WHEN c.cost_type = 'labor' THEN 1.15
        WHEN c.cost_type = 'material' THEN 1.08
        ELSE 1.10
    END
FROM locations l, pricing_catalog_items c 
WHERE l.name = 'Other'
ON CONFLICT (location_id, catalog_item_id) DO UPDATE SET multiplier = EXCLUDED.multiplier;

-- ============================================
-- AGE FACTORS (older properties = more prep/labor)
-- ============================================

-- 16-20 years: 10% more labor
INSERT INTO pricing_age_factors (property_age_id, catalog_item_id, multiplier)
SELECT p.id, c.id, 
    CASE WHEN c.cost_type = 'labor' THEN 1.10 ELSE 1.00 END
FROM property_age_bands p, pricing_catalog_items c 
WHERE p.label = '16 - 20 Years'
ON CONFLICT (property_age_id, catalog_item_id) DO UPDATE SET multiplier = EXCLUDED.multiplier;

-- 21-25 years: 18% more labor
INSERT INTO pricing_age_factors (property_age_id, catalog_item_id, multiplier)
SELECT p.id, c.id, 
    CASE WHEN c.cost_type = 'labor' THEN 1.18 ELSE 1.00 END
FROM property_age_bands p, pricing_catalog_items c 
WHERE p.label = '21 - 25 Years'
ON CONFLICT (property_age_id, catalog_item_id) DO UPDATE SET multiplier = EXCLUDED.multiplier;

-- 25+ years: 28% more labor
INSERT INTO pricing_age_factors (property_age_id, catalog_item_id, multiplier)
SELECT p.id, c.id, 
    CASE WHEN c.cost_type = 'labor' THEN 1.28 ELSE 1.00 END
FROM property_age_bands p, pricing_catalog_items c 
WHERE p.label = 'More than 25 Years'
ON CONFLICT (property_age_id, catalog_item_id) DO UPDATE SET multiplier = EXCLUDED.multiplier;


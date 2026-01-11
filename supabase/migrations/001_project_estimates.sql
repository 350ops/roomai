-- NovaHogar Project Estimates Schema
-- Run this in your Supabase SQL Editor to create the required tables

-- ============================================
-- LOOKUP TABLES (with pricing multipliers)
-- ============================================

-- Locations
CREATE TABLE IF NOT EXISTS locations (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    multiplier NUMERIC(6,3) NOT NULL
);

INSERT INTO locations (name, multiplier) VALUES
    ('Spain', 1.00),
    ('Brazil', 0.75),
    ('Other', 1.10)
ON CONFLICT (name) DO UPDATE SET multiplier = EXCLUDED.multiplier;

-- Property Age Bands
CREATE TABLE IF NOT EXISTS property_age_bands (
    id SERIAL PRIMARY KEY,
    label TEXT UNIQUE NOT NULL,
    min_years INT NOT NULL,
    max_years INT NULL,
    multiplier NUMERIC(6,3) NOT NULL
);

INSERT INTO property_age_bands (label, min_years, max_years, multiplier) VALUES
    ('1 - 5 Years', 1, 5, 0.95),
    ('6 - 10 Years', 6, 10, 1.00),
    ('11 - 15 Years', 11, 15, 1.06),
    ('16 - 20 Years', 16, 20, 1.12),
    ('21 - 25 Years', 21, 25, 1.20),
    ('More than 25 Years', 26, NULL, 1.32)
ON CONFLICT (label) DO UPDATE SET 
    min_years = EXCLUDED.min_years,
    max_years = EXCLUDED.max_years,
    multiplier = EXCLUDED.multiplier;

-- Room Types
CREATE TABLE IF NOT EXISTS room_types (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    base_multiplier NUMERIC(6,3) NOT NULL
);

INSERT INTO room_types (name, base_multiplier) VALUES
    ('Entire Property', 0.92),
    ('Living Room', 1.00),
    ('Dining Room', 0.98),
    ('Kitchen', 1.45),
    ('Bathroom', 1.55),
    ('Bedroom', 0.95),
    ('Balcony', 1.10),
    ('Home Office', 0.97),
    ('Walk-in Closet', 0.90)
ON CONFLICT (name) DO UPDATE SET base_multiplier = EXCLUDED.base_multiplier;

-- Floor Finishes
CREATE TABLE IF NOT EXISTS floor_finishes (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    multiplier NUMERIC(6,3) NOT NULL
);

INSERT INTO floor_finishes (name, multiplier) VALUES
    ('Hardwood', 1.25),
    ('Laminate', 0.95),
    ('Tile', 1.10),
    ('Vinyl', 0.85),
    ('Carpet', 0.90),
    ('Concrete', 0.92),
    ('Marble', 1.55),
    ('Engineered Wood', 1.10)
ON CONFLICT (name) DO UPDATE SET multiplier = EXCLUDED.multiplier;

-- Wall Finishes
CREATE TABLE IF NOT EXISTS wall_finishes (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    multiplier NUMERIC(6,3) NOT NULL
);

INSERT INTO wall_finishes (name, multiplier) VALUES
    ('Paint', 0.90),
    ('Wallpaper', 1.10),
    ('Tile', 1.30),
    ('Wood Paneling', 1.25),
    ('Exposed Brick', 1.15),
    ('Textured Plaster', 1.12),
    ('Stone Veneer', 1.35)
ON CONFLICT (name) DO UPDATE SET multiplier = EXCLUDED.multiplier;

-- Built-in Furniture Options
CREATE TABLE IF NOT EXISTS built_in_furniture_options (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    multiplier NUMERIC(6,3) NOT NULL
);

INSERT INTO built_in_furniture_options (name, multiplier) VALUES
    ('None', 1.00),
    ('Basic Cabinets', 1.08),
    ('Custom Closets', 1.12),
    ('Built-in Shelving', 1.07),
    ('Kitchen Cabinets', 1.18),
    ('Bathroom Vanity', 1.10),
    ('Entertainment Center', 1.10),
    ('Full Custom', 1.30)
ON CONFLICT (name) DO UPDATE SET multiplier = EXCLUDED.multiplier;

-- ============================================
-- CORE TABLES
-- ============================================

-- Projects (property-level info)
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NULL,  -- Link to auth.users if you have authentication
    location_id INT NOT NULL REFERENCES locations(id),
    property_age_id INT NOT NULL REFERENCES property_age_bands(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Project Rooms (one row per room in a project)
CREATE TABLE IF NOT EXISTS project_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    room_type_id INT NOT NULL REFERENCES room_types(id),
    width_m NUMERIC(8,2) NOT NULL CHECK (width_m > 0),
    length_m NUMERIC(8,2) NOT NULL CHECK (length_m > 0),
    floor_finish_id INT NOT NULL REFERENCES floor_finishes(id),
    wall_finish_id INT NOT NULL REFERENCES wall_finishes(id),
    built_in_furniture_id INT NOT NULL REFERENCES built_in_furniture_options(id),
    -- Computed column for area
    area_m2 NUMERIC(10,2) GENERATED ALWAYS AS (width_m * length_m) STORED,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Estimates (store calculation results for history)
CREATE TABLE IF NOT EXISTS estimates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    currency TEXT NOT NULL DEFAULT 'EUR',
    base_rate_per_m2 NUMERIC(10,2) NOT NULL,
    subtotal NUMERIC(12,2) NOT NULL,
    total NUMERIC(12,2) NOT NULL,
    pricing_version TEXT NOT NULL,
    breakdown_json JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_project_rooms_project_id ON project_rooms(project_id);
CREATE INDEX IF NOT EXISTS idx_estimates_project_id ON estimates(project_id);
CREATE INDEX IF NOT EXISTS idx_estimates_created_at ON estimates(created_at DESC);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimates ENABLE ROW LEVEL SECURITY;

-- Lookup tables: allow read access to all authenticated users
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_age_bands ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE floor_finishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE wall_finishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE built_in_furniture_options ENABLE ROW LEVEL SECURITY;

-- Policies for lookup tables (read-only for authenticated users)
CREATE POLICY "Allow read access to locations" ON locations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access to property_age_bands" ON property_age_bands FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access to room_types" ON room_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access to floor_finishes" ON floor_finishes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access to wall_finishes" ON wall_finishes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access to built_in_furniture_options" ON built_in_furniture_options FOR SELECT TO authenticated USING (true);

-- For anonymous access (if you want the app to work without auth):
CREATE POLICY "Allow anon read access to locations" ON locations FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon read access to property_age_bands" ON property_age_bands FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon read access to room_types" ON room_types FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon read access to floor_finishes" ON floor_finishes FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon read access to wall_finishes" ON wall_finishes FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon read access to built_in_furniture_options" ON built_in_furniture_options FOR SELECT TO anon USING (true);

-- Projects: users can CRUD their own projects, anon can insert
CREATE POLICY "Users can view own projects" ON projects FOR SELECT TO authenticated 
    USING (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "Users can insert projects" ON projects FOR INSERT TO authenticated 
    WITH CHECK (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "Users can update own projects" ON projects FOR UPDATE TO authenticated 
    USING (user_id = auth.uid());
CREATE POLICY "Users can delete own projects" ON projects FOR DELETE TO authenticated 
    USING (user_id = auth.uid());

-- Allow anonymous users to create projects (for guests)
CREATE POLICY "Anon can insert projects" ON projects FOR INSERT TO anon 
    WITH CHECK (user_id IS NULL);
CREATE POLICY "Anon can view their session projects" ON projects FOR SELECT TO anon 
    USING (user_id IS NULL);

-- Project rooms: cascade from project policies
CREATE POLICY "Users can manage project rooms" ON project_rooms FOR ALL TO authenticated 
    USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = project_rooms.project_id AND (projects.user_id = auth.uid() OR projects.user_id IS NULL)));
CREATE POLICY "Anon can manage project rooms" ON project_rooms FOR ALL TO anon 
    USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = project_rooms.project_id AND projects.user_id IS NULL));

-- Estimates: cascade from project policies
CREATE POLICY "Users can manage estimates" ON estimates FOR ALL TO authenticated 
    USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = estimates.project_id AND (projects.user_id = auth.uid() OR projects.user_id IS NULL)));
CREATE POLICY "Anon can manage estimates" ON estimates FOR ALL TO anon 
    USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = estimates.project_id AND projects.user_id IS NULL));

-- ============================================
-- HELPER FUNCTION: Update timestamp
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


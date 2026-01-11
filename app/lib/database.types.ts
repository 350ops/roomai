// Database types for Supabase
// These match the schema defined in your Postgres database

export interface Database {
    public: {
        Tables: {
            locations: {
                Row: {
                    id: number;
                    name: string;
                    multiplier: number;
                };
                Insert: {
                    id?: number;
                    name: string;
                    multiplier: number;
                };
                Update: {
                    id?: number;
                    name?: string;
                    multiplier?: number;
                };
            };
            property_age_bands: {
                Row: {
                    id: number;
                    label: string;
                    min_years: number;
                    max_years: number | null;
                    multiplier: number;
                };
                Insert: {
                    id?: number;
                    label: string;
                    min_years: number;
                    max_years?: number | null;
                    multiplier: number;
                };
                Update: {
                    id?: number;
                    label?: string;
                    min_years?: number;
                    max_years?: number | null;
                    multiplier?: number;
                };
            };
            room_types: {
                Row: {
                    id: number;
                    name: string;
                    base_multiplier: number;
                };
                Insert: {
                    id?: number;
                    name: string;
                    base_multiplier: number;
                };
                Update: {
                    id?: number;
                    name?: string;
                    base_multiplier?: number;
                };
            };
            floor_finishes: {
                Row: {
                    id: number;
                    name: string;
                    multiplier: number;
                };
                Insert: {
                    id?: number;
                    name: string;
                    multiplier: number;
                };
                Update: {
                    id?: number;
                    name?: string;
                    multiplier?: number;
                };
            };
            wall_finishes: {
                Row: {
                    id: number;
                    name: string;
                    multiplier: number;
                };
                Insert: {
                    id?: number;
                    name: string;
                    multiplier: number;
                };
                Update: {
                    id?: number;
                    name?: string;
                    multiplier?: number;
                };
            };
            built_in_furniture_options: {
                Row: {
                    id: number;
                    name: string;
                    multiplier: number;
                };
                Insert: {
                    id?: number;
                    name: string;
                    multiplier: number;
                };
                Update: {
                    id?: number;
                    name?: string;
                    multiplier?: number;
                };
            };
            projects: {
                Row: {
                    id: string;
                    user_id: string | null;
                    location_id: number;
                    property_age_id: number;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    user_id?: string | null;
                    location_id: number;
                    property_age_id: number;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string | null;
                    location_id?: number;
                    property_age_id?: number;
                    created_at?: string;
                    updated_at?: string;
                };
            };
            project_rooms: {
                Row: {
                    id: string;
                    project_id: string;
                    room_type_id: number;
                    width_m: number;
                    length_m: number;
                    floor_finish_id: number;
                    wall_finish_id: number;
                    built_in_furniture_id: number;
                    area_m2: number;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    project_id: string;
                    room_type_id: number;
                    width_m: number;
                    length_m: number;
                    floor_finish_id: number;
                    wall_finish_id: number;
                    built_in_furniture_id: number;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    project_id?: string;
                    room_type_id?: number;
                    width_m?: number;
                    length_m?: number;
                    floor_finish_id?: number;
                    wall_finish_id?: number;
                    built_in_furniture_id?: number;
                    created_at?: string;
                };
            };
            estimates: {
                Row: {
                    id: string;
                    project_id: string;
                    currency: string;
                    base_rate_per_m2: number;
                    subtotal: number;
                    total: number;
                    pricing_version: string;
                    breakdown_json: EstimateBreakdown;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    project_id: string;
                    currency?: string;
                    base_rate_per_m2: number;
                    subtotal: number;
                    total: number;
                    pricing_version: string;
                    breakdown_json: EstimateBreakdown;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    project_id?: string;
                    currency?: string;
                    base_rate_per_m2?: number;
                    subtotal?: number;
                    total?: number;
                    pricing_version?: string;
                    breakdown_json?: EstimateBreakdown;
                    created_at?: string;
                };
            };
        };
    };
}

// Estimate breakdown structure stored as JSON
export interface EstimateBreakdown {
    rooms: RoomBreakdown[];
    multipliers: {
        location: { name: string; value: number };
        propertyAge: { label: string; value: number };
    };
    baseRatePerM2: number;
    minRoomFee: number;
    pricingVersion: string;
}

export interface RoomBreakdown {
    roomType: { name: string; multiplier: number };
    area: number;
    floorFinish: { name: string; multiplier: number };
    wallFinish: { name: string; multiplier: number };
    builtInFurniture: { name: string; multiplier: number };
    baseRoomCost: number;
    adjustedRoomCost: number;
    finalRoomCost: number;
}


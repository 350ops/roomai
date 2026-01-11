// NovaHogar Estimate Calculation Service
// Handles local calculations and Supabase persistence

import { getSupabase, isSupabaseConfigured } from './supabase';
import {
    PRICING_VERSION,
    BASE_RATE_PER_M2,
    MIN_ROOM_FEE,
    DEFAULT_CURRENCY,
    LOCATION_MULTIPLIERS,
    PROPERTY_AGE_MULTIPLIERS,
    ROOM_TYPE_MULTIPLIERS,
    FLOOR_FINISH_MULTIPLIERS,
    WALL_FINISH_MULTIPLIERS,
    BUILT_IN_FURNITURE_MULTIPLIERS,
    getMultiplier,
} from './pricing';
import { EstimateBreakdown, RoomBreakdown } from './database.types';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Form data structure from the UI
export interface ProjectFormData {
    propertyLocation: string;
    propertyAge: string;
    rooms: RoomFormData[];
}

export interface RoomFormData {
    roomType: string;
    width: number;
    length: number;
    floorFinish: string;
    wallFinish: string;
    builtInFurniture: string;
}

// Estimate result
export interface EstimateResult {
    subtotal: number;
    total: number;
    currency: string;
    breakdown: EstimateBreakdown;
    roomBreakdowns: RoomBreakdown[];
}

// Calculate estimate for a single room
export const calculateRoomEstimate = (
    room: RoomFormData,
    locationMultiplier: number,
    ageMultiplier: number
): RoomBreakdown => {
    // Calculate area
    const area = room.width * room.length;
    
    // Get all multipliers
    const roomTypeMultiplier = getMultiplier(ROOM_TYPE_MULTIPLIERS, room.roomType);
    const floorMultiplier = getMultiplier(FLOOR_FINISH_MULTIPLIERS, room.floorFinish);
    const wallMultiplier = getMultiplier(WALL_FINISH_MULTIPLIERS, room.wallFinish);
    const furnitureMultiplier = getMultiplier(BUILT_IN_FURNITURE_MULTIPLIERS, room.builtInFurniture);
    
    // Base room cost = area × base rate
    const baseRoomCost = area * BASE_RATE_PER_M2;
    
    // Apply all multipliers
    const adjustedRoomCost = baseRoomCost
        * locationMultiplier
        * ageMultiplier
        * roomTypeMultiplier
        * floorMultiplier
        * wallMultiplier
        * furnitureMultiplier;
    
    // Apply minimum room fee
    const finalRoomCost = Math.max(adjustedRoomCost, MIN_ROOM_FEE);
    
    return {
        roomType: { name: room.roomType, multiplier: roomTypeMultiplier },
        area,
        floorFinish: { name: room.floorFinish, multiplier: floorMultiplier },
        wallFinish: { name: room.wallFinish, multiplier: wallMultiplier },
        builtInFurniture: { name: room.builtInFurniture, multiplier: furnitureMultiplier },
        baseRoomCost,
        adjustedRoomCost,
        finalRoomCost,
    };
};

// Calculate full project estimate
export const calculateEstimate = (formData: ProjectFormData): EstimateResult => {
    // Get property-level multipliers
    const locationMultiplier = getMultiplier(LOCATION_MULTIPLIERS, formData.propertyLocation);
    const ageMultiplier = getMultiplier(PROPERTY_AGE_MULTIPLIERS, formData.propertyAge);
    
    // Calculate each room
    const roomBreakdowns = formData.rooms.map(room => 
        calculateRoomEstimate(room, locationMultiplier, ageMultiplier)
    );
    
    // Sum up totals
    const subtotal = roomBreakdowns.reduce((sum, room) => sum + room.adjustedRoomCost, 0);
    const total = roomBreakdowns.reduce((sum, room) => sum + room.finalRoomCost, 0);
    
    // Build breakdown
    const breakdown: EstimateBreakdown = {
        rooms: roomBreakdowns,
        multipliers: {
            location: { name: formData.propertyLocation, value: locationMultiplier },
            propertyAge: { label: formData.propertyAge, value: ageMultiplier },
        },
        baseRatePerM2: BASE_RATE_PER_M2,
        minRoomFee: MIN_ROOM_FEE,
        pricingVersion: PRICING_VERSION,
    };
    
    return {
        subtotal: Math.round(subtotal * 100) / 100,
        total: Math.round(total * 100) / 100,
        currency: DEFAULT_CURRENCY,
        breakdown,
        roomBreakdowns,
    };
};

// Format currency for display
export const formatCurrency = (amount: number, currency: string = 'EUR'): string => {
    return new Intl.NumberFormat('en-EU', {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};

// Local storage key for estimates
const ESTIMATES_STORAGE_KEY = '@novahogar_estimates';

// Save estimate locally (fallback when Supabase is not configured)
export const saveEstimateLocally = async (
    formData: ProjectFormData,
    result: EstimateResult
): Promise<string> => {
    const id = `local_${Date.now()}`;
    
    const storedEstimate = {
        id,
        formData,
        result,
        createdAt: new Date().toISOString(),
    };
    
    try {
        // Get existing estimates
        const existingJson = await AsyncStorage.getItem(ESTIMATES_STORAGE_KEY);
        const existing = existingJson ? JSON.parse(existingJson) : [];
        
        // Add new estimate
        existing.push(storedEstimate);
        
        // Save back
        await AsyncStorage.setItem(ESTIMATES_STORAGE_KEY, JSON.stringify(existing));
        
        return id;
    } catch (error) {
        console.error('Failed to save estimate locally:', error);
        throw error;
    }
};

// Get all locally stored estimates
export const getLocalEstimates = async () => {
    try {
        const json = await AsyncStorage.getItem(ESTIMATES_STORAGE_KEY);
        return json ? JSON.parse(json) : [];
    } catch (error) {
        console.error('Failed to get local estimates:', error);
        return [];
    }
};

// Save estimate to Supabase (if configured)
export const saveEstimateToSupabase = async (
    formData: ProjectFormData,
    result: EstimateResult
): Promise<string | null> => {
    const supabase = getSupabase();
    
    if (!isSupabaseConfigured() || !supabase) {
        console.log('Supabase not configured, saving locally');
        return saveEstimateLocally(formData, result);
    }
    
    try {
        // Get location ID
        const { data: locationData } = await supabase
            .from('locations')
            .select('id')
            .eq('name', formData.propertyLocation)
            .single();
        
        // Get property age ID
        const { data: ageData } = await supabase
            .from('property_age_bands')
            .select('id')
            .eq('label', formData.propertyAge)
            .single();
        
        if (!locationData || !ageData) {
            console.warn('Lookup data not found in Supabase, saving locally');
            return saveEstimateLocally(formData, result);
        }
        
        // Create project
        const { data: projectData, error: projectError } = await supabase
            .from('projects')
            .insert({
                location_id: locationData.id,
                property_age_id: ageData.id,
            })
            .select('id')
            .single();
        
        if (projectError || !projectData) {
            console.error('Failed to create project:', projectError);
            return saveEstimateLocally(formData, result);
        }
        
        const projectId = projectData.id;
        
        // Insert rooms
        for (const room of formData.rooms) {
            // Get room type ID
            const { data: roomTypeData } = await supabase
                .from('room_types')
                .select('id')
                .eq('name', room.roomType)
                .single();
            
            // Get floor finish ID
            const { data: floorData } = await supabase
                .from('floor_finishes')
                .select('id')
                .eq('name', room.floorFinish)
                .single();
            
            // Get wall finish ID
            const { data: wallData } = await supabase
                .from('wall_finishes')
                .select('id')
                .eq('name', room.wallFinish)
                .single();
            
            // Get furniture ID
            const { data: furnitureData } = await supabase
                .from('built_in_furniture_options')
                .select('id')
                .eq('name', room.builtInFurniture)
                .single();
            
            if (roomTypeData && floorData && wallData && furnitureData) {
                await supabase.from('project_rooms').insert({
                    project_id: projectId,
                    room_type_id: roomTypeData.id,
                    width_m: room.width,
                    length_m: room.length,
                    floor_finish_id: floorData.id,
                    wall_finish_id: wallData.id,
                    built_in_furniture_id: furnitureData.id,
                });
            }
        }
        
        // Save estimate
        const { error: estimateError } = await supabase.from('estimates').insert({
            project_id: projectId,
            currency: result.currency,
            base_rate_per_m2: BASE_RATE_PER_M2,
            subtotal: result.subtotal,
            total: result.total,
            pricing_version: PRICING_VERSION,
            breakdown_json: result.breakdown,
        });
        
        if (estimateError) {
            console.error('Failed to save estimate:', estimateError);
        }
        
        return projectId;
    } catch (error) {
        console.error('Supabase error, saving locally:', error);
        return saveEstimateLocally(formData, result);
    }
};


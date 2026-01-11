# NovaHogar AI Prompt System Documentation

This document describes how prompts are built and sent to the OpenAI API for room redesign generation.

---

## Overview

The app uses OpenAI's `/v1/images/edits` endpoint with the `gpt-image-1` model to transform room photos based on user selections and custom instructions.

**Key Design Principle:** Constraint-first prompting. The model is explicitly told what NOT to change before describing what should change.

---

## Prompt Architecture

Prompts are automatically constructed from user selections using the `buildPromptFromSelections()` function. The prompt is built using **7 distinct sections** in this order:

1. **Critical Constraints** (non-negotiable rules)
2. **Structure Definition** (immutable elements)
3. **Style Transformation** (what to change)
4. **Furniture & Product Placement** (if applicable)
5. **Room Function Context** (if specified)
6. **Strict Mode** (if enabled)
7. **Rendering Quality Target** (always included)

---

## Prompt Template (Full Structure)

```
CRITICAL CONSTRAINTS:
- Preserve the original room geometry exactly.
- Do NOT change wall positions, ceiling height, doors, windows, or openings.
- Do NOT modify camera angle, lens perspective, or framing.
- Do NOT add or remove architectural elements.
- Keep original natural lighting direction and intensity.
- Only modify surfaces, finishes, and furniture explicitly requested.

STRUCTURE (DO NOT CHANGE):
- Original room layout and proportions
- All doors, windows, trim, and architectural details
- Original lighting sources and direction
- Camera perspective and viewpoint
- Room function: {Room Type if selected}

STYLE TRANSFORMATION:
Overall aesthetic: {Style} interior design
Walls: Replace existing wall finish with {Wall type}. Remove the previous wall material entirely. Keep wall texture realistic and consistent.
Flooring: Replace the existing floor surface with {Flooring type}. Remove the previous floor material entirely. Ensure seamless integration with room edges.
Floor reference: Match the floor finish exactly to the selected flooring reference image.
Furniture style: {Furniture style}

FURNITURE & PRODUCT PLACEMENT:
Products to add: {Product names}

Furniture placement rules:
- Each product must sit fully on the floor plane with correct ground contact.
- Maintain realistic clearance from doors and primary walkways.
- Do NOT block doors, windows, radiators, or electrical outlets.
- Respect realistic scale relative to door height (standard door ~2.1m).
- Match product lighting and shadows to room's ambient light.
- Preserve product proportions from reference images.

User placement instructions: {User's custom instructions if provided}

ROOM FUNCTION CONTEXT:
This space is a {Room Type}.
All design decisions must respect typical functional use of this room type.
Furniture placement should optimize usability for this room's purpose.

STRICT REALISM MODE ENABLED:
No creative interpretation beyond explicit instructions.
Preserve maximum fidelity to original photograph.
Zero artistic embellishment or stylization.

RENDERING QUALITY TARGET:
Photorealistic interior visualization.
Real-world materials with correct textures.
Accurate shadows and global illumination matching original photo.
No stylization, no illustration, no artistic exaggeration.
Output must appear as a real photograph, not a 3D render.
```

---

## Section Details

### 1. Critical Constraints (Always Included)

This section is **prepended to every prompt** and establishes non-negotiable rules:

| Constraint | Purpose |
|------------|---------|
| Preserve room geometry | Prevents wall/ceiling/floor plane changes |
| No camera modifications | Maintains original perspective and framing |
| No architectural additions | Stops model from adding columns, arches, etc. |
| Keep lighting direction | Preserves natural light consistency |
| Only modify explicitly requested | Reduces unwanted "improvements" |

### 2. Structure Definition (Always Included)

Explicitly names what is **immutable**:

- Room layout and proportions
- Doors, windows, trim
- Lighting sources and direction
- Camera perspective

If a room type is selected, it's added here as well.

### 3. Style Transformation (Based on Selections)

Uses **explicit replacement language** for surfaces:

| Selection | Prompt Format |
|-----------|---------------|
| Walls | `Replace existing wall finish with {type}. Remove the previous wall material entirely.` |
| Flooring | `Replace the existing floor surface with {type}. Remove the previous floor material entirely.` |
| Style | `Overall aesthetic: {style} interior design` |
| Furniture Style | `Furniture style: {style}` |

### 4. Furniture & Product Placement (Conditional)

Only included if furniture items or uploaded products are selected. Includes:

- List of all product names
- **Physical plausibility rules:**
  - Ground contact requirement
  - Door/walkway clearance
  - No blocking of openings
  - Scale reference (door height ~2.1m)
  - Lighting/shadow matching
  - Proportion preservation

### 5. Room Function Context (Conditional)

If a room type is selected, this section tells the model:

- What kind of room this is (Living Room, Bedroom, Kitchen, etc.)
- That design decisions must respect typical functional use
- Furniture placement should optimize for the room's purpose

**Room Type Options:**
- Living Room
- Bedroom
- Kitchen
- Bathroom
- Dining Room
- Home Office
- Entryway
- Hallway
- Nursery
- Guest Room

### 6. Strict Realism Mode (Conditional)

When enabled by the user toggle, adds:

```
STRICT REALISM MODE ENABLED:
No creative interpretation beyond explicit instructions.
Preserve maximum fidelity to original photograph.
Zero artistic embellishment or stylization.
```

This prevents the model from adding "Pinterest-style" beautification.

### 7. Rendering Quality Target (Always Included)

Forces photorealistic output:

- Real-world materials with correct textures
- Accurate shadows and global illumination
- No stylization or illustration
- Output must appear as real photograph

---

## Available Options

### Style Options (Overall Room Style)
| Option | Prompt Text |
|--------|-------------|
| Bright & Airy | `Bright & Airy interior design` |
| Warm & Cozy | `Warm & Cozy interior design` |
| Elegant & Luxurious | `Elegant & Luxurious interior design` |
| Clean & Minimal | `Clean & Minimal interior design` |
| Bold & Dramatic | `Bold & Dramatic interior design` |
| Natural & Organic | `Natural & Organic interior design` |
| Sleek & Modern | `Sleek & Modern interior design` |
| Vintage & Eclectic | `Vintage & Eclectic interior design` |
| Serene & Calm | `Serene & Calm interior design` |
| Chic & Sophisticated | `Chic & Sophisticated interior design` |

### Wall Options
| Option | Prompt Text |
|--------|-------------|
| Plain White | `Replace existing wall finish with plain white. Remove the previous wall material entirely.` |
| Soft Gray | `Replace existing wall finish with soft gray. Remove the previous wall material entirely.` |
| Warm Beige | `Replace existing wall finish with warm beige. Remove the previous wall material entirely.` |
| Light Blue | `Replace existing wall finish with light blue. Remove the previous wall material entirely.` |
| Sage Green | `Replace existing wall finish with sage green. Remove the previous wall material entirely.` |
| Floral Wallpaper | `Replace existing wall finish with floral wallpaper. Remove the previous wall material entirely.` |
| Geometric Wallpaper | `Replace existing wall finish with geometric wallpaper. Remove the previous wall material entirely.` |
| Marble Effect | `Replace existing wall finish with marble effect. Remove the previous wall material entirely.` |
| Exposed Brick | `Replace existing wall finish with exposed brick. Remove the previous wall material entirely.` |
| Wood Paneling | `Replace existing wall finish with wood paneling. Remove the previous wall material entirely.` |
| Textured Plaster | `Replace existing wall finish with textured plaster. Remove the previous wall material entirely.` |
| Accent Wall (Dark) | `Replace existing wall finish with accent wall (dark). Remove the previous wall material entirely.` |

### Flooring Options
| Option | Prompt Text |
|--------|-------------|
| Hardwood Oak | `Replace the existing floor surface with hardwood oak. Remove the previous floor material entirely.` |
| Hardwood Walnut | `Replace the existing floor surface with hardwood walnut. Remove the previous floor material entirely.` |
| Light Maple Wood | `Replace the existing floor surface with light maple wood. Remove the previous floor material entirely.` |
| Dark Mahogany | `Replace the existing floor surface with dark mahogany. Remove the previous floor material entirely.` |
| White Marble | `Replace the existing floor surface with white marble. Remove the previous floor material entirely.` |
| Gray Marble | `Replace the existing floor surface with gray marble. Remove the previous floor material entirely.` |
| Ceramic Tiles | `Replace the existing floor surface with ceramic tiles. Remove the previous floor material entirely.` |
| Porcelain Tiles | `Replace the existing floor surface with porcelain tiles. Remove the previous floor material entirely.` |
| Herringbone Parquet | `Replace the existing floor surface with herringbone parquet. Remove the previous floor material entirely.` |
| Concrete Polished | `Replace the existing floor surface with concrete polished. Remove the previous floor material entirely.` |
| Natural Stone | `Replace the existing floor surface with natural stone. Remove the previous floor material entirely.` |
| Luxury Vinyl Plank | `Replace the existing floor surface with luxury vinyl plank. Remove the previous floor material entirely.` |

### Furniture Style Options
| Option | Prompt Text |
|--------|-------------|
| Modern Minimalist | `modern minimalist` |
| Mid-Century Modern | `mid-century modern` |
| Contemporary | `contemporary` |
| Traditional Classic | `traditional classic` |
| Rustic Farmhouse | `rustic farmhouse` |
| Industrial | `industrial` |
| Bohemian | `bohemian` |
| Art Deco | `art deco` |
| Japandi | `japandi` |
| Coastal | `coastal` |

---

## Pre-loaded Furniture Items

These furniture items can be selected and their images are sent to the API for reference:

| ID | Name | Description |
|----|------|-------------|
| mobile | Media Console | TV stand/media console |
| silla | Accent Chair | Modern accent chair |
| mueble1 | Sideboard | Storage sideboard |
| mueble2 | Cabinet | Display cabinet |
| mueble4 | Bookshelf | Book storage shelf |
| mueble5 | Console Table | Entryway console table |
| ... | (25+ items) | Various furniture pieces |

---

## User-Uploaded Products

Users can also upload their own product images (furniture, flooring, decor). These are:
- Converted to JPEG format automatically (if not already)
- Sent to the API alongside the room photo
- Referenced by filename in the prompt
- Integrated with physical plausibility rules

---

## Example Prompts

### Example 1: Full Selections with Strict Mode

**Selections:**
- Room Type: Living Room
- Style: Warm & Cozy
- Walls: Warm Beige
- Flooring: Hardwood Oak
- Furniture Style: Mid-Century Modern
- Furniture Items: Media Console, Accent Chair
- Placement: "Place the chair near the window"
- Strict Mode: ON

**Generated Prompt:**
```
CRITICAL CONSTRAINTS:
- Preserve the original room geometry exactly.
- Do NOT change wall positions, ceiling height, doors, windows, or openings.
- Do NOT modify camera angle, lens perspective, or framing.
- Do NOT add or remove architectural elements.
- Keep original natural lighting direction and intensity.
- Only modify surfaces, finishes, and furniture explicitly requested.

STRUCTURE (DO NOT CHANGE):
- Original room layout and proportions
- All doors, windows, trim, and architectural details
- Original lighting sources and direction
- Camera perspective and viewpoint
- Room function: Living Room

STYLE TRANSFORMATION:
Overall aesthetic: Warm & Cozy interior design
Walls: Replace existing wall finish with warm beige. Remove the previous wall material entirely. Keep wall texture realistic and consistent.
Flooring: Replace the existing floor surface with hardwood oak. Remove the previous floor material entirely. Ensure seamless integration with room edges.
Furniture style: mid-century modern

FURNITURE & PRODUCT PLACEMENT:
Products to add: Media Console, Accent Chair

Furniture placement rules:
- Each product must sit fully on the floor plane with correct ground contact.
- Maintain realistic clearance from doors and primary walkways.
- Do NOT block doors, windows, radiators, or electrical outlets.
- Respect realistic scale relative to door height (standard door ~2.1m).
- Match product lighting and shadows to room's ambient light.
- Preserve product proportions from reference images.

User placement instructions: Place the chair near the window

ROOM FUNCTION CONTEXT:
This space is a Living Room.
All design decisions must respect typical functional use of this room type.
Furniture placement should optimize usability for this room's purpose.

STRICT REALISM MODE ENABLED:
No creative interpretation beyond explicit instructions.
Preserve maximum fidelity to original photograph.
Zero artistic embellishment or stylization.

RENDERING QUALITY TARGET:
Photorealistic interior visualization.
Real-world materials with correct textures.
Accurate shadows and global illumination matching original photo.
No stylization, no illustration, no artistic exaggeration.
Output must appear as a real photograph, not a 3D render.
```

### Example 2: Minimal Selections (Style Only)

**Selections:**
- Style: Sleek & Modern

**Generated Prompt:**
```
CRITICAL CONSTRAINTS:
- Preserve the original room geometry exactly.
- Do NOT change wall positions, ceiling height, doors, windows, or openings.
- Do NOT modify camera angle, lens perspective, or framing.
- Do NOT add or remove architectural elements.
- Keep original natural lighting direction and intensity.
- Only modify surfaces, finishes, and furniture explicitly requested.

STRUCTURE (DO NOT CHANGE):
- Original room layout and proportions
- All doors, windows, trim, and architectural details
- Original lighting sources and direction
- Camera perspective and viewpoint

STYLE TRANSFORMATION:
Overall aesthetic: Sleek & Modern interior design

RENDERING QUALITY TARGET:
Photorealistic interior visualization.
Real-world materials with correct textures.
Accurate shadows and global illumination matching original photo.
No stylization, no illustration, no artistic exaggeration.
Output must appear as a real photograph, not a 3D render.
```

---

## API Configuration

| Parameter | Value |
|-----------|-------|
| Endpoint | `https://api.openai.com/v1/images/edits` |
| Model | `gpt-image-1` |
| Size | `1024x1024` |
| Input Fidelity | `high` |
| Number of Results | `1` |

### Images Sent:
1. **Room photo** (first, for highest fidelity)
2. **Selected furniture reference images** (from pre-loaded items)
3. **User-uploaded product images**
4. **Flooring sample image** (if selected)

All images are:
- Converted to JPEG format before sending
- Sent using array notation (`image[]`) to support multiple files

---

## UI/UX Features

### "What will NOT change" Confirmation Box

After image upload, users see a checklist of preserved elements:
- ✓ Room shape & size
- ✓ Doors & windows
- ✓ Camera angle
- ✓ Natural light direction

### Strict Realism Mode Toggle

A user-facing toggle that when enabled:
- Adds the strict mode section to the prompt
- Displays in the recap screen before generation
- Prevents creative liberties and artistic interpretation

### Room Type Selector

Dropdown to classify the room function, which:
- Informs furniture placement decisions
- Ensures functional appropriateness
- Prevents absurd placements (e.g., console blocking entry)

---

## Notes

- The prompt is automatically updated whenever dropdown selections change
- Users can also manually edit the prompt text before generating
- Empty selections are skipped (corresponding sections omitted)
- All furniture/product images are sent to the API with high input fidelity enabled
- Constraint sections are always included to maintain structural integrity

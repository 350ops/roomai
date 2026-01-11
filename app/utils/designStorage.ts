import { File, Directory, Paths } from 'expo-file-system/next';

// Design data structure
export interface SavedDesign {
  id: string;
  originalImage: string;
  resultImage: string;
  prompt: string;
  createdAt: string;
  title?: string;
}

// Directory for designs
const designsDir = new Directory(Paths.document, 'designs');
const INDEX_FILENAME = 'index.json';

// Ensure the designs directory exists
function ensureDirectoryExists(): void {
  if (!designsDir.exists) {
    designsDir.create({ intermediates: true });
  }
}

// Generate a unique ID
function generateId(): string {
  return `design_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Save an image to local storage and return the local URI
async function saveImageLocally(imageUri: string, filename: string): Promise<string> {
  ensureDirectoryExists();
  const destFile = new File(designsDir, filename);
  
  if (imageUri.startsWith('file://') || imageUri.startsWith(Paths.document)) {
    // Local file - copy it
    const sourceFile = new File(imageUri);
    if (sourceFile.exists) {
      sourceFile.copy(destFile);
    }
  } else if (imageUri.startsWith('data:')) {
    // Base64 image - extract and save
    const base64Data = imageUri.split(',')[1];
    const bytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    destFile.write(bytes);
  } else {
    // Remote URL - download it
    const downloaded = await File.downloadFileAsync(imageUri, designsDir);
    if (downloaded.exists) {
      downloaded.move(destFile);
    }
  }
  
  return destFile.uri;
}

// Load designs index
export async function loadDesigns(): Promise<SavedDesign[]> {
  try {
    ensureDirectoryExists();
    const indexFile = new File(designsDir, INDEX_FILENAME);
    
    if (!indexFile.exists) {
      return [];
    }
    
    const content = await indexFile.text();
    return JSON.parse(content);
  } catch (error) {
    console.error('[DesignStorage] Failed to load designs:', error);
    return [];
  }
}

// Save a new design
export async function saveDesign(
  originalImage: string,
  resultImage: string,
  prompt: string,
  title?: string
): Promise<SavedDesign> {
  try {
    ensureDirectoryExists();
    
    const id = generateId();
    const timestamp = new Date().toISOString();
    
    // Save images locally
    const localOriginal = await saveImageLocally(originalImage, `${id}_original.png`);
    const localResult = await saveImageLocally(resultImage, `${id}_result.png`);
    
    const newDesign: SavedDesign = {
      id,
      originalImage: localOriginal,
      resultImage: localResult,
      prompt,
      createdAt: timestamp,
      title: title || `Design ${new Date().toLocaleDateString()}`,
    };
    
    // Load existing designs and add new one
    const designs = await loadDesigns();
    designs.unshift(newDesign); // Add to beginning
    
    // Save updated index
    const indexFile = new File(designsDir, INDEX_FILENAME);
    indexFile.write(JSON.stringify(designs));
    
    console.log('[DesignStorage] Design saved:', id);
    return newDesign;
  } catch (error) {
    console.error('[DesignStorage] Failed to save design:', error);
    throw error;
  }
}

// Delete a design
export async function deleteDesign(id: string): Promise<void> {
  try {
    const designs = await loadDesigns();
    const design = designs.find(d => d.id === id);
    
    if (design) {
      // Delete image files
      try {
        const originalFile = new File(design.originalImage);
        const resultFile = new File(design.resultImage);
        if (originalFile.exists) originalFile.delete();
        if (resultFile.exists) resultFile.delete();
      } catch (e) {
        console.warn('[DesignStorage] Could not delete image files:', e);
      }
      
      // Update index
      const updatedDesigns = designs.filter(d => d.id !== id);
      const indexFile = new File(designsDir, INDEX_FILENAME);
      indexFile.write(JSON.stringify(updatedDesigns));
      
      console.log('[DesignStorage] Design deleted:', id);
    }
  } catch (error) {
    console.error('[DesignStorage] Failed to delete design:', error);
    throw error;
  }
}

// Get a single design by ID
export async function getDesign(id: string): Promise<SavedDesign | null> {
  const designs = await loadDesigns();
  return designs.find(d => d.id === id) || null;
}

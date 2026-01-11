const OPENAI_API_URL =
  process.env.EXPO_PUBLIC_OPENAI_API_URL ?? "https://api.openai.com";

const OPENAI_API_KEY =
  process.env.EXPO_PUBLIC_OPENAI_API_KEY ?? "";

export async function editImageWithOpenAI(formData: FormData): Promise<Response> {
  // Validate API key at runtime
  if (!OPENAI_API_KEY) {
    throw new Error("OpenAI API key not configured. Please set EXPO_PUBLIC_OPENAI_API_KEY in your environment.");
  }

  const url = `${OPENAI_API_URL}/v1/images/edits`;
  
  // Debug logging
  console.log('[OpenAI] Making request to:', url);
  console.log('[OpenAI] API Key present:', !!OPENAI_API_KEY);
  console.log('[OpenAI] API Key prefix:', OPENAI_API_KEY.substring(0, 10) + '...');

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        // DO NOT set Content-Type for FormData - browser/RN sets it automatically with boundary
      },
      body: formData,
    });

    console.log('[OpenAI] Response status:', response.status);
    return response;
  } catch (error) {
    console.error('[OpenAI] Fetch error:', error);
    throw error;
  }
}
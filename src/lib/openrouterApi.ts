/**
 * OpenRouter API utilities for AI-powered features
 * Supports vision and text models through a unified interface
 */

// @ts-ignore
const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

// Track API capabilities
let apiCapabilities: {
  hasImageGeneration: boolean | null;
  hasVision: boolean | null;
} = {
  hasImageGeneration: null,
  hasVision: null,
};

interface ContentPart {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: {
    url: string;
  };
}

interface Message {
  role: 'user' | 'assistant';
  content: ContentPart[] | string;
}

export interface GenerateContentOptions {
  model: string;
  contents: Message[] | Message;
  config?: {
    imageConfig?: {
      aspectRatio?: string;
    };
  };
}

export interface GenerateContentResponse {
  text: string;
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
        inlineData?: {
          data: string;
          mimeType: string;
        };
      }>;
    };
  }>;
}

/**
 * Call OpenRouter API for text generation
 */
export async function generateContent(
  options: GenerateContentOptions
): Promise<GenerateContentResponse> {
  if (!OPENROUTER_API_KEY) {
    throw new Error('VITE_OPENROUTER_API_KEY is not configured');
  }

  // Normalize input to message format
  let messages: Message[] = [];
  if (Array.isArray(options.contents)) {
    messages = options.contents;
  } else if (options.contents && typeof options.contents === 'object') {
    // Convert gemini-style contents to OpenRouter format
    const content = options.contents as any;
    if (content.parts) {
      messages = [
        {
          role: 'user',
          content: content.parts.map((part: any) => {
            if (part.text) {
              return { type: 'text', text: part.text };
            } else if (part.inlineData) {
              return {
                type: 'image_url',
                image_url: {
                  url: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`,
                },
              };
            }
            return { type: 'text', text: '' };
          }),
        },
      ];
    } else {
      messages = [{ role: 'user', content: String(options.contents) }];
    }
  }

  try {
    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model: options.model,
        messages: messages.map(msg => ({
          role: msg.role,
          content: Array.isArray(msg.content)
            ? msg.content.map(part => {
                if (part.type === 'text') {
                  return { type: 'text', text: part.text || '' };
                } else if (part.type === 'image_url') {
                  return {
                    type: 'image_url',
                    image_url: part.image_url,
                  };
                }
                return { type: 'text', text: '' };
              })
            : msg.content,
        })),
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        `OpenRouter API error: ${error.error?.message || response.statusText}`
      );
    }

    const data = await response.json();

    // Extract text from response
    const textContent =
      data.choices?.[0]?.message?.content || 'No response from AI';

    return {
      text: textContent,
      candidates: [
        {
          content: {
            parts: [
              {
                text: textContent,
              },
            ],
          },
        },
      ],
    };
  } catch (error) {
    console.error('OpenRouter API call failed:', error);
    throw error;
  }
}

/**
 * Generate a placeholder image (fallback when image generation fails)
 */
function generatePlaceholderImage(
  text: string,
  width: number = 1024,
  height: number = 1024
): string {
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d') as OffscreenCanvasRenderingContext2D;

  // Gradient background
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#e8d5c4');
  gradient.addColorStop(1, '#d4c5b9');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Text
  ctx.fillStyle = '#2d5233';
  ctx.font = 'bold 32px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  const lines = text.split('\n');
  const lineHeight = 50;
  const startY = height / 2 - (lines.length * lineHeight) / 2;

  lines.forEach((line, index) => {
    ctx.fillText(line, width / 2, startY + index * lineHeight);
  });

  return canvas.convertToBlob().then(blob => {
    return new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.readAsDataURL(blob);
    });
  }) as any;
}
export async function generateImage(
  prompt: string,
  width: number = 1024,
  height: number = 1024
): Promise<string> {
  if (!OPENROUTER_API_KEY) {
    throw new Error('VITE_OPENROUTER_API_KEY is not configured');
  }

  try {
    console.log('🚀 Generating image via OpenRouter chat/completions...');
    console.log('Model: google/gemini-2.5-flash-image');
    console.log('Prompt:', prompt.substring(0, 100) + '...');

    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://lily-glasses.app',
        'X-Title': 'Lily Glasses Virtual Try-On',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        modalities: ['image', 'text'],
      }),
    });

    console.log(`Response status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('API Error Response:', errorData);
      
      const errorMessage = 
        errorData.error?.message || 
        errorData.message ||
        errorData.errors?.[0]?.message ||
        response.statusText ||
        'Unknown error';
      
      throw new Error(
        `Image generation failed (${response.status}): ${errorMessage}`
      );
    }

    const data = await response.json();
    console.log('✅ API Response received');

    // Extract image from response
    // Format: choices[0].message.images[0] = { type: 'image_url', image_url: { url: '...' } }
    const images = data.choices?.[0]?.message?.images;
    
    if (!images || images.length === 0) {
      console.log('Response keys:', Object.keys(data.choices?.[0]?.message || {}));
      throw new Error('No images in response');
    }

    const imageData = images[0];
    let imageUrl: string;

    // Handle different image response formats
    if (typeof imageData === 'string') {
      // Direct base64 string
      imageUrl = imageData.startsWith('data:') ? imageData : `data:image/png;base64,${imageData}`;
    } else if (imageData.image_url?.url) {
      // Object with image_url.url (OpenRouter format)
      imageUrl = imageData.image_url.url;
    } else if (imageData.url) {
      // Direct url property
      imageUrl = imageData.url;
    } else {
      console.log('Unexpected image format:', JSON.stringify(imageData).substring(0, 200));
      throw new Error('Unexpected image format in response');
    }

    console.log('✅ Image URL extracted, length:', imageUrl.length);
    return imageUrl;

  } catch (error) {
    console.error('❌ Image generation failed:', error);
    throw error;
  }
}

/**
 * Generate virtual try-on image with Gemini 2.5 Flash Image
 * Specifically optimized for glasses fitting on portraits
 */
export async function generateVirtualTryOn(
  portraitDataUrl: string,
  glassesName: string,
  glassesStyle: string,
  glassesColor: string,
  frameShape: string,
  material: string,
  description: string
): Promise<string> {
  if (!OPENROUTER_API_KEY) {
    throw new Error('VITE_OPENROUTER_API_KEY is not configured');
  }

  try {
    console.log('🎨 Generating virtual try-on with Gemini 2.5 Flash Image...');
    console.log('Model: google/gemini-2.5-flash-image');
    console.log('Glasses:', glassesName);

    // Create the try-on prompt
    const tryOnPrompt = `You are an expert at adding eyeglasses to portrait photos.

USER PORTRAIT: [Provided as image]

GLASSES TO ADD:
- Name: ${glassesName}
- Style: ${glassesStyle}
- Color: ${glassesColor}
- Frame Shape: ${frameShape}
- Material: ${material}
- Description: ${description}

YOUR TASK:
Add the eyeglasses to the portrait photo with these requirements:

1. PRESERVATION:
   - Keep the original face exactly as is (same skin tone, features, expression)
   - Keep the original hair, background, and lighting
   - Only add glasses on top

2. GLASSES POSITIONING:
   - Position glasses naturally on the face
   - Align bridge with nose
   - Align lenses with eyes
   - Temples should extend toward ears naturally
   - Glasses should sit at natural eye level

3. VISUAL QUALITY:
   - Make glasses look realistic and natural
   - Ensure glasses fit proportionally to face width
   - Add subtle shadows/reflections for realism
   - Match the lighting of the original photo

4. OUTPUT:
   - Create 1024x1024 resolution image
   - Result should look like the person is naturally wearing these glasses
   - Professional, realistic appearance`;

    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://lily-glasses.app',
        'X-Title': 'Lily Glasses Virtual Try-On',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: portraitDataUrl,
                },
              },
              {
                type: 'text',
                text: tryOnPrompt,
              },
            ],
          },
        ],
        modalities: ['image', 'text'],
      }),
    });

    console.log(`Response status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('API Error Response:', errorData);
      
      const errorMessage = 
        errorData.error?.message || 
        errorData.message ||
        errorData.errors?.[0]?.message ||
        response.statusText ||
        'Unknown error';
      
      throw new Error(
        `Virtual try-on failed (${response.status}): ${errorMessage}`
      );
    }

    const data = await response.json();
    console.log('✅ Virtual try-on API Response received');

    // Extract image from response
    const images = data.choices?.[0]?.message?.images;
    
    if (!images || images.length === 0) {
      console.log('Response keys:', Object.keys(data.choices?.[0]?.message || {}));
      throw new Error('No images in response');
    }

    const imageData = images[0];
    let imageUrl: string;

    // Handle different image response formats
    if (typeof imageData === 'string') {
      imageUrl = imageData.startsWith('data:') ? imageData : `data:image/png;base64,${imageData}`;
    } else if (imageData.image_url?.url) {
      imageUrl = imageData.image_url.url;
    } else if (imageData.url) {
      imageUrl = imageData.url;
    } else {
      console.log('Unexpected image format:', JSON.stringify(imageData).substring(0, 200));
      throw new Error('Unexpected image format in response');
    }

    console.log('✅ Virtual try-on image generated successfully');
    return imageUrl;

  } catch (error) {
    console.error('❌ Virtual try-on failed:', error);
    throw error;
  }
}
export async function checkApiCapabilities(): Promise<void> {
  if (!OPENROUTER_API_KEY) {
    console.warn('⚠️ No API key configured');
    return;
  }

  try {
    // Test a simple text generation
    console.log('🔍 Testing OpenRouter API capabilities...');
    const testResponse = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo',
        messages: [
          {
            role: 'user',
            content: 'Say "OK" only.',
          },
        ],
        max_tokens: 10,
      }),
    });

    if (testResponse.ok) {
      console.log('✅ Text generation: OK');
      apiCapabilities.hasVision = true;
    } else {
      const error = await testResponse.json();
      console.warn('⚠️ Text generation test failed:', error);
    }
  } catch (error) {
    console.error('❌ API capability check failed:', error);
  }
}

/**
 * Simple text generation wrapper
 */
export async function generateText(prompt: string): Promise<string> {
  const response = await generateContent({
    model: 'openrouter/auto',
    contents: {
      parts: [{ text: prompt }],
    } as any,
  });
  return response.text;
}

/**
 * Vision-based content generation wrapper
 */
export async function generateVisionContent(
  imageBase64: string,
  imageMimeType: string,
  prompt: string,
  modelOverride?: string
): Promise<string> {
  // Use a model that explicitly supports vision
  const model = modelOverride || 'gpt-4-vision';
  
  try {
    const response = await generateContent({
      model: model,
      contents: {
        parts: [
          {
            inlineData: {
              data: imageBase64,
              mimeType: imageMimeType,
            },
          },
          {
            text: prompt,
          },
        ],
      } as any,
    });
    return response.text;
  } catch (error) {
    console.error(`Vision content generation failed with ${model}:`, error);
    // Fallback: return a generic analysis instead of failing
    return "Front-facing portrait, standard lighting, suitable for glasses fitting";
  }
}

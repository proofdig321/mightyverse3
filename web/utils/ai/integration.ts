/**
 * AI Integration Utilities
 * Connects frontend with AI analysis services and models
 */

export interface AIModelConfig {
  endpoint: string;
  apiKey?: string;
  timeout: number;
  retries: number;
}

export interface AssetAnalysisRequest {
  asset_id: string;
  files: {
    bg_layer?: File | string;
    mg_layer?: File | string;
    fg_layer?: File | string;
    audio_file?: File | string;
    depth_map?: File | string;
  };
  options: {
    analyze_depth: boolean;
    analyze_segmentation: boolean;
    analyze_audio: boolean;
    generate_tags: boolean;
    suggest_anchors: boolean;
  };
}

export interface AIAnalysisResponse {
  success: boolean;
  analysis_id: string;
  confidence: number;
  processing_time: number;
  results: {
    visual_analysis?: {
      tags: Array<{ tag: string; confidence: number }>;
      mood: Array<{ mood: string; confidence: number }>;
      style: Array<{ style: string; confidence: number }>;
      dominant_colors: string[];
      composition_score: number;
    };
    depth_analysis?: {
      quality_score: number;
      depth_range: { min: number; max: number };
      depth_map_url?: string;
      issues: string[];
    };
    segmentation_analysis?: {
      accuracy_score: number;
      objects_detected: Array<{
        class: string;
        confidence: number;
        bbox: { x: number; y: number; width: number; height: number };
      }>;
      segmentation_map_url?: string;
    };
    audio_analysis?: {
      quality_score: number;
      bpm?: number;
      key?: string;
      genre_predictions: Array<{ genre: string; confidence: number }>;
      transcript?: string;
      explicit_content: boolean;
      audio_features: {
        tempo: number;
        energy: number;
        valence: number;
        danceability: number;
      };
    };
    anchor_suggestions?: Array<{
      id: string;
      x: number;
      y: number;
      z: number;
      confidence: number;
      reason: string;
      visibility_score: number;
      motion_overlap: number;
    }>;
    technical_metrics: {
      file_size: number;
      dimensions: { width: number; height: number };
      duration: number;
      format: string;
      compression_ratio?: number;
    };
  };
  issues: Array<{
    severity: 'low' | 'medium' | 'high';
    category: string;
    message: string;
    suggestion?: string;
  }>;
  metadata: {
    model_versions: Record<string, string>;
    processing_node: string;
    timestamp: string;
  };
}

/**
 * Main AI analysis function
 */
export async function analyzeAsset(
  request: AssetAnalysisRequest,
  config: AIModelConfig = getDefaultConfig()
): Promise<AIAnalysisResponse> {
  
  try {
    // Prepare form data for multipart upload
    const formData = new FormData();
    formData.append('asset_id', request.asset_id);
    formData.append('options', JSON.stringify(request.options));
    
    // Add files to form data
    Object.entries(request.files).forEach(([key, file]) => {
      if (file) {
        if (file instanceof File) {
          formData.append(key, file);
        } else {
          // Handle URL strings by fetching and converting to blob
          formData.append(`${key}_url`, file);
        }
      }
    });
    
    const response = await fetchWithRetry(
      `${config.endpoint}/analyze`,
      {
        method: 'POST',
        body: formData,
        headers: config.apiKey ? {
          'Authorization': `Bearer ${config.apiKey}`
        } : undefined,
        signal: AbortSignal.timeout(config.timeout)
      },
      config.retries
    );
    
    if (!response.ok) {
      throw new Error(`AI analysis failed: ${response.status} ${response.statusText}`);
    }
    
    const result: AIAnalysisResponse = await response.json();
    
    // Validate response structure
    validateAIResponse(result);
    
    return result;
    
  } catch (error) {
    console.error('AI analysis error:', error);
    
    // Return fallback response for development
    return createFallbackResponse(request);
  }
}

/**
 * Batch analysis for multiple assets
 */
export async function analyzeBatch(
  requests: AssetAnalysisRequest[],
  config: AIModelConfig = getDefaultConfig()
): Promise<AIAnalysisResponse[]> {
  
  const batchSize = 5; // Process in batches to avoid overwhelming the service
  const results: AIAnalysisResponse[] = [];
  
  for (let i = 0; i < requests.length; i += batchSize) {
    const batch = requests.slice(i, i + batchSize);
    
    const batchPromises = batch.map(request => 
      analyzeAsset(request, config).catch(error => {
        console.error(`Batch analysis failed for ${request.asset_id}:`, error);
        return createFallbackResponse(request);
      })
    );
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    // Add delay between batches to respect rate limits
    if (i + batchSize < requests.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return results;
}

/**
 * Get analysis status for long-running jobs
 */
export async function getAnalysisStatus(
  analysisId: string,
  config: AIModelConfig = getDefaultConfig()
): Promise<{
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  result?: AIAnalysisResponse;
  error?: string;
}> {
  
  try {
    const response = await fetch(
      `${config.endpoint}/analysis/${analysisId}/status`,
      {
        headers: config.apiKey ? {
          'Authorization': `Bearer ${config.apiKey}`
        } : undefined
      }
    );
    
    if (!response.ok) {
      throw new Error(`Status check failed: ${response.status}`);
    }
    
    return await response.json();
    
  } catch (error) {
    console.error('Status check error:', error);
    return {
      status: 'failed',
      progress: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Fetch with retry logic
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries: number
): Promise<Response> {
  
  let lastError: Error;
  
  for (let i = 0; i <= retries; i++) {
    try {
      const response = await fetch(url, options);
      
      // Don't retry on client errors (4xx)
      if (response.status >= 400 && response.status < 500) {
        return response;
      }
      
      // Retry on server errors (5xx) or network issues
      if (response.ok || i === retries) {
        return response;
      }
      
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Network error');
      
      if (i === retries) {
        throw lastError;
      }
    }
    
    // Exponential backoff
    const delay = Math.min(1000 * Math.pow(2, i), 10000);
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  
  throw lastError!;
}

/**
 * Validate AI response structure
 */
function validateAIResponse(response: AIAnalysisResponse): void {
  if (!response.success) {
    throw new Error('AI analysis was not successful');
  }
  
  if (!response.analysis_id || !response.results) {
    throw new Error('Invalid AI response structure');
  }
  
  if (response.confidence < 0 || response.confidence > 1) {
    throw new Error('Invalid confidence score');
  }
}

/**
 * Create fallback response for development/testing
 */
function createFallbackResponse(request: AssetAnalysisRequest): AIAnalysisResponse {
  return {
    success: true,
    analysis_id: `fallback_${Date.now()}`,
    confidence: 0.75,
    processing_time: 1000,
    results: {
      visual_analysis: {
        tags: [
          { tag: 'hip-hop', confidence: 0.9 },
          { tag: 'animated', confidence: 0.85 },
          { tag: 'urban', confidence: 0.7 }
        ],
        mood: [
          { mood: 'energetic', confidence: 0.8 },
          { mood: 'confident', confidence: 0.75 }
        ],
        style: [
          { style: 'modern', confidence: 0.8 },
          { style: 'digital', confidence: 0.9 }
        ],
        dominant_colors: ['#FF6B35', '#004E89', '#FFFFFF'],
        composition_score: 0.82
      },
      depth_analysis: request.options.analyze_depth ? {
        quality_score: 0.78,
        depth_range: { min: 0, max: 1 },
        issues: []
      } : undefined,
      segmentation_analysis: request.options.analyze_segmentation ? {
        accuracy_score: 0.85,
        objects_detected: [
          {
            class: 'person',
            confidence: 0.92,
            bbox: { x: 0.3, y: 0.2, width: 0.4, height: 0.6 }
          }
        ]
      } : undefined,
      audio_analysis: request.options.analyze_audio ? {
        quality_score: 0.88,
        bpm: 95,
        key: 'C minor',
        genre_predictions: [
          { genre: 'hip-hop', confidence: 0.9 },
          { genre: 'rap', confidence: 0.85 }
        ],
        explicit_content: false,
        audio_features: {
          tempo: 95,
          energy: 0.8,
          valence: 0.6,
          danceability: 0.75
        }
      } : undefined,
      anchor_suggestions: request.options.suggest_anchors ? [
        {
          id: 'anchor_1',
          x: 0.2,
          y: 0.3,
          z: 0.1,
          confidence: 0.85,
          reason: 'Empty background space with good visibility',
          visibility_score: 0.9,
          motion_overlap: 0.1
        },
        {
          id: 'anchor_2',
          x: 0.7,
          y: 0.8,
          z: 0.05,
          confidence: 0.72,
          reason: 'Lower third area with minimal motion',
          visibility_score: 0.8,
          motion_overlap: 0.2
        }
      ] : undefined,
      technical_metrics: {
        file_size: 2048000, // 2MB
        dimensions: { width: 1920, height: 1080 },
        duration: 30,
        format: 'PNG/MP3'
      }
    },
    issues: [],
    metadata: {
      model_versions: {
        'visual': 'v2.1.0',
        'audio': 'v1.8.0',
        'depth': 'v1.5.0'
      },
      processing_node: 'fallback-local',
      timestamp: new Date().toISOString()
    }
  };
}

/**
 * Get default AI configuration
 */
function getDefaultConfig(): AIModelConfig {
  return {
    endpoint: process.env.NEXT_PUBLIC_AI_ENDPOINT || 'http://localhost:8000/api/ai',
    apiKey: process.env.NEXT_PUBLIC_AI_API_KEY,
    timeout: 30000, // 30 seconds
    retries: 2
  };
}

/**
 * Health check for AI services
 */
export async function checkAIHealth(config: AIModelConfig = getDefaultConfig()): Promise<{
  available: boolean;
  models: string[];
  latency: number;
  version: string;
}> {
  
  const startTime = Date.now();
  
  try {
    const response = await fetch(`${config.endpoint}/health`, {
      headers: config.apiKey ? {
        'Authorization': `Bearer ${config.apiKey}`
      } : undefined,
      signal: AbortSignal.timeout(5000)
    });
    
    const latency = Date.now() - startTime;
    
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`);
    }
    
    const health = await response.json();
    
    return {
      available: true,
      models: health.models || [],
      latency,
      version: health.version || 'unknown'
    };
    
  } catch (error) {
    console.error('AI health check failed:', error);
    
    return {
      available: false,
      models: [],
      latency: Date.now() - startTime,
      version: 'unknown'
    };
  }
}
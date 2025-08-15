// ------------------- Imports & Types -------------------
import axios from "axios";
import * as FileSystem from "expo-file-system";
import localKnowledgeBaseJson from "../data/detectionData.json";
import { Buffer } from "buffer";
import { StorageService, DetectionRecord } from "./StorageService";

// Polyfill Buffer for React Native
if (typeof global.Buffer === 'undefined') {
  global.Buffer = Buffer;
}

type Treatment = {
  name: string;
  dosage: string;
  frequency: string;
  safety: string;
};

type LocalKnowledgeBaseEntry = {
  scientific_name: string;
  severity: string;
  description: string;
  symptoms: string[];
  treatments: {
    organic: Treatment[];
    chemical: Treatment[];
    preventive: string[];
  };
};

type LocalKnowledgeBase = {
  [key: string]: LocalKnowledgeBaseEntry;
};

const localKnowledgeBase: LocalKnowledgeBase = localKnowledgeBaseJson;

// ------------------- Config -------------------
const HUGGINGFACE_API_KEY = "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";

// Models
const DISEASE_MODEL = "linkanjarad/mobilenet_v2_1.0_224-plant-disease-identification";
const PEST_MODEL = "keremberke/yolov8n-plant-pest-detection";

// Helper: wait function for retry delay
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper: Validate image URI
const isValidImageUri = (uri: string): boolean => {
  return Boolean(uri && (uri.startsWith('file://') || uri.startsWith('content://') || uri.startsWith('ph://')));
};

// Helper: Get proper content type from file extension
const getContentTypeFromUri = (uri: string): string => {
  const extension = uri.toLowerCase().split('.').pop();
  switch (extension) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    default:
      return 'image/jpeg';
  }
};

// ------------------- Service -------------------
export class DetectionService {
  static async analyzeImage(
    imageUri: string,
    type: "pest" | "disease",
    cropType: string
  ) {
    try {
      // Validate input parameters
      if (!imageUri || typeof imageUri !== 'string') {
        throw new Error("Invalid image URI provided");
      }
      
      if (!isValidImageUri(imageUri)) {
        throw new Error("Image URI must be a local file path (file://, content://, or ph://)");
      }

      if (!type || (type !== "pest" && type !== "disease")) {
        throw new Error("Type must be either 'pest' or 'disease'");
      }

      // Check if file exists
      const fileInfo = await FileSystem.getInfoAsync(imageUri);
      if (!fileInfo.exists) {
        throw new Error("Image file does not exist at the provided URI");
      }

      console.log("Reading image file:", imageUri);
      console.log("File size:", fileInfo.size);

      // 1. Read image file as Base64 with error handling
      let imageBase64: string;
      try {
        imageBase64 = await FileSystem.readAsStringAsync(imageUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        
        if (!imageBase64 || imageBase64.length === 0) {
          throw new Error("Failed to read image file - empty result");
        }
        
        console.log("Image base64 length:", imageBase64.length);
      } catch (fileError: any) {
        console.error("File reading error:", fileError);
        throw new Error(`Failed to read image file: ${fileError.message || 'Unknown file error'}`);
      }

      // 2. Convert Base64 to binary Buffer with validation
      let imageBuffer: Buffer;
      try {
        imageBuffer = Buffer.from(imageBase64, "base64");
        
        if (imageBuffer.length === 0) {
          throw new Error("Invalid image data - buffer is empty");
        }
        
        // Check if buffer size is reasonable (between 1KB and 10MB)
        if (imageBuffer.length < 1024) {
          throw new Error("Image file too small - may be corrupted");
        }
        
        if (imageBuffer.length > 10 * 1024 * 1024) {
          throw new Error("Image file too large - please use a smaller image");
        }
        
        console.log("Image buffer size:", imageBuffer.length);
      } catch (bufferError: any) {
        console.error("Buffer conversion error:", bufferError);
        throw new Error(`Failed to process image data: ${bufferError.message || 'Buffer error'}`);
      }

      // Choose model based on type
      const model = type === "disease" ? DISEASE_MODEL : PEST_MODEL;
      const apiUrl = `https://api-inference.huggingface.co/models/${model}`;
      const contentType = getContentTypeFromUri(imageUri);

      console.log("Using model:", model);
      console.log("Content type:", contentType);

      let predictions: any[] | null = null;
      let attempts = 0;
      const maxAttempts = 3;

      // Retry up to 3 times if model is loading (503)
      while (attempts < maxAttempts && !predictions) {
        attempts++;
        console.log(`API request attempt ${attempts}/${maxAttempts}`);
        
        try {
          // Configure axios request with proper headers and timeout
          const config = {
            method: 'POST' as const,
            url: apiUrl,
            data: imageBuffer,
            headers: {
              'Authorization': `Bearer ${HUGGINGFACE_API_KEY}`,
              'Content-Type': contentType,
              'User-Agent': 'Expo-App/1.0',
            },
            timeout: 45000, // Increased timeout for mobile networks
            maxContentLength: 50 * 1024 * 1024, // 50MB limit
            validateStatus: (status: number) => status < 500 || status === 503, // Don't throw on 503
          };

          console.log("Making API request...");
          const response = await axios(config);

          console.log("API Response status:", response.status);
          console.log("API Response headers:", response.headers);

          // Handle different response scenarios
          if (response.status === 503) {
            const errorMsg = response.data?.error || "Model is loading";
            if (errorMsg.toLowerCase().includes("loading")) {
              console.warn(`Model is loading, retrying in 8s... (Attempt ${attempts}/${maxAttempts})`);
              if (attempts < maxAttempts) {
                await sleep(8000); // Longer wait time
                continue;
              } else {
                throw new Error("Model is still loading after multiple attempts. Please try again later.");
              }
            } else {
              throw new Error(`Service temporarily unavailable: ${errorMsg}`);
            }
          }

          if (response.status === 401) {
            throw new Error("Invalid Hugging Face API key. Please check your token.");
          }

          if (response.status === 429) {
            throw new Error("Rate limit exceeded. Please wait before making another request or upgrade your HF account.");
          }

          if (response.status >= 400) {
            const errorMsg = response.data?.error || `HTTP ${response.status}`;
            throw new Error(`API request failed: ${errorMsg}`);
          }

          // Validate response data
          if (!response.data) {
            throw new Error("Empty response from API");
          }

          if (Array.isArray(response.data) && response.data.length > 0) {
            predictions = response.data;
            console.log("Successful predictions received:", predictions.length);
            break;
          } else if (typeof response.data === 'object' && response.data.error) {
            throw new Error(response.data.error);
          } else {
            console.warn("Unexpected response format:", response.data);
            throw new Error("Unexpected API response format");
          }

        } catch (err: any) {
          console.error(`Attempt ${attempts} failed:`, {
            message: err.message,
            status: err?.response?.status,
            statusText: err?.response?.statusText,
            data: err?.response?.data
          });

          // Handle specific error types
          if (err.code === 'NETWORK_ERROR' || err.code === 'ENOTFOUND') {
            throw new Error("Network error. Please check your internet connection and try again.");
          }

          if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
            if (attempts < maxAttempts) {
              console.warn("Request timeout, retrying...");
              await sleep(3000);
              continue;
            } else {
              throw new Error("Request timeout. Please check your internet connection and try again.");
            }
          }

          // If it's the last attempt, throw the error
          if (attempts >= maxAttempts) {
            throw err;
          }

          // For other errors, wait a bit before retrying
          await sleep(2000);
        }
      }

      if (!predictions || predictions.length === 0) {
        throw new Error("No predictions returned from the AI model. The image may not be clear enough or may not contain recognizable plant issues.");
      }

      // 3. Process the top prediction
      const topPrediction = predictions[0];
      
      if (!topPrediction || typeof topPrediction !== 'object') {
        throw new Error("Invalid prediction format received from API");
      }

      console.log("Top prediction:", topPrediction);

      const rawLabel = 
        (typeof topPrediction.label === "string" && topPrediction.label.trim() !== "")
          ? topPrediction.label
          : "unknown";

      // Normalize label for knowledge base lookup
      const normalizedLabel = rawLabel
        .toLowerCase()
        .replace(/[_\-]+/g, " ")
        .replace(/\s+/g, " ") // Replace multiple spaces with single space
        .trim();

      console.log("Normalized label:", normalizedLabel);

      // 4. Match with local knowledge base with extensive fallback logic
      console.log("Looking up in knowledge base:", normalizedLabel);
      console.log("Available keys:", Object.keys(localKnowledgeBase));
      
      let localInfo = localKnowledgeBase[normalizedLabel];
      
      // Try different fallback strategies if not found
      if (!localInfo) {
        // Try original raw label
        localInfo = localKnowledgeBase[rawLabel.toLowerCase()];
      }
      
      if (!localInfo) {
        // Try without specific crop name (e.g., "bacterial spot" instead of "bell pepper with bacterial spot")
        const genericDisease = normalizedLabel.replace(/^[^a-z]*\s*(with|having)?\s*/, '').trim();
        localInfo = localKnowledgeBase[genericDisease];
        console.log("Trying generic lookup:", genericDisease);
      }
      
      if (!localInfo) {
        // Try partial matches for common diseases
        const diseaseKeywords = ['blight', 'spot', 'rot', 'mildew', 'rust', 'wilt', 'canker'];
        for (const keyword of diseaseKeywords) {
          if (normalizedLabel.includes(keyword)) {
            const matchingKey = Object.keys(localKnowledgeBase).find(key => key.includes(keyword));
            if (matchingKey) {
              localInfo = localKnowledgeBase[matchingKey];
              console.log("Found partial match:", matchingKey);
              break;
            }
          }
        }
      }
      
      // Final fallback to unknown or create default
      if (!localInfo) {
        console.log("No match found, using fallback");
        localInfo = localKnowledgeBase["unknown"] || {
          scientific_name: `Unknown ${type}`,
          severity: "Medium", // Changed from Low to Medium for unknown diseases
          description: `This appears to be a ${type} affecting your plant. ${normalizedLabel.includes('spot') ? 'Spot diseases are often fungal or bacterial infections that can spread if not treated.' : 'Consider consulting with a local agricultural expert for proper identification and treatment.'}`,
          symptoms: [`Visible ${type} symptoms detected`, "May cause plant stress", "Could spread to other plants"],
          treatments: { 
            organic: [
              { 
                name: "Neem oil spray", 
                dosage: "5-10 ml per liter of water", 
                frequency: "Every 7-10 days", 
                safety: "Safe for beneficial insects when applied in evening" 
              },
              { 
                name: "Baking soda solution", 
                dosage: "1 tsp per liter of water", 
                frequency: "Every 5-7 days", 
                safety: "Test on small area first" 
              }
            ], 
            chemical: [
              {
                name: "Copper-based fungicide",
                dosage: "Follow manufacturer instructions",
                frequency: "As per label directions",
                safety: "Wear protective equipment, avoid spraying during bloom"
              }
            ], 
            preventive: [
              "Monitor plant regularly", 
              "Maintain good air circulation", 
              "Avoid overhead watering",
              "Remove affected plant parts",
              "Practice crop rotation",
              "Ensure proper plant spacing"
            ] 
          },
        };
      }

      // 5. Calculate confidence score
      const confidence = 
        typeof topPrediction.score === "number" && !isNaN(topPrediction.score)
          ? Math.round(Math.max(0, Math.min(100, topPrediction.score * 100)))
          : 0;

      console.log("Analysis complete:", {
        name: normalizedLabel,
        confidence,
        severity: localInfo.severity,
        fullResult: JSON.stringify({
          name: normalizedLabel || "unknown",
          scientific_name: localInfo?.scientific_name || `Unknown ${type}`,
          severity: localInfo?.severity || "Low",
          confidence,
          description: localInfo?.description || `This appears to be an unidentified ${type}.`,
          symptoms: Array.isArray(localInfo?.symptoms) ? localInfo.symptoms : [],
          treatments: {
            organic: Array.isArray(localInfo?.treatments?.organic) ? localInfo.treatments.organic : [],
            chemical: Array.isArray(localInfo?.treatments?.chemical) ? localInfo.treatments.chemical : [],
            preventive: Array.isArray(localInfo?.treatments?.preventive) ? localInfo.treatments.preventive : [],
          }
        }, null, 2)
      });

      // 6. Return in expected format with additional null checks
      const result = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        image: imageUri,
        type,
        crop: cropType || "Unknown crop",
        result: {
          name: normalizedLabel || "unknown",
          scientific_name: localInfo?.scientific_name || `Unknown ${type}`,
          severity: localInfo?.severity || "Low",
          confidence,
          description: localInfo?.description || `This appears to be an unidentified ${type}.`,
          symptoms: Array.isArray(localInfo?.symptoms) ? localInfo.symptoms : [],
          treatments: {
            organic: Array.isArray(localInfo?.treatments?.organic) ? localInfo.treatments.organic : [],
            chemical: Array.isArray(localInfo?.treatments?.chemical) ? localInfo.treatments.chemical : [],
            preventive: Array.isArray(localInfo?.treatments?.preventive) ? localInfo.treatments.preventive : [],
          },
        },
      };

      // Save detection to storage
      await StorageService.saveDetection(result as DetectionRecord);

      return result;

    } catch (error: any) {
      console.error("DetectionService.analyzeImage error:", {
        message: error.message,
        stack: error.stack,
        response: error?.response?.data,
        status: error?.response?.status
      });
      
      // Provide more user-friendly error messages
      let userMessage = error.message;
      
      if (error.message?.includes('Network Error') || error.code === 'NETWORK_ERROR') {
        userMessage = "Unable to connect to the analysis service. Please check your internet connection and try again.";
      } else if (error.message?.includes('timeout')) {
        userMessage = "The analysis is taking too long. Please try again with a smaller image or check your connection.";
      } else if (error.message?.includes('API key')) {
        userMessage = "Authentication failed. Please check the API configuration.";
      } else if (error.message?.includes('Rate limit')) {
        userMessage = "Too many requests. Please wait a moment before trying again.";
      } else if (!error.message || error.message === 'Image analysis failed') {
        userMessage = "Image analysis failed. Please ensure the image is clear and shows plant issues, then try again.";
      }
      
      throw new Error(userMessage);
    }
  }

  static async getDetectionHistory(): Promise<any[]> {
    return await StorageService.getDetections();
  }

  static async getAppStats() {
    return await StorageService.getStats();
  }

  static getSeverityColor(severity: string | undefined | null): string {
    if (!severity || typeof severity !== 'string') {
      return "#6b7280"; // Gray for unknown/invalid severity
    }
    
    const normalizedSeverity = severity.toLowerCase();
    switch (normalizedSeverity) {
      case "high":
      case "severe":
        return "#ef4444"; // Red
      case "medium":
      case "moderate":
        return "#f59e0b"; // Orange
      case "low":
      case "mild":
        return "#10b981"; // Green
      default:
        return "#6b7280"; // Gray
    }
  }

  static getConfidenceLevel(confidence: number): string {
    if (typeof confidence !== 'number' || isNaN(confidence)) {
      return "Unknown";
    }
    
    if (confidence >= 90) return "Very High";
    if (confidence >= 80) return "High";
    if (confidence >= 70) return "Good";
    if (confidence >= 60) return "Fair";
    return "Low";
  }
}
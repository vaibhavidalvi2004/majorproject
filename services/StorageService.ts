import AsyncStorage from '@react-native-async-storage/async-storage';

export interface DetectionRecord {
  id: string;
  timestamp: number;
  type: 'disease' | 'pest';
  crop: string;
  result: {
    name: string;
    scientific_name: string;
    severity: string;
    confidence: number;
    description: string;
    symptoms: string[];
    treatments: {
      organic: any[];
      chemical: any[];
      preventive: string[];
    };
  };
  image: string;
}

export interface AppStats {
  totalScans: number;
  healthyPlants: number;
  issuesFound: number;
  successfulTreatments: number;
  recentScans: DetectionRecord[];
}

export class StorageService {
  private static readonly DETECTIONS_KEY = 'plant_detections';
  private static readonly STATS_KEY = 'app_stats';
  private static readonly ONBOARDING_KEY = 'onboarding_completed';

  static async saveDetection(detection: DetectionRecord): Promise<void> {
    try {
      const existingDetections = await this.getDetections();
      const updatedDetections = [detection, ...existingDetections];
      
      // Keep only last 100 detections to prevent storage bloat
      const trimmedDetections = updatedDetections.slice(0, 100);
      
      await AsyncStorage.setItem(this.DETECTIONS_KEY, JSON.stringify(trimmedDetections));
      await this.updateStats();
    } catch (error) {
      console.error('Error saving detection:', error);
    }
  }

  static async getDetections(): Promise<DetectionRecord[]> {
    try {
      const detectionsJson = await AsyncStorage.getItem(this.DETECTIONS_KEY);
      return detectionsJson ? JSON.parse(detectionsJson) : [];
    } catch (error) {
      console.error('Error getting detections:', error);
      return [];
    }
  }

  static async getStats(): Promise<AppStats> {
    try {
      const detections = await this.getDetections();
      
      const totalScans = detections.length;
      const issuesFound = detections.filter(d => 
        d.result.severity.toLowerCase() !== 'low' || 
        d.result.name !== 'healthy'
      ).length;
      
      // Calculate healthy plants (low severity or confidence > 80%)
      const healthyPlants = detections.filter(d => 
        d.result.severity.toLowerCase() === 'low' || 
        d.result.confidence > 80
      ).length;
      
      // Mock successful treatments based on issues found (assuming 70% success rate)
      const successfulTreatments = Math.floor(issuesFound * 0.7);
      
      const recentScans = detections.slice(0, 5);

      return {
        totalScans,
        healthyPlants,
        issuesFound,
        successfulTreatments,
        recentScans
      };
    } catch (error) {
      console.error('Error getting stats:', error);
      return {
        totalScans: 0,
        healthyPlants: 0,
        issuesFound: 0,
        successfulTreatments: 0,
        recentScans: []
      };
    }
  }

  private static async updateStats(): Promise<void> {
    try {
      const stats = await this.getStats();
      await AsyncStorage.setItem(this.STATS_KEY, JSON.stringify(stats));
    } catch (error) {
      console.error('Error updating stats:', error);
    }
  }

  static async isOnboardingCompleted(): Promise<boolean> {
    try {
      const completed = await AsyncStorage.getItem(this.ONBOARDING_KEY);
      return completed === 'true';
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      return false;
    }
  }

  static async setOnboardingCompleted(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.ONBOARDING_KEY, 'true');
    } catch (error) {
      console.error('Error setting onboarding completed:', error);
    }
  }

  static async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([this.DETECTIONS_KEY, this.STATS_KEY]);
      await this.updateStats();
    } catch (error) {
      console.error('Error clearing data:', error);
    }
  }
}
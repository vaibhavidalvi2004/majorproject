import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { Camera as CameraIcon, FlipHorizontal, Zap, Bug, Leaf, ArrowRight, CircleCheck as CheckCircle } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { DetectionService } from '@/services/DetectionService';

type DetectionType = 'disease' | 'pest';
type CropType = 'tomato' | 'pepper' | 'corn' | 'wheat' | 'other';

export default function CameraTab() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [selectedDetectionType, setSelectedDetectionType] = useState<DetectionType>('disease');
  const [selectedCrop, setSelectedCrop] = useState<CropType>('tomato');
  const cameraRef = useRef<CameraView>(null);

  const detectionTypes = [
    { key: 'disease' as DetectionType, label: 'Disease', icon: Leaf, color: '#dc2626' },
    { key: 'pest' as DetectionType, label: 'Pest', icon: Bug, color: '#ea580c' },
  ];

  const cropTypes = [
    { key: 'tomato' as CropType, label: 'Tomato' },
    { key: 'pepper' as CropType, label: 'Pepper' },
    { key: 'corn' as CropType, label: 'Corn' },
    { key: 'wheat' as CropType, label: 'Wheat' },
    { key: 'other' as CropType, label: 'Other' },
  ];

  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Sorry, we need camera roll permissions to make this work!');
      }
    })();
  }, []);

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <CameraIcon size={64} color="#6b7280" />
          <Text style={styles.permissionTitle}>Camera Permission Required</Text>
          <Text style={styles.permissionText}>
            We need access to your camera to detect plant diseases and pests
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync();
        if (photo) {
          setCapturedImage(photo.uri);
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to take picture');
        console.error(error);
      }
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        setCapturedImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
      console.error(error);
    }
  };

  const analyzeImage = async () => {
    if (!capturedImage) return;

    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      const result = await DetectionService.analyzeImage(
        capturedImage,
        selectedDetectionType,
        selectedCrop
      );
      setAnalysisResult(result);
    } catch (error: any) {
      Alert.alert('Analysis Failed', error.message || 'Please try again');
      console.error(error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetCamera = () => {
    setCapturedImage(null);
    setAnalysisResult(null);
  };

  const getSeverityColor = (severity: string) => {
    return DetectionService.getSeverityColor(severity);
  };

  if (capturedImage) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.reviewContainer}>
          <View style={styles.imageContainer}>
            <Image source={{ uri: capturedImage }} style={styles.capturedImage} />
            <TouchableOpacity style={styles.retakeButton} onPress={resetCamera}>
              <Text style={styles.retakeButtonText}>Retake</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.selectionContainer}>
            <Text style={styles.selectionTitle}>Detection Type</Text>
            <View style={styles.typeSelector}>
              {detectionTypes.map((type) => {
                const IconComponent = type.icon;
                return (
                  <TouchableOpacity
                    key={type.key}
                    style={[
                      styles.typeButton,
                      selectedDetectionType === type.key && styles.typeButtonActive
                    ]}
                    onPress={() => setSelectedDetectionType(type.key)}
                  >
                    <IconComponent 
                      size={20} 
                      color={selectedDetectionType === type.key ? '#ffffff' : type.color} 
                    />
                    <Text style={[
                      styles.typeButtonText,
                      selectedDetectionType === type.key && styles.typeButtonTextActive
                    ]}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.selectionTitle}>Crop Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cropSelector}>
              {cropTypes.map((crop) => (
                <TouchableOpacity
                  key={crop.key}
                  style={[
                    styles.cropButton,
                    selectedCrop === crop.key && styles.cropButtonActive
                  ]}
                  onPress={() => setSelectedCrop(crop.key)}
                >
                  <Text style={[
                    styles.cropButtonText,
                    selectedCrop === crop.key && styles.cropButtonTextActive
                  ]}>
                    {crop.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <TouchableOpacity
            style={[styles.analyzeButton, isAnalyzing && styles.analyzeButtonDisabled]}
            onPress={analyzeImage}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Zap size={20} color="#ffffff" />
            )}
            <Text style={styles.analyzeButtonText}>
              {isAnalyzing ? 'Analyzing...' : 'Analyze Plant'}
            </Text>
          </TouchableOpacity>

          {analysisResult && (
            <View style={styles.resultContainer}>
              <View style={styles.resultHeader}>
                <CheckCircle size={24} color="#10b981" />
                <Text style={styles.resultTitle}>Analysis Complete</Text>
              </View>

              <View style={styles.resultCard}>
                <View style={styles.resultInfo}>
                  <Text style={styles.detectionName}>{analysisResult.result.name}</Text>
                  <Text style={styles.scientificName}>{analysisResult.result.scientific_name}</Text>
                  
                  <View style={styles.statusRow}>
                    <View style={styles.severityBadge}>
                      <View style={[styles.severityDot, { backgroundColor: getSeverityColor(analysisResult.result.severity) }]} />
                      <Text style={styles.severityText}>
                        Severity: {analysisResult.result.severity}
                      </Text>
                    </View>
                    <Text style={styles.confidenceText}>
                      Confidence: {analysisResult.result.confidence}%
                    </Text>
                  </View>

                  <Text style={styles.description}>{analysisResult.result.description}</Text>

                  {analysisResult.result.symptoms.length > 0 && (
                    <View style={styles.symptomsSection}>
                      <Text style={styles.sectionTitle}>Symptoms</Text>
                      {analysisResult.result.symptoms.map((symptom: string, index: number) => (
                        <Text key={index} style={styles.symptomText}>• {symptom}</Text>
                      ))}
                    </View>
                  )}

                  {analysisResult.result.treatments.organic.length > 0 && (
                    <View style={styles.treatmentsSection}>
                      <Text style={styles.sectionTitle}>Organic Treatments</Text>
                      {analysisResult.result.treatments.organic.map((treatment: any, index: number) => (
                        <View key={index} style={styles.treatmentCard}>
                          <Text style={styles.treatmentName}>{treatment.name}</Text>
                          <Text style={styles.treatmentDetail}>Dosage: {treatment.dosage}</Text>
                          <Text style={styles.treatmentDetail}>Frequency: {treatment.frequency}</Text>
                          <Text style={styles.treatmentSafety}>Safety: {treatment.safety}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.cameraHeader}>
        <Text style={styles.headerTitle}>Plant Detection</Text>
        <Text style={styles.headerSubtitle}>Point camera at affected plant area</Text>
      </View>

      <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
        <View style={styles.cameraOverlay}>
          <View style={styles.scanFrame} />
          <Text style={styles.scanInstructions}>
            Position the affected area within the frame
          </Text>
        </View>
      </CameraView>

      <View style={styles.cameraControls}>
        <TouchableOpacity style={styles.controlButton} onPress={pickImage}>
          <Image
            source={{ uri: 'https://images.pexels.com/photos/1407305/pexels-photo-1407305.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=1' }}
            style={styles.galleryPreview}
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
          <View style={styles.captureButtonInner} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlButton} onPress={toggleCameraFacing}>
          <FlipHorizontal size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  permissionButton: {
    backgroundColor: '#16a34a',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  permissionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  cameraHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  scanFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#16a34a',
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  scanInstructions: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  cameraControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 24,
    backgroundColor: '#000000',
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  galleryPreview: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#16a34a',
  },
  reviewContainer: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  imageContainer: {
    position: 'relative',
  },
  capturedImage: {
    width: '100%',
    height: 300,
  },
  retakeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  retakeButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  selectionContainer: {
    padding: 20,
  },
  selectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 12,
    marginTop: 16,
  },
  typeSelector: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
    marginRight: 12,
  },
  typeButtonActive: {
    backgroundColor: '#16a34a',
    borderColor: '#16a34a',
  },
  typeButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#4b5563',
  },
  typeButtonTextActive: {
    color: '#ffffff',
  },
  cropSelector: {
    flexDirection: 'row',
  },
  cropButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
    marginRight: 8,
  },
  cropButtonActive: {
    backgroundColor: '#16a34a',
    borderColor: '#16a34a',
  },
  cropButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4b5563',
  },
  cropButtonTextActive: {
    color: '#ffffff',
  },
  analyzeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16a34a',
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  analyzeButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  analyzeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  resultContainer: {
    margin: 20,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginLeft: 8,
  },
  resultCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultInfo: {
    flex: 1,
  },
  detectionName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  scientificName: {
    fontSize: 16,
    color: '#6b7280',
    fontStyle: 'italic',
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  severityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  severityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  severityText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4b5563',
  },
  confidenceText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4b5563',
  },
  description: {
    fontSize: 16,
    color: '#4b5563',
    lineHeight: 24,
    marginBottom: 20,
  },
  symptomsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 12,
  },
  symptomText: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
    marginBottom: 4,
  },
  treatmentsSection: {
    marginBottom: 20,
  },
  treatmentCard: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  treatmentName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  treatmentDetail: {
    fontSize: 13,
    color: '#4b5563',
    marginBottom: 2,
  },
  treatmentSafety: {
    fontSize: 13,
    color: '#059669',
    fontStyle: 'italic',
  },
});
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { History as HistoryIcon, Calendar, CircleAlert as AlertCircle, CircleCheck as CheckCircle, TrendingUp, Filter } from 'lucide-react-native';
import { DetectionService } from '@/services/DetectionService';

export default function HistoryTab() {
  const [detections, setDetections] = useState<any[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'disease' | 'pest'>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDetectionHistory();
  }, []);

  const loadDetectionHistory = async () => {
    setIsLoading(true);
    try {
      const history = await DetectionService.getDetectionHistory();
      setDetections(history);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Mock data for demonstration since getDetectionHistory returns empty array
  const mockDetections = [
    {
      id: '1',
      timestamp: Date.now() - 86400000, // 1 day ago
      type: 'disease',
      crop: 'tomato',
      result: {
        name: 'early blight',
        scientific_name: 'Alternaria solani',
        severity: 'Medium',
        confidence: 85,
        description: 'Early blight is a common fungal disease affecting tomatoes.',
      },
      image: 'https://images.pexels.com/photos/1459339/pexels-photo-1459339.jpeg?auto=compress&cs=tinysrgb&w=400'
    },
    {
      id: '2',
      timestamp: Date.now() - 172800000, // 2 days ago
      type: 'pest',
      crop: 'pepper',
      result: {
        name: 'aphids',
        scientific_name: 'Aphidoidea',
        severity: 'Low',
        confidence: 92,
        description: 'Small insects that feed on plant sap.',
      },
      image: 'https://images.pexels.com/photos/1407305/pexels-photo-1407305.jpeg?auto=compress&cs=tinysrgb&w=400'
    },
    {
      id: '3',
      timestamp: Date.now() - 259200000, // 3 days ago
      type: 'disease',
      crop: 'corn',
      result: {
        name: 'leaf rust',
        scientific_name: 'Puccinia sorghi',
        severity: 'High',
        confidence: 78,
        description: 'Fungal disease causing rust-colored pustules on leaves.',
      },
      image: 'https://images.pexels.com/photos/2518861/pexels-photo-2518861.jpeg?auto=compress&cs=tinysrgb&w=400'
    },
  ];

  const displayDetections = detections.length > 0 ? detections : mockDetections;
  const filteredDetections = filterType === 'all' 
    ? displayDetections 
    : displayDetections.filter(detection => detection.type === filterType);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
  };

  const getSeverityColor = (severity: string) => {
    return DetectionService.getSeverityColor(severity);
  };

  const getSeverityIcon = (severity: string) => {
    const color = getSeverityColor(severity);
    if (severity.toLowerCase() === 'low') return <CheckCircle size={16} color={color} />;
    return <AlertCircle size={16} color={color} />;
  };

  const getStats = () => {
    const total = displayDetections.length;
    const diseases = displayDetections.filter(d => d.type === 'disease').length;
    const pests = displayDetections.filter(d => d.type === 'pest').length;
    const highSeverity = displayDetections.filter(d => d.result.severity.toLowerCase() === 'high').length;

    return { total, diseases, pests, highSeverity };
  };

  const stats = getStats();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <HistoryIcon size={24} color="#16a34a" />
        <Text style={styles.headerTitle}>Detection History</Text>
      </View>

      {/* Stats Overview */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total Scans</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.diseases}</Text>
          <Text style={styles.statLabel}>Diseases</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.pests}</Text>
          <Text style={styles.statLabel}>Pests</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.highSeverity}</Text>
          <Text style={styles.statLabel}>Critical</Text>
        </View>
      </View>

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filterType === 'all' && styles.filterButtonActive]}
          onPress={() => setFilterType('all')}
        >
          <Text style={[styles.filterText, filterType === 'all' && styles.filterTextActive]}>
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filterType === 'disease' && styles.filterButtonActive]}
          onPress={() => setFilterType('disease')}
        >
          <Text style={[styles.filterText, filterType === 'disease' && styles.filterTextActive]}>
            Diseases
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filterType === 'pest' && styles.filterButtonActive]}
          onPress={() => setFilterType('pest')}
        >
          <Text style={[styles.filterText, filterType === 'pest' && styles.filterTextActive]}>
            Pests
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
        {filteredDetections.length === 0 ? (
          <View style={styles.emptyState}>
            <HistoryIcon size={48} color="#9ca3af" />
            <Text style={styles.emptyTitle}>No detections yet</Text>
            <Text style={styles.emptyText}>
              Start scanning your plants to build your detection history
            </Text>
          </View>
        ) : (
          filteredDetections.map((detection, index) => (
            <View key={detection.id || index} style={styles.detectionCard}>
              <Image source={{ uri: detection.image }} style={styles.detectionImage} />
              
              <View style={styles.detectionInfo}>
                <View style={styles.detectionHeader}>
                  <Text style={styles.detectionName}>{detection.result.name}</Text>
                  <View style={styles.severityContainer}>
                    {getSeverityIcon(detection.result.severity)}
                    <Text style={[styles.severityText, { color: getSeverityColor(detection.result.severity) }]}>
                      {detection.result.severity}
                    </Text>
                  </View>
                </View>
                
                <Text style={styles.scientificName}>{detection.result.scientific_name}</Text>
                
                <View style={styles.detectionMeta}>
                  <View style={styles.metaItem}>
                    <Calendar size={14} color="#6b7280" />
                    <Text style={styles.metaText}>{formatDate(detection.timestamp)}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <TrendingUp size={14} color="#6b7280" />
                    <Text style={styles.metaText}>{detection.result.confidence}% confidence</Text>
                  </View>
                </View>
                
                <Text style={styles.cropType}>Crop: {detection.crop}</Text>
                <Text style={styles.detectionDescription} numberOfLines={2}>
                  {detection.result.description}
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginLeft: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    fontWeight: '500',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#f3f4f6',
  },
  filterButtonActive: {
    backgroundColor: '#16a34a',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4b5563',
  },
  filterTextActive: {
    color: '#ffffff',
  },
  listContainer: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  detectionCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  detectionImage: {
    width: 100,
    height: 120,
  },
  detectionInfo: {
    flex: 1,
    padding: 16,
  },
  detectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  detectionName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    flex: 1,
    textTransform: 'capitalize',
  },
  severityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  severityText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  scientificName: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  detectionMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
  },
  cropType: {
    fontSize: 12,
    color: '#16a34a',
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  detectionDescription: {
    fontSize: 13,
    color: '#4b5563',
    lineHeight: 18,
  },
});
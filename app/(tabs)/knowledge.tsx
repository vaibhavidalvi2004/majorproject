import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Book, Search, Leaf, Bug, Shield, TriangleAlert as AlertTriangle, Info } from 'lucide-react-native';
import localKnowledgeBaseJson from '@/data/detectionData.json';

export default function KnowledgeTab() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'disease' | 'pest'>('all');
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  const knowledgeBase = localKnowledgeBaseJson as any;

  const categories = [
    { key: 'all' as const, label: 'All', icon: Book },
    { key: 'disease' as const, label: 'Diseases', icon: Leaf },
    { key: 'pest' as const, label: 'Pests', icon: Bug },
  ];

  const getFilteredEntries = () => {
    const entries = Object.entries(knowledgeBase).filter(([key, _]) => key !== 'unknown');
    
    let filtered = entries.filter(([key, entry]: [string, any]) => {
      const matchesSearch = key.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          entry.scientific_name?.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (selectedCategory === 'all') return matchesSearch;
      
      // Simple categorization based on common terms
      const isDiseaseKeyword = ['blight', 'spot', 'rot', 'mildew', 'rust', 'wilt', 'canker', 'scab', 'mosaic'].some(term => 
        key.toLowerCase().includes(term)
      );
      
      if (selectedCategory === 'disease') return matchesSearch && isDiseaseKeyword;
      if (selectedCategory === 'pest') return matchesSearch && !isDiseaseKeyword;
      
      return matchesSearch;
    });

    return filtered;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getSeverityIcon = (severity: string) => {
    const color = getSeverityColor(severity);
    switch (severity?.toLowerCase()) {
      case 'high': return <AlertTriangle size={16} color={color} />;
      case 'medium': return <Info size={16} color={color} />;
      case 'low': return <Shield size={16} color={color} />;
      default: return <Info size={16} color={color} />;
    }
  };

  const filteredEntries = getFilteredEntries();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Book size={24} color="#16a34a" />
        <Text style={styles.headerTitle}>Knowledge Base</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color="#6b7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search diseases and pests..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9ca3af"
          />
        </View>
      </View>

      {/* Category Filter */}
      <View style={styles.categoryContainer}>
        {categories.map((category) => {
          const IconComponent = category.icon;
          return (
            <TouchableOpacity
              key={category.key}
              style={[
                styles.categoryButton,
                selectedCategory === category.key && styles.categoryButtonActive
              ]}
              onPress={() => setSelectedCategory(category.key)}
            >
              <IconComponent 
                size={18} 
                color={selectedCategory === category.key ? '#ffffff' : '#6b7280'} 
              />
              <Text style={[
                styles.categoryText,
                selectedCategory === category.key && styles.categoryTextActive
              ]}>
                {category.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
        {filteredEntries.length === 0 ? (
          <View style={styles.emptyState}>
            <Search size={48} color="#9ca3af" />
            <Text style={styles.emptyTitle}>No results found</Text>
            <Text style={styles.emptyText}>
              Try adjusting your search terms or category filter
            </Text>
          </View>
        ) : (
          filteredEntries.map(([key, entry]: [string, any], index) => (
            <View key={key} style={styles.knowledgeCard}>
              <TouchableOpacity
                style={styles.cardHeader}
                onPress={() => setExpandedItem(expandedItem === key ? null : key)}
              >
                <View style={styles.cardTitleContainer}>
                  <Text style={styles.cardTitle}>{key.replace(/_/g, ' ')}</Text>
                  <Text style={styles.cardScientific}>{entry.scientific_name}</Text>
                </View>
                <View style={styles.severityContainer}>
                  {getSeverityIcon(entry.severity)}
                  <Text style={[styles.severityText, { color: getSeverityColor(entry.severity) }]}>
                    {entry.severity}
                  </Text>
                </View>
              </TouchableOpacity>

              {expandedItem === key && (
                <View style={styles.expandedContent}>
                  <Text style={styles.description}>{entry.description}</Text>

                  {entry.symptoms && entry.symptoms.length > 0 && (
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Symptoms</Text>
                      {entry.symptoms.map((symptom: string, idx: number) => (
                        <Text key={idx} style={styles.symptomText}>• {symptom}</Text>
                      ))}
                    </View>
                  )}

                  {entry.treatments?.organic && entry.treatments.organic.length > 0 && (
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Organic Treatments</Text>
                      {entry.treatments.organic.map((treatment: any, idx: number) => (
                        <View key={idx} style={styles.treatmentCard}>
                          <Text style={styles.treatmentName}>{treatment.name}</Text>
                          <Text style={styles.treatmentDetail}>Dosage: {treatment.dosage}</Text>
                          <Text style={styles.treatmentDetail}>Frequency: {treatment.frequency}</Text>
                          <Text style={styles.treatmentSafety}>Safety: {treatment.safety}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {entry.treatments?.chemical && entry.treatments.chemical.length > 0 && (
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Chemical Treatments</Text>
                      {entry.treatments.chemical.map((treatment: any, idx: number) => (
                        <View key={idx} style={styles.treatmentCard}>
                          <Text style={styles.treatmentName}>{treatment.name}</Text>
                          <Text style={styles.treatmentDetail}>Dosage: {treatment.dosage}</Text>
                          <Text style={styles.treatmentDetail}>Frequency: {treatment.frequency}</Text>
                          <Text style={styles.treatmentSafety}>Safety: {treatment.safety}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {entry.treatments?.preventive && entry.treatments.preventive.length > 0 && (
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Prevention</Text>
                      {entry.treatments.preventive.map((preventive: string, idx: number) => (
                        <Text key={idx} style={styles.preventiveText}>• {preventive}</Text>
                      ))}
                    </View>
                  )}
                </View>
              )}
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
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
    marginLeft: 12,
  },
  categoryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: '#f3f4f6',
  },
  categoryButtonActive: {
    backgroundColor: '#16a34a',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4b5563',
    marginLeft: 6,
  },
  categoryTextActive: {
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
  knowledgeCard: {
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  cardTitleContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    textTransform: 'capitalize',
  },
  cardScientific: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
    marginTop: 2,
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
  expandedContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  description: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
    marginBottom: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
  },
  symptomText: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
    marginBottom: 4,
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
  preventiveText: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
    marginBottom: 4,
  },
});
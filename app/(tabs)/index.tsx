import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera, TrendingUp, TriangleAlert as AlertTriangle, Leaf, Sun } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { DetectionService } from '@/services/DetectionService';
import { useFocusEffect } from '@react-navigation/native';

export default function HomeTab() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalScans: 0,
    healthyPlants: 0,
    issuesFound: 0,
    successfulTreatments: 0,
    recentScans: []
  });
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [])
  );

  const loadStats = async () => {
    try {
      setIsLoading(true);
      const appStats = await DetectionService.getAppStats();
      setStats(appStats);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setIsLoading(false);
    }
  };
  const handleDetectionPress = () => {
    router.push('/camera');
  };

  const quickStats = [
    { title: 'Total Scans', value: stats.totalScans.toString(), color: '#16a34a', icon: Camera },
    { title: 'Healthy Plants', value: stats.healthyPlants.toString(), color: '#10b981', icon: Leaf },
    { title: 'Issues Found', value: stats.issuesFound.toString(), color: '#ea580c', icon: AlertTriangle },
    { title: 'Treatments', value: stats.successfulTreatments.toString(), color: '#3b82f6', icon: TrendingUp },
  ];

  const getRecentActivity = () => {
    if (stats.recentScans.length === 0) {
      return {
        title: 'Welcome to Plant Detective',
        description: 'Start scanning your plants to detect diseases and pests early.',
        time: 'Get started',
        icon: Leaf,
        color: '#16a34a'
      };
    }

    const recent = stats.recentScans[0];
    const timeAgo = Math.floor((Date.now() - recent.timestamp) / (1000 * 60));
    
    return {
      title: `${recent.result.name.charAt(0).toUpperCase() + recent.result.name.slice(1)} Detected`,
      description: `Found ${recent.result.name} on ${recent.crop}. ${recent.result.severity} severity level.`,
      time: timeAgo < 60 ? `${timeAgo} minutes ago` : `${Math.floor(timeAgo / 60)} hours ago`,
      icon: recent.type === 'disease' ? AlertTriangle : Camera,
      color: recent.result.severity.toLowerCase() === 'high' ? '#ea580c' : '#16a34a'
    };
  };

  const recentActivity = getRecentActivity();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient
          colors={['#16a34a', '#22c55e']}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.greeting}>Good Morning</Text>
              <Text style={styles.farmerName}>Farmer John</Text>
            </View>
            <View style={styles.weatherContainer}>
              <Sun size={24} color="#f59e0b" />
              <Text style={styles.temperature}>24°C</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Image
            source={{ uri: 'https://images.pexels.com/photos/1459339/pexels-photo-1459339.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1' }}
            style={styles.heroImage}
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']}
            style={styles.heroOverlay}
          >
            <Text style={styles.heroTitle}>Plant Health Detection</Text>
            <Text style={styles.heroSubtitle}>Scan your plants for diseases and pests</Text>
            <TouchableOpacity style={styles.scanButton} onPress={handleDetectionPress}>
              <Camera size={20} color="#ffffff" />
              <Text style={styles.scanButtonText}>Start Scan</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Farm Overview</Text>
          {isLoading && (
            <Text style={styles.loadingText}>Loading stats...</Text>
          )}
          <View style={styles.statsGrid}>
            {quickStats.map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <LinearGradient
                  key={index}
                  colors={['#ffffff', '#f8fafc']}
                  style={styles.statCard}
                >
                  <LinearGradient
                    colors={[`${stat.color}20`, `${stat.color}10`]}
                    style={styles.statIcon}
                  >
                    <IconComponent size={22} color={stat.color} />
                  </LinearGradient>
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statTitle}>{stat.title}</Text>
                </LinearGradient>
              );
            })}
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.activitySection}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <LinearGradient
            colors={['#ffffff', '#f8fafc']}
            style={styles.activityCard}
          >
            <View style={styles.activityHeader}>
              <LinearGradient
                colors={[`${recentActivity.color}20`, `${recentActivity.color}10`]}
                style={styles.activityIcon}
              >
                <recentActivity.icon size={18} color={recentActivity.color} />
              </LinearGradient>
              <View style={styles.activityInfo}>
                <Text style={styles.activityTitle}>{recentActivity.title}</Text>
                <Text style={styles.activityTime}>{recentActivity.time}</Text>
              </View>
            </View>
            <Text style={styles.activityDescription}>
              {recentActivity.description}
            </Text>
          </LinearGradient>
        </View>

        {/* Tips Section */}
        <View style={styles.tipsSection}>
          <Text style={styles.sectionTitle}>Today's Farming Tip</Text>
          <LinearGradient
            colors={['#f0fdf4', '#dcfce7']}
            style={styles.tipCard}
          >
            <LinearGradient
              colors={['#16a34a20', '#16a34a10']}
              style={styles.tipIcon}
            >
              <Leaf size={20} color="#16a34a" />
            </LinearGradient>
            <Text style={styles.tipText}>
              Monitor your plants daily for early signs of disease. Early detection can prevent widespread crop damage and improve treatment success rates.
            </Text>
          </LinearGradient>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    paddingTop: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  farmerName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 4,
  },
  weatherContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    backdropFilter: 'blur(10px)',
  },
  temperature: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  heroSection: {
    margin: 20,
    borderRadius: 20,
    overflow: 'hidden',
    height: 220,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  heroImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  heroOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#e5e7eb',
    textAlign: 'center',
    marginBottom: 24,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16a34a',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 30,
    elevation: 4,
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  scanButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  statsSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
  },
  activitySection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  activityCard: {
    padding: 20,
    borderRadius: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
  },
  activityTime: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  activityDescription: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
  },
  tipsSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 20,
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#16a34a',
    elevation: 2,
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tipIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#15803d',
    lineHeight: 22,
    fontWeight: '500',
  },
});

                  </View>
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statTitle}>{stat.title}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.activitySection}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityCard}>
            <View style={styles.activityHeader}>
              <View style={styles.activityIcon}>
                <AlertTriangle size={16} color="#ea580c" />
              </View>
              <View style={styles.activityInfo}>
                <Text style={styles.activityTitle}>Tomato Blight Detected</Text>
                <Text style={styles.activityTime}>2 hours ago</Text>
              </View>
            </View>
            <Text style={styles.activityDescription}>
              Found early blight symptoms on tomato leaves. Treatment recommendations available.
            </Text>
          </View>
        </View>

        {/* Tips Section */}
        <View style={styles.tipsSection}>
          <Text style={styles.sectionTitle}>Today's Farming Tip</Text>
          <View style={styles.tipCard}>
            <Leaf size={20} color="#16a34a" />
            <Text style={styles.tipText}>
              Monitor your plants daily for early signs of disease. Early detection can prevent widespread crop damage.
            </Text>
          </View>
        </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  greeting: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  farmerName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginTop: 2,
  },
  weatherContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  temperature: {
    marginLeft: 6,
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  heroSection: {
    margin: 20,
    borderRadius: 16,
    overflow: 'hidden',
    height: 200,
  },
  heroImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  heroOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#e5e7eb',
    textAlign: 'center',
    marginBottom: 20,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16a34a',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  scanButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  statsSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  activitySection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  activityCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  activityIcon: {
    width: 32,
    height: 32,
    backgroundColor: '#fef3f2',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  activityTime: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  activityDescription: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
  },
  tipsSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f0fdf4',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#16a34a',
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#15803d',
    lineHeight: 20,
    marginLeft: 12,
  },
});
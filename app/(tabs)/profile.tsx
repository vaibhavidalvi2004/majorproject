import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, Bell, Shield, CircleHelp as HelpCircle, Settings, ChevronRight, Mail, Phone, MapPin, Award, LogOut } from 'lucide-react-native';

export default function ProfileTab() {
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [autoDetectionEnabled, setAutoDetectionEnabled] = React.useState(false);

  const profileStats = [
    { label: 'Plants Scanned', value: '127', icon: Award, color: '#16a34a' },
    { label: 'Issues Detected', value: '23', icon: Shield, color: '#ea580c' },
    { label: 'Successful Treatments', value: '19', icon: Award, color: '#10b981' },
  ];

  const menuItems = [
    {
      section: 'Account',
      items: [
        { title: 'Edit Profile', icon: User, onPress: () => {} },
        { title: 'Contact Information', icon: Mail, onPress: () => {} },
        { title: 'Farm Location', icon: MapPin, onPress: () => {} },
      ]
    },
    {
      section: 'Settings',
      items: [
        { 
          title: 'Push Notifications', 
          icon: Bell, 
          rightComponent: (
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#d1d5db', true: '#16a34a' }}
              thumbColor={notificationsEnabled ? '#ffffff' : '#f4f3f4'}
            />
          )
        },
        { 
          title: 'Auto Detection', 
          icon: Settings, 
          rightComponent: (
            <Switch
              value={autoDetectionEnabled}
              onValueChange={setAutoDetectionEnabled}
              trackColor={{ false: '#d1d5db', true: '#16a34a' }}
              thumbColor={autoDetectionEnabled ? '#ffffff' : '#f4f3f4'}
            />
          )
        },
      ]
    },
    {
      section: 'Support',
      items: [
        { title: 'Help Center', icon: HelpCircle, onPress: () => {} },
        { title: 'Privacy Policy', icon: Shield, onPress: () => {} },
        { title: 'Terms of Service', icon: Settings, onPress: () => {} },
      ]
    }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>FJ</Text>
          </View>
          <Text style={styles.profileName}>Farmer John</Text>
          <Text style={styles.profileEmail}>john.farmer@email.com</Text>
          <Text style={styles.profileLocation}>📍 Green Valley Farm, CA</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          {profileStats.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <View key={index} style={styles.statItem}>
                <View style={[styles.statIconContainer, { backgroundColor: `${stat.color}20` }]}>
                  <IconComponent size={20} color={stat.color} />
                </View>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            );
          })}
        </View>

        {/* Menu Sections */}
        {menuItems.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.menuSection}>
            <Text style={styles.sectionTitle}>{section.section}</Text>
            <View style={styles.menuContainer}>
              {section.items.map((item, itemIndex) => {
                const IconComponent = item.icon;
                return (
                  <TouchableOpacity
                    key={itemIndex}
                    style={[
                      styles.menuItem,
                      itemIndex === section.items.length - 1 && styles.menuItemLast
                    ]}
                    onPress={item.onPress}
                  >
                    <View style={styles.menuItemLeft}>
                      <View style={styles.menuIconContainer}>
                        <IconComponent size={20} color="#6b7280" />
                      </View>
                      <Text style={styles.menuItemText}>{item.title}</Text>
                    </View>
                    <View style={styles.menuItemRight}>
                      {item.rightComponent || <ChevronRight size={16} color="#9ca3af" />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}

        {/* Logout Button */}
        <View style={styles.logoutSection}>
          <TouchableOpacity style={styles.logoutButton}>
            <LogOut size={20} color="#dc2626" />
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        {/* App Version */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Plant Detective v1.0.0</Text>
          <Text style={styles.versionSubtext}>Built for farmers, by farmers</Text>
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
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#16a34a',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 4,
  },
  profileLocation: {
    fontSize: 14,
    color: '#9ca3af',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    fontWeight: '500',
  },
  menuSection: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 12,
  },
  menuContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuItemText: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
  },
  menuItemRight: {
    marginLeft: 12,
  },
  logoutSection: {
    paddingHorizontal: 20,
    marginTop: 32,
    marginBottom: 24,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#dc2626',
    marginLeft: 8,
  },
  versionContainer: {
    alignItems: 'center',
    paddingBottom: 32,
  },
  versionText: {
    fontSize: 14,
    color: '#9ca3af',
    fontWeight: '500',
  },
  versionSubtext: {
    fontSize: 12,
    color: '#d1d5db',
    marginTop: 4,
  },
});
import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { StorageService } from '@/services/StorageService';
import OnboardingScreen from '@/components/OnboardingScreen';

export default function RootLayout() {
  const [isOnboardingCompleted, setIsOnboardingCompleted] = useState<boolean | null>(null);
  useFrameworkReady();

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const completed = await StorageService.isOnboardingCompleted();
      setIsOnboardingCompleted(completed);
      
      if (!completed) {
        // Simulate loading time for onboarding
        setTimeout(async () => {
          await StorageService.setOnboardingCompleted();
          setIsOnboardingCompleted(true);
        }, 3000);
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      setIsOnboardingCompleted(true);
    }
  };

  if (isOnboardingCompleted === null || !isOnboardingCompleted) {
    return <OnboardingScreen />;
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}

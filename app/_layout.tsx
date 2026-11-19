import { BarlowCondensed_600SemiBold, BarlowCondensed_700Bold } from '@expo-google-fonts/barlow-condensed';
import { BodoniModa_700Bold_Italic, BodoniModa_900Black } from '@expo-google-fonts/bodoni-moda';
import { DMSans_400Regular, DMSans_500Medium, DMSans_600SemiBold } from '@expo-google-fonts/dm-sans';
import { Spectral_700Bold, Spectral_800ExtraBold } from '@expo-google-fonts/spectral';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DialogHost } from '@/ui/confirm';
import { colors } from '@/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // Keys must match src/theme/typography.ts `fonts`.
  const [loaded, error] = useFonts({
    Spectral_700Bold,
    Spectral_800ExtraBold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    BarlowCondensed_600SemiBold,
    BarlowCondensed_700Bold,
    BodoniModa_900Black,
    BodoniModa_700Bold_Italic,
  });

  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync();
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade', // hi-fi flow: dissolve / cross-fade between screens
          contentStyle: { backgroundColor: colors.bg.base },
        }}
      />
      <DialogHost />
    </SafeAreaProvider>
  );
}

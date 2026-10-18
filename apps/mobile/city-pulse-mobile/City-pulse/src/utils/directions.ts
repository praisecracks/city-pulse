import { Linking, Platform, Alert } from 'react-native';

type DirectionsOptions = {
  latitude: number;
  longitude: number;
  label?: string;
  travelMode?: 'driving' | 'walking' | 'bicycling' | 'transit';
};

const ANDROID_SCHEME = 'google.navigation:';
const IOS_SCHEME = 'comgooglemaps://';
const WEB_URL = 'https://www.google.com/maps/dir/?api=1';

export async function openDirections(options: DirectionsOptions): Promise<void> {
  const { latitude, longitude, label = 'Destination', travelMode = 'walking' } = options;
  const destination = `${latitude},${longitude}`;

  if (Platform.OS === 'android') {
    const url = `${ANDROID_SCHEME}?q=${destination}&mode=${travelMode}&baselng=0`;
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
      return;
    }
  }

  if (Platform.OS === 'ios') {
    const url = `${IOS_SCHEME}?daddr=${destination}&directionsmode=${travelMode}`;
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
      return;
    }
  }

  const webUrl = `${WEB_URL}&destination=${encodeURIComponent(destination)}&travelmode=${travelMode}`;
  const canOpenWeb = await Linking.canOpenURL(webUrl);
  if (canOpenWeb) {
    await Linking.openURL(webUrl);
  } else {
    Alert.alert(
      'Unable to open directions',
      'No maps application is available on this device.',
    );
  }
}

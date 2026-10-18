export default {
  expo: {
    name: "City Pulse",
    slug: "city-pulse",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/logo-transparent.png",
    scheme: "citypulse",
    userInterfaceStyle: "automatic",

    splash: {
      image: "./assets/logo-mark.png",
      imageWidth: 200,
      backgroundColor: "#129E9E",
      resizeMode: "contain"
    },

    ios: {
      icon: "./assets/expo.icon",
      bundleIdentifier: "com.citypulse.app",
      infoPlist: {
        NSLocationWhenInUseUsageDescription:
          "Allow City Pulse to use your location for live navigation and to find nearby services.",
        NSLocationAlwaysAndWhenInUseUsageDescription:
          "Allow City Pulse to track your movement and guide you safely to your destination."
      }
    },

    android: {
      package: "com.citypulse.app",
      adaptiveIcon: {
        backgroundColor: "#129E9E",
        foregroundImage: "./assets/logo-transparent.png"
      },
      splash: {
        image: "./assets/logo-mark.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#129E9E"
      },
      predictiveBackGestureEnabled: false,
      permissions: [
        "android.permission.ACCESS_COARSE_LOCATION",
        "android.permission.ACCESS_FINE_LOCATION"
      ]
    },

    web: {
      output: "static",
      favicon: "./assets/logo-transparent.png"
    },

    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/logo-mark.png",
          imageWidth: 200,
          backgroundColor: "#129E9E",
          resizeMode: "contain"
        }
      ],
      [
        "expo-location",
        {
          locationWhenInUsePermission:
            "Allow City Pulse to use your location for live navigation and to find nearby services.",
          locationAlwaysAndWhenInUsePermission:
            "Allow City Pulse to track your movement to your destination."
        }
      ],
      "expo-video",
      [
        "expo-image-picker",
        {
          photosPermission: "Allow City Pulse to access your photos so you can set a profile picture",
          cameraPermission: "Allow City Pulse to use your camera so you can take a profile photo",
          microphonePermission: false
        }
      ],
      [
        "react-native-maps",
        {
          androidGoogleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID,
          iosGoogleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS
        }
      ]
    ],

    experiments: {
      typedRoutes: true,
      reactCompiler: true
    },

    extra: {
      googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
      googleMapsApiKeyAndroid: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID,
      googleMapsApiKeyIos: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS,
      router: {},
      eas: {
        projectId: "a17421c5-bdf4-4286-b487-1ec88c27fb0c"
      }
    },

    owner: "praisecrackdev"
  }
};

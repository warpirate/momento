import { ImageSourcePropType } from 'react-native';

// Logo assets for Momento app
// Wired to actual filenames in this folder

export const logos: { [key: string]: ImageSourcePropType } = {
  // Main app logo (used in auth screen, etc.)
  appLogo: require('./512x512.png'),

  // Smaller versions for different contexts
  appLogoSmall: require('./128x128.png'),
  appLogoTiny: require('./64x64.png'),

  // App store icon / high-res
  appIcon: require('./1024x1024.png'),
};

// Logo sizes for different use cases inside the app UI
export const logoSizes = {
  tiny: 24,
  small: 32,
  medium: 48,
  large: 64,
  xlarge: 96,
  xxlarge: 128,
};

/**
 * @format
 */

// Import polyfills
import 'react-native-url-polyfill/auto';
import 'text-encoding-polyfill';

import { AppRegistry, LogBox } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import App from './App';
import { name as appName } from './app.json';

// Ignore specific warnings
LogBox.ignoreLogs([
  'Setting a timer',
  'AsyncStorage has been extracted',
]);

// Ensure Feather icon font is loaded
Icon.loadFont();

// Register the main app component
AppRegistry.registerComponent(appName, () => App);

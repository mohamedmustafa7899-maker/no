import React from 'react';
import { createRoot } from 'react-dom/client';
import { AppRegistry } from 'react-native';
import App from './App';

AppRegistry.registerComponent('basaffar', () => App);
AppRegistry.runApplication('basaffar', {
  rootTag: document.getElementById('root'),
});

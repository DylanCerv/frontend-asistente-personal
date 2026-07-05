import { registerWidgetTaskHandler } from 'react-native-android-widget';

import { widgetTaskHandler } from './src/services/widgets/widget-task-handler';

registerWidgetTaskHandler(widgetTaskHandler);

import 'expo-router/entry';

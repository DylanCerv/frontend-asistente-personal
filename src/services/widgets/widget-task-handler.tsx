import React from 'react';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';

import { KivoTodayWidgetView } from './kivo-today-widget-view';
import { readWidgetPayload } from './widget-storage';
import { WIDGET_NAME } from './widget-types';

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  if (props.widgetInfo.widgetName !== WIDGET_NAME) return;

  switch (props.widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED': {
      const payload = await readWidgetPayload();
      props.renderWidget(<KivoTodayWidgetView payload={payload} />);
      break;
    }
    case 'WIDGET_DELETED':
      break;
    default:
      break;
  }
}

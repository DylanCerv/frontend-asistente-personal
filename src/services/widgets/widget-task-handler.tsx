import React from 'react';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';

import { KivoCaptureWidgetView } from './kivo-capture-widget-view';
import { KivoFocusPointsWidgetView } from './kivo-focus-points-widget-view';
import { KivoPriorityWidgetView } from './kivo-priority-widget-view';
import { KivoTodayWidgetView } from './kivo-today-widget-view';
import {
  buildCaptureWidgetPayload,
  buildDisabledHomeWidgetsPayload,
} from './widget-payload';
import { readHomeWidgetPayload } from './widget-storage';
import {
  WIDGET_NAME_CAPTURE,
  WIDGET_NAME_FOCUS_POINTS,
  WIDGET_NAME_PRIORITY,
  WIDGET_NAME_TODAY,
} from './widget-types';

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  const { widgetName } = props.widgetInfo;

  if (
    widgetName !== WIDGET_NAME_TODAY &&
    widgetName !== WIDGET_NAME_PRIORITY &&
    widgetName !== WIDGET_NAME_CAPTURE &&
    widgetName !== WIDGET_NAME_FOCUS_POINTS
  ) {
    return;
  }

  switch (props.widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED': {
      const payload = (await readHomeWidgetPayload()) ?? buildDisabledHomeWidgetsPayload();

      switch (widgetName) {
        case WIDGET_NAME_PRIORITY:
          props.renderWidget(
            <KivoPriorityWidgetView payload={payload.priority} enabled={payload.enabled} />,
          );
          break;
        case WIDGET_NAME_CAPTURE:
          props.renderWidget(
            <KivoCaptureWidgetView payload={payload.capture ?? buildCaptureWidgetPayload()} />,
          );
          break;
        case WIDGET_NAME_FOCUS_POINTS:
          props.renderWidget(
            <KivoFocusPointsWidgetView
              payload={payload.focusPoints}
              enabled={payload.enabled}
            />,
          );
          break;
        case WIDGET_NAME_TODAY:
        default:
          props.renderWidget(<KivoTodayWidgetView payload={payload.today} />);
          break;
      }
      break;
    }
    case 'WIDGET_DELETED':
      break;
    default:
      break;
  }
}

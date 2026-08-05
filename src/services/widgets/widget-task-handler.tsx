import React from 'react';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';

import { KivoCaptureWidgetView } from './kivo-capture-widget-view';
import { KivoPriorityWidgetView } from './kivo-priority-widget-view';
import { KivoTodayWidgetView } from './kivo-today-widget-view';
import {
  buildCaptureWidgetPayload,
  buildNeedsSyncHomeWidgetsPayload,
} from './widget-payload';
import { readHomeWidgetPayload } from './widget-storage';
import {
  WIDGET_NAME_CAPTURE,
  WIDGET_NAME_PRIORITY,
  WIDGET_NAME_TODAY,
} from './widget-types';

function renderWidgetFromPayload(
  props: WidgetTaskHandlerProps,
  widgetName: string,
  payload: ReturnType<typeof buildNeedsSyncHomeWidgetsPayload>,
) {
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
    case WIDGET_NAME_TODAY:
    default:
      props.renderWidget(<KivoTodayWidgetView payload={payload.today} />);
      break;
  }
}

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  const { widgetName } = props.widgetInfo;

  if (
    widgetName !== WIDGET_NAME_TODAY &&
    widgetName !== WIDGET_NAME_PRIORITY &&
    widgetName !== WIDGET_NAME_CAPTURE
  ) {
    return;
  }

  switch (props.widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED': {
      try {
        const stored = await readHomeWidgetPayload();
        const payload = stored ?? buildNeedsSyncHomeWidgetsPayload();
        renderWidgetFromPayload(props, widgetName, payload);
      } catch {
        renderWidgetFromPayload(props, widgetName, buildNeedsSyncHomeWidgetsPayload());
      }
      break;
    }
    case 'WIDGET_DELETED':
      break;
    default:
      break;
  }
}

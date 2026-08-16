import React from 'react';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';

import { KivoCaptureWidgetView } from './kivo-capture-widget-view';
import { KivoPriorityWidgetView } from './kivo-priority-widget-view';
import { KivoTodayWidgetView } from './kivo-today-widget-view';
import {
  buildCaptureWidgetPayload,
  buildNeedsSyncHomeWidgetsPayload,
} from './widget-payload';
import {
  clampPriorityPageIndex,
  nextPriorityPageIndex,
  prevPriorityPageIndex,
  PRIORITY_CLICK_NEXT,
  PRIORITY_CLICK_PREV,
  readPriorityPageIndex,
  writePriorityPageIndex,
} from './widget-priority-page';
import { readHomeWidgetPayload } from './widget-storage';
import {
  WIDGET_NAME_CAPTURE,
  WIDGET_NAME_PRIORITY,
  WIDGET_NAME_TODAY,
  type WidgetHomePayload,
} from './widget-types';

function priorityItemCount(payload: WidgetHomePayload): number {
  const items = payload.priority.items;
  if (items && items.length > 0) return items.length;
  if (
    payload.priority.title &&
    payload.priority.title !== 'Nada urgente' &&
    payload.priority.title !== 'Tu prioridad'
  ) {
    return 1;
  }
  return 0;
}

async function renderPriorityWidget(
  props: Pick<WidgetTaskHandlerProps, 'renderWidget' | 'widgetInfo'>,
  payload: WidgetHomePayload,
) {
  const pageIndex = await readPriorityPageIndex(props.widgetInfo.widgetId);
  const count = priorityItemCount(payload);
  const safeIndex = clampPriorityPageIndex(pageIndex, count);

  props.renderWidget(
    <KivoPriorityWidgetView
      payload={payload.priority}
      enabled={payload.enabled}
      height={props.widgetInfo.height}
      pageIndex={safeIndex}
    />,
  );
}

async function renderWidgetFromPayload(
  props: WidgetTaskHandlerProps,
  widgetName: string,
  payload: WidgetHomePayload,
) {
  switch (widgetName) {
    case WIDGET_NAME_PRIORITY:
      await renderPriorityWidget(props, payload);
      return;
    case WIDGET_NAME_CAPTURE:
      props.renderWidget(
        <KivoCaptureWidgetView
          payload={payload.capture ?? buildCaptureWidgetPayload()}
          height={props.widgetInfo.height}
          width={props.widgetInfo.width}
        />,
      );
      return;
    case WIDGET_NAME_TODAY:
    default:
      props.renderWidget(<KivoTodayWidgetView payload={payload.today} />);
  }
}

async function loadPayload(): Promise<WidgetHomePayload> {
  try {
    const stored = await readHomeWidgetPayload();
    return stored ?? buildNeedsSyncHomeWidgetsPayload();
  } catch {
    return buildNeedsSyncHomeWidgetsPayload();
  }
}

async function handlePriorityPageClick(
  props: WidgetTaskHandlerProps,
  direction: 'prev' | 'next',
) {
  const payload = await loadPayload();
  const count = priorityItemCount(payload);
  if (count <= 1) {
    await renderPriorityWidget(props, payload);
    return;
  }

  const current = await readPriorityPageIndex(props.widgetInfo.widgetId);
  const next =
    direction === 'next'
      ? nextPriorityPageIndex(current, count)
      : prevPriorityPageIndex(current, count);

  await writePriorityPageIndex(props.widgetInfo.widgetId, next);
  await renderPriorityWidget(
    { renderWidget: props.renderWidget, widgetInfo: props.widgetInfo },
    payload,
  );
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
      const payload = await loadPayload();
      await renderWidgetFromPayload(props, widgetName, payload);
      break;
    }
    case 'WIDGET_CLICK': {
      if (widgetName !== WIDGET_NAME_PRIORITY) break;
      if (props.clickAction === PRIORITY_CLICK_PREV) {
        await handlePriorityPageClick(props, 'prev');
      } else if (props.clickAction === PRIORITY_CLICK_NEXT) {
        await handlePriorityPageClick(props, 'next');
      }
      break;
    }
    case 'WIDGET_DELETED':
      break;
    default:
      break;
  }
}

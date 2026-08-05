'use no memo';

import React from 'react';
import { FlexWidget, ListWidget, TextWidget } from 'react-native-android-widget';

import {
  WIDGET_ACCENT,
  WIDGET_CALENDAR,
  WIDGET_SURFACE,
  WIDGET_TEXT,
  WIDGET_TEXT_MUTED,
} from './widget-theme';
import type { WidgetTodayPayload } from './widget-types';
import { WIDGET_DEEP_LINK_AGENDA } from './widget-types';

type KivoTodayWidgetViewProps = {
  payload: WidgetTodayPayload | null;
};

function fallbackPayload(): WidgetTodayPayload {
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    dateLabel: '',
    headline: 'Kivo',
    items: [],
    overflowCount: 0,
    emptyMessage: 'Abre Kivo para sincronizar',
    enabled: false,
    deepLink: WIDGET_DEEP_LINK_AGENDA,
  };
}

function formatItemLine(item: WidgetTodayPayload['items'][number]): string {
  const prefix = item.time ? `${item.time} · ` : '';
  return `${prefix}${item.title}`;
}

function itemColor(item: WidgetTodayPayload['items'][number]): string {
  if (item.source === 'device') return WIDGET_CALENDAR;
  if (item.priority === 'high') return WIDGET_ACCENT;
  return WIDGET_TEXT;
}

export function KivoTodayWidgetView({ payload }: KivoTodayWidgetViewProps) {
  const data = payload ?? fallbackPayload();

  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: WIDGET_SURFACE,
        borderRadius: 28,
        padding: 16,
        flexDirection: 'column',
      }}
      clickAction="OPEN_URI"
      clickActionData={{ uri: data.deepLink }}>
      <TextWidget
        text="Kivo"
        style={{ fontSize: 12, fontWeight: '600', color: WIDGET_ACCENT }}
      />
      {data.dateLabel ? (
        <TextWidget
          text={data.dateLabel}
          style={{ fontSize: 11, color: WIDGET_TEXT_MUTED, marginTop: 2 }}
          maxLines={1}
        />
      ) : null}
      <TextWidget
        text={data.headline}
        style={{ fontSize: 16, fontWeight: '700', color: WIDGET_TEXT, marginTop: 8 }}
        maxLines={2}
      />

      {data.items.length === 0 ? (
        <TextWidget
          text={data.emptyMessage ?? ''}
          style={{ fontSize: 13, color: WIDGET_TEXT_MUTED, marginTop: 10 }}
          maxLines={3}
        />
      ) : (
        <ListWidget
          style={{
            width: 'match_parent',
            height: 'match_parent',
            marginTop: 6,
          }}>
          {data.items.map((item) => (
            <FlexWidget
              key={item.id}
              style={{
                width: 'match_parent',
                flexDirection: 'row',
                alignItems: 'center',
                paddingTop: 6,
                paddingBottom: 6,
              }}
              clickAction="OPEN_URI"
              clickActionData={{ uri: data.deepLink }}>
              <TextWidget
                text={formatItemLine(item)}
                style={{
                  fontSize: 13,
                  color: itemColor(item),
                  fontWeight: item.source === 'device' || item.priority === 'high' ? '600' : 'normal',
                }}
                maxLines={1}
                truncate="END"
              />
            </FlexWidget>
          ))}
          {data.overflowCount > 0 ? (
            <FlexWidget
              style={{ width: 'match_parent', paddingTop: 4, paddingBottom: 4 }}
              clickAction="OPEN_URI"
              clickActionData={{ uri: data.deepLink }}>
              <TextWidget
                text={`+${data.overflowCount} más · tocar para abrir`}
                style={{ fontSize: 12, color: WIDGET_TEXT_MUTED }}
                maxLines={1}
              />
            </FlexWidget>
          ) : null}
        </ListWidget>
      )}
    </FlexWidget>
  );
}

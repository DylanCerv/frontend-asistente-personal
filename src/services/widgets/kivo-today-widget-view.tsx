import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

import type { WidgetTodayPayload } from './widget-types';
import { WIDGET_DEEP_LINK } from './widget-types';

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
    deepLink: WIDGET_DEEP_LINK,
  };
}

function formatItemLine(item: WidgetTodayPayload['items'][number]): string {
  const prefix = item.time ? `${item.time} · ` : '';
  return `${prefix}${item.title}`;
}

export function KivoTodayWidgetView({ payload }: KivoTodayWidgetViewProps) {
  const data = payload ?? fallbackPayload();

  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 16,
        flexDirection: 'column',
      }}
      clickAction="OPEN_URI"
      clickActionData={{ uri: data.deepLink }}>
      <TextWidget text="Kivo" style={{ fontSize: 12, fontWeight: '600', color: '#7C3AED' }} />
      {data.dateLabel ? (
        <TextWidget
          text={data.dateLabel}
          style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}
          maxLines={1}
        />
      ) : null}
      <TextWidget
        text={data.headline}
        style={{ fontSize: 16, fontWeight: '700', color: '#0F172A', marginTop: 8 }}
        maxLines={2}
      />

      {data.items.length === 0 ? (
        <TextWidget
          text={data.emptyMessage ?? ''}
          style={{ fontSize: 13, color: '#64748B', marginTop: 10 }}
          maxLines={3}
        />
      ) : (
        data.items.map((item) => (
          <TextWidget
            key={item.id}
            text={formatItemLine(item)}
            style={{
              fontSize: 13,
              color: item.priority === 'high' ? '#7C3AED' : '#334155',
              fontWeight: item.priority === 'high' ? '600' : 'normal',
              marginTop: 8,
            }}
            maxLines={1}
            truncate="END"
          />
        ))
      )}

      {data.overflowCount > 0 ? (
        <TextWidget
          text={`+${data.overflowCount} más`}
          style={{ fontSize: 12, color: '#64748B', marginTop: 10 }}
          maxLines={1}
        />
      ) : null}
    </FlexWidget>
  );
}

'use no memo';

import React from 'react';
import { FlexWidget, ListWidget, OverlapWidget, SvgWidget, TextWidget } from 'react-native-android-widget';

import {
  WIDGET_ACCENT,
  WIDGET_SURFACE,
  WIDGET_TEXT,
  WIDGET_TEXT_MUTED,
  WIDGET_TRACK,
} from './widget-theme';
import type { WidgetPriorityItem, WidgetPriorityPayload } from './widget-types';
import { WIDGET_DEEP_LINK_FOCUS } from './widget-types';

type KivoPriorityWidgetViewProps = {
  payload: WidgetPriorityPayload;
  enabled?: boolean;
};

const RING_SIZE = 48;
const RING_RADIUS = 18;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function progressRingSvg(percent: number): string {
  const clamped = Math.max(0, Math.min(100, percent));
  const dash = (clamped / 100) * RING_CIRCUMFERENCE;
  const gap = RING_CIRCUMFERENCE - dash;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${RING_SIZE}" height="${RING_SIZE}" viewBox="0 0 ${RING_SIZE} ${RING_SIZE}">
  <circle cx="24" cy="24" r="${RING_RADIUS}" fill="none" stroke="${WIDGET_TRACK}" stroke-width="4"/>
  <circle cx="24" cy="24" r="${RING_RADIUS}" fill="none" stroke="${WIDGET_ACCENT}" stroke-width="4"
    stroke-linecap="round"
    stroke-dasharray="${dash.toFixed(2)} ${gap.toFixed(2)}"
    transform="rotate(-90 24 24)"/>
</svg>`;
}

const FALLBACK: WidgetPriorityPayload = {
  label: 'No olvides de',
  title: 'Kivo',
  dueLabel: 'Abre Kivo para sincronizar',
  items: [],
  progressPercent: 0,
  deepLink: WIDGET_DEEP_LINK_FOCUS,
};

function resolveItems(data: WidgetPriorityPayload): WidgetPriorityItem[] {
  if (data.items && data.items.length > 0) return data.items;
  if (data.title && data.title !== 'Nada urgente' && data.title !== 'Tu prioridad') {
    return [{ id: 'primary', title: data.title, dueLabel: data.dueLabel }];
  }
  return [];
}

export function KivoPriorityWidgetView({ payload, enabled = true }: KivoPriorityWidgetViewProps) {
  const data = payload ?? FALLBACK;
  const percent = Math.max(0, Math.min(100, data.progressPercent));
  const items = resolveItems(data);
  const emptyText = enabled
    ? (data.emptyMessage ?? data.dueLabel)
    : (data.emptyMessage ?? data.dueLabel);

  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: WIDGET_SURFACE,
        borderRadius: 22,
        paddingHorizontal: 12,
        paddingVertical: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
      clickAction="OPEN_URI"
      clickActionData={{ uri: data.deepLink }}>
      <FlexWidget
        style={{
          flex: 1,
          flexDirection: 'column',
          height: 'match_parent',
          justifyContent: 'center',
          paddingRight: 8,
        }}>
        <FlexWidget style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
          <FlexWidget
            style={{
              width: 7,
              height: 7,
              borderRadius: 4,
              backgroundColor: WIDGET_ACCENT,
              marginRight: 7,
            }}
          />
          <TextWidget
            text={data.label}
            style={{ fontSize: 11, fontWeight: '600', color: WIDGET_TEXT_MUTED }}
            maxLines={1}
          />
        </FlexWidget>

        {items.length === 0 ? (
          <TextWidget
            text={emptyText}
            style={{ fontSize: 14, fontWeight: '700', color: WIDGET_TEXT }}
            maxLines={2}
            truncate="END"
          />
        ) : (
          <ListWidget
            style={{
              width: 'match_parent',
              height: 'match_parent',
            }}>
            {items.map((item) => (
              <FlexWidget
                key={item.id}
                style={{
                  width: 'match_parent',
                  flexDirection: 'column',
                  paddingTop: 4,
                  paddingBottom: 6,
                }}
                clickAction="OPEN_URI"
                clickActionData={{ uri: data.deepLink }}>
                <TextWidget
                  text={item.title}
                  style={{ fontSize: 15, fontWeight: '700', color: WIDGET_TEXT }}
                  maxLines={1}
                  truncate="END"
                />
                <TextWidget
                  text={item.dueLabel}
                  style={{ fontSize: 11, color: WIDGET_TEXT_MUTED, marginTop: 2 }}
                  maxLines={1}
                  truncate="END"
                />
              </FlexWidget>
            ))}
          </ListWidget>
        )}
      </FlexWidget>

      <OverlapWidget
        style={{
          width: RING_SIZE,
          height: RING_SIZE,
        }}>
        <SvgWidget
          svg={progressRingSvg(percent)}
          style={{ width: RING_SIZE, height: RING_SIZE }}
        />
        <FlexWidget
          style={{
            width: RING_SIZE,
            height: RING_SIZE,
            justifyContent: 'center',
            alignItems: 'center',
          }}>
          <TextWidget
            text={`${percent}%`}
            style={{ fontSize: 11, fontWeight: '700', color: WIDGET_TEXT }}
          />
        </FlexWidget>
      </OverlapWidget>
    </FlexWidget>
  );
}

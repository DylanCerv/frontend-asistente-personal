import React from 'react';
import { FlexWidget, OverlapWidget, SvgWidget, TextWidget } from 'react-native-android-widget';

import {
  WIDGET_ACCENT,
  WIDGET_SURFACE,
  WIDGET_TEXT,
  WIDGET_TEXT_MUTED,
  WIDGET_TRACK,
} from './widget-theme';
import type { WidgetPriorityPayload } from './widget-types';
import { WIDGET_DEEP_LINK_FOCUS } from './widget-types';

type KivoPriorityWidgetViewProps = {
  payload: WidgetPriorityPayload;
  enabled?: boolean;
};

const RING_SIZE = 56;
const RING_RADIUS = 22;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function progressRingSvg(percent: number): string {
  const clamped = Math.max(0, Math.min(100, percent));
  const dash = (clamped / 100) * RING_CIRCUMFERENCE;
  const gap = RING_CIRCUMFERENCE - dash;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${RING_SIZE}" height="${RING_SIZE}" viewBox="0 0 ${RING_SIZE} ${RING_SIZE}">
  <circle cx="28" cy="28" r="${RING_RADIUS}" fill="none" stroke="${WIDGET_TRACK}" stroke-width="4"/>
  <circle cx="28" cy="28" r="${RING_RADIUS}" fill="none" stroke="${WIDGET_ACCENT}" stroke-width="4"
    stroke-linecap="round"
    stroke-dasharray="${dash.toFixed(2)} ${gap.toFixed(2)}"
    transform="rotate(-90 28 28)"/>
</svg>`;
}

const FALLBACK: WidgetPriorityPayload = {
  label: 'PRIORIDAD ACTUAL',
  title: 'Kivo',
  dueLabel: 'Abre Kivo para sincronizar',
  progressPercent: 0,
  deepLink: WIDGET_DEEP_LINK_FOCUS,
};

export function KivoPriorityWidgetView({ payload, enabled = true }: KivoPriorityWidgetViewProps) {
  const data = payload ?? FALLBACK;
  const percent = Math.max(0, Math.min(100, data.progressPercent));

  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: WIDGET_SURFACE,
        borderRadius: 28,
        padding: 16,
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
        <FlexWidget style={{ flexDirection: 'row', alignItems: 'center' }}>
          <FlexWidget
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: WIDGET_ACCENT,
              marginRight: 8,
            }}
          />
          <TextWidget
            text={data.label}
            style={{ fontSize: 10, fontWeight: '600', color: WIDGET_ACCENT }}
            maxLines={1}
          />
        </FlexWidget>

        <TextWidget
          text={data.title}
          style={{ fontSize: 18, fontWeight: '700', color: WIDGET_TEXT, marginTop: 10 }}
          maxLines={2}
          truncate="END"
        />

        <TextWidget
          text={enabled ? data.dueLabel : (data.emptyMessage ?? data.dueLabel)}
          style={{ fontSize: 12, color: WIDGET_TEXT_MUTED, marginTop: 8 }}
          maxLines={1}
          truncate="END"
        />
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
            style={{ fontSize: 12, fontWeight: '700', color: WIDGET_TEXT }}
          />
        </FlexWidget>
      </OverlapWidget>
    </FlexWidget>
  );
}

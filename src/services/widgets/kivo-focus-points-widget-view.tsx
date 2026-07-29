import React from 'react';
import { FlexWidget, SvgWidget, TextWidget } from 'react-native-android-widget';

import {
  WIDGET_SURFACE,
  WIDGET_TEAL,
  WIDGET_TEXT,
  WIDGET_TEXT_MUTED,
  WIDGET_TRACK,
} from './widget-theme';
import type { WidgetFocusPointsPayload } from './widget-types';
import { WIDGET_DEEP_LINK_REPORT } from './widget-types';

type KivoFocusPointsWidgetViewProps = {
  payload: WidgetFocusPointsPayload;
  enabled?: boolean;
};

const CHART_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none">
  <path d="M4 19h16" stroke="${WIDGET_TEAL}" stroke-width="2" stroke-linecap="round"/>
  <path d="M5 15l4-4 3 3 6-7" stroke="${WIDGET_TEAL}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const FALLBACK: WidgetFocusPointsPayload = {
  valueLabel: '—',
  label: 'Focus Points',
  deltaLabel: '—',
  deltaPositive: true,
  progressPercent: 0,
  deepLink: WIDGET_DEEP_LINK_REPORT,
};

export function KivoFocusPointsWidgetView({
  payload,
  enabled = true,
}: KivoFocusPointsWidgetViewProps) {
  const data = payload ?? FALLBACK;
  const percent = Math.max(0, Math.min(100, data.progressPercent));
  const filledFlex = Math.max(1, percent);
  const emptyFlex = Math.max(1, 100 - percent);
  const deltaColor = data.deltaPositive ? WIDGET_TEAL : '#F87171';

  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: WIDGET_SURFACE,
        borderRadius: 28,
        padding: 16,
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
      clickAction="OPEN_URI"
      clickActionData={{ uri: data.deepLink }}>
      <FlexWidget
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: 'match_parent',
        }}>
        <SvgWidget svg={CHART_SVG} style={{ width: 16, height: 16 }} />
        <TextWidget
          text={data.deltaLabel}
          style={{ fontSize: 12, fontWeight: '700', color: deltaColor }}
          maxLines={1}
        />
      </FlexWidget>

      <FlexWidget style={{ flexDirection: 'column', marginTop: 8 }}>
        <TextWidget
          text={enabled ? data.valueLabel : '—'}
          style={{ fontSize: 28, fontWeight: '700', color: WIDGET_TEXT }}
          maxLines={1}
        />
        <TextWidget
          text={data.label}
          style={{ fontSize: 13, color: WIDGET_TEXT, marginTop: 2 }}
          maxLines={1}
        />
        {!enabled && data.emptyMessage ? (
          <TextWidget
            text={data.emptyMessage}
            style={{ fontSize: 10, color: WIDGET_TEXT_MUTED, marginTop: 4 }}
            maxLines={2}
          />
        ) : null}
      </FlexWidget>

      <FlexWidget
        style={{
          width: 'match_parent',
          height: 6,
          borderRadius: 3,
          backgroundColor: WIDGET_TRACK,
          flexDirection: 'row',
          marginTop: 12,
          overflow: 'hidden',
        }}>
        <FlexWidget
          style={{
            flex: filledFlex,
            height: 6,
            backgroundColor: WIDGET_TEAL,
            borderRadius: 3,
          }}
        />
        <FlexWidget style={{ flex: emptyFlex, height: 6 }} />
      </FlexWidget>
    </FlexWidget>
  );
}

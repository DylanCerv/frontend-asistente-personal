'use no memo';

import React from 'react';
import { FlexWidget, SvgWidget, TextWidget } from 'react-native-android-widget';

import {
  WIDGET_ACCENT,
  WIDGET_ON_ACCENT,
  WIDGET_SURFACE,
  WIDGET_TEXT,
  WIDGET_TEXT_MUTED,
} from './widget-theme';
import type { WidgetCapturePayload } from './widget-types';
import { WIDGET_DEEP_LINK_CAPTURE } from './widget-types';

type KivoCaptureWidgetViewProps = {
  payload: WidgetCapturePayload;
  /** Widget size in dp — used to shrink chrome on 1×1 tiles. */
  height?: number;
  width?: number;
};

const FALLBACK: WidgetCapturePayload = {
  title: 'Captura rápida',
  subtitle: 'TOCA PARA GRABAR',
  deepLink: WIDGET_DEEP_LINK_CAPTURE,
};

function micSvg(size: number): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none">
  <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3Z" fill="${WIDGET_ON_ACCENT}"/>
  <path d="M19 11a1 1 0 1 0-2 0 5 5 0 0 1-10 0 1 1 0 1 0-2 0 7 7 0 0 0 6 6.93V20H8a1 1 0 1 0 0 2h8a1 1 0 1 0 0-2h-3v-2.07A7 7 0 0 0 19 11Z" fill="${WIDGET_ON_ACCENT}"/>
</svg>`;
}

export function KivoCaptureWidgetView({
  payload,
  height,
  width,
}: KivoCaptureWidgetViewProps) {
  const data = payload ?? FALLBACK;
  const shortSide =
    typeof height === 'number' && typeof width === 'number'
      ? Math.min(height, width)
      : typeof height === 'number'
        ? height
        : 140;
  const compact = shortSide > 0 && shortSide < 120;
  const micButton = compact ? 44 : 64;
  const micIcon = compact ? 22 : 28;
  const showLabels = shortSide >= 100;

  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: WIDGET_SURFACE,
        borderRadius: compact ? 22 : 28,
        padding: compact ? 10 : 16,
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      clickAction="OPEN_URI"
      clickActionData={{ uri: data.deepLink }}>
      <FlexWidget
        style={{
          width: micButton,
          height: micButton,
          borderRadius: micButton / 2,
          backgroundColor: WIDGET_ACCENT,
          justifyContent: 'center',
          alignItems: 'center',
        }}>
        <SvgWidget
          svg={micSvg(micIcon)}
          style={{ width: micIcon, height: micIcon }}
        />
      </FlexWidget>

      {showLabels ? (
        <TextWidget
          text={data.title}
          style={{
            fontSize: compact ? 12 : 15,
            fontWeight: '700',
            color: WIDGET_TEXT,
            marginTop: compact ? 8 : 12,
          }}
          maxLines={1}
        />
      ) : null}
      {showLabels ? (
        <TextWidget
          text={data.subtitle}
          style={{
            fontSize: compact ? 9 : 10,
            fontWeight: '600',
            color: WIDGET_TEXT_MUTED,
            marginTop: 3,
          }}
          maxLines={1}
        />
      ) : null}
    </FlexWidget>
  );
}

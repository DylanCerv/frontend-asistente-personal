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
};

const MIC_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none">
  <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3Z" fill="${WIDGET_ON_ACCENT}"/>
  <path d="M19 11a1 1 0 1 0-2 0 5 5 0 0 1-10 0 1 1 0 1 0-2 0 7 7 0 0 0 6 6.93V20H8a1 1 0 1 0 0 2h8a1 1 0 1 0 0-2h-3v-2.07A7 7 0 0 0 19 11Z" fill="${WIDGET_ON_ACCENT}"/>
</svg>`;

const FALLBACK: WidgetCapturePayload = {
  title: 'Quick Capture',
  subtitle: 'TAP TO RECORD',
  deepLink: WIDGET_DEEP_LINK_CAPTURE,
};

export function KivoCaptureWidgetView({ payload }: KivoCaptureWidgetViewProps) {
  const data = payload ?? FALLBACK;

  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: WIDGET_SURFACE,
        borderRadius: 28,
        padding: 16,
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      clickAction="OPEN_URI"
      clickActionData={{ uri: data.deepLink }}>
      <FlexWidget
        style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          backgroundColor: WIDGET_ACCENT,
          justifyContent: 'center',
          alignItems: 'center',
        }}>
        <SvgWidget svg={MIC_SVG} style={{ width: 28, height: 28 }} />
      </FlexWidget>

      <TextWidget
        text={data.title}
        style={{
          fontSize: 15,
          fontWeight: '700',
          color: WIDGET_TEXT,
          marginTop: 12,
        }}
        maxLines={1}
      />
      <TextWidget
        text={data.subtitle}
        style={{
          fontSize: 10,
          fontWeight: '600',
          color: WIDGET_TEXT_MUTED,
          marginTop: 4,
        }}
        maxLines={1}
      />
    </FlexWidget>
  );
}

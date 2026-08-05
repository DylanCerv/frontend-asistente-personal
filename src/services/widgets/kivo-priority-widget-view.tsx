'use no memo';

import React from 'react';
import { FlexWidget, ListWidget, OverlapWidget, SvgWidget, TextWidget } from 'react-native-android-widget';

import {
  PRIORITY_CLICK_NEXT,
  PRIORITY_CLICK_PREV,
  PRIORITY_COMPACT_HEIGHT_MAX,
} from './widget-priority-page';
import {
  WIDGET_ACCENT,
  WIDGET_SURFACE,
  WIDGET_TEXT,
  WIDGET_TEXT_DIM,
  WIDGET_TEXT_MUTED,
  WIDGET_TRACK,
} from './widget-theme';
import type { WidgetPriorityItem, WidgetPriorityPayload } from './widget-types';
import { WIDGET_DEEP_LINK_FOCUS } from './widget-types';

type KivoPriorityWidgetViewProps = {
  payload: WidgetPriorityPayload;
  enabled?: boolean;
  /** Widget height in dp (from Android widget info). */
  height?: number;
  /** Active page when showing the compact carousel. */
  pageIndex?: number;
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
  progressLabel: '0/0',
  deepLink: WIDGET_DEEP_LINK_FOCUS,
};

function resolveItems(data: WidgetPriorityPayload): WidgetPriorityItem[] {
  if (data.items && data.items.length > 0) return data.items;
  if (data.title && data.title !== 'Nada urgente' && data.title !== 'Tu prioridad') {
    return [{ id: 'primary', title: data.title, dueLabel: data.dueLabel }];
  }
  return [];
}

function PageDots({ count, index }: { count: number; index: number }) {
  return (
    <FlexWidget
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 6,
        width: 'match_parent',
      }}>
      {Array.from({ length: count }, (_, i) => {
        const active = i === index;
        return (
          <FlexWidget
            key={`dot-${i}`}
            style={{
              width: active ? 6 : 5,
              height: active ? 6 : 5,
              borderRadius: 3,
              backgroundColor: active ? WIDGET_ACCENT : WIDGET_TEXT_DIM,
              marginHorizontal: 3,
            }}
          />
        );
      })}
    </FlexWidget>
  );
}

function PriorityHeader({ label }: { label: string }) {
  return (
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
        text={label}
        style={{ fontSize: 11, fontWeight: '600', color: WIDGET_TEXT_MUTED }}
        maxLines={1}
      />
    </FlexWidget>
  );
}

function ProgressRing({
  percent,
  progressLabel,
  deepLink,
}: {
  percent: number;
  progressLabel: string;
  deepLink: string;
}) {
  const label = progressLabel.trim() || '0/0';
  const fontSize = label.length > 3 ? 10 : 11;

  return (
    <OverlapWidget
      style={{
        width: RING_SIZE,
        height: RING_SIZE,
      }}
      clickAction="OPEN_URI"
      clickActionData={{ uri: deepLink }}>
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
          text={label}
          style={{ fontSize, fontWeight: '700', color: WIDGET_TEXT }}
        />
      </FlexWidget>
    </OverlapWidget>
  );
}

function CompactCarousel({
  data,
  items,
  pageIndex,
  percent,
  progressLabel,
}: {
  data: WidgetPriorityPayload;
  items: WidgetPriorityItem[];
  pageIndex: number;
  percent: number;
  progressLabel: string;
}) {
  const safeIndex = ((pageIndex % items.length) + items.length) % items.length;
  const item = items[safeIndex]!;
  const showPager = items.length > 1;

  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: WIDGET_SURFACE,
        borderRadius: 22,
        paddingHorizontal: 10,
        paddingVertical: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
      {showPager ? (
        <FlexWidget
          style={{
            width: 28,
            height: 'match_parent',
            justifyContent: 'center',
            alignItems: 'center',
          }}
          clickAction={PRIORITY_CLICK_PREV}
          accessibilityLabel="Actividad anterior">
          <TextWidget
            text="‹"
            style={{ fontSize: 26, fontWeight: '700', color: WIDGET_TEXT_MUTED }}
          />
        </FlexWidget>
      ) : null}

      <FlexWidget
        style={{
          flex: 1,
          flexDirection: 'column',
          height: 'match_parent',
          justifyContent: 'center',
          paddingHorizontal: 4,
        }}
        clickAction="OPEN_URI"
        clickActionData={{ uri: data.deepLink }}>
        <PriorityHeader label={data.label} />
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
        {showPager ? <PageDots count={items.length} index={safeIndex} /> : null}
      </FlexWidget>

      {showPager ? (
        <FlexWidget
          style={{
            width: 28,
            height: 'match_parent',
            justifyContent: 'center',
            alignItems: 'center',
          }}
          clickAction={PRIORITY_CLICK_NEXT}
          accessibilityLabel="Siguiente actividad">
          <TextWidget
            text="›"
            style={{ fontSize: 26, fontWeight: '700', color: WIDGET_TEXT_MUTED }}
          />
        </FlexWidget>
      ) : null}

      <FlexWidget style={{ marginLeft: 4 }}>
        <ProgressRing percent={percent} progressLabel={progressLabel} deepLink={data.deepLink} />
      </FlexWidget>
    </FlexWidget>
  );
}

function TallList({
  data,
  items,
  emptyText,
  percent,
  progressLabel,
}: {
  data: WidgetPriorityPayload;
  items: WidgetPriorityItem[];
  emptyText: string;
  percent: number;
  progressLabel: string;
}) {
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
        <PriorityHeader label={data.label} />

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

      <ProgressRing percent={percent} progressLabel={progressLabel} deepLink={data.deepLink} />
    </FlexWidget>
  );
}

export function KivoPriorityWidgetView({
  payload,
  enabled = true,
  height,
  pageIndex = 0,
}: KivoPriorityWidgetViewProps) {
  const data = payload ?? FALLBACK;
  const percent = Math.max(0, Math.min(100, data.progressPercent));
  const progressLabel = data.progressLabel?.trim() || '0/0';
  const items = resolveItems(data);
  const emptyText = enabled
    ? (data.emptyMessage ?? data.dueLabel)
    : (data.emptyMessage ?? data.dueLabel);

  const useCompact =
    typeof height === 'number' &&
    height > 0 &&
    height < PRIORITY_COMPACT_HEIGHT_MAX &&
    items.length > 0;

  if (useCompact) {
    return (
      <CompactCarousel
        data={data}
        items={items}
        pageIndex={pageIndex}
        percent={percent}
        progressLabel={progressLabel}
      />
    );
  }

  return (
    <TallList
      data={data}
      items={items}
      emptyText={emptyText}
      percent={percent}
      progressLabel={progressLabel}
    />
  );
}

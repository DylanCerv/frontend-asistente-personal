import SwiftUI
import WidgetKit

enum KivoWidgetTheme {
  static let canvas = Color(red: 5 / 255, green: 5 / 255, blue: 5 / 255)
  static let surface = Color(red: 23 / 255, green: 23 / 255, blue: 23 / 255)
  static let accent = Color(red: 196 / 255, green: 181 / 255, blue: 253 / 255)
  static let teal = Color(red: 34 / 255, green: 211 / 255, blue: 238 / 255)
  static let text = Color.white
  static let muted = Color(red: 138 / 255, green: 138 / 255, blue: 138 / 255)
  static let track = Color(red: 42 / 255, green: 42 / 255, blue: 42 / 255)
  static let danger = Color(red: 248 / 255, green: 113 / 255, blue: 113 / 255)
  static let onAccent = Color(red: 26 / 255, green: 11 / 255, blue: 46 / 255)
}

struct KivoHomeEntry: TimelineEntry {
  let date: Date
  let payload: WidgetHomePayload
}

struct KivoHomeProvider: TimelineProvider {
  func placeholder(in context: Context) -> KivoHomeEntry {
    KivoHomeEntry(date: Date(), payload: WidgetPayloadStore.load())
  }

  func getSnapshot(in context: Context, completion: @escaping (KivoHomeEntry) -> Void) {
    completion(KivoHomeEntry(date: Date(), payload: WidgetPayloadStore.load()))
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<KivoHomeEntry>) -> Void) {
    let payload = WidgetPayloadStore.load()
    let entry = KivoHomeEntry(date: Date(), payload: payload)
    let nextRefresh = Calendar.current.date(byAdding: .minute, value: 30, to: Date()) ?? Date()
    completion(Timeline(entries: [entry], policy: .after(nextRefresh)))
  }
}

// MARK: - Agenda de hoy

struct KivoTodayWidgetView: View {
  let payload: WidgetTodayPayload

  var body: some View {
    VStack(alignment: .leading, spacing: 8) {
      Text("Kivo")
        .font(.system(size: 12, weight: .semibold))
        .foregroundStyle(KivoWidgetTheme.accent)

      if !payload.dateLabel.isEmpty {
        Text(payload.dateLabel)
          .font(.system(size: 11))
          .foregroundStyle(KivoWidgetTheme.muted)
          .lineLimit(1)
      }

      Text(payload.headline)
        .font(.system(size: 16, weight: .bold))
        .foregroundStyle(KivoWidgetTheme.text)
        .lineLimit(2)

      if payload.items.isEmpty {
        Text(payload.emptyMessage ?? "")
          .font(.system(size: 13))
          .foregroundStyle(KivoWidgetTheme.muted)
          .lineLimit(3)
      } else {
        ForEach(payload.items.prefix(5), id: \.id) { item in
          Text(formatItemLine(item))
            .font(.system(size: 13, weight: item.priority == "high" ? .semibold : .regular))
            .foregroundStyle(item.priority == "high" ? KivoWidgetTheme.accent : KivoWidgetTheme.text)
            .lineLimit(1)
        }
      }

      if payload.overflowCount > 0 {
        Text("+\(payload.overflowCount) más")
          .font(.system(size: 12))
          .foregroundStyle(KivoWidgetTheme.muted)
      }

      Spacer(minLength: 0)
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
    .padding(16)
    .widgetURL(URL(string: payload.deepLink))
  }

  private func formatItemLine(_ item: WidgetTodayItem) -> String {
    if let time = item.time, !time.isEmpty {
      return "\(time) · \(item.title)"
    }
    return item.title
  }
}

struct KivoTodayWidget: Widget {
  let kind: String = "KivoTodayWidget"

  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: KivoHomeProvider()) { entry in
      KivoTodayWidgetView(payload: entry.payload.today)
        .containerBackground(for: .widget) {
          KivoWidgetTheme.surface
        }
    }
    .configurationDisplayName("Agenda de hoy")
    .description("Tareas y reuniones de hoy sin abrir Kivo.")
    .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
  }
}

// MARK: - No olvides de

struct ProgressRing: View {
  let percent: Int
  private var clamped: Double { Double(min(100, max(0, percent))) / 100 }

  var body: some View {
    ZStack {
      Circle()
        .stroke(KivoWidgetTheme.track, lineWidth: 4)
      Circle()
        .trim(from: 0, to: clamped)
        .stroke(KivoWidgetTheme.accent, style: StrokeStyle(lineWidth: 4, lineCap: .round))
        .rotationEffect(.degrees(-90))
      Text("\(min(100, max(0, percent)))%")
        .font(.system(size: 12, weight: .bold))
        .foregroundStyle(KivoWidgetTheme.text)
    }
    .frame(width: 52, height: 52)
  }
}

struct KivoPriorityWidgetView: View {
  let payload: WidgetPriorityPayload
  let enabled: Bool

  private var listItems: [WidgetPriorityItem] {
    if let items = payload.items, !items.isEmpty {
      return items
    }
    if payload.title != "Nada urgente" && payload.title != "Tu prioridad" && !payload.title.isEmpty {
      return [WidgetPriorityItem(id: "primary", title: payload.title, dueLabel: payload.dueLabel)]
    }
    return []
  }

  var body: some View {
    HStack(alignment: .center, spacing: 10) {
      VStack(alignment: .leading, spacing: 4) {
        HStack(spacing: 7) {
          Circle()
            .fill(KivoWidgetTheme.accent)
            .frame(width: 7, height: 7)
          Text(payload.label)
            .font(.system(size: 11, weight: .semibold))
            .foregroundStyle(KivoWidgetTheme.muted)
            .lineLimit(1)
        }

        if listItems.isEmpty {
          Text(enabled ? (payload.emptyMessage ?? payload.dueLabel) : (payload.emptyMessage ?? payload.dueLabel))
            .font(.system(size: 14, weight: .bold))
            .foregroundStyle(KivoWidgetTheme.text)
            .lineLimit(2)
        } else {
          ForEach(listItems.prefix(4), id: \.id) { item in
            VStack(alignment: .leading, spacing: 2) {
              Text(item.title)
                .font(.system(size: 15, weight: .bold))
                .foregroundStyle(KivoWidgetTheme.text)
                .lineLimit(1)
              Text(item.dueLabel)
                .font(.system(size: 11))
                .foregroundStyle(KivoWidgetTheme.muted)
                .lineLimit(1)
            }
          }
        }
      }

      ProgressRing(percent: payload.progressPercent)
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
    .padding(.horizontal, 12)
    .padding(.vertical, 10)
    .widgetURL(URL(string: payload.deepLink))
  }
}

struct KivoPriorityWidget: Widget {
  let kind: String = "KivoPriorityWidget"

  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: KivoHomeProvider()) { entry in
      KivoPriorityWidgetView(payload: entry.payload.priority, enabled: entry.payload.enabled)
        .containerBackground(for: .widget) {
          KivoWidgetTheme.surface
        }
    }
    .configurationDisplayName("No olvides de")
    .description("Tu tarea Focus del día con avance.")
    .supportedFamilies([.systemMedium])
  }
}

// MARK: - Captura rápida

struct KivoCaptureWidgetView: View {
  let payload: WidgetCapturePayload

  var body: some View {
    VStack(spacing: 12) {
      ZStack {
        Circle()
          .fill(KivoWidgetTheme.accent)
          .frame(width: 64, height: 64)
        Image(systemName: "mic.fill")
          .font(.system(size: 24, weight: .semibold))
          .foregroundStyle(KivoWidgetTheme.onAccent)
      }

      Text(payload.title)
        .font(.system(size: 15, weight: .bold))
        .foregroundStyle(KivoWidgetTheme.text)

      Text(payload.subtitle)
        .font(.system(size: 10, weight: .semibold))
        .foregroundStyle(KivoWidgetTheme.muted)
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity)
    .padding(16)
    .widgetURL(URL(string: payload.deepLink))
  }
}

struct KivoCaptureWidget: Widget {
  let kind: String = "KivoCaptureWidget"

  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: KivoHomeProvider()) { entry in
      KivoCaptureWidgetView(payload: entry.payload.capture)
        .containerBackground(for: .widget) {
          KivoWidgetTheme.surface
        }
    }
    .configurationDisplayName("Captura rápida")
    .description("Abre el Asistente y empieza a grabar voz.")
    .supportedFamilies([.systemSmall])
  }
}

// MARK: - Focus Points (retired — kept for App Group payload decode compatibility)

struct KivoFocusPointsWidgetView: View {
  let payload: WidgetFocusPointsPayload
  let enabled: Bool

  var body: some View {
    VStack(alignment: .leading, spacing: 8) {
      HStack {
        Image(systemName: "chart.line.uptrend.xyaxis")
          .font(.system(size: 12, weight: .semibold))
          .foregroundStyle(KivoWidgetTheme.teal)
        Spacer()
        Text(payload.deltaLabel)
          .font(.system(size: 12, weight: .bold))
          .foregroundStyle(payload.deltaPositive ? KivoWidgetTheme.teal : KivoWidgetTheme.danger)
      }

      Text(enabled ? payload.valueLabel : "—")
        .font(.system(size: 28, weight: .bold))
        .foregroundStyle(KivoWidgetTheme.text)

      Text(payload.label)
        .font(.system(size: 13))
        .foregroundStyle(KivoWidgetTheme.text)

      if !enabled, let empty = payload.emptyMessage {
        Text(empty)
          .font(.system(size: 10))
          .foregroundStyle(KivoWidgetTheme.muted)
          .lineLimit(2)
      }

      Spacer(minLength: 0)

      GeometryReader { geo in
        ZStack(alignment: .leading) {
          Capsule()
            .fill(KivoWidgetTheme.track)
          Capsule()
            .fill(KivoWidgetTheme.teal)
            .frame(width: geo.size.width * CGFloat(min(100, max(0, payload.progressPercent))) / 100)
        }
      }
      .frame(height: 6)
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
    .padding(16)
    .widgetURL(URL(string: payload.deepLink))
  }
}

struct KivoFocusPointsWidget: Widget {
  let kind: String = "KivoFocusPointsWidget"

  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: KivoHomeProvider()) { entry in
      KivoFocusPointsWidgetView(payload: entry.payload.focusPoints, enabled: entry.payload.enabled)
        .containerBackground(for: .widget) {
          KivoWidgetTheme.surface
        }
    }
    .configurationDisplayName("Focus Points")
    .description("Avance y puntos de productividad.")
    .supportedFamilies([.systemSmall, .systemMedium])
  }
}

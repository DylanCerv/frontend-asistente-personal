import SwiftUI
import WidgetKit

private let brandColor = Color(red: 0.486, green: 0.227, blue: 0.929)
private let subtleColor = Color(red: 0.392, green: 0.455, blue: 0.545)
private let foregroundColor = Color(red: 0.059, green: 0.09, blue: 0.165)

struct KivoTodayEntry: TimelineEntry {
  let date: Date
  let payload: WidgetTodayPayload
}

struct KivoTodayWidgetView: View {
  let payload: WidgetTodayPayload

  var body: some View {
    VStack(alignment: .leading, spacing: 8) {
      Text("Kivo")
        .font(.system(size: 12, weight: .semibold))
        .foregroundStyle(brandColor)

      if !payload.dateLabel.isEmpty {
        Text(payload.dateLabel)
          .font(.system(size: 11))
          .foregroundStyle(subtleColor)
          .lineLimit(1)
      }

      Text(payload.headline)
        .font(.system(size: 16, weight: .bold))
        .foregroundStyle(foregroundColor)
        .lineLimit(2)

      if payload.items.isEmpty {
        Text(payload.emptyMessage ?? "")
          .font(.system(size: 13))
          .foregroundStyle(subtleColor)
          .lineLimit(3)
      } else {
        ForEach(payload.items.prefix(5), id: \.id) { item in
          Text(formatItemLine(item))
            .font(.system(size: 13, weight: item.priority == "high" ? .semibold : .regular))
            .foregroundStyle(item.priority == "high" ? brandColor : foregroundColor)
            .lineLimit(1)
        }
      }

      if payload.overflowCount > 0 {
        Text("+\(payload.overflowCount) más")
          .font(.system(size: 12))
          .foregroundStyle(subtleColor)
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

struct KivoTodayProvider: TimelineProvider {
  func placeholder(in context: Context) -> KivoTodayEntry {
    KivoTodayEntry(date: Date(), payload: WidgetPayloadStore.load())
  }

  func getSnapshot(in context: Context, completion: @escaping (KivoTodayEntry) -> Void) {
    completion(KivoTodayEntry(date: Date(), payload: WidgetPayloadStore.load()))
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<KivoTodayEntry>) -> Void) {
    let payload = WidgetPayloadStore.load()
    let entry = KivoTodayEntry(date: Date(), payload: payload)
    let nextRefresh = Calendar.current.date(byAdding: .minute, value: 30, to: Date()) ?? Date()
    let timeline = Timeline(entries: [entry], policy: .after(nextRefresh))
    completion(timeline)
  }
}

struct KivoTodayWidget: Widget {
  let kind: String = "KivoTodayWidget"

  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: KivoTodayProvider()) { entry in
      KivoTodayWidgetView(payload: entry.payload)
        .containerBackground(for: .widget) {
          Color.white
        }
    }
    .configurationDisplayName("Agenda de hoy")
    .description("Tareas y reuniones de hoy sin abrir Kivo.")
    .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
  }
}

struct KivoTodayWidget_Previews: PreviewProvider {
  static var previews: some View {
    KivoTodayWidgetView(payload: WidgetPayloadStore.load())
      .previewContext(WidgetPreviewContext(family: .systemMedium))
  }
}

import Foundation

private let appGroupId = "group.com.kivo.app.widget"
private let payloadKey = "@asistente/widget_payload_v1"

struct WidgetTodayItem: Codable {
  let id: String
  let title: String
  let time: String?
  let kind: String
  let priority: String?
}

struct WidgetTodayPayload: Codable {
  let version: Int
  let updatedAt: String
  let dateLabel: String
  let headline: String
  let items: [WidgetTodayItem]
  let overflowCount: Int
  let emptyMessage: String?
  let enabled: Bool
  let deepLink: String
}

enum WidgetPayloadStore {
  static func load() -> WidgetTodayPayload {
    guard
      let defaults = UserDefaults(suiteName: appGroupId),
      let json = defaults.string(forKey: payloadKey),
      let data = json.data(using: .utf8),
      let payload = try? JSONDecoder().decode(WidgetTodayPayload.self, from: data)
    else {
      return fallbackPayload()
    }

    return payload
  }

  private static func fallbackPayload() -> WidgetTodayPayload {
    WidgetTodayPayload(
      version: 1,
      updatedAt: ISO8601DateFormatter().string(from: Date()),
      dateLabel: "",
      headline: "Kivo",
      items: [],
      overflowCount: 0,
      emptyMessage: "Abre Kivo para sincronizar",
      enabled: false,
      deepLink: "kivo://agenda"
    )
  }
}

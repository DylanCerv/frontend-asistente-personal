import Foundation

private let appGroupId = "group.com.kivo.app.widget"
private let payloadKey = "@asistente/widget_payload_v2"
private let legacyPayloadKey = "@asistente/widget_payload_v1"

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

struct WidgetPriorityPayload: Codable {
  let label: String
  let title: String
  let dueLabel: String
  let progressPercent: Int
  let emptyMessage: String?
  let deepLink: String
}

struct WidgetCapturePayload: Codable {
  let title: String
  let subtitle: String
  let deepLink: String
}

struct WidgetFocusPointsPayload: Codable {
  let valueLabel: String
  let label: String
  let deltaLabel: String
  let deltaPositive: Bool
  let progressPercent: Int
  let emptyMessage: String?
  let deepLink: String
}

struct WidgetHomePayload: Codable {
  let version: Int
  let updatedAt: String
  let enabled: Bool
  let signedIn: Bool
  let today: WidgetTodayPayload
  let priority: WidgetPriorityPayload
  let capture: WidgetCapturePayload
  let focusPoints: WidgetFocusPointsPayload
}

enum WidgetPayloadStore {
  static func load() -> WidgetHomePayload {
    if let home = loadHome(key: payloadKey) {
      return home
    }

    if let legacy = loadLegacyToday() {
      return wrapLegacy(legacy)
    }

    return fallbackPayload()
  }

  private static func loadHome(key: String) -> WidgetHomePayload? {
    guard
      let defaults = UserDefaults(suiteName: appGroupId),
      let json = defaults.string(forKey: key),
      let data = json.data(using: .utf8),
      let payload = try? JSONDecoder().decode(WidgetHomePayload.self, from: data)
    else {
      return nil
    }
    return payload
  }

  private static func loadLegacyToday() -> WidgetTodayPayload? {
    guard
      let defaults = UserDefaults(suiteName: appGroupId),
      let json = defaults.string(forKey: legacyPayloadKey),
      let data = json.data(using: .utf8),
      let payload = try? JSONDecoder().decode(WidgetTodayPayload.self, from: data)
    else {
      return nil
    }
    return payload
  }

  private static func wrapLegacy(_ today: WidgetTodayPayload) -> WidgetHomePayload {
    WidgetHomePayload(
      version: 2,
      updatedAt: today.updatedAt,
      enabled: today.enabled,
      signedIn: today.enabled,
      today: today,
      priority: WidgetPriorityPayload(
        label: "PRIORIDAD ACTUAL",
        title: today.headline,
        dueLabel: today.emptyMessage ?? "",
        progressPercent: 0,
        emptyMessage: today.emptyMessage,
        deepLink: "kivo:///"
      ),
      capture: WidgetCapturePayload(
        title: "Quick Capture",
        subtitle: "TAP TO RECORD",
        deepLink: "kivo://capture"
      ),
      focusPoints: WidgetFocusPointsPayload(
        valueLabel: "—",
        label: "Focus Points",
        deltaLabel: "—",
        deltaPositive: true,
        progressPercent: 0,
        emptyMessage: today.emptyMessage,
        deepLink: "kivo://report"
      )
    )
  }

  private static func fallbackPayload() -> WidgetHomePayload {
    let now = ISO8601DateFormatter().string(from: Date())
    return WidgetHomePayload(
      version: 2,
      updatedAt: now,
      enabled: false,
      signedIn: false,
      today: WidgetTodayPayload(
        version: 1,
        updatedAt: now,
        dateLabel: "",
        headline: "Kivo",
        items: [],
        overflowCount: 0,
        emptyMessage: "Abre Kivo para sincronizar",
        enabled: false,
        deepLink: "kivo://agenda"
      ),
      priority: WidgetPriorityPayload(
        label: "PRIORIDAD ACTUAL",
        title: "Kivo",
        dueLabel: "Abre Kivo para sincronizar",
        progressPercent: 0,
        emptyMessage: "Abre Kivo para sincronizar",
        deepLink: "kivo:///"
      ),
      capture: WidgetCapturePayload(
        title: "Quick Capture",
        subtitle: "TAP TO RECORD",
        deepLink: "kivo://capture"
      ),
      focusPoints: WidgetFocusPointsPayload(
        valueLabel: "—",
        label: "Focus Points",
        deltaLabel: "—",
        deltaPositive: true,
        progressPercent: 0,
        emptyMessage: "Abre Kivo para sincronizar",
        deepLink: "kivo://report"
      )
    )
  }
}

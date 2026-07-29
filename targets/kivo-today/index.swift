import WidgetKit
import SwiftUI

@main
struct KivoTodayWidgetBundle: WidgetBundle {
  var body: some Widget {
    KivoTodayWidget()
    KivoPriorityWidget()
    KivoCaptureWidget()
    KivoFocusPointsWidget()
  }
}

package expo.modules.kivofocuslock

import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.graphics.PixelFormat
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.media.RingtoneManager
import android.net.Uri
import android.os.Build
import android.provider.Settings
import android.util.TypedValue
import android.view.Gravity
import android.view.View
import android.view.WindowManager
import android.widget.LinearLayout
import android.widget.TextView
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class KivoFocusLockModule : Module() {
  private var overlayView: View? = null
  private var windowManager: WindowManager? = null

  override fun definition() = ModuleDefinition {
    Name("KivoFocusLock")

    Events("onOverlayAction")

    Function("hasNotificationPolicyAccess") {
      hasNotificationPolicyAccess()
    }

    Function("openNotificationPolicySettings") {
      openNotificationPolicySettings()
    }

    Function("getInterruptionFilter") {
      getInterruptionFilter()
    }

    Function("setInterruptionFilter") { filter: Int ->
      setInterruptionFilter(filter)
    }

    Function("canDrawOverlays") {
      canDrawOverlays()
    }

    Function("openOverlaySettings") {
      openOverlaySettings()
    }

    Function("showOverlay") { title: String, timerText: String ->
      showOverlay(title, timerText)
    }

    Function("updateOverlay") { title: String, timerText: String ->
      updateOverlay(title, timerText)
    }

    Function("hideOverlay") {
      hideOverlay()
    }

    Function("getRingtoneTitle") { uriString: String ->
      getRingtoneTitle(uriString)
    }

    Function("getDefaultNotificationSoundUri") {
      getDefaultNotificationSoundUri()
    }
  }

  private fun appContextSafe(): Context {
    return appContext.reactContext
      ?: throw IllegalStateException("React context unavailable")
  }

  private fun getRingtoneTitle(uriString: String): String? {
    return try {
      val uri = Uri.parse(uriString)
      val ringtone = RingtoneManager.getRingtone(appContextSafe(), uri)
      ringtone?.getTitle(appContextSafe())
    } catch (_: Exception) {
      null
    }
  }

  private fun getDefaultNotificationSoundUri(): String? {
    return try {
      RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)?.toString()
        ?: RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM)?.toString()
    } catch (_: Exception) {
      null
    }
  }

  private fun hasNotificationPolicyAccess(): Boolean {
    val nm = appContextSafe().getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    return nm.isNotificationPolicyAccessGranted
  }

  private fun openNotificationPolicySettings() {
    val context = appContextSafe()
    // Prefer the per-app DND access screen when available (API 30+).
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      try {
        val detail = Intent(Settings.ACTION_NOTIFICATION_POLICY_ACCESS_DETAIL_SETTINGS).apply {
          data = Uri.parse("package:${context.packageName}")
          addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        context.startActivity(detail)
        return
      } catch (_: Exception) {
        // Fall through to the full access list.
      }
    }
    val intent = Intent(Settings.ACTION_NOTIFICATION_POLICY_ACCESS_SETTINGS).apply {
      addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    }
    context.startActivity(intent)
  }

  private fun getInterruptionFilter(): Int {
    val nm = appContextSafe().getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    return nm.currentInterruptionFilter
  }

  private fun setInterruptionFilter(filter: Int): Boolean {
    val nm = appContextSafe().getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    if (!nm.isNotificationPolicyAccessGranted) return false
    nm.setInterruptionFilter(filter)
    return true
  }

  /** Turns off Do Not Disturb mode (keeps the access permission). */
  private fun clearFocusInterruptionFilter() {
    try {
      val nm = appContextSafe().getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
      if (!nm.isNotificationPolicyAccessGranted) return
      nm.setInterruptionFilter(NotificationManager.INTERRUPTION_FILTER_ALL)
    } catch (_: Exception) {
      // Ignore — JS restoreFocusDnd is the fallback.
    }
  }

  private fun canDrawOverlays(): Boolean {
    return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      Settings.canDrawOverlays(appContextSafe())
    } else {
      true
    }
  }

  private fun openOverlaySettings() {
    val context = appContextSafe()
    val intent = Intent(
      Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
      Uri.parse("package:${context.packageName}")
    ).apply {
      addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    }
    context.startActivity(intent)
  }

  private fun dp(value: Float): Int {
    return TypedValue.applyDimension(
      TypedValue.COMPLEX_UNIT_DIP,
      value,
      appContextSafe().resources.displayMetrics
    ).toInt()
  }

  private fun roundedBg(color: Int, radiusDp: Float): GradientDrawable {
    return GradientDrawable().apply {
      setColor(color)
      cornerRadius = TypedValue.applyDimension(
        TypedValue.COMPLEX_UNIT_DIP,
        radiusDp,
        appContextSafe().resources.displayMetrics
      )
    }
  }

  private fun showOverlay(title: String, timerText: String) {
    if (!canDrawOverlays()) return
    hideOverlay()

    val context = appContextSafe()
    val wm = context.getSystemService(Context.WINDOW_SERVICE) as WindowManager
    windowManager = wm

    val root = LinearLayout(context).apply {
      orientation = LinearLayout.VERTICAL
      setPadding(dp(16f), dp(16f), dp(16f), dp(16f))
      background = roundedBg(Color.parseColor("#E6171717"), 20f)
    }

    val header = TextView(context).apply {
      text = "Sesión Focus"
      setTextColor(Color.parseColor("#C4B5FD"))
      setTextSize(TypedValue.COMPLEX_UNIT_SP, 12f)
      setTypeface(typeface, Typeface.BOLD)
      tag = "header"
    }

    val timer = TextView(context).apply {
      text = timerText
      setTextColor(Color.WHITE)
      setTextSize(TypedValue.COMPLEX_UNIT_SP, 28f)
      setTypeface(typeface, Typeface.BOLD)
      setPadding(0, dp(6f), 0, dp(4f))
      tag = "timer"
    }

    val titleView = TextView(context).apply {
      text = title
      setTextColor(Color.WHITE)
      setTextSize(TypedValue.COMPLEX_UNIT_SP, 15f)
      tag = "title"
    }

    val actions = LinearLayout(context).apply {
      orientation = LinearLayout.HORIZONTAL
      setPadding(0, dp(12f), 0, 0)
    }

    fun actionButton(label: String, action: String, bg: Int, fg: Int): TextView {
      return TextView(context).apply {
        text = label
        gravity = Gravity.CENTER
        setTextColor(fg)
        setTextSize(TypedValue.COMPLEX_UNIT_SP, 13f)
        setTypeface(typeface, Typeface.BOLD)
        background = roundedBg(bg, 14f)
        setPadding(dp(10f), dp(10f), dp(10f), dp(10f))
        layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f).apply {
          marginEnd = dp(6f)
        }
        setOnClickListener {
          // Exit Focus quiet mode immediately in native (JS may be suspended).
          if (action == "complete" || action == "stop") {
            clearFocusInterruptionFilter()
          }
          sendEvent("onOverlayAction", mapOf("action" to action))
        }
      }
    }

    actions.addView(actionButton("Completar", "complete", Color.parseColor("#C4B5FD"), Color.parseColor("#1A0B2E")))
    actions.addView(actionButton("Posponer", "postpone", Color.parseColor("#2A2A2A"), Color.WHITE))
    actions.addView(actionButton("Cerrar", "stop", Color.parseColor("#2A2A2A"), Color.WHITE).apply {
      (layoutParams as LinearLayout.LayoutParams).marginEnd = 0
    })

    root.addView(header)
    root.addView(timer)
    root.addView(titleView)
    root.addView(actions)

    val type = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
    } else {
      @Suppress("DEPRECATION")
      WindowManager.LayoutParams.TYPE_PHONE
    }

    val params = WindowManager.LayoutParams(
      WindowManager.LayoutParams.MATCH_PARENT,
      WindowManager.LayoutParams.WRAP_CONTENT,
      type,
      WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
        WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
      PixelFormat.TRANSLUCENT
    ).apply {
      gravity = Gravity.TOP or Gravity.CENTER_HORIZONTAL
      y = dp(48f)
    }

    wm.addView(root, params)
    overlayView = root
  }

  private fun updateOverlay(title: String, timerText: String) {
    val root = overlayView as? LinearLayout ?: return
    for (i in 0 until root.childCount) {
      val child = root.getChildAt(i)
      when (child.tag) {
        "timer" -> (child as TextView).text = timerText
        "title" -> (child as TextView).text = title
      }
    }
  }

  private fun hideOverlay() {
    val view = overlayView ?: return
    try {
      windowManager?.removeView(view)
    } catch (_: Exception) {
      // Already removed.
    }
    overlayView = null
  }
}

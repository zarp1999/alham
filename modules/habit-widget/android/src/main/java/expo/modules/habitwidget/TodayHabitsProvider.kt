package expo.modules.habitwidget
import android.app.AlarmManager
import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.appwidget.AppWidgetProviderInfo
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.net.Uri
import android.os.Bundle
import android.view.View
import android.widget.RemoteViews
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale

class TodayHabitsProvider : AppWidgetProvider() {
  override fun onUpdate(context: Context, manager: AppWidgetManager, ids: IntArray) { refresh(context) }
  override fun onAppWidgetOptionsChanged(context: Context, manager: AppWidgetManager, id: Int, options: Bundle) { refresh(context) }
  override fun onReceive(context: Context, intent: Intent) {
    super.onReceive(context, intent)
    if (intent.action in listOf(Intent.ACTION_DATE_CHANGED, Intent.ACTION_TIME_CHANGED, Intent.ACTION_TIMEZONE_CHANGED, Intent.ACTION_BOOT_COMPLETED, MIDNIGHT)) refresh(context)
  }
  override fun onDisabled(context: Context) { (context.getSystemService(Context.ALARM_SERVICE) as AlarmManager).cancel(alarmIntent(context)) }
  companion object {
    const val MIDNIGHT = "expo.modules.habitwidget.MIDNIGHT"
    private fun alarmIntent(context: Context) = PendingIntent.getBroadcast(context, 0, Intent(context, TodayHabitsProvider::class.java).setAction(MIDNIGHT), PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
    private fun open(context: Context, url: String) = PendingIntent.getActivity(context, 0, Intent(Intent.ACTION_VIEW, Uri.parse(url)).setPackage(context.packageName).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP), PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
    fun refresh(context: Context) {
      val manager = AppWidgetManager.getInstance(context)
      val ids = manager.getAppWidgetIds(ComponentName(context, TodayHabitsProvider::class.java))
      if (ids.isEmpty()) return
      val raw = context.getSharedPreferences("habit_widget", 0).getString("data", "{}") ?: "{}"
      val data = try { JSONObject(raw) } catch (_: Exception) { JSONObject() }
      val now = Calendar.getInstance()
      val today = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(now.time)
      val weekday = now.get(Calendar.DAY_OF_WEEK) - 1
      val habits = data.optJSONArray("habits")
      val entries = data.optJSONArray("entries")
      val rows = mutableListOf<Triple<String, String, String>>()
      if (habits != null) for (i in 0 until habits.length()) {
        val h = habits.getJSONObject(i)
        if (h.optBoolean("paused") || h.optString("created") > today) continue
        val schedules = h.optJSONArray("schedules") ?: continue
        var schedule: JSONObject? = null
        for (j in 0 until schedules.length()) { val sc = schedules.getJSONObject(j); if (sc.optString("from") <= today) schedule = sc }
        val sc = schedule ?: continue
        if (sc.optString("kind") == "days") {
          val days = sc.optJSONArray("days") ?: continue
          if ((0 until days.length()).none { days.optInt(it) == weekday }) continue
        }
        var status = ""
        if (entries != null) for (j in 0 until entries.length()) { val e = entries.getJSONObject(j); if (e.optString("date") == today && e.optString("habitId") == h.optString("id")) status = e.optString("status") }
        rows.add(Triple(h.optString("id"), h.optString("name"), status))
      }
      rows.sortBy { if (it.third == "done" || it.third == "rest") 1 else 0 }
      for (id in ids) {
        val options = manager.getAppWidgetOptions(id)
        val lock = options.getInt(AppWidgetManager.OPTION_APPWIDGET_HOST_CATEGORY) == AppWidgetProviderInfo.WIDGET_CATEGORY_KEYGUARD
        val fontScale = context.resources.configuration.fontScale.coerceAtLeast(1f)
        val height = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_HEIGHT, 180)
        val capacity = if (lock) 2 else ((height - 74) / (40 * fontScale)).toInt().coerceIn(1, 8)
        val pending = rows.filter { it.third != "done" && it.third != "rest" }
        val visible = if (lock && pending.isNotEmpty()) pending else rows
        val views = RemoteViews(context.packageName, R.layout.today_habits)
        views.setTextViewText(R.id.habit_widget_title, data.optString("title", context.getString(R.string.habit_widget_name)))
        views.removeAllViews(R.id.habit_widget_rows)
        for (row in visible.take(capacity)) {
          val child = RemoteViews(context.packageName, R.layout.habit_widget_row)
          val prefix = if (row.third == "done") "✓ " else if (row.third == "rest") "− " else "○ "
          child.setTextViewText(R.id.habit_widget_row, prefix + row.second)
          child.setTextColor(R.id.habit_widget_row, Color.parseColor(if (row.third == "done" || row.third == "rest") "#718078" else "#233B34"))
          child.setOnClickPendingIntent(R.id.habit_widget_row, open(context, "kotsukotsu://widget?id=" + Uri.encode(row.first)))
          views.addView(R.id.habit_widget_rows, child)
        }
        if (visible.isEmpty()) {
          val child = RemoteViews(context.packageName, R.layout.habit_widget_row)
          child.setTextViewText(R.id.habit_widget_row, data.optString("empty", "アプリを開いて習慣を設定"))
          views.addView(R.id.habit_widget_rows, child)
        }
        views.setViewVisibility(R.id.habit_widget_more, if (visible.size > capacity) View.VISIBLE else View.GONE)
        views.setTextViewText(R.id.habit_widget_more, data.optString("more", "すべて見る"))
        views.setOnClickPendingIntent(R.id.habit_widget_root, open(context, "kotsukotsu://today"))
        views.setOnClickPendingIntent(R.id.habit_widget_more, open(context, "kotsukotsu://today"))
        manager.updateAppWidget(id, views)
      }
      val next = Calendar.getInstance().apply { add(Calendar.DAY_OF_YEAR, 1); set(Calendar.HOUR_OF_DAY, 0); set(Calendar.MINUTE, 0); set(Calendar.SECOND, 5); set(Calendar.MILLISECOND, 0) }
      // Inexact alarm avoids exact-alarm permission; periodic updates provide a fallback.
      (context.getSystemService(Context.ALARM_SERVICE) as AlarmManager).set(AlarmManager.RTC, next.timeInMillis, alarmIntent(context))
    }
  }
}

package expo.modules.habitwidget
import expo.modules.kotlin.modules.Module
import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.os.Build
import expo.modules.kotlin.modules.ModuleDefinition
class HabitWidgetModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("HabitWidget")
    Function("canPin") {
      val context = appContext.reactContext
      context != null && Build.VERSION.SDK_INT >= 26 && AppWidgetManager.getInstance(context).isRequestPinAppWidgetSupported
    }
    Function("requestPin") {
      val context = appContext.reactContext
      if (context == null || Build.VERSION.SDK_INT < 26) false
      else AppWidgetManager.getInstance(context).requestPinAppWidget(ComponentName(context, TodayHabitsProvider::class.java), null, null)
    }
    Function("update") { json: String ->
      val context = appContext.reactContext ?: return@Function
      context.getSharedPreferences("habit_widget", 0).edit().putString("data", json).apply()
      TodayHabitsProvider.refresh(context)
    }
  }
}

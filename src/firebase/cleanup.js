import { cleanupOldOrders } from "./orderService";
import { cleanupOldMenus } from "./menuService";

const CLEANUP_KEY = "dabbago_last_cleanup";

function getTodayStr() {
  return new Date().toISOString().split("T")[0];
}

// Runs once per Sunday. Silently skips on all other days or if already ran today.
export async function runWeeklyCleanupIfDue() {
  if (new Date().getDay() !== 0) return;
  if (localStorage.getItem(CLEANUP_KEY) === getTodayStr()) return;

  await Promise.all([cleanupOldOrders(), cleanupOldMenus()]);
  localStorage.setItem(CLEANUP_KEY, getTodayStr());
}

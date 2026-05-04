import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./config";
import { cleanupOldMenus } from "./menuService";
import { cleanupOldOrders } from "./orderService";

function getTodayStr() {
  return new Date().toISOString().split("T")[0];
}

export async function runWeeklyCleanupIfDue() {
  const today = getTodayStr();
  const settingsRef = doc(db, "settings", "app");
  const snap = await getDoc(settingsRef);
  if (snap.data()?.lastCleanup === today) return;

  await Promise.all([cleanupOldOrders(), cleanupOldMenus()]);
  await setDoc(settingsRef, { lastCleanup: today }, { merge: true });
}

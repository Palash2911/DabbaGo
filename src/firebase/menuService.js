import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  where,
} from "firebase/firestore";
import { db } from "./config";

export async function getAppSettings() {
  const snap = await getDoc(doc(db, "settings", "app"));
  if (!snap.exists()) return { isOpen: true };
  return snap.data();
}

export async function getCurrentMenu() {
  const snap = await getDocs(
    query(collection(db, "menu"), where("isCurrentMenu", "==", true), limit(1)),
  );
  if (snap.empty) return null;
  return snap.docs[0].data().items;
}

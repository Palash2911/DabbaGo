import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  query,
  where,
  limit,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { db } from "./config";

export async function getAppSettings() {
  const snap = await getDoc(doc(db, "settings", "app"));
  if (!snap.exists()) return { isOpen: true };
  return snap.data();
}

export async function updateStoreStatus(isOpen) {
  await setDoc(doc(db, "settings", "app"), { isOpen }, { merge: true });
}

export async function getCurrentMenu() {
  const snap = await getDocs(
    query(collection(db, "menu"), where("isCurrentMenu", "==", true), limit(1))
  );
  if (snap.empty) return null;
  return snap.docs[0].data().items;
}

export async function saveMenu(items) {
  const newDocRef = await addDoc(collection(db, "menu"), {
    items,
    createdAt: serverTimestamp(),
    isCurrentMenu: true,
  });

  const allCurrent = await getDocs(
    query(collection(db, "menu"), where("isCurrentMenu", "==", true))
  );
  const batch = writeBatch(db);
  allCurrent.docs.forEach((d) => {
    if (d.id !== newDocRef.id) batch.update(d.ref, { isCurrentMenu: false });
  });
  await batch.commit();
}

// Deletes all non-active menu documents (old menus replaced by newer ones).
export async function cleanupOldMenus() {
  const snap = await getDocs(
    query(collection(db, "menu"), where("isCurrentMenu", "==", false))
  );
  if (snap.empty) return;
  const batch = writeBatch(db);
  snap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
}

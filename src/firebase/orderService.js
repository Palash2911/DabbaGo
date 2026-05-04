import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "./config";

function getTodayString() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export async function placeOrder({ name, phone, quantity }) {
  await addDoc(collection(db, "orders"), {
    name,
    phone,
    quantity,
    date: getTodayString(),
    createdAt: serverTimestamp(),
    exported: false,
  });
}

export async function getNewOrders() {
  const snap = await getDocs(
    query(
      collection(db, "orders"),
      where("exported", "==", false),
      orderBy("createdAt", "asc"),
    ),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function deleteOrder(orderId) {
  await deleteDoc(doc(db, "orders", orderId));
}

export async function markOrdersExported(orders) {
  const batch = writeBatch(db);
  orders.forEach((o) =>
    batch.update(doc(db, "orders", o.id), { exported: true }),
  );
  await batch.commit();
}

// Deletes orders older than 7 days.
export async function cleanupOldOrders() {
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const cutoffStr = cutoff.toISOString().split("T")[0];
  const snap = await getDocs(
    query(collection(db, "orders"), where("date", "<", cutoffStr)),
  );
  if (snap.empty) return;
  const batch = writeBatch(db);
  snap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
}

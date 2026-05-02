import {
  collection,
  doc,
  addDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
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
      orderBy("createdAt", "asc")
    )
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function deleteOrder(orderId) {
  await deleteDoc(doc(db, "orders", orderId));
}

export async function markOrdersExported(orders) {
  const batch = writeBatch(db);
  orders.forEach((o) => batch.update(doc(db, "orders", o.id), { exported: true }));
  await batch.commit();
}

// Deletes all orders placed before today. Runs on Sunday to clear the week's history.
export async function cleanupOldOrders() {
  const snap = await getDocs(
    query(collection(db, "orders"), where("date", "<", getTodayString()))
  );
  if (snap.empty) return;
  const batch = writeBatch(db);
  snap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
}

import { collection, addDoc, serverTimestamp } from "firebase/firestore";
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

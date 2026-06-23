import { redirect } from "next/navigation"; // [cite: 226]

export default function RootPage() {
  // Langsung alihkan rute utama ke halaman dashboard [cite: 227]
  redirect("/dashboard"); // [cite: 227]
} 
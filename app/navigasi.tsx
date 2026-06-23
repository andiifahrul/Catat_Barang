"use client";

import { usePathname, useRouter } from "next/navigation"; // [cite: 150, 206]
import { 
  LayoutDashboard, 
  Package, 
  ArrowLeftRight, 
  History, 
  Settings 
} from "lucide-react"; // [cite: 137, 207]
    
export default function BottomNav() {
  const pathname = usePathname(); // [cite: 150, 208]
  const router = useRouter(); // [cite: 209]

  // --- LOGIKA TAMBAHAN: SEMBUNYIKAN NAVBAR DI HALAMAN LOGIN ---
  if (pathname === "/login") return null; // 

  // Struktur menu sesuai folder kamu [cite: 141, 209]
  const navigationItems = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard }, // [cite: 209]
    { name: "Stok", path: "/stok", icon: Package }, // [cite: 209]
    { name: "Transaksi", path: "/transaksi", icon: ArrowLeftRight }, // [cite: 209]
    { name: "Riwayat", path: "/riwayat", icon: History }, // [cite: 209]
    { name: "Pengaturan", path: "/pengaturan", icon: Settings }, // [cite: 209]
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg px-2 py-3 z-50"> {/* [cite: 210] */}
      <div className="max-w-md mx-auto flex justify-around relative"> {/* [cite: 210] */}
        
        {navigationItems.map((item) => { // [cite: 210]
          const Icon = item.icon; // [cite: 210]
          const isActive = pathname === item.path; // [cite: 210]

          return (
            <button
              key={item.path} // [cite: 210]
              onClick={() => router.push(item.path)} // [cite: 210]
              className="flex flex-col items-center justify-center w-16 h-12 relative z-10 transition-all duration-300" // [cite: 210]
            >
              {/* Efek Lingkaran Membesar & Melayang Saat Aktif */}
              <div
                className={`absolute inset-0 mx-auto rounded-full transition-all duration-300 ease-out ${
                  isActive 
                    ? "bg-blue-600 text-white scale-110 -translate-y-4 shadow-md w-12 h-12 flex items-center justify-center" 
                    : "bg-transparent text-gray-500 w-12 h-12 flex items-center justify-center"
                }`} // [cite: 211]
              >
                <Icon 
                  className={`w-6 h-6 transition-colors duration-300 ${
                    isActive ? "text-white" : "text-gray-500 hover:text-gray-800" // [cite: 212, 213]
                  }`} 
                /> {/* [cite: 213] */}
              </div>

              {/* Teks Menu */}
              <span 
                className={`text-[10px] font-medium mt-auto transition-all duration-300 ${
                  isActive ? "opacity-100 text-blue-600 font-bold transform translate-y-1" : "opacity-70 text-gray-500" // [cite: 214, 215]
                }`}
              >
                {item.name} {/* [cite: 215] */}
              </span>
            </button> // [cite: 215]
          ); // [cite: 215]
        })} {/* [cite: 216] */}

      </div>
    </nav>
  );
}
import { useState } from "react";
import { Sidebar, type NavSection } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import { NetworkBanner } from "@/components/NetworkBanner";
import { WalletScreen } from "@/screens/WalletScreen";
import { AccountScreen } from "@/screens/AccountScreen";
import { TransactionsScreen } from "@/screens/TransactionsScreen";
import { SorobanScreen } from "@/screens/SorobanScreen";
import { NetworkScreen } from "@/screens/NetworkScreen";

export function Dashboard() {
  const [active, setActive] = useState<NavSection>("wallet");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-base">
      <Sidebar
        active={active}
        onNavigate={setActive}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar
          active={active}
          onMenuToggle={() => setSidebarOpen((o) => !o)}
        />
        <NetworkBanner />
        <main className="flex-1 min-h-0 overflow-y-auto">
          <div className="max-w-[700px] mx-auto px-6 py-8 sm:px-10 sm:py-10 min-h-[300px]">
            {active === "wallet" && <WalletScreen />}
            {active === "account" && <AccountScreen />}
            {active === "transactions" && <TransactionsScreen />}
            {active === "soroban" && <SorobanScreen />}
            {active === "network" && <NetworkScreen />}
          </div>
        </main>
      </div>
    </div>
  );
}

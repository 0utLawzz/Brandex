import { Navbar } from "./Navbar";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[#F0E8D0] flex flex-col">
      <Navbar />
      {/* Main content - full width */}
      <main className="flex-1 flex flex-col w-full h-[calc(100vh-4rem)] overflow-hidden">
        {children}
      </main>
    </div>
  );
}

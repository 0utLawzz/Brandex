import { Sidebar } from "./Sidebar";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[#F0E8D0] flex">
      <Sidebar />
      {/* Main content — offset by sidebar width on lg+ */}
      <main className="flex-1 lg:ml-52 min-h-screen flex flex-col">
        {children}
      </main>
    </div>
  );
}

import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { AIAnalysisProvider } from "@/contexts/ai-analysis-context";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AIAnalysisProvider>
      <div className="flex min-h-screen dark" style={{ background: "#060b14" }}>
        {/* Top accent gradient line */}
        <div
          className="fixed top-0 left-0 right-0 h-[2px] z-[60]"
          style={{ background: "linear-gradient(90deg, #7c3aed, #a855f7, #22d3ee, #f472b6, #7c3aed)" }}
        />

        <Sidebar />

        <div className="flex-1 flex flex-col min-w-0">
          <Topbar />
          <main
            className="flex-1 p-4 md:p-6"
            style={{ background: "#060b14" }}
          >
            {children}
          </main>
        </div>
      </div>
    </AIAnalysisProvider>
  );
}

import { NavigationBar } from "@/components/navigation/navigation-bar";
import { LlmClusterAndSummarize } from "@/components/summarizer/cluster-and-summarize";

export default function Page() {
  return (
    <>
      <NavigationBar />
      <main className="relative container flex min-h-screen flex-col">
        <div className="flex flex-1 py-4">
          <div className="w-full">
            <LlmClusterAndSummarize />
          </div>
        </div>
      </main>
    </>
  );
}

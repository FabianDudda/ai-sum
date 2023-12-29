import { NavigationBar } from "@/components/navigation-bar";
import { LlmMapReduce } from "@/components/summarizer/llm-map-reduce";

export default async function Page() {
  return (
    <>
      <NavigationBar />
      <main className="container">
        <LlmMapReduce />
      </main>
    </>
  );
}

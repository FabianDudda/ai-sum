import { NavigationBar } from "@/components/navigation/navigation-bar";
import { LlmMapReduceWithoutLangchain } from "@/components/summarizer/llm-map-reduce-without-langchain";

export default async function Page() {
  return (
    <>
      <NavigationBar />
      <main className="relative container flex min-h-screen flex-col">
        <div className="flex flex-1 py-4">
          <div className="w-full">
            <LlmMapReduceWithoutLangchain />
          </div>
        </div>
      </main>
    </>
  );
}

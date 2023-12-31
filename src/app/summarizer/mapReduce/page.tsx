import { NavigationBar } from "@/components/navigation/navigation-bar";
import { LlmMapReduce } from "@/components/summarizer/map-reduce";

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

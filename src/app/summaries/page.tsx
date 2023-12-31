import { NavigationBar } from "@/components/navigation/navigation-bar";
import { SummaryList } from "@/components/summary-list";

async function getData() {
  // no-cache for refetch data on every page reload
  const res = await fetch("http://localhost:3000/api/summaries", { cache: "no-cache" });
  // The return value is *not* serialized
  // You can return Date, Map, Set, etc.

  if (!res.ok) {
    // This will activate the closest `error.js` Error Boundary
    throw new Error("Failed to fetch data");
  }

  return res.json();
}

export default async function Page() {
  const data = await getData();

  return (
    <>
      <NavigationBar />
      <main className="relative container flex min-h-screen flex-col">
        <div className="flex flex-1 py-4">
          <div className="w-full">
            <SummaryList data={data} />
          </div>
        </div>
      </main>
    </>
  );
}

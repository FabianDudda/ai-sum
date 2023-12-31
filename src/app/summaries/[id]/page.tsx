import { NavigationBar } from "@/components/navigation/navigation-bar";

async function getData(summaryId: any) {
  // no-cache for refetch data on every page reload
  const res = await fetch(`http://localhost:3000/api/summaries/${summaryId}`, {
    cache: "no-cache",
  });
  // The return value is *not* serialized
  // You can return Date, Map, Set, etc.

  if (!res.ok) {
    // This will activate the closest `error.js` Error Boundary
    throw new Error("Failed to fetch data");
  }

  return res.json();
}

export default async function Page({ params }: { params: any }) {
  const data = await getData(params.id);

  return (
    <>
      <NavigationBar />
      <main className="relative container flex min-h-screen flex-col">
        <div className="flex flex-1 py-4">
          <div className="w-full">
            <p className="font-bold">Title</p>
            <p>{data.title}</p>
          </div>
        </div>
        <div className="flex flex-1 py-4">
          <div className="w-full">
            <p className="font-bold">Summary</p>

            <p style={{ whiteSpace: "pre-line" }}>{data.text.summary.replace("\n\n", "")}</p>
          </div>
        </div>
      </main>
    </>
  );
}

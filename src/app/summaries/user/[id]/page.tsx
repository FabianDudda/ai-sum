import { NavigationBar } from "@/components/navigation-bar";
import { SummaryList } from "@/components/summary-list";

import { useSession } from "next-auth/react";

async function getData(userId: String) {
  // no-cache for refetch data on every page reload
  const res = await fetch(`http://localhost:3000/api/summaries/user/${userId}`, {
    method: "GET",
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
  // user object
  // console.log("useSession(): ", useSession());

  // const data = await getData("6590469d09a14d335d686175");

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

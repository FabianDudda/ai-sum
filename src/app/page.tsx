import { NavigationBar } from "@/components/navigation-bar";

import { UserInfo } from "@/components/user-info";
export default async function Home() {
  return (
    <>
      <NavigationBar />
      <main className="relative container flex min-h-screen flex-col">
        <div>Home</div>

        <UserInfo />
      </main>
    </>
  );
}

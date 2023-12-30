"use client";

import Image from "next/image";
import { SignInBtn } from "./signin-btn";
import { useSession } from "next-auth/react";

export function UserInfo() {
  const { status, data: session } = useSession();
  console.log(useSession());

  if (status === "authenticated") {
    return (
      <div className="rounded-2xl border h-auto w-full max-w-3xl flex flex-col justify-between p-4">
        <Image
          className="rounded-full"
          src={session?.user?.image || ""}
          width={60}
          height={60}
          alt={""}
        />
        <div>
          Name: <span className="font-bold">{session?.user?.name}</span>
        </div>
        <div>
          Email: <span className="font-bold">{session?.user?.email}</span>
        </div>
      </div>
    );
  } else {
    return <SignInBtn />;
  }
}

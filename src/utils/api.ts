// utils/api.ts
import { NextResponse } from "next/server";
import { ChainValues } from "langchain/schema";

export interface FormData {
  title: string;
  text: string;
  source: string;
}

// Insert formdata (user input) and docs (chain result) into MongoDB
export async function insertDataToDatabase(formData: FormData, docs: ChainValues, userId: String) {
  console.log("formData: ", formData, docs);

  const res = await fetch("http://localhost:3000/api/summaries", {
    method: "POST",
    // cache: "no-cache", // for refetch data on every page reload
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title: formData.title,
      text: {
        original: formData.text,
        summary: docs.text,
      },
      source: formData.source,
      userId: userId,
    }),
  });

  // The return value is *not* serialized
  // You can return Date, Map, Set, etc.

  if (!res.ok) {
    // This will activate the closest `error.js` Error Boundary
    throw new Error("Failed to fetch data");
  }

  return res.json();
}

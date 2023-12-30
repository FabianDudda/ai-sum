import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import Summary from "@/models/summary";

// To handle a GET request to /api/summaries/user/[id]
// Return all summaries by userId
export async function GET(request, { params }) {
  const userId = params.id;

  await connectMongoDB();

  // const userId = "6590469d09a14d335d686175";

  const filter = { userId: userId };
  const allSummarys = await Summary.find(filter);

  return NextResponse.json(allSummarys, { status: 200 });
}

// Same logic to add a `PATCH`, `DELETE`...
export const revalidate = 10;

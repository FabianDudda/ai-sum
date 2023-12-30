import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import Summary from "@/models/summary";

// To handle a GET request to /api/summaries/[id]
// Return summary by summaryId
export async function GET(request, { params }) {
  const id = params.id;

  await connectMongoDB();
  const filter = { _id: id };
  const summaryById = await Summary.findOne(filter);

  return NextResponse.json(summaryById, { status: 200 });
}

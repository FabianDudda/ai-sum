import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import Summary from "@/models/summary";
import User from "@/models/user";

// To handle a GET request to /api/summaries
// Return all summarys
export async function GET(request) {
  await connectMongoDB();

  const allSummarys = await Summary.find({});

  return NextResponse.json(allSummarys, { status: 200 });
}

// To handle a POST request to /api/summaries
// Insert summary in db with userId
export async function POST(request) {
  const {
    title,
    text: { original, summary },
    source,
    userEmail,
  } = await request.json();
  await connectMongoDB();

  const userByEmail = await User.findOne({ userEmail });

  const userId = userByEmail._id.toString();

  await Summary.create({ title, text: { original, summary }, source, userId });
  return NextResponse.json({ message: "Summary saved" }, { status: 201 });
}

// Same logic to add a `PATCH`, `DELETE`...
export const revalidate = 10;

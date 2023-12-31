import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import Summary from "@/models/summary";
import User from "@/models/user";

import { getSession } from "next-auth/react";

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
    text: { summary, original },
    source,
    userId,
  } = await request.json();

  await connectMongoDB();

  await User.updateOne({ _id: userId }, { $inc: { credits: -1 } });
  const newSummary = await Summary.create({ title, text: { summary, original }, source, userId });
  return NextResponse.json(newSummary, { status: 201 });
}

// Same logic to add a `PATCH`, `DELETE`...
export const revalidate = 10;

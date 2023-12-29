import { NextResponse } from "next/server";
import clientPromise from "../../../lib/mongodb";

// To handle a GET request to /api
export async function GET(request) {
  const client = await clientPromise;
  const db = client.db("sciencesnack");

  const summarys = await db.collection("summarys").find({}).toArray();

  return NextResponse.json(summarys, { status: 200 });
}

// To handle a POST request to /api
export async function POST(request) {
  const client = await clientPromise;
  const db = client.db("sciencesnack");

  const body = await request.json();

  const response = await db.collection("summarys").insertOne(body);
  // Do whatever you want
  return NextResponse.json(response, { status: 200 });
}

// Same logic to add a `PATCH`, `DELETE`...
export const revalidate = 10;

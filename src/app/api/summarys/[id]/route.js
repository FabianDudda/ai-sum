import { NextResponse } from "next/server";
import clientPromise from "../../../../lib/mongodb";
import { ObjectId } from "mongodb";

// To handle a GET request to /api/summarys/[id]
export async function GET(request, { params }) {
  const id = params.id;
  const objectId = new ObjectId(id);

  const client = await clientPromise;
  const db = client.db("sciencesnack");

  const summary = await db.collection("summarys").findOne({ _id: objectId });

  return NextResponse.json(summary, { status: 200 });
}

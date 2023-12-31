import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import User from "@/models/user";

// To handle a POST request to /api/users
export async function POST(request) {
  const { name, email, credits, googleId } = await request.json();

  await connectMongoDB();
  await User.create({ name, email, credits, googleId });
  return NextResponse.json({ message: "User Registered" }, { status: 201 });
}

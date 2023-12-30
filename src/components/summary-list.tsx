"use client";

import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import React, { useState, useEffect, ChangeEvent } from "react";

export async function SummaryList({ data }: { data: any[] }) {
  // user object
  // console.log("useSession(): ", useSession());
  // const data = await getData("6590469d09a14d335d686175");

  return (
    <div>
      <h1 className="text-2xl pb-2">Summary List</h1>

      <div className="rounded-2xl border h-auto flex flex-col justify-between">
        <div className="flex flex-col py-4 px-4">
          <div className="w-full">
            <div>
              {data.map((item, index) => (
                <Card key={index} className="w-full  mb-4">
                  <CardHeader>
                    <CardTitle>{item.title || "Title"}</CardTitle>
                    <CardDescription>Short description...</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Label htmlFor="name">Summary</Label>

                    <CardDescription style={{ whiteSpace: "pre-line" }}>
                      {item.text.summary.replace("\n\n", "")}
                    </CardDescription>
                  </CardContent>
                  <CardContent>
                    <Label htmlFor="name">Category</Label>
                    <CardDescription> Science, Health </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect, ChangeEvent } from "react";

import { OpenAI } from "langchain/llms/openai";
import { loadSummarizationChain } from "langchain/chains";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { ChainValues } from "langchain/schema";
import { PromptTemplate } from "langchain/prompts";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import { useSession } from "next-auth/react";

async function insertDataToDatabase(formData: FormData, docs: ChainValues) {
  console.log("formData: ", formData);

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
      userId: formData.userEmail,
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

interface FormData {
  title: string;
  text: string;
  source: string;
  userEmail: string;
}

export function LlmMapReduce() {
  // user object
  const { status, data } = useSession();
  console.log("useSession(): ", useSession());
  // formData: title, text, source
  const [formData, setFormData] = useState<FormData>({
    title: "",
    text: "",
    source: "",
    userEmail: data?.user?.email || "",
  });
  // formData: texttype
  const [textType, setTextType] = useState<string>("standard"); // Default type is standard
  // formData: summarizationOptions
  const [summarizationOptions, setSummarizationOptions] = useState<string>("standard"); // Default is standard
  // estimated Tokens
  const [estimatedTokens, setEstimatedTokens] = useState<number>();
  // llm response
  const [response, setResponse] = useState<any>({});
  // objectId from api response
  const [summaryId, setSummaryId] = useState<string>("");

  // Customize combineMapPromptTemplate based on textType
  const getCombineMapPromptTemplate = (textType: string) => {
    switch (textType) {
      case "standard": // Default
        return `Write a concise summary in bullet points: "{text}"`;
      case "scientific":
        return `Write a concise summary in bullet points: "{text}"`;
      case "news":
        return `Write a concise summary in bullet points: "{text}"`;
      case "website":
        return `Write a concise summary in bullet points: "{text}"`;
      default:
        return `Write a concise summary in bullet points: "{text}"`;
    }
  };

  // Customize combinePromptTemplate based on summarizationOptions
  const getCombinePromptTemplate = (summarizationOptions: string) => {
    switch (summarizationOptions) {
      case "standard": // Default
        return `As a professional summarizer for blinkist, create a concise and comprehensive summary of the provided text -
        The text will be enclosed in triple hashtags (###) - while adhering to these guidelines:
        1. Craft a summary that is concise and to the point with a well-organized structure.
        2. Write in a natural and conversational language with an engaging and informative tone.
        3. Incorporate main ideas and essential information, eliminating extraneous language and focusing on critical aspects.
        4. Rely strictly on the provided text, without including external information.
        5. Your response should be at least three paragraphs and fully encompass what was said in the text.
        ###"{text}"###`;
      case "friendly":
        return `As a friendly summarizer for blinkist, create a concise and easy-to-understand summary of the provided text -
        The text will be enclosed in triple hashtags (###) - while adhering to these guidelines:
        1. Craft a summary that is concise and to the point with a well-organized structure.
        2. Write in a natural and conversational language with an engaging and informative tone.
        3. Incorporate main ideas and essential information, eliminating extraneous language and focusing on critical aspects.
        4. Rely strictly on the provided text, without including external information.
        5. Your response should be at least three paragraphs and fully encompass what was said in the text.
        ###"{text}"###`;
      case "technical":
        return `As a technical summarizer for blinkist, create a detailed and technical summary of the provided text -
        The text will be enclosed in triple hashtags (###) - while adhering to these guidelines:
        1. Craft a summary that is concise and to the point with a well-organized structure.
        2. Write in a natural and conversational language with an engaging and informative tone.
        3. Incorporate main ideas and essential information, eliminating extraneous language and focusing on critical aspects.
        4. Rely strictly on the provided text, without including external information.
        5. Your response should be at least three paragraphs and fully encompass what was said in the text.
        ###"{text}"###`;
      default:
        return `As a professional summarizer for blinkist, create a concise and comprehensive summary of the provided text -
        The text will be enclosed in triple hashtags (###) - while adhering to these guidelines:
        1. Craft a summary that is concise and to the point with a well-organized structure.
        2. Write in a natural and conversational language with an engaging and informative tone.
        3. Incorporate main ideas and essential information, eliminating extraneous language and focusing on critical aspects.
        4. Rely strictly on the provided text, without including external information.
        5. Your response should be at least three paragraphs and fully encompass what was said in the text.
        ###"{text}"###`;
    }
  };

  // PromptTemplate for intermediate summary step
  const combineMapPrompt = new PromptTemplate({
    template: getCombineMapPromptTemplate(textType),
    inputVariables: ["text"],
  });

  // PromptTemplate for final summary step
  const combinePrompt = new PromptTemplate({
    template: getCombinePromptTemplate(summarizationOptions),
    inputVariables: ["text"],
  });

  // Create textSplitter
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 4000,
    chunkOverlap: 200,
  });

  // Event handler for form input changes
  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
    const { name, value } = event.target;

    // Check if input text is under 20.000 characters
    if (value.length < 20000)
      // Event handler for form input changes
      setFormData((prevFormData) => ({
        ...prevFormData,
        [name]: value,
      }));
    else {
      console.log("Input text is too long");
    }
  };

  // Event handler for form submit
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      // Create llm
      const model = new OpenAI({
        maxTokens: 1000,
        openAIApiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
        temperature: 0,
      });

      const docs = await textSplitter.createDocuments([formData.text]);
      console.log("chunkedDocs:", docs);

      // Calculate estimated tokens (calc tokens for one chunkedDoc * (number of chunkedDocs + 1))
      const tokens = (await model.getNumTokens(docs[0].pageContent)) * (docs.length + 1);
      setEstimatedTokens(tokens);
      console.log("estimated tokens:", tokens);

      // Create llm chain
      const chain = loadSummarizationChain(model, {
        type: "map_reduce",
        combineMapPrompt: combineMapPrompt,
        combinePrompt: combinePrompt,
        returnIntermediateSteps: true,
        // verbose: true,
      });

      // Call llm chain
      const res = await chain.call({
        input_documents: docs,
      });
      setResponse(res);
      console.log("response:", res);

      // Insert data to db
      const apiResponse = await insertDataToDatabase(formData, res);
      setSummaryId(apiResponse.insertedId);
    } catch (e) {
      console.error(e);
      throw new Error("Something failed");
    }
  };

  if (status === "authenticated") {
    return (
      <div className="flex flex-col items-center">
        <div className="w-full max-w-3xl">
          <h1 className="text-2xl">Summarize a text with mapReduce</h1>
          max. characters: 20.000 (~ 3.000 words)
          <br />
          chunkSize: 4000
          <br />
          chunkOverlap: 200
          <br />
          <br />
        </div>
        <div className="rounded-2xl border h-auto w-full max-w-3xl flex flex-col justify-between">
          <div className="p-4 overflow-auto">
            <Accordion
              type="single"
              defaultValue="item-main-response"
              collapsible
              className="w-full"
            >
              {/* Render text from intermediateSteps if available */}
              {response.intermediateSteps && (
                <div>
                  <p className="font-bold">summaries:</p>
                  {response.intermediateSteps.map((step: string, stepIndex: number) => (
                    <AccordionItem key={stepIndex} value={`item-${stepIndex}`}>
                      <AccordionTrigger>ChunkedDoc No: {stepIndex}</AccordionTrigger>
                      <AccordionContent>
                        <div style={{ whiteSpace: "pre-line" }}>{step.replace("\n\n", "")}</div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </div>
              )}
              {response.text && (
                <div>
                  <AccordionItem value={`item-main-response`}>
                    <AccordionTrigger>Main Response:</AccordionTrigger>
                    <AccordionContent>
                      <div style={{ whiteSpace: "pre-line" }}>
                        {response.text.replace("\n\n", "")}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                  <p className="font-bold">Share your summary:</p>
                  <p>localhost:3000/summaries/{summaryId}</p>
                  <p className="font-bold">Estimated Token Cost:</p> <p>{estimatedTokens}</p>{" "}
                </div>
              )}
            </Accordion>
          </div>
          <form onSubmit={handleSubmit} className="grid w-full gap-1.5 space-y-2 p-4">
            <div className="w-auto">
              <Label>Text</Label>
              <Textarea
                name="text"
                value={formData.text}
                onChange={handleChange}
                placeholder="Enter your text here"
                className="min-h-60"
              />
              <p className="text-xs text-muted-foreground text-neutral-500 dark:text-neutral-400">
                Max 16.000 characters allowed.
              </p>
            </div>
            <div className="w-auto">
              <Label>Title</Label>
              <Input
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Title"
              />
            </div>
            <div className="w-auto">
              <Label>Source</Label>
              <Input
                name="source"
                value={formData.source}
                onChange={handleChange}
                placeholder="Source URL"
              />
            </div>
            <div className="w-auto">
              <Label>Type</Label>
              <Select onValueChange={setTextType}>
                <SelectTrigger>
                  <SelectValue placeholder="Standard" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="news">News</SelectItem>
                    <SelectItem value="scientific">Scientific paper</SelectItem>
                    <SelectItem value="website">Website</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="w-auto">
              <Label>Options</Label>
              <Select onValueChange={setSummarizationOptions}>
                <SelectTrigger>
                  <SelectValue placeholder="Standard" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="friendly">Friendly</SelectItem>
                    <SelectItem value="technical">Technical</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-auto">
              Summarize
            </Button>
          </form>
        </div>
      </div>
    );
  } else {
    return <>Not authenticated</>;
  }
}

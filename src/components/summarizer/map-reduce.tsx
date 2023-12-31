"use client";

import React, { useState, ChangeEvent } from "react";
import { useSession } from "next-auth/react";

import { OpenAI } from "langchain/llms/openai";
import { loadSummarizationChain } from "langchain/chains";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { PromptTemplate } from "langchain/prompts";

import { FormData, insertDataToDatabase } from "@/utils/api";

import { getCombinePromptTemplate, getCombineMapPromptTemplate } from "@/utils/promptTemplate";

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

export function LlmMapReduce() {
  // session
  const { status, data: session } = useSession();
  console.log(session);
  // formData: title, text, source, userId
  const [formData, setFormData] = useState<FormData>({
    title: "",
    text: "",
    source: "",
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
  const [summaryId, setSummaryId] = useState<String>("");

  // Event handler for form input changes
  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
    const { name, value } = event.target;
    console.log(formData);
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

    // @ts-ignore // Check user role and limit form submissions
    if (session?.user?.credits <= 0) {
      console.log("Not enough credits.");
      throw new Error("Not enough credits.");
    }

    try {
      // OpenAi LLM Model
      const model = new OpenAI({
        maxTokens: 1000,
        openAIApiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
        temperature: 0,
      });

      // TextSplitter for chunkSize and chunkOverlap
      const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 4000,
        chunkOverlap: 200,
      });

      // Chunked docs
      const chunkedDocs = await textSplitter.createDocuments([formData.text]);
      console.log("chunkedDocs:", chunkedDocs);

      // Calculate estimated tokens (calc tokens for one chunkedDoc * (number of chunkedDocs + 1))
      const tokens =
        (await model.getNumTokens(chunkedDocs[0].pageContent)) * (chunkedDocs.length + 1);
      setEstimatedTokens(tokens);
      console.log("estimated tokens:", tokens);

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

      // MapReduce Chain
      const chain = loadSummarizationChain(model, {
        type: "map_reduce",
        returnIntermediateSteps: true,
        // verbose: true,
        combineMapPrompt: combineMapPrompt,
        combinePrompt: combinePrompt,
      });

      // Call chain
      const chainResponse = await chain.call({
        input_documents: chunkedDocs,
      });
      setResponse(chainResponse);
      console.log("chainResponse:", chainResponse);

      // @ts-ignore // Insert data to MongoDB and get the summaryId back
      const newSummary = await insertDataToDatabase(formData, chainResponse, session?.user?._id);
      setSummaryId(newSummary._id);
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

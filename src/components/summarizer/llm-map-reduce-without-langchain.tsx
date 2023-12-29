"use client";

import { OpenAI } from "langchain/llms/openai";
import { loadSummarizationChain } from "langchain/chains";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useState, ChangeEvent } from "react";

import { BaseCallbackConfig } from "langchain/callbacks";
import { collapseDocs, splitListOfDocs } from "langchain/chains/combine_documents/reduce";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { PromptTemplate } from "langchain/prompts";
import { ChainValues } from "langchain/schema";

import { Document } from "langchain/document";
import { StringOutputParser } from "langchain/schema/output_parser";
import { formatDocument } from "langchain/schema/prompt_template";
import { RunnablePassthrough, RunnableSequence } from "@langchain/core/runnables";
import { metadata } from "@/app/layout";
import { text } from "stream/consumers";

async function insertDataToDatabase(formData: FormData, summary: String) {
  // no-cache for refetch data on every page reload
  const res = await fetch("http://localhost:3000/api/summarys", {
    method: "POST",
    cache: "no-cache",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title: formData.title,
      text: {
        original: formData.text,
        summary: summary,
      },
      source: formData.source,
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
}

export function LlmMapReduceWithoutLangchain() {
  const [formData, setFormData] = useState<FormData>({
    title: "",
    text: "",
    source: "",
  });
  const [mapResponse, setMapResponse] = useState<any[]>([]);
  const [combineResponse, setCombineResponse] = useState<string>("");

  // Event handler for form input changes
  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
    const { name, value } = event.target;

    console.log("name: ", name);
    console.log("value: ", value);

    // Check if input text is under 150.000 characters
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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    // Hier kannst du Logik für das Absenden des Formulars hinzufügen
    console.log("click");

    // Define prompt templates for document step #1 mapPrompt and step #2 combinePrompt
    // step #1 map prompt: Summarize each chunkedDoc
    // step #2 combine prompt: Summarize all summaries
    const mapPromptTemplate = `Write a concise summary in bullet points: "{text}"`;

    const combinePromptTemplate = `As a professional summarizer for blinkist, create a concise and comprehensive summary of the provided text -
    The text will be enclosed in triple hashtags (###) - while adhering to these guidelines:
    1. Craft a summary that is concise and to the point with a well-organized structure.
    2. Write in a natural and conversational language with an engaging and informative tone.
    3. Incorporate main ideas and essential information, eliminating extraneous language and focusing on critical aspects.
    4. Rely strictly on the provided text, without including external information.
    5. Your response should be at least three paragraphs and fully encompass what was said in the text.
    ###"{text}"###
    `;

    try {
      // Create language model
      const model = new OpenAI({
        maxTokens: 1000,
        openAIApiKey: "NEXT_PUBLIC_OPENAI_API_KEY",
        temperature: 0,
      });

      // Splitting text
      const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 4000,
        chunkOverlap: 200,
      });
      const docs = await textSplitter.createDocuments([formData.text]);

      console.log("chunkedDocs:", docs);

      const tokens = await model.getNumTokens(docs[0].pageContent);

      console.log("estimated tokens:", tokens * 5);

      const mapPrompt = new PromptTemplate({
        template: mapPromptTemplate,
        inputVariables: ["text"],
      });

      const combinePrompt = new PromptTemplate({
        template: combinePromptTemplate,
        inputVariables: ["text"],
      });

      const mapChain = mapPrompt.pipe(model);

      // Execute mapPrompt on every chunked doc and return an array of the summaries
      const summarizeEachChunkedDoc = async (array: Document[]): Promise<String[]> => {
        const summaries = await Promise.all(
          array.map((item) => {
            const result = mapChain.invoke({
              text: item.pageContent,
            });
            return result;
          })
        );
        return summaries;
      };

      // Summaries of the chunkedDocs
      setMapResponse(await summarizeEachChunkedDoc(docs));
      console.log("mapResponse: ", await summarizeEachChunkedDoc(docs));

      // Combine array of summaries into one string
      const summariesOfAllChunkedDocs = (await summarizeEachChunkedDoc(docs)).join("\n");

      //TODO: If mapResponse is too big for combinePrompt, summarize it again
      console.log("mapSummaries length: ", summariesOfAllChunkedDocs.length);

      const tokens2 = await model.getNumTokens(summariesOfAllChunkedDocs);

      console.log("estimated tokens for combineSummary:", tokens2);

      const combineChain = combinePrompt.pipe(model);

      // Execute combinePrompt on
      const summarizeAllSummaries = await combineChain.invoke({
        text: summariesOfAllChunkedDocs,
      });

      // Summary of the summaries
      setCombineResponse(summarizeAllSummaries);
      console.log("combineResponse: ", summarizeAllSummaries);

      await insertDataToDatabase(formData, summarizeAllSummaries);
    } catch (e) {
      console.error(e);
      throw new Error("Something failed");
    }
  };

  return (
    <div>
      <h1 className="text-2xl">mapReduce without langchain</h1>
      max. characters: 20.000
      <br />
      chunkSize: 4000
      <br />
      chunkOverlap: 200
      <br />
      <br />
      <div className="rounded-2xl border h-[75vh] flex flex-col justify-between">
        <div className="p-6 overflow-auto">
          {mapResponse.map((item, index) => (
            <div key={index}>
              <br />
              Summary of chunk no. {index} <br />
              {item}
              {/* Render text from intermediateSteps if available */}
              {item.intermediateSteps && (
                <div>
                  <p>Intermediate Steps:</p>
                  {item.intermediateSteps.map((step: string, stepIndex: number) => (
                    <p key={stepIndex}>
                      Intermediate Step No: {stepIndex} <br />
                      {step}
                    </p>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Render text from the main response */}
          <div>
            <br />
            {combineResponse && <p>Main Response:</p>}
            {combineResponse}
          </div>
        </div>
        <form onSubmit={handleSubmit} className="grid w-full gap-1.5 space-y-6 p-4">
          <div>
            <Input
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Title"
            />
            <Textarea
              name="text"
              value={formData.text}
              onChange={handleChange}
              placeholder="Enter your text here"
            />
            <Input
              name="source"
              value={formData.source}
              onChange={handleChange}
              placeholder="Source URL"
            />
            {/* <Input name="doi" value={formData.doi} onChange={handleChange} placeholder="DOI" /> */}
            <p className="text-xs text-muted-foreground">Max 16.000 characters allowed.</p>
          </div>
          <Button type="submit" className="w-24">
            Summarize
          </Button>
        </form>
      </div>
    </div>
  );
}

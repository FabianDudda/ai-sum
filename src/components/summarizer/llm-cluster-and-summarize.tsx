"use client";

import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { PromptTemplate } from "langchain/prompts";

// import kmeans from "k-means";
import { kmeans } from "ml-kmeans";

import { OpenAI } from "langchain/llms/openai";
import { loadSummarizationChain } from "langchain/chains";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

import { Button } from "../ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import React, { useState, ChangeEvent } from "react";

import { ChainValues } from "langchain/schema";

async function insertDataToDatabase(formData: FormData, docs: ChainValues) {
  // no-cache for refetch data on every page reload
  const res = await fetch("http://localhost:3000/api/summaries", {
    method: "POST",
    cache: "no-cache",
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

export function LlmClusterAndSummarize() {
  const [response, setResponse] = useState<any[]>([]);
  const [formData, setFormData] = useState<FormData>({
    title: "",
    text: "",
    source: "",
  });

  // Event handler for form input changes
  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
    const { name, value } = event.target;

    // Check if input text is under 150.000 characters
    if (value.length < 150000)
      // Event handler for form input changes
      setFormData((prevFormData) => ({
        ...prevFormData,
        [name]: value,
      }));
    else {
      console.log("Input text is too long");
    }
  };

  const combineMapPromptTemplate = `Write a concise summary in bullet points: "{text}"`;

  const combinePromptTemplate = `
  As a professional summarizer for blinkist, create a concise and comprehensive summary of the provided text -
  The text will be enclosed in triple hashtags (###) - while adhering to these guidelines:
  1. Craft a summary that is concise and to the point with a well-organized structure.
  2. Write in a natural and conversational language with an engaging and informative tone.
  3. Incorporate main ideas and essential information, eliminating extraneous language and focusing on critical aspects.
  4. Rely strictly on the provided text, without including external information.
  5. Your response should be at least three paragraphs and fully encompass what was said in the text.

  ###"{text}"###
  `;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      // Create language model
      const model = new OpenAI({
        maxTokens: 1000,
        openAIApiKey: "NEXT_PUBLIC_OPENAI_API_KEY",
        temperature: 0,
      });

      // Splitting text
      const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 6000,
        chunkOverlap: 200,
      });
      const docs = await textSplitter.createDocuments([formData.text]);

      console.log("chunkedDocs: ", docs);

      const embeddings = new OpenAIEmbeddings({
        openAIApiKey: "NEXT_PUBLIC_OPENAI_API_KEY",
      });

      const arrayOfStrings = docs.map((doc) => doc.pageContent);

      // // An die Funktion übergeben
      const vectors = await embeddings.embedDocuments(arrayOfStrings);

      console.log(vectors);

      const closestIndices: number[] = [];

      // Number of clusters (K)
      const k: number = 8;

      // Run K-Means clustering
      const result = kmeans(vectors, k, { initialization: "kmeans++" });

      // Print the cluster centroids and data points with their assigned cluster
      console.log(result);

      // Function to calculate the Euclidean norm (distance) between two vectors
      const euclideanNorm = (a: number[], b: number[]): number => {
        if (a.length !== b.length) {
          throw new Error("Vectors must have the same length");
        }

        return Math.sqrt(a.reduce((sum, value, index) => sum + Math.pow(value - b[index], 2), 0));
      };

      // Loop through the clusters
      for (let i = 0; i < k; i++) {
        // Get the list of distances from that particular cluster center
        const distances = vectors.map((vector) => euclideanNorm(vector, result.centroids[i]));

        // Find the list position of the closest one (using argmin to find the smallest distance)
        const closestIndex = distances.indexOf(Math.min(...distances));

        // console.log(closestIndex);

        // Append that position to your closest indices list
        closestIndices.push(closestIndex);
      }

      // Sorting the array in ascending order
      const selectedIndices: number[] = [...closestIndices].sort((a, b) => a - b);
      console.log("Ascending Order:", selectedIndices);

      // Select docs based on indices in selectedIndices
      const selectedDocs = selectedIndices.map((index) => docs[index]);

      console.log("selected chunkedDocs (after clustering):", selectedDocs);

      const combinePrompt = new PromptTemplate({
        template: combinePromptTemplate,
        inputVariables: ["text"],
      });

      const combineMapPrompt = new PromptTemplate({
        template: combineMapPromptTemplate,
        inputVariables: ["text"],
      });

      // This convenience function creates a document chain prompted to summarize a set of documents.
      const chain = loadSummarizationChain(model, {
        type: "map_reduce",
        verbose: true,
        returnIntermediateSteps: true,
        combinePrompt: combinePrompt,
        combineMapPrompt: combineMapPrompt,
      });
      const res = await chain.call({
        input_documents: selectedDocs,
      });
      console.log("res:", res);

      setResponse([res]);

      await insertDataToDatabase(formData, res);
    } catch (e) {
      console.error(e);
      throw new Error("Something failed");
    }
  };

  return (
    <div>
      <h1 className="text-2xl">Cluster Pages and Summarize just one page for each cluster</h1>
      max. characters: 200.000
      <br />
      chunkSize: 6000
      <br />
      chunkOverlap: 200
      <br />
      number of clusters: 8
      <br />
      <br />
      <div className="rounded-2xl border h-[75vh] flex flex-col justify-between">
        <div className="p-6 overflow-auto">
          {response.map((item, index) => (
            <div key={index}>
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

              {/* Render text from the main response */}
              <p>Main Response: {item.text}</p>
              <p>Estimated tokens: ~ 10.000 = 4.000 chunksize * 10 selected Pages</p>
            </div>
          ))}
        </div>
        {/* <form onSubmit={handleSubmit} className="p-4 flex clear-both">
          <Button type="submit" className="w-24">
            Generate
          </Button>
        </form> */}
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

// utils/promptTemplate.ts

// Customize combineMapPromptTemplate based on textType
export const getCombineMapPromptTemplate = (textType: string) => {
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
export const getCombinePromptTemplate = (summarizationOptions: string) => {
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

import dotenv from "dotenv";
dotenv.config();
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { createClient } from "@supabase/supabase-js";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { OpenAIEmbeddings } from "@langchain/openai";

function purifyText(content) {
  // Remove URLs
  content = content.replace(/https?:\/\/\S+/g, "");
  // Standardize and format certain sections
  content = content.replace("Athens User:", "User Type: Athens User");
  // Remove phone numbers
  content = content.replace(/\(\d{3}\) \d{3}-\d{4}/g, "[Phone Number Removed]");
  // Remove emails
  content = content.replace(/\S+@\S+\.\S+/g, "[Email Removed]");
  // Optional: Trim extra spaces and format newlines for readability
  content = content.replace(/\s+/g, " ").trim();

  return content;
}

async function embeddedBloodReport() {
  try {
    const loader = new PDFLoader("./test.pdf");
    const docs = await loader.load();
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
    const openAiKey = process.env.OPENAI_API_KEY;
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      separators: ["\n\n", "\n", " ", "", "##", "[\n"],
      chunkOverlap: 190,
    });
    let arr = [];
    for (const item of docs) {
      const docOutput = await splitter.createDocuments([
        purifyText(item.pageContent),
      ]);
      arr = [...arr, ...docOutput];
    }
    const texts = arr.map((item) => item.pageContent);
    const client = await createClient(supabaseUrl, supabaseAnonKey);
    console.log(arr.length);
    const text = arr.map((item) => item.pageContent);
    const metaData = arr.map((item) => item.metadata);
    const vectorStore = await SupabaseVectorStore.fromTexts(
      text,
      metaData,
      new OpenAIEmbeddings({
        openAIApiKey: openAiKey,
      }),
      {
        client,
        tableName: "documents",
      }
    );
  } catch (error) {
    console.log(error);
  }
}

// embeddedBloodReport();

import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { Document } from "langchain/document";

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
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      separators: ["\n\n", "\n", " ", "", "##", "[\n"],
      chunkOverlap: 190,
    });
    const arr = [];
    Array.isArray(docs) &&
      docs.length > 0 &&
      docs.forEach(async (item) => {
        const docOutput = await splitter
          .createDocuments([purifyText(item.pageContent)])
          .then((item) => {
            console.log(item);
          });
      });
    console.log(arr);
  } catch (error) {
    console.log(error);
  }
}

embeddedBloodReport();

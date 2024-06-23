import { SimpleDirectoryReader } from "llamaindex";

export const DATA_DIR = "./data";

export async function getDocuments() {
  return await new SimpleDirectoryReader().loadData({
    directoryPath: DATA_DIR,
  });
}

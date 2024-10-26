import { ChunkReqPayload, TrieveSDK } from "trieve-ts-sdk";
import * as fs from "node:fs";
import { DocumentRecord } from "fumadocs-core/search/algolia";
import { env } from "node:process";
import "dotenv/config";

let trieve = new TrieveSDK({
  apiKey: env["NEXT_PUBLIC_TRIEVE_API_KEY"] as string,
  datasetId: env["NEXT_PUBLIC_TRIEVE_DATASET_ID"] as string,
});

const content = fs.readFileSync(".next/server/app/static.json.body");

const pages = JSON.parse(content.toString()) as DocumentRecord[];

sync(trieve, pages);

async function sync(trieve: TrieveSDK, pages: DocumentRecord[]) {
  let documents = pages.flatMap(toTrievePayload);
  const chunkSize = 120;
  const chunks = [];
  for (let i = 0; i < documents.length; i += chunkSize) {
    const chunk = documents.slice(i, i + chunkSize);
    chunks.push(chunk);
  }
  for (const chunk of chunks) {
    trieve.createChunk(chunk);
  }
}

function toTrievePayload(page: DocumentRecord) {
  let id = 0;
  const chunks: ChunkReqPayload[] = [];
  const scannedHeadings = new Set<string>();

  function createPayload(
    section: string | undefined,
    sectionId: string | undefined,
    content: string,
  ): ChunkReqPayload {
    return {
      tracking_id: `${page._id}-${(id++).toString()}`,
      chunk_html: content,
      link: page.url,
      tag_set: page.tag ? [page.tag] : [],
      metadata: {
        title: page.title,
        section: section || "",
        section_id: sectionId || "",
        page_id: page._id,
      },
      group_tracking_ids: [page.title],
    };
  }

  if (page.description)
    chunks.push(createPayload(undefined, undefined, page.description));

  page.structured.contents.forEach((p) => {
    const heading = p.heading
      ? page.structured.headings.find((h) => p.heading === h.id)
      : null;

    const index = createPayload(heading?.content, heading?.id, p.content);

    if (heading && !scannedHeadings.has(heading.id)) {
      scannedHeadings.add(heading.id);

      chunks.push(createPayload(heading.content, heading.id, heading.content));
    }

    chunks.push(index);
  });

  return chunks;
}

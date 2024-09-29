import { CoreUserContentPart } from "./AssistantTypes";

export type PendingAttachmentStatus =
  | {
      type: "running";
      reason: "uploading";
      progress: number;
    }
  | {
      type: "requires-action";
      reason: "composer-send";
    }
  | {
      type: "incomplete";
      reason: "error" | "upload-paused";
    };

export type CompleteAttachmentStatus = {
  type: "complete";
};

export type AttachmentStatus =
  | PendingAttachmentStatus
  | CompleteAttachmentStatus;

type BaseAttachment = {
  id: string;
  type: "image" | "document" | "file";
  name: string;
  // TODO mark as required in 0.6.0
  contentType?: string;
  file?: File;
  content?: CoreUserContentPart[];
};

export type PendingAttachment = BaseAttachment & {
  status: PendingAttachmentStatus;
  file: File;
};

export type CompleteAttachment = BaseAttachment & {
  status: CompleteAttachmentStatus;
  content: CoreUserContentPart[];
};

export type Attachment = PendingAttachment | CompleteAttachment;

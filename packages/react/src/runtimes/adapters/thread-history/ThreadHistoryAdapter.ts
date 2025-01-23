import {
  ExportedMessageRepository,
  ExportedMessageRepositoryItem,
} from "../../utils/MessageRepository";

// TODO external store - which version to save? how to restore?
export type ThreadHistoryAdapter<TMessage> = {
  load(): Promise<ExportedMessageRepository>;
  append(item: ExportedMessageRepositoryItem): Promise<void>;
};

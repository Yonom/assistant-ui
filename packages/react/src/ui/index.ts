export {
  ThreadConfigProvider,
  useThreadConfig,
  type ThreadConfig,
  type ThreadWelcomeConfig,
  type UserMessageConfig,
  type AssistantMessageConfig,
  type StringsConfig,
  type SuggestionConfig,
  type ThreadConfigProviderProps,
} from "./thread-config";

export { default as AssistantActionBar } from "./assistant-action-bar";

export { default as AssistantMessage } from "./assistant-message";

export { default as AssistantModal } from "./assistant-modal";

export { default as BranchPicker } from "./branch-picker";

export { default as Composer } from "./composer";

export {
  default as AttachmentUI, // TODO name collision with Attachment
} from "./attachment";

export { default as EditComposer } from "./edit-composer";

export { default as Thread } from "./thread";

export { default as UserMessage } from "./user-message";

export { default as UserActionBar } from "./user-action-bar";

export { default as ThreadWelcome } from "./thread-welcome";

export { default as ContentPart } from "./content-part";

import {
  type StateCreator,
  type StoreApi,
  type UseBoundStore,
  create,
} from "zustand";

type BaseComposerState = {
  value: string;
  setValue: (value: string) => void;
};

const makeBaseComposer: StateCreator<
  BaseComposerState,
  [],
  [],
  BaseComposerState
> = (set) => ({
  value: "",
  setValue: (value) => {
    set({ value });
  },
});

type MessageComposerState = BaseComposerState & {
  isEditing: boolean;
  canCancel: true;

  edit: () => void;
  send: () => void;
  cancel: () => void;
};

export type MessageComposerStore = {
  useComposer: UseBoundStore<StoreApi<MessageComposerState>>;
};

export const makeMessageComposer = ({
  onEdit,
  onSend,
}: {
  onEdit: () => string;
  onSend: (value: string) => Promise<void>;
}) =>
  create<MessageComposerState>()((set, get, store) => ({
    ...makeBaseComposer(set, get, store),

    canCancel: true,
    isEditing: false,

    edit: () => {
      const value = onEdit();
      set({ isEditing: true, value });
    },
    send: () => {
      const value = get().value;
      set({ isEditing: false });
      return onSend(value);
    },
    cancel: () => {
      set({ isEditing: false });
    },
  }));

type ThreadComposerState = BaseComposerState & {
  isEditing: true;
  canCancel: boolean;

  send: () => void;
  cancel: () => void;
};

export type ThreadComposerStore = {
  useComposer: UseBoundStore<StoreApi<ThreadComposerState>>;
};

export const makeThreadComposer = ({
  onSend,
  onCancel,
}: {
  onSend: (value: string) => Promise<void>;
  onCancel: () => void;
}) =>
  create<ThreadComposerState>()((set, get, store) => ({
    ...makeBaseComposer(set, get, store),

    isEditing: true,
    canCancel: false,

    send: () => {
      const value = get().value;
      set({ value: "", canCancel: true });
      onSend(value).then(() => {
        set({ canCancel: false });
      });
    },
    cancel: onCancel,
  }));

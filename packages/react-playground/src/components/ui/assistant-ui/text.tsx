import { TextContentPartComponent, useMessageStore } from "@assistant-ui/react";
import TextareaAutosize from "react-textarea-autosize";
import { useGetPlaygroundRuntime } from "../../../lib/usePlaygroundRuntime";

export const Text: TextContentPartComponent = ({ part }) => {
  const getPlaygroundRuntime = useGetPlaygroundRuntime();
  const messageStore = useMessageStore();
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    try {
      getPlaygroundRuntime().setMessageText({
        messageId: messageStore.getState().message.id,
        contentPart: part,
        text: e.target.value,
      });
    } catch (ex) {
      console.error(ex);
    }
  };

  return (
    <TextareaAutosize
      className="w-full resize-none border-none p-0 outline-none focus:ring-0"
      onChange={handleChange}
      value={part.text}
      rows={1}
    />
  );
};

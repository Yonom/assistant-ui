import { toLanguageModelMessages, useThreadContext } from "@assistant-ui/react";
import { PlaygroundThreadRuntime } from "../lib/playground-runtime";
import { convertToOpenAIChatMessages } from "../lib/openai/toOpenAIMessages";
import { FC, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { threadMessagesFromOpenAI } from "../lib/converters";

export const PayloadEditorButton: FC = () => {
  const { useThreadActions } = useThreadContext();
  const getRuntime = useThreadActions((t) => t.getRuntime);

  const [isOpen, setIsOpen] = useState(false);
  const [value, setValue] = useState("");

  const handleOpen = (open: boolean) => {
    setIsOpen(open);
    if (!open) return;

    const messages = getRuntime().messages;
    const lmMessages = toLanguageModelMessages(messages);
    const oaiMessages = convertToOpenAIChatMessages(lmMessages);
    setValue(
      JSON.stringify({ model: "gpt-4o", messages: oaiMessages }, null, 2),
    );
  };

  const handleSave = () => {
    let jsonValue;
    try {
      jsonValue = JSON.parse(value);
    } catch (e) {
      alert("Unable to parse input as JSON");
      return;
    }

    const messages = threadMessagesFromOpenAI(jsonValue.messages);
    (getRuntime() as PlaygroundThreadRuntime).messages = messages;
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button>View Payload</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Payload</DialogTitle>
        </DialogHeader>
        <pre>
          <Textarea
            rows={20}
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </pre>
        <DialogFooter>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

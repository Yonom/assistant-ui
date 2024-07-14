"use client";

import { FC, PropsWithChildren, useState } from "react";
import {
  Tool,
  useAssistantContext,
  useAssistantTool,
} from "@assistant-ui/react";
import { PayloadEditorButton } from "../../payload-editor-button";
import { Thread } from "./thread";
import { Button } from "../button";

type ToolWithName = Tool & { name: string };

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../dialog";
import { Textarea } from "../textarea";
import { Input } from "../input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../select";
import { Slider } from "../slider";

type ToolDialogProps = PropsWithChildren<{
  tool: ToolWithName;
  setTool: (tool: ToolWithName) => void;
}>;

type ToolItemProps = {
  tool: ToolWithName;
  setTool: (tool: ToolWithName) => void;
  deleteTool: () => void;
};

const ToolDialog: FC<ToolDialogProps> = ({ tool, setTool, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [value, setValue] = useState("");

  const handleOpen = (open: boolean) => {
    setIsOpen(open);
    if (!open) return;

    setValue(JSON.stringify(tool, null, 2));
  };

  const handleSave = () => {
    let jsonValue;
    try {
      jsonValue = JSON.parse(value);
    } catch (e) {
      alert("Unable to parse input as JSON");
      return;
    }

    setTool(jsonValue);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Tool</DialogTitle>
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

const ToolItem: FC<ToolItemProps> = ({ tool, setTool }) => {
  const { name, ...toolWithoutName } = tool;
  useAssistantTool({
    toolName: name,
    ...toolWithoutName,
  });

  return (
    <ToolDialog tool={tool} setTool={setTool}>
      <Button variant="outline">{name}</Button>
    </ToolDialog>
  );
};

const ToolManager: FC = () => {
  const [tools, setTools] = useState<ToolWithName[]>([]);

  return (
    <div className="flex flex-col gap-2">
      {tools.map((tool, idx) => (
        <ToolItem
          key={idx}
          tool={tool}
          setTool={(newTool) => {
            setTools(
              tools.map((t, i) =>
                i === idx ? newTool : i > idx ? { ...t, name: t.name } : t,
              ),
            );
          }}
          deleteTool={() => {
            setTools(tools.slice(0, idx).concat(tools.slice(idx + 1)));
          }}
        />
      ))}
      <ToolDialog
        tool={{} as ToolWithName}
        setTool={(tool) => setTools([...tools, tool])}
      >
        <Button variant="outline">Add Tool</Button>
      </ToolDialog>
    </div>
  );
};

const Sidebar = () => {
  const { useAssistantActions } = useAssistantContext();
  const handleClearChat = () => {
    useAssistantActions.getState().switchToThread(null);
  };
  return (
    <div className="flex w-[300px] min-w-[300px] flex-col gap-4 px-4 py-4">
      <PayloadEditorButton />

      <Button onClick={handleClearChat}>Clear chat</Button>

      <div className="flex flex-col gap-2">
        <label>Model</label>
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select a model" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="gpt-4o">GPT-4o</SelectItem>
            <SelectItem value="gpt-4">GPT-4</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <label>Provider API Key</label>
        <Input placeholder="Enter your OpenAI API key" />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex justify-between">
          <label>Temperature</label>
          <Input value={0.7} className="inline h-6 w-16 py-0" />
        </div>
        <Slider min={0} max={2} step={0.01} value={[0.7]} className="py-2" />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex justify-between">
          <label>Max Tokens</label>
          <Input value={256} className="inline h-6 w-16 py-0" />
        </div>
        <Slider min={1} max={4095} value={[256]} className="py-2" />
      </div>

      <div className="flex flex-col gap-2">
        <p className="font-medium">Tools</p>
        <ToolManager />
      </div>
    </div>
  );
};

export const AssistantPlayground: FC = () => {
  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex flex-grow flex-col">
        <Thread />
      </div>
      <Sidebar />
    </div>
  );
};

import asyncio
from typing import Any, AsyncGenerator
from assistant_stream.assistant_stream_chunk import (
    AssistantStreamChunk,
    ToolCallBeginChunk,
    ToolCallDeltaChunk,
    ToolResultChunk,
)
import string
import random


def generate_openai_style_tool_call_id():
    prefix = "call_"
    characters = string.ascii_letters + string.digits
    random_id = "".join(random.choices(characters, k=24))
    return prefix + random_id


class ToolCallController:
    def __init__(self, queue, tool_name: str, tool_call_id: str):
        self.tool_name = tool_name
        self.tool_call_id = tool_call_id
        self.queue = queue
        self.loop = asyncio.get_event_loop()

        begin_chunk = ToolCallBeginChunk(
            type="tool-call-begin",
            tool_call_id=self.tool_call_id,
            tool_name=self.tool_name,
        )
        self.queue.put_nowait(begin_chunk)

    def append_args_text(self, args_text_delta: str):
        """Append an args text delta to the stream."""
        chunk = ToolCallDeltaChunk(
            type="tool-call-delta",
            tool_call_id=self.tool_call_id,
            args_text_delta=args_text_delta,
        )
        self.loop.call_soon_threadsafe(self.queue.put_nowait, chunk)

    def set_result(self, result: Any):
        """Set the result of the tool call."""

        chunk = ToolResultChunk(
            type="tool-result",
            tool_call_id=self.tool_call_id,
            result=result,
        )
        self.loop.call_soon_threadsafe(self.queue.put_nowait, chunk)
        self.loop.call_soon_threadsafe(self.queue.put_nowait, None)


async def create_tool_call(
    tool_name: str,
    tool_call_id: str,
) -> tuple[AsyncGenerator[AssistantStreamChunk, None], ToolCallController]:
    queue = asyncio.Queue()
    controller = ToolCallController(queue, tool_name, tool_call_id)

    async def stream():
        while True:
            chunk = await controller.queue.get()
            if chunk is None:
                break
            yield chunk
            controller.queue.task_done()

    return stream(), controller

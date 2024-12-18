import asyncio
from typing import Any, AsyncGenerator, Callable, Coroutine
from assistant_stream.assistant_stream_chunk import AssistantStreamChunk, TextDeltaChunk
from assistant_stream.modules.tool_call import (
    create_tool_call,
    ToolCallController,
    generate_openai_style_tool_call_id,
)


class RunController:
    def __init__(self, queue):
        self._queue = queue
        self._loop = asyncio.get_event_loop()
        self._dispose_callbacks = []
        self._stream_tasks = []

    def append_text(self, text_delta: str):
        """Append a text delta to the stream."""
        chunk = TextDeltaChunk(type="text-delta", text_delta=text_delta)
        self._loop.call_soon_threadsafe(self._queue.put_nowait, chunk)

    async def add_tool_call(
        self, tool_name: str, tool_call_id: str = generate_openai_style_tool_call_id()
    ) -> ToolCallController:
        """Add a tool call to the stream."""

        stream, controller = await create_tool_call(tool_name, tool_call_id)
        self._dispose_callbacks.append(controller.close)
        self.add_stream(stream)
        return controller

    def add_stream(self, stream: AsyncGenerator[AssistantStreamChunk, None]):
        """Append a substream to the main stream."""

        async def reader():
            async for chunk in stream:
                await self._queue.put(chunk)

        task = asyncio.create_task(reader())
        self._stream_tasks.append(task)


async def create_run(
    callback: Callable[[RunController], Coroutine[Any, Any, None]]
) -> AsyncGenerator[AssistantStreamChunk, None]:
    queue = asyncio.Queue()
    controller = RunController(queue)

    async def background_task():
        try:
            await callback(controller)

            for dispose in controller._dispose_callbacks:
                dispose()
            for task in controller._stream_tasks:
                await task
        finally:
            asyncio.get_event_loop().call_soon_threadsafe(queue.put_nowait, None)

    task = asyncio.create_task(background_task())

    while True:
        chunk = await controller._queue.get()
        if chunk is None:
            break
        yield chunk
        controller._queue.task_done()

    await task

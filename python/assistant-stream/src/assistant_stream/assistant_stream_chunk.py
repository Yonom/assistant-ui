from dataclasses import dataclass
from typing import Any, Union


# Define the data classes for different chunk types
@dataclass
class TextDeltaChunk:
    text_delta: str
    type: str = "text-delta"


@dataclass
class ToolCallBeginChunk:
    tool_call_id: str
    tool_name: str
    type: str = "tool-call-begin"


@dataclass
class ToolCallDeltaChunk:
    tool_call_id: str
    args_text_delta: str
    type: str = "tool-call-delta"


@dataclass
class ToolResultChunk:
    tool_call_id: str
    result: Any
    type: str = "tool-result"


@dataclass
class DataChunk:
    data: Any
    type: str = "data"


# Define the union type for AssistantStreamChunk
AssistantStreamChunk = Union[
    TextDeltaChunk, ToolCallBeginChunk, ToolCallDeltaChunk, ToolResultChunk, DataChunk
]

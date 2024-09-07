# @assistant-ui/react

## 0.5.46

### Patch Changes

- 0a4b8d7: feat: adjust the override order of tool UIs
- 34ad491: feat: ThreadConfig.ToolFallback
- 34ad491: feat: ThreadConfig.tools
- 0a4b8d7: fix: tool UI fallback should not override makeAssistantToolUI definitions

## 0.5.45

### Patch Changes

- fb8e58f: feat: add thread runtime threadId

## 0.5.44

### Patch Changes

- b2801ce: feat(styling): cursor-not-allowed when composer input is disabled
- 0aa4e6b: fix: use-smooth-state should notdesync

## 0.5.43

### Patch Changes

- 3962831: feat: useExternalMessageConverter API
- 85defe1: feat: allow string content in ThreadMessageLike
- 6f7ccf7: feat: add toolName to addToolResult callback
- 6f7ccf7: feat: thread converter should ignore empty text parts

## 0.5.42

### Patch Changes

- c8b98b6: feat: animate composer border color on focus
- 800eb9e: fix: error on switchToThread / switchToNewThread
- 8768c67: feat: support shadcn scroll area

## 0.5.41

### Patch Changes

- f526279: feat: SpeechSyntehsis
- e8aa697: refactor: remove unsupported external runtime onCopy callback

## 0.5.40

### Patch Changes

- 4333382: fix(runtime/edge): handle maxToolRoundtrips

## 0.5.39

### Patch Changes

- ab1160c: fix: switchToThread should persist maxToolRoundtrips

## 0.5.38

### Patch Changes

- 554a423: chore: update deps

## 0.5.37

### Patch Changes

- 60c0fdc: fix: remove Composer focus ring when using @tailwindcss/forms
- edbab24: feat(runtimes/local): reset thread

## 0.5.36

### Patch Changes

- edb5a16: feat: DangerousInBrowserRuntime
- f8e2cf1: fix: @tailwindcss/forms input border

## 0.5.35

### Patch Changes

- 53cf707: fix: do not require content in ChatModelRunResult

## 0.5.34

### Patch Changes

- 3178788: feat: custom AssistantMessage metadata

## 0.5.33

### Patch Changes

- c154b8f: feat(runtime/edge): allow extra headers & body

## 0.5.32

### Patch Changes

- cd70d4f: refactor: rewrite ai-sdk integration to use external runtime

## 0.5.31

### Patch Changes

- 34621cc: feat(runtimes/edge): getEdgeRuntimeResponse API
- 2df3e73: fix: CircleStopIcon invisible on safari
- 1b9ded0: feat: lift thread composer state to ThreadRuntime.Composer

## 0.5.30

### Patch Changes

- ccf5fef: fix: do not capture enter key during IME composition events

## 0.5.29

### Patch Changes

- 556001f: chore: update deps
- 556001f: feat: tool call cancellation support

## 0.5.28

### Patch Changes

- 915b5b7: feat: expose streamUtils
- 9a55735: chore: update deps

## 0.5.27

### Patch Changes

- dbf1042: fix: minor styling fixes
- dbf1042: chore: update deps

## 0.5.26

### Patch Changes

- 440b051: fix: sending messages when thread is empty

## 0.5.25

### Patch Changes

- 0445cdf: fix: disallow sending new messages when last message is in requires-action state
- 0445cdf: refactor: remove Runtime.isRunning / auto-infer isRunning state from last message state
- 71f4b77: feat: update Tooltip styles

## 0.5.24

### Patch Changes

- a7e8ef6: refactor: rewrite external store sync
- 6629dd8: fix: render loop if a message ID is used twice

## 0.5.23

### Patch Changes

- f83e4d1: feat: LocalRuntime export / import

## 0.5.22

### Patch Changes

- 134d39e: fix: undo moving internal utilities to /react/internal

## 0.5.20

### Patch Changes

- de04d92: feat: loading status & smooth streaming interop
- 3cc67f2: refactor: move internal utilities to @assistant-ui/react/internal

## 0.5.19

### Patch Changes

- 2534938: feat: Message.Content Empty component

## 0.5.18

### Patch Changes

- 0302235: fix(external-store): add initial messages to message repository

## 0.5.17

### Patch Changes

- 4b4f9c8: feat(local-runtime): AsyncGenerator support

## 0.5.16

### Patch Changes

- 9dc942f: feat: useThread.isDisabled flag

## 0.5.15

### Patch Changes

- 0418c73: fix(runtimes/external-store): invalidate cache when isRunning changes during autoStatus

## 0.5.12

### Patch Changes

- 8688a9f: feat(runtimes/external-store): loosen the return type for convertMessage callback

## 0.5.11

### Patch Changes

- fc6bc35: feat: initialMessages SSR support

## 0.5.10

### Patch Changes

- 1c6bf72: feat(tailwindcss): allow customizing colors directly in tailwind config

## 0.5.9

### Patch Changes

- a216fbf: chore: update deps

## 0.5.6

### Patch Changes

- e5e6b20: feat(runtime): BranchPicker feature detection

## 0.5.5

### Patch Changes

- f26783a: feat(ui): allow ReactNode in SuggestionConfig.text

## 0.5.4

### Patch Changes

- f2d7590: fix(rsc): hide copy message button

## 0.5.3

### Patch Changes

- 1acdf45: feat: external store runtime

## 0.5.2

### Patch Changes

- 2d7a8bd: fix: markdown loading indicator
- 2d7a8bd: fix: ScrollToBottom visbility bug
- 2d7a8bd: fix: text content part data-status field

## 0.5.1

### Patch Changes

- ee38c0c: feat: message status v2
- ee38c0c: fix(runtimes/edge): wait for serverside tool call results before reporting onFinish
- 2baa898: chore: v5

## 0.4.6

### Patch Changes

- bc77b4f: feat(runtimes/edge): dynamic model creator functions
- e220617: feat(runtimes/edge): client side API key, model name, model parameters specification

## 0.4.4

### Patch Changes

- 998081b: fix: reduce specificity of built-in CSS styles

## 0.4.3

### Minor Changes

- feat: scrolling to bottom during streaming is now instant
- fix: useSmooth gets triggered during branch switch

## 0.4.2

### Minor Changes

- fix: issue with forwarding props to primitives

## 0.4.1

### Minor Changes

- fix: useSmooth scrolling performance in dev mode

## 0.4.0

### Minor Changes

- e0e51cf: refactor!: Rename AssistantMessage to ThreadAssistantMessage
- e0e51cf: refactor!: Rename UserMessage to ThreadUserMessage
- 679cd54: feat: system message support

### Patch Changes

- c7ba6a2: feat: Edge Runtime API
- e0e51cf: feat: add styled UI components

## 0.3.5

### Patch Changes

- ef25706: feat: Code Header and Syntax Highlighter support

## 0.3.3

### Patch Changes

- b5aa29f: feat: smooth streaming by default

## 0.3.2

### Patch Changes

- 1a8919b: feat: smooth text streaming

## 0.3.1

### Patch Changes

- 05fd5d6: feat: runtime capabilities API

## 0.3.0

### Minor Changes

- 5b68f4a: refactor!: drop Message.InProgress support

### Patch Changes

- 3dd7384: fix: better message hover state tracking
- 23f474e: fix: remove warning about useLayoutEffect in SSR

## 0.2.4

### Patch Changes

- c373fc9: feat: AssistantModalPrimitive.Anchor

## 0.2.3

### Patch Changes

- be2c26b: fix: Vercel useAssistant BranchPicker duplicates bug

## 0.2.2

### Patch Changes

- 62e9f19: feat: AssistantRuntime newThread
- 611fdcc: feat: useAssistantActions
- ca0eaa1: feat: Programmatic Interactions API

## 0.2.1

### Patch Changes

- d52c345: feat: Primitive Prop Types

## 0.2.0

### Minor Changes

- de20b1c: feat!: ContentPartText is now a <p> element
- 2ab2cab: feat!: experimental features are now marked as stable

## 0.1.12

### Patch Changes

- 904556d: feat: ComposerContext focus() API
- 33ae8f9: feat: AssistantModalPrimitive

## 0.1.11

### Patch Changes

- fd6a202: feat: Primitive Hook useThreadViewportAutoScroll
- c2a6b22: fix: improved Viewport autoscroll handling
- c2a6b22: fix: more reliable escape hotkey handling
- c2a6b22: feat: add "role" field to AppendMessage

## 0.1.10

### Patch Changes

- 269b32f: feat: Primitive Hooks API
- 2867923: feat: Composer API Docs

## 0.1.9

### Patch Changes

- ab16a99: feat: useMessageUtils Context API
- ab16a99: feat: useThreadActions Context API
- ab16a99: fix: make all Context APIs read-only

## 0.1.8

### Patch Changes

- 8513f9a: feat: ToolUI addResult API

## 0.1.7

### Patch Changes

- 36f3a1f: fix: add DisplayName to primitive components for better error logs
- 36f3a1f: chore: upgrade to radix-ui 1.1
- 36f3a1f: chore: update dependencies

## 0.1.6

### Patch Changes

- a6769d5: feat: ContentPartComponent types
- 52236ab: feat: new default chat bubble design

## 0.1.5

### Patch Changes

- 671dc86: feat: Tool Render functions

## 0.1.4

### Patch Changes

- a73b50f: fix: ComposerRoot onSubmit should be called when using keyboard shortcuts

## 0.1.3

### Patch Changes

- 6e9528d: build: add changesets
- 6e9528d: feat: add useAssistantTool API

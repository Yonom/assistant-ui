"use client";

import { useStopThread } from "../../actions/useStopThread";
import { createActionButton } from "../../utils/createActionButton";

export const ThreadStop = createActionButton(useStopThread);

"use client";
import React from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@radix-ui/react-icons";
import * as MessageActionPrimitive from "assistant-ui/src/primitives/MessageActionPrimitive";
import {
  BranchNumberValue,
  BranchCountValue,
} from "assistant-ui/src/primitives/MessageValues";

export const BranchUI = () => {
  return (
    <p className="inline-flex text-xs text-[#b4b4b4]">
      <MessageActionPrimitive.BranchGoBack className="disabled:opacity-50">
        <ChevronLeftIcon />
      </MessageActionPrimitive.BranchGoBack>
      <BranchNumberValue /> / <BranchCountValue />
      <MessageActionPrimitive.BranchGoForward className="disabled:opacity-50">
        <ChevronRightIcon />
      </MessageActionPrimitive.BranchGoForward>
    </p>
  );
};

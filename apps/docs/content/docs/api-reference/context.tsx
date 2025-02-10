"use client";

import type React from "react";
import { ChevronRight, Layers } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Fragment } from "react";

interface ComponentProps {
  name: string;
  isContextProvider?: boolean;
  providedContexts?: { name: string; color: string; link?: string }[];
  isLink?: boolean;
  docsLink?: string;
  tooltip?: string;
  children?: React.ReactNode;
  props?: string;
}

export const Component: React.FC<ComponentProps> = ({
  name,
  isContextProvider,
  providedContexts,
  isLink,
  docsLink,
  tooltip,
  children,
  props,
}) => (
  <div className="mb-4">
    <div className="flex items-center">
      <ChevronRight className="mr-2 h-5 w-5" />
      {isLink ? (
        <a
          href={`#${name.toLowerCase().replace(/\s/g, "-")}`}
          className="font-semibold hover:underline"
        >
          {name}
        </a>
      ) : (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <a href={docsLink}>
                <code>
                  &lt;
                  {name
                    ? name
                        .split(".")
                        .map((part, index) =>
                          index === name.split(".").length - 1 ? (
                            <strong key={index}>{part}</strong>
                          ) : (
                            <span key={index}>{part}.</span>
                          ),
                        )
                    : name}
                  {`${props ? ` ${props}` : ""} />`}
                </code>
              </a>
            </TooltipTrigger>
            <TooltipContent>{tooltip}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      {isContextProvider && (
        <div className="ml-3 flex items-center">
          <Layers className="mr-2 h-5 w-5 text-purple-500 dark:text-purple-400" />
          <span className="text-sm font-semibold text-purple-500 dark:text-purple-400">
            Context Provider
          </span>
        </div>
      )}
    </div>
    {providedContexts && (
      <div className="ml-7 mt-1">
        Provides:{" "}
        {providedContexts.map((context, index) => (
          <Fragment key={context.name}>
            <a
              href={
                context.link ||
                `#${context.name.toLowerCase().replace(/\s/g, "-")}`
              }
              style={{
                color: context.color,
                textDecorationColor: context.color,
              }}
            >
              {context.name}
            </a>
            {index < providedContexts.length - 1 ? ", " : ""}
          </Fragment>
        ))}
      </div>
    )}
    {children && <div className="ml-7 mt-4">{children}</div>}
  </div>
);

interface RuntimeHooksProps {
  hooks: { name: string; docsLink: string }[];
}

export const RuntimeHooks: React.FC<RuntimeHooksProps> = ({ hooks }) => (
  <div className="mb-6 mt-8">
    <ul className="list-inside list-disc space-y-3">
      {hooks.map((hook, index) => (
        <li key={index} className="text-base">
          <a
            href={hook.docsLink}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            {hook.name}
          </a>
        </li>
      ))}
    </ul>
  </div>
);

interface ContextLevelProps {
  color: string;
  children: React.ReactNode;
}

export const ContextLevel: React.FC<ContextLevelProps> = ({
  color,
  children,
}) => (
  <div className={`mb-12 border-l-4 pl-6`} style={{ borderColor: color }}>
    {children}
  </div>
);

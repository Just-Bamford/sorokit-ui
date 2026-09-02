import { render, type RenderOptions } from "@testing-library/react";
import React, { type ReactElement } from "react";

import { SorokitProvider } from "@/context/SorokitProvider";
import type { SorokitClient } from "@/lib/client";
import { createMockClient } from "@/lib/mock-client";

export interface RenderWithProviderOptions
  extends Omit<RenderOptions, "wrapper"> {
  client?: SorokitClient;
  onError?: (error: string, source: string) => void;
}

export function renderWithProvider(
  ui: ReactElement,
  contextOverrides: RenderWithProviderOptions = {},
) {
  const { client = createMockClient(), onError, ...renderOptions } = contextOverrides;

  return {
    client,
    ...render(
      React.createElement(SorokitProvider, { client, onError }, ui),
      renderOptions,
    ),
  };
}

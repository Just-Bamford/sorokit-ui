
import React from 'react';
import { SorokitProvider } from '../src/context/SorokitProvider';
import { initClient } from '../src/lib/client';
import '../src/index.css'; // Add if they use global CSS, wait let's just do standard

const mockClient = {
  getNetwork: async () => ({ id: "testnet", name: "testnet" }),
  transaction: { estimateFee: async () => ({ data: { baseFee: "100", recommended: "120" } }) },

  // Add other required methods if they error out, but SorokitProvider usually just takes it
} as any;

initClient(mockClient);

export const decorators = [
  (Story) => (
    <SorokitProvider client={mockClient}>
      <Story />
    </SorokitProvider>
  ),
];
import type { Preview } from '@storybook/react-vite'

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo'
    }
  },
};

export default preview;
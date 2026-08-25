import type { Meta, StoryObj } from '@storybook/react';
import { NetworkBanner } from '../components/NetworkBanner';

const meta = {
  title: 'Domain/NetworkBanner',
  component: NetworkBanner,
  tags: ['autodocs'],
} satisfies Meta<typeof NetworkBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: {} };

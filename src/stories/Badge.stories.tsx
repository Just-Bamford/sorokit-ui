import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from '../components/ui/Badge';

const meta = {
  title: 'UI/Badge',
  component: Badge,
  tags: ['autodocs'],
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { children: 'Default Badge' } };
export const Success: Story = { args: { variant: 'success', children: 'Success' } };
export const Warning: Story = { args: { variant: 'warning', children: 'Warning' } };
export const Error: Story = { args: { variant: 'error', children: 'Error' } };

import type { Meta, StoryObj } from '@storybook/react';
import { Input } from '../components/ui/Input';

const meta = {
  title: 'UI/Input',
  component: Input,
  tags: ['autodocs'],
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { placeholder: 'Enter value...' } };
export const WithError: Story = { args: { placeholder: 'Enter value...', error: 'Invalid input' } };
export const WithHint: Story = { args: { placeholder: 'Enter value...', hint: 'Hint text' } };

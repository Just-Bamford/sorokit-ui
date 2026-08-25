import type { Meta, StoryObj } from '@storybook/react';
import { AddressDisplay } from '../components/AddressDisplay';

const meta = {
  title: 'Domain/AddressDisplay',
  component: AddressDisplay,
  tags: ['autodocs'],
} satisfies Meta<typeof AddressDisplay>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Truncated: Story = { args: { address: 'GDQ5A...' } };
export const ShowFull: Story = { args: { address: 'GDQ5A...', showFull: true } };
export const WithLabel: Story = { args: { address: 'GDQ5A...', label: 'Recipient' } };

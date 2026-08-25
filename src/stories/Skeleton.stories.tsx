import type { Meta, StoryObj } from '@storybook/react';
import { Skeleton } from '../components/ui/Skeleton';

const meta = {
  title: 'UI/Skeleton',
  component: Skeleton,
  tags: ['autodocs'],
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { className: 'w-[100px] h-[20px] rounded-full' } };

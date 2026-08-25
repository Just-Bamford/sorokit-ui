import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '../components/ui/Button';

const meta = {
  title: 'UI/Button',
  component: Button,
  tags: ['autodocs'],
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = { args: { variant: 'primary', children: 'Primary Button' } };
export const Secondary: Story = { args: { variant: 'secondary', children: 'Secondary Button' } };
export const Outline: Story = { args: { variant: 'outline', children: 'Outline Button' } };
export const Ghost: Story = { args: { variant: 'ghost', children: 'Ghost Button' } };

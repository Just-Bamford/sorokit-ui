import type { Meta, StoryObj } from '@storybook/react';
import { FeeEstimator } from '../components/FeeEstimator';

const meta = {
  title: 'Domain/FeeEstimator',
  component: FeeEstimator,
  tags: ['autodocs'],
} satisfies Meta<typeof FeeEstimator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: {} };

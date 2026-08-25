import type { Meta, StoryObj } from '@storybook/react';
import { AssetBadge } from '../components/AssetBadge';

const meta = {
  title: 'Domain/AssetBadge',
  component: AssetBadge,
  tags: ['autodocs'],
} satisfies Meta<typeof AssetBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const XLM: Story = { args: { balance: { assetType: 'native', balance: '100.00' } } };
export const USDC: Story = { args: { balance: { assetType: 'credit_alphanum4', assetCode: 'USDC', assetIssuer: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGZW3L5AWIEG7X12345678', balance: '50.0' } } };
export const Unknown: Story = { args: { balance: { assetType: 'credit_alphanum12', assetCode: 'UNKNOWN', assetIssuer: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGZW3L5AWIEG7X12345678', balance: '10.0' } } };

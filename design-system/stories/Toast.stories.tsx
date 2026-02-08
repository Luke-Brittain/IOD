import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import Toast from '../src/Toast';

const meta: Meta<typeof Toast> = {
  title: 'DesignSystem/Toast',
  component: Toast,
};

export default meta;
type Story = StoryObj<typeof Toast>;

export const Saving: Story = {
  args: {
    pendingCount: 2,
    failedIds: [],
    onRetryAll: () => {},
    onDismissFailed: () => {},
  },
};

export const Failed: Story = {
  args: {
    pendingCount: 0,
    failedIds: ['n1', 'n2'],
    onRetryAll: () => {},
    onDismissFailed: () => {},
  },
};

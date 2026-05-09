'use client';

import { ThunderboltOutlined } from '@ant-design/icons';
import { App, Button } from 'antd';
import { useState } from 'react';
import { ApiError, api } from '@/lib/api';

interface Props {
  onComplete: () => void;
}

export default function RescheduleButton({ onComplete }: Props) {
  const [running, setRunning] = useState(false);
  const { message } = App.useApp();

  const handle = async () => {
    setRunning(true);
    try {
      const result = await api.reschedule();
      const n = result.updated.length;
      if (n === 0) {
        message.info('No conflicts to resolve');
      } else {
        message.success(`${n} order${n === 1 ? '' : 's'} rescheduled`);
      }
      onComplete();
    } catch (err) {
      const detail = err instanceof ApiError ? err.message : 'Unknown error';
      message.error(`Reschedule failed: ${detail}`);
    } finally {
      setRunning(false);
    }
  };

  return (
    <Button
      type="default"
      icon={<ThunderboltOutlined />}
      loading={running}
      onClick={handle}
    >
      Reschedule conflicts
    </Button>
  );
}

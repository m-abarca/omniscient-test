'use client';

import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { Button, Space, Typography } from 'antd';
import { useCallback, useEffect, useState } from 'react';
import OrderFormModal from '@/components/OrderFormModal';
import OrdersTable from '@/components/OrdersTable';
import RescheduleButton from '@/components/RescheduleButton';
import { ApiError, api } from '@/lib/api';
import type { ProductionOrder } from '@omniscient/types';

const { Title, Text } = Typography;

export default function Page() {
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.listOrders();
      setOrders(data);
    } catch (err) {
      const detail = err instanceof ApiError ? err.message : 'Unknown error';
      setError(detail);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return (
    <main
      style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: '32px 24px',
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 24,
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <Title level={2} style={{ margin: 0 }}>
            Production Orders
          </Title>
          <Text type="secondary">
            Mini SaaS · {orders.length} order{orders.length === 1 ? '' : 's'}
          </Text>
        </div>
        <Space wrap>
          <Button icon={<ReloadOutlined />} onClick={refetch} loading={loading}>
            Refresh
          </Button>
          <RescheduleButton onComplete={refetch} />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setModalOpen(true)}
          >
            New order
          </Button>
        </Space>
      </header>

      <section
        style={{
          background: '#fff',
          padding: 16,
          borderRadius: 8,
          boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
        }}
      >
        <OrdersTable orders={orders} loading={loading} error={error} />
      </section>

      <OrderFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={refetch}
      />
    </main>
  );
}

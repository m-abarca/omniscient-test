'use client';

import { Alert, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import type { OrderStatus, ProductionOrder } from '@omniscient/types';

const STATUS_COLOR: Record<OrderStatus, string> = {
  planned: 'blue',
  scheduled: 'cyan',
  in_progress: 'gold',
  completed: 'green',
};

const formatDate = (iso: string) => dayjs(iso).format('YYYY-MM-DD HH:mm');

const columns: ColumnsType<ProductionOrder> = [
  {
    title: 'Reference',
    dataIndex: 'reference',
    key: 'reference',
    sorter: (a, b) => a.reference.localeCompare(b.reference),
  },
  {
    title: 'Product',
    dataIndex: 'product',
    key: 'product',
  },
  {
    title: 'Quantity',
    dataIndex: 'quantity',
    key: 'quantity',
    align: 'right',
    sorter: (a, b) => a.quantity - b.quantity,
  },
  {
    title: 'Start',
    dataIndex: 'startDate',
    key: 'startDate',
    render: formatDate,
    sorter: (a, b) => Date.parse(a.startDate) - Date.parse(b.startDate),
    defaultSortOrder: 'ascend',
  },
  {
    title: 'End',
    dataIndex: 'endDate',
    key: 'endDate',
    render: formatDate,
    sorter: (a, b) => Date.parse(a.endDate) - Date.parse(b.endDate),
  },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    render: (status: OrderStatus) => (
      <Tag color={STATUS_COLOR[status]}>{status}</Tag>
    ),
    filters: (
      ['planned', 'scheduled', 'in_progress', 'completed'] as OrderStatus[]
    ).map((s) => ({ text: s, value: s })),
    onFilter: (value, record) => record.status === value,
  },
  {
    title: 'Created',
    dataIndex: 'createdAt',
    key: 'createdAt',
    render: formatDate,
    sorter: (a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt),
  },
];

interface Props {
  orders: ProductionOrder[];
  loading: boolean;
  error: string | null;
}

export default function OrdersTable({ orders, loading, error }: Props) {
  if (error) {
    return (
      <Alert
        type="error"
        showIcon
        message="Could not load orders"
        description={error}
      />
    );
  }

  return (
    <Table<ProductionOrder>
      dataSource={orders}
      columns={columns}
      loading={loading}
      rowKey="id"
      pagination={{ pageSize: 10, showSizeChanger: false }}
      size="middle"
    />
  );
}

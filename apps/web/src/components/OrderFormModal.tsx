'use client';

import {
  App,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
} from 'antd';
import type { Dayjs } from 'dayjs';
import { useState } from 'react';
import { ApiError, api } from '@/lib/api';

interface FormValues {
  reference: string;
  product: string;
  quantity: number;
  startDate: Dayjs;
  endDate: Dayjs;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export default function OrderFormModal({ open, onClose, onCreated }: Props) {
  const [form] = Form.useForm<FormValues>();
  const [submitting, setSubmitting] = useState(false);
  const { message } = App.useApp();

  const handleOk = async () => {
    let values: FormValues;
    try {
      values = await form.validateFields();
    } catch {
      return;
    }
    if (!values.endDate.isAfter(values.startDate)) {
      message.error('End date must be after start date.');
      return;
    }
    setSubmitting(true);
    try {
      await api.createOrder({
        reference: values.reference.trim(),
        product: values.product.trim(),
        quantity: values.quantity,
        startDate: values.startDate.toISOString(),
        endDate: values.endDate.toISOString(),
      });
      message.success('Order created');
      form.resetFields();
      onCreated();
      onClose();
    } catch (err) {
      const detail = err instanceof ApiError ? err.message : 'Unknown error';
      message.error(`Could not create order: ${detail}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (submitting) return;
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title="New production order"
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      okText="Create"
      confirmLoading={submitting}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        preserve={false}
        initialValues={{ quantity: 1 }}
      >
        <Form.Item
          name="reference"
          label="Reference"
          rules={[{ required: true, message: 'Reference is required' }]}
        >
          <Input placeholder="ORD-001" autoFocus />
        </Form.Item>
        <Form.Item
          name="product"
          label="Product"
          rules={[{ required: true, message: 'Product is required' }]}
        >
          <Input placeholder="Widget" />
        </Form.Item>
        <Form.Item
          name="quantity"
          label="Quantity"
          rules={[{ required: true, message: 'Quantity is required' }]}
        >
          <InputNumber min={1} step={1} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item
          name="startDate"
          label="Start date"
          rules={[{ required: true, message: 'Start date is required' }]}
        >
          <DatePicker showTime style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item
          name="endDate"
          label="End date"
          rules={[{ required: true, message: 'End date is required' }]}
        >
          <DatePicker showTime style={{ width: '100%' }} />
        </Form.Item>
      </Form>
    </Modal>
  );
}

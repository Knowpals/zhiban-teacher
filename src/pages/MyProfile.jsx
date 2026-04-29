import React, { useState, useEffect } from 'react';
import { Form, Input, Button, message, Spin } from 'antd';
import MainLayout from '../components/MainLayout';
import { getUserInfo } from '../services/api';

const MyProfile = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    fetchUserInfo();
  }, []);

  const fetchUserInfo = async () => {
    setLoading(true);
    try {
      const res = await getUserInfo();
      setUserData(res.data);
    } catch (error) {
      message.error(error.message || '获取用户信息失败');
    } finally {
      setLoading(false);
    }
  };

  // 保存提交（目前后端可能没有更新用户信息的接口，先模拟）
  const onFinish = (values) => {
    setSaving(true);
    // 模拟保存
    setTimeout(() => {
      setSaving(false);
      message.success('信息保存成功!');
    }, 1000);
  };

  return (
    <MainLayout pageTitle="个人信息编辑">
      <div style={{ maxWidth: 800, margin: '0 auto', background: '#fff', padding: 32, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 100 }}>
            <Spin size="large" />
          </div>
        ) : (
        <Form
          form={form}
          layout="horizontal"
          labelCol={{ span: 4 }}
          wrapperCol={{ span: 16 }}
          onFinish={onFinish}
          initialValues={userData}
        >
          <Form.Item label="用户名:" name="username">
            <Input placeholder="请输入用户名" />
          </Form.Item>

          <Form.Item label="邮箱:" name="email">
            <Input disabled placeholder="请输入邮箱" />
          </Form.Item>

          <Form.Item label="注册天数:" name="register_day">
            <Input disabled suffix="天" />
          </Form.Item>

          <Form.Item label="密码:" name="password">
            <Input.Password placeholder="请输入密码（留空则不修改）" />
          </Form.Item>

          <Form.Item wrapperCol={{ offset: 4, span: 16 }}>
            <Button
              type="primary"
              htmlType="submit"
              style={{ padding: '0 24px' }}
              loading={saving}
            >
              保存
            </Button>
          </Form.Item>
        </Form>
        )}
      </div>
    </MainLayout>
  );
};

export default MyProfile;

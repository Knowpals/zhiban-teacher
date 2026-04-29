import React, { useState, useEffect } from 'react';
import { Form, Button, Modal, Card, message, Space, Spin, Input } from 'antd';
import { PlusOutlined, CopyOutlined, SyncOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/MainLayout';
import { createClass, getMyCreatedClasses } from '../services/api';

const ClassManagement = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [classList, setClassList] = useState([]);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [inviteCode, setInviteCode] = useState('');

  useEffect(() => {
    fetchClassList();
  }, []);

  const fetchClassList = async () => {
    setFetchLoading(true);
    try {
      const res = await getMyCreatedClasses();
      setClassList(res.data?.class_list || []);
    } catch (error) {
      message.error(error.message || '获取班级列表失败');
    } finally {
      setFetchLoading(false);
    }
  };

  // 复制邀请码
  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    message.success('邀请码已复制');
  };

  // 生成邀请码（8位数字）
  const generateInviteCode = () => {
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += Math.floor(Math.random() * 10);
    }
    setInviteCode(code);
  };

  // 创建班级
  const handleCreateClass = async (values) => {
    if (!inviteCode) {
      message.error('请先生成班级邀请码');
      return;
    }
    setLoading(true);
    try {
      await createClass({ 
        class_name: values.class_name,
        invite_code: inviteCode 
      });
      message.success('班级创建成功！');
      setIsModalOpen(false);
      form.resetFields();
      setInviteCode('');
      fetchClassList();
    } catch (error) {
      message.error(error.message || '创建失败');
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <MainLayout pageTitle="班级管理">
        <div style={{ textAlign: 'center', padding: 100 }}>
          <Spin size="large" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout pageTitle="班级管理">
      {/* 无班级状态 */}
      {classList.length === 0 ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '80vh'
        }}>
          <div style={{ fontSize: 80, marginBottom: 24 }}>👥+</div>
          <div style={{ fontSize: 24, fontWeight: 500, marginBottom: 32, color: '#1f2937' }}>
            您还未创建任何班级哦～
          </div>
          <Button
            type="primary"
            onClick={() => setIsModalOpen(true)}
            style={{ padding: '0 32px', height: 40 }}
          >
            立即创建班级
          </Button>
        </div>
      ) : (
        // 有班级列表状态
        <div>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            {classList.map((cls) => (
              <Card
                key={cls.class_id}
                style={{ width: 240, borderRadius: 8 }}
                actions={[
                  <Button
                    type="link"
                    onClick={() => navigate(`/class-detail/${cls.class_id}`)}
                  >
                    查看详情
                  </Button>,
                ]}
              >
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 12 }}>
                    {cls.class_name}
                  </div>
                  <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
                    负责老师: {cls.teacher_name || '未知'}
                  </div>
                  <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
                    班级邀请码:{' '}
                    <span
                      style={{ cursor: 'pointer', color: '#7c3aed' }}
                      onClick={() => handleCopyCode(cls.invite_code)}
                    >
                      {cls.invite_code}
                      <CopyOutlined style={{ marginLeft: 4 }} />
                    </span>
                  </div>
                </div>
              </Card>
            ))}
            {/* 新增班级卡片 */}
            <Card
              style={{ width: 240, borderRadius: 8, borderStyle: 'dashed' }}
              styles={{ body: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 } }}
            >
              <Button
                type="text"
                icon={<PlusOutlined style={{ fontSize: 24 }} />}
                onClick={() => setIsModalOpen(true)}
              />
            </Card>
          </div>
        </div>
      )}

      {/* 新增班级弹窗 */}
      <Modal
        title="新增班级"
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
          setInviteCode('');
        }}
        footer={null}
        centered
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateClass}
        >
          <Form.Item
            label="班级名称"
            name="class_name"
            rules={[{ required: true, message: '请输入班级名称' }]}
          >
            <Input placeholder="请输入班级名称" />
          </Form.Item>

          <Form.Item label="班级邀请码">
            <Space.Compact style={{ width: '100%' }}>
              <Input
                value={inviteCode}
                placeholder="点击按钮生成邀请码"
                readOnly
                style={{ 
                  background: inviteCode ? '#f5f5f5' : '#fff',
                  fontWeight: inviteCode ? 600 : 400,
                  letterSpacing: inviteCode ? 2 : 0
                }}
              />
              <Button 
                icon={<SyncOutlined spin={loading} />} 
                onClick={generateInviteCode}
                disabled={loading}
              >
                生成
              </Button>
            </Space.Compact>
            {inviteCode && (
              <div style={{ marginTop: 8, color: '#52c41a', fontSize: 12 }}>
                邀请码已生成，创建班级后将自动生效
              </div>
            )}
          </Form.Item>

          <Form.Item style={{ textAlign: 'right', marginBottom: 0, marginTop: 24 }}>
            <Space>
              <Button onClick={() => {
                setIsModalOpen(false);
                form.resetFields();
                setInviteCode('');
              }}>
                取消
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                style={{ background: '#7c3aed' }}
                loading={loading}
              >
                确认创建
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </MainLayout>
  );
};

export default ClassManagement;

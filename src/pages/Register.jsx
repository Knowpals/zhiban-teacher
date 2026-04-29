import React, { useState } from 'react';
import { Form, Input, Button, Checkbox, message, Spin } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, SafetyOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { register, sendCode } from '../services/api';

const Register = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // 发送验证码
  const handleSendCode = async () => {
    const email = form.getFieldValue('email');
    if (!email) {
      message.error('请先输入邮箱');
      return;
    }
    setSendingCode(true);
    try {
      await sendCode({ email });
      message.success('验证码已发送');
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      message.error(error.message || '发送失败');
    } finally {
      setSendingCode(false);
    }
  };

  // 注册提交
  const onFinish = async (values) => {
    setLoading(true);
    try {
      await register({
        username: values.username,
        email: values.email,
        password: values.password,
        code: values.verify_code,
        role: 'teacher',
      });
      message.success('注册成功！请登录');
      navigate('/');
    } catch (error) {
      message.error(error.message || '注册失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="footer-book"></div>

      <div className="auth-card">
        <div className="auth-title">
          知伴<span>AI</span>
        </div>

        <div style={{ textAlign: 'center', marginBottom: 24, color: '#374151', fontWeight: 500 }}>
          注册新账号
        </div>

        <Form
          form={form}
          name="register"
          onFinish={onFinish}
          layout="vertical"
          size="large"
        >
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="请输入用户名" />
          </Form.Item>

          <Form.Item
            name="email"
            label="邮箱"
            rules={[
              { required: true, message: '请输入邮箱地址' },
              { type: 'email', message: '请输入正确的邮箱格式' },
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="请输入邮箱" />
          </Form.Item>

          <Form.Item
            name="verify_code"
            label="验证码"
            rules={[{ required: true, message: '请输入验证码' }]}
          >
            <div style={{ display: 'flex', gap: 8 }}>
              <Input
                prefix={<SafetyOutlined />}
                placeholder="请输入验证码"
                style={{ flex: 1 }}
              />
              <Button
                onClick={handleSendCode}
                disabled={countdown > 0 || sendingCode}
                style={{ width: 120 }}
              >
                {sendingCode ? <Spin size="small" /> : countdown > 0 ? `${countdown}s` : '获取验证码'}
              </Button>
            </div>
          </Form.Item>

          <Form.Item
            name="password"
            label="密码"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码长度不能少于6位' },
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="请输入您的密码" />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="确认密码"
            dependencies={['password']}
            rules={[
              { required: true, message: '请再次输入密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="请再次输入密码" />
          </Form.Item>

          <Form.Item name="agreement" valuePropName="checked" rules={[{ required: true, message: '请阅读并同意协议' }]}>
            <Checkbox>
              我已阅读并同意《用户协议》和《隐私政策》
            </Checkbox>
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              className="gradient-btn"
              loading={loading}
            >
              注册
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center', color: '#6b7280' }}>
          已有账号？
          <a onClick={() => navigate('/')} style={{ color: '#7c3aed', fontWeight: 500, marginLeft: 4 }}>
            立即登录
          </a>
        </div>
      </div>
    </div>
  );
};

export default Register;

import { useState } from 'react';
import { Form, Input, Button, Tabs, Checkbox, message, Modal, Spin } from 'antd';
import { LockOutlined, MailOutlined, SafetyOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { loginByPassword, loginByCode, sendCode } from '../services/api';

const Login = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [codeForm] = Form.useForm();
  const [forgotForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [forgotModalVisible, setForgotModalVisible] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotCountdown, setForgotCountdown] = useState(0);
  const [forgotSendingCode, setForgotSendingCode] = useState(false);

  // 邮箱密码登录
  const handleEmailLogin = async (values) => {
    setLoading(true);
    try {
      const res = await loginByPassword({
        email: values.email,
        password: values.password,
      });
      localStorage.setItem('token', res.data.token);
      message.success('登录成功！即将进入首页');
      navigate('/home');
    } catch (error) {
      message.error(error.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  // 发送验证码
  const handleSendCode = async () => {
    const email = codeForm.getFieldValue('email');
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

  // 验证码登录
  const handleCodeLogin = async (values) => {
    setLoading(true);
    try {
      const res = await loginByCode({
        email: values.email,
        verify_code: values.verify_code,
      });
      localStorage.setItem('token', res.data.token);
      message.success('登录成功！即将进入首页');
      navigate('/home');
    } catch (error) {
      message.error(error.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  // 忘记密码 - 发送验证码
  const handleForgotSendCode = async () => {
    const email = forgotForm.getFieldValue('email');
    if (!email) {
      message.error('请先输入邮箱');
      return;
    }
    setForgotSendingCode(true);
    try {
      await sendCode({ email });
      message.success('验证码已发送');
      setForgotCountdown(60);
      const timer = setInterval(() => {
        setForgotCountdown((prev) => {
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
      setForgotSendingCode(false);
    }
  };

  // 忘记密码
  const handleForgotPassword = async (values) => {
    setForgotLoading(true);
    try {
      const { forgotPassword } = await import('../services/api');
      await forgotPassword({
        email: values.email,
        verify_code: values.verify_code,
        new_password: values.new_password,
      });
      message.success('密码重置成功');
      setForgotModalVisible(false);
    } catch (error) {
      message.error(error.message || '操作失败');
    } finally {
      setForgotLoading(false);
    }
  };

  const emailTab = {
    key: 'email',
    label: '邮箱登录',
    children: (
      <Form
        form={form}
        name="email_login"
        onFinish={handleEmailLogin}
        layout="vertical"
        size="large"
      >
        <Form.Item
          name="email"
          label="邮箱"
          rules={[
            { required: true, message: '请输入邮箱地址' },
            { type: 'email', message: '请输入正确的邮箱格式' },
          ]}
        >
          <Input prefix={<MailOutlined />} placeholder="example@zhiban.com" />
        </Form.Item>

        <Form.Item
          name="password"
          label="密码"
          rules={[{ required: true, message: '请输入密码' }]}
        >
          <Input.Password prefix={<LockOutlined />} placeholder="请输入您的密码" />
        </Form.Item>

        <div style={{ textAlign: 'right', marginBottom: 16 }}>
          <a onClick={() => setForgotModalVisible(true)} style={{ color: '#7c3aed' }}>
            忘记密码？
          </a>
        </div>

        <Form.Item name="remember" valuePropName="checked">
          <Checkbox>记住密码</Checkbox>
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            block
            className="gradient-btn"
            loading={loading}
          >
            登录
          </Button>
        </Form.Item>
      </Form>
    ),
  };

  const codeTab = {
    key: 'code',
    label: '验证码登录',
    children: (
      <Form
        form={codeForm}
        name="code_login"
        onFinish={handleCodeLogin}
        layout="vertical"
        size="large"
      >
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

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            block
            className="gradient-btn"
            loading={loading}
          >
            登录
          </Button>
        </Form.Item>
      </Form>
    ),
  };

  return (
    <div className="auth-container">
      <div className="footer-book"></div>

      <div className="auth-card">
        <div className="auth-title">
          知伴<span>AI</span>
        </div>

        <Tabs defaultActiveKey="email" items={[emailTab, codeTab]} centered />

        <div style={{ textAlign: 'center', marginTop: 24, color: '#6b7280' }}>
          还没有账号？
          <a
            onClick={() => navigate('/register')}
            style={{ color: '#7c3aed', fontWeight: 500, marginLeft: 4 }}
          >
            立即注册
          </a>
        </div>
      </div>

      {/* 忘记密码弹窗 */}
      <Modal
        title="忘记密码"
        open={forgotModalVisible}
        onCancel={() => setForgotModalVisible(false)}
        footer={null}
        destroyOnHidden
      >
        <Form
          form={forgotForm}
          onFinish={handleForgotPassword}
          layout="vertical"
          size="large"
        >
          <Form.Item
            name="email"
            label="邮箱"
            rules={[
              { required: true, message: '请输入邮箱地址' },
              { type: 'email', message: '请输入正确的邮箱格式' },
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="请输入注册邮箱" />
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
                onClick={handleForgotSendCode}
                disabled={forgotCountdown > 0 || forgotSendingCode}
                style={{ width: 120 }}
              >
                {forgotSendingCode ? <Spin size="small" /> : forgotCountdown > 0 ? `${forgotCountdown}s` : '获取验证码'}
              </Button>
            </div>
          </Form.Item>

          <Form.Item
            name="new_password"
            label="新密码"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 6, message: '密码至少6位' },
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="请输入新密码" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'center' }}>
            <Button
              type="primary"
              htmlType="submit"
              className="gradient-btn"
              loading={forgotLoading}
              style={{ width: '100%' }}
            >
              重置密码
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Login;

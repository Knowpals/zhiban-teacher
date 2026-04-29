import React, { useState, useEffect } from 'react';
import { Layout, Menu, Avatar, Dropdown, Modal, message } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  HomeOutlined, 
  VideoCameraOutlined, 
  TeamOutlined, 
  BarChartOutlined, 
  UserOutlined,
  ArrowLeftOutlined,
  LogoutOutlined,
  DownOutlined
} from '@ant-design/icons';

const { Sider, Header, Content } = Layout;

// 侧边栏导航配置
const menuItems = [
  { key: '/home', label: '首页', icon: <HomeOutlined /> },
  { key: '/video-management', label: '视频管理', icon: <VideoCameraOutlined /> },
  { key: '/class-management', label: '班级管理', icon: <TeamOutlined /> },
  { key: '/data-analysis', label: '数据分析', icon: <BarChartOutlined /> },
  { key: '/my', label: '我的', icon: <UserOutlined /> },
];

const MainLayout = ({ children, pageTitle, showBack = false }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const selectedKey = location.pathname;
  const [userInfo, setUserInfo] = useState({ username: '加载中...' });

  // 获取用户信息
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const { getUserInfo } = await import('../services/api');
          const res = await getUserInfo();
          setUserInfo({ username: res.data?.username || res.data?.name || '用户' });
        }
      } catch (error) {
        console.error('获取用户信息失败:', error);
      }
    };
    fetchUserInfo();
  }, []);

  // 退出登录
  const handleLogout = () => {
    Modal.confirm({
      title: '确认退出',
      content: '确定要退出登录吗？',
      okText: '确认',
      cancelText: '取消',
      onOk: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userInfo');
        message.success('已退出登录');
        navigate('/');
      },
    });
  };

  // 用户下拉菜单
  const userMenuItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh', background: '#f9fafb' }}>
      {/* 左侧固定侧边栏（全局复用） */}
      <Sider width={200} style={{ background: '#fff', boxShadow: '2px 0 8px rgba(0,0,0,0.05)' }}>
        <div style={{ 
          height: 64, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          fontSize: 20, 
          fontWeight: 700, 
          color: '#7c3aed' 
        }}>
          知伴AI
        </div>
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          style={{ border: 'none', paddingTop: 16 }}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>

      <Layout>
        {/* 顶部导航栏（全局复用） */}
        <Header style={{ 
          background: '#fff', 
          padding: '0 24px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          height: 64
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 16, fontWeight: 500 }}>
            {showBack && <ArrowLeftOutlined style={{ cursor: 'pointer', color: '#666' }} onClick={() => navigate(-1)} />}
            {pageTitle}
          </div>
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <Avatar size={32} icon={<UserOutlined />} style={{ background: '#ddd6fe' }} />
              <span>{userInfo.username}</span>
              <DownOutlined style={{ fontSize: 10, color: '#999' }} />
            </div>
          </Dropdown>
        </Header>

        {/* 页面内容区 */}
        <Content style={{ padding: '24px', overflow: 'auto' }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
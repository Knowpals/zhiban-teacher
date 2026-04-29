import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import {
  Card, Button, Modal, Input, message,
  Space, Dropdown, Typography, Spin, Upload, DatePicker
} from 'antd';
import { PlusOutlined, MoreOutlined, UploadOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/MainLayout';
import { getMyUploadedVideos, uploadVideo } from '../services/api';

const { Text } = Typography;

const VideoManagement = () => {
  const navigate = useNavigate();
  const [videoList, setVideoList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [addModal, setAddModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [currentDeleteId, setCurrentDeleteId] = useState(null);
  const [videoTitle, setVideoTitle] = useState('');
  const [file, setFile] = useState(null);
  const [deadline, setDeadline] = useState('');

  useEffect(() => {
    fetchVideoList();
  }, []);

  const fetchVideoList = async () => {
    setLoading(true);
    try {
      const res = await getMyUploadedVideos();
      setVideoList(res.data?.videos || []);
    } catch (error) {
      message.error(error.message || '获取视频列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 上传视频
  const handleUpload = async () => {
    if (!file) {
      message.warning('请选择视频文件');
      return;
    }
    if (!videoTitle) {
      message.warning('请输入视频标题');
      return;
    }
    if (!deadline) {
      message.warning('请选择截止日期');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', videoTitle);
    // deadline 已经包含时间（showTime），直接使用
    formData.append('deadline', deadline);

    // 调试：打印 FormData 内容
    console.log('上传视频数据:');
    console.log('- file:', file ? file.name : '无');
    console.log('- title:', videoTitle);
    console.log('- deadline:', deadline);

    setUploading(true);
    try {
      const res = await uploadVideo(formData);
      console.log('上传成功响应:', res);
      message.success('视频上传成功！');
      setAddModal(false);
      setVideoTitle('');
      setFile(null);
      setDeadline('');
      fetchVideoList();
    } catch (error) {
      // 打印完整的错误响应
      console.error('上传错误详情:', error);
      console.error('错误响应完整:', JSON.stringify(error.response?.data, null, 2));
      
      const errorMsg = 
        error.message ||
        error.response?.data?.message || 
        error.response?.data?.error ||
        error.response?.data?.msg ||
        error.response?.data ||
        '上传失败，请检查视频格式和大小';
      message.error('上传失败: ' + errorMsg);
    } finally {
      setUploading(false);
    }
  };

  // 删除视频（仅前端模拟，实际需要后端接口）
  const handleDeleteVideo = () => {
    setVideoList(videoList.filter(item => item.video_id !== currentDeleteId));
    setDeleteModal(false);
    message.success('视频删除成功');
  };

  // 获取视频状态显示
  const getStatusDisplay = (video) => {
    const statusMap = {
      pending: { text: '尚未发布', tag: '未添加互动点', tagColor: 'red' },
      reviewing: { text: '审核中', tag: '审核中', tagColor: 'orange' },
      published: { text: '已发布', tag: '已审核', tagColor: 'green' },
      rejected: { text: '已拒绝', tag: '已拒绝', tagColor: 'red' },
    };
    return statusMap[video.status] || { text: video.status, tag: video.status, tagColor: 'default' };
  };

  // 删除菜单
  const getDeleteMenu = (videoId) => ({
    items: [
      {
        key: 'delete',
        label: '删除视频',
        danger: true,
        onClick: (e) => {
          e.domEvent.stopPropagation(); // 阻止事件冒泡
          setCurrentDeleteId(videoId);
          setDeleteModal(true);
        },
      },
    ],
  });

  // 格式化时间
  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return '刚刚';
    if (days === 1) return '昨天';
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <MainLayout pageTitle="视频管理">
        <div style={{ textAlign: 'center', padding: 100 }}>
          <Spin size="large" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout pageTitle="视频管理">
      {/* 页面顶部：标题 + 搜索框 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>全部视频</h2>
        <Input placeholder="搜索视频" style={{ width: 300 }} allowClear />
      </div>

      {/* 视频卡片列表 */}
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        {videoList.map((item) => {
          const status = getStatusDisplay(item);
          // 兼容多种可能的ID字段名
          const videoId = item.video_id || item.id || item.videoId;
          return (
            <Card
              key={videoId || Math.random()}
              style={{ width: 260, position: 'relative' }}
              hoverable
              onClick={() => {
                if (videoId) {
                  navigate(`/video-detail-edit/${videoId}`);
                }
              }}
              extra={
                <Dropdown menu={getDeleteMenu(videoId)} trigger={['click']}>
                  <Button type="text" icon={<MoreOutlined />} onClick={(e) => e.stopPropagation()} />
                </Dropdown>
              }
            >
              {/* 视频缩略图 */}
              <div
                style={{
                  width: '100%',
                  height: 140,
                  backgroundColor: '#f0f2f5',
                  borderRadius: 4,
                  marginBottom: 12,
                }}
              />

              {/* 视频信息 */}
              <h3 style={{ margin: '0 0 8px 0', fontSize: 15 }}>{item.title || '未命名视频'}</h3>
              <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                {status.text}
              </Text>
              <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
                最后操作：{formatTime(item.created_at)}
              </Text>

              {/* 状态标签 */}
              <Text
                style={{
                  padding: '2px 6px',
                  borderRadius: 2,
                  fontSize: 12,
                  backgroundColor: status.tagColor === 'red' ? '#fff2f0' : '#f6ffed',
                  color: status.tagColor === 'red' ? '#ff4d4f' : status.tagColor === 'green' ? '#52c41a' : '#fa8c16',
                }}
              >
                {status.tag}
              </Text>
            </Card>
          );
        })}
      </div>

      {/* 右下角悬浮新增按钮 */}
      <Button
        type="primary"
        shape="circle"
        size="large"
        icon={<PlusOutlined />}
        onClick={() => setAddModal(true)}
        style={{
          position: 'fixed',
          bottom: 50,
          right: 50,
          width: 60,
          height: 60,
          fontSize: 24,
          backgroundColor: '#722ed1',
          borderColor: '#722ed1',
        }}
      />

      {/* 新增视频弹窗 */}
      <Modal
        title="新增视频"
        open={addModal}
        onCancel={() => {
          setAddModal(false);
          setVideoTitle('');
          setFile(null);
          setDeadline('');
        }}
        footer={null}
        mask={{ closable: false }}
      >
        {/* 视频上传区域 */}
        <Upload.Dragger
          name="file"
          beforeUpload={(info) => {
            setFile(info);
            if (!videoTitle && info.name) {
              setVideoTitle(info.name.replace(/\.[^/.]+$/, ''));
            }
            return false;
          }}
          showUploadList={false}
          accept="video/*"
        >
          <p className="ant-upload-drag-icon">
            <UploadOutlined style={{ fontSize: 24, color: '#999' }} />
          </p>
          <p className="ant-upload-text">点击上传视频</p>
          <p className="ant-upload-hint">支持 mp4 格式</p>
        </Upload.Dragger>

        {file && (
          <div style={{ marginTop: 8, color: '#52c41a' }}>
            已选择: {file.name}
          </div>
        )}

        {/* 标题输入框 */}
        <Input
          placeholder="请输入标题"
          value={videoTitle}
          onChange={(e) => setVideoTitle(e.target.value)}
          style={{ marginTop: 16, marginBottom: 16 }}
        />

        {/* 任务截止日期 */}
        <div style={{ marginBottom: 16 }}>
          <Text style={{ marginBottom: 8, display: 'block' }}>任务截止日期</Text>
          <DatePicker
            placeholder="请选择日期和时间"
            showTime={{ format: 'HH:mm:ss' }}
            format="YYYY-MM-DD HH:mm:ss"
            value={deadline ? dayjs(deadline, 'YYYY-MM-DD HH:mm:ss') : null}
            onChange={(date, dateString) => setDeadline(dateString)}
            style={{ width: '100%' }}
          />
        </div>

        {/* 按钮组 */}
        <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={() => {
            setAddModal(false);
            setVideoTitle('');
            setFile(null);
            setDeadline('');
          }}>
            取消
          </Button>
          <Button
            type="primary"
            onClick={handleUpload}
            loading={uploading}
            style={{ backgroundColor: '#722ed1', borderColor: '#722ed1' }}
          >
            确认
          </Button>
        </Space>
      </Modal>

      {/* 删除确认弹窗 */}
      <Modal
        title="确认删除？"
        open={deleteModal}
        onCancel={() => setDeleteModal(false)}
        onOk={handleDeleteVideo}
        okText="确认"
        cancelText="取消"
        okButtonProps={{ danger: true }}
      />
    </MainLayout>
  );
};

export default VideoManagement;

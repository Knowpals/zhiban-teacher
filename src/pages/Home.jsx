import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Tag, Button, Spin } from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/MainLayout';
import { getMyUploadedVideos, getMyCreatedClasses } from '../services/api';

const Home = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [videoList, setVideoList] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [videoRes, classRes] = await Promise.all([
        getMyUploadedVideos(),
        getMyCreatedClasses(),
      ]);
      setVideoList(videoRes.data?.videos || []);
      // 待审核数量从视频列表中筛选
      const pendingVideos = (videoRes.data?.videos || []).filter(
        (v) => v.status === 'pending' || v.status === 'reviewing'
      );
      setPendingCount(pendingVideos.length);
    } catch (error) {
      console.error('获取数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 获取视频状态显示
  const getStatusDisplay = (video) => {
    const statusMap = {
      pending: { text: '待发布', color: 'orange' },
      reviewing: { text: '审核中', color: 'blue' },
      published: { text: '已发布', color: 'green' },
      rejected: { text: '已拒绝', color: 'red' },
    };
    return statusMap[video.status] || { text: video.status, color: 'default' };
  };

  // 格式化时间
  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return '今天';
    if (days === 1) return '昨天';
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <MainLayout pageTitle="首页">
        <div style={{ textAlign: 'center', padding: 100 }}>
          <Spin size="large" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout pageTitle="首页">
      {/* 待审核模块 */}
      <Card style={{ marginBottom: 24, borderRadius: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: '#ede9fe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#7c3aed',
              fontSize: 20
            }}>
              <ClockCircleOutlined />
            </div>
            <div>
              <div style={{ fontSize: 14, color: '#666', marginBottom: 4 }}>待审核互动点</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 24, fontWeight: 700, color: '#1f2937' }}>{pendingCount}</span>
                {pendingCount > 0 && <Tag color="blue">新增{pendingCount}个</Tag>}
              </div>
            </div>
          </div>
          <Button
            type="link"
            style={{ color: '#7c3aed' }}
            onClick={() => navigate('/pending-review')}
          >
            查看详情
          </Button>
        </div>
      </Card>

      {/* 最近视频模块 */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <span style={{ fontSize: 16, fontWeight: 500 }}>最近视频</span>
          <Button
            type="link"
            style={{ color: '#7c3aed', padding: 0 }}
            onClick={() => navigate('/video-management')}
          >
            查看全部
          </Button>
        </div>

        {videoList.length === 0 ? (
          <Card style={{ borderRadius: 12, textAlign: 'center', padding: 40 }}>
            <div style={{ color: '#666', marginBottom: 16 }}>暂无视频</div>
            <Button type="primary" onClick={() => navigate('/video-management')}>
              上传视频
            </Button>
          </Card>
        ) : (
          <Row gutter={[16, 16]}>
            {videoList.slice(0, 6).map((video) => {
              const status = getStatusDisplay(video);
              // 兼容多种可能的ID字段名
              const videoId = video.video_id || video.id || video.videoId;
              return (
                <Col span={4} key={videoId || Math.random()}>
                  <Card
                    hoverable
                    style={{ borderRadius: 12, height: '100%' }}
                    styles={{ body: { padding: 12 } }}
                    onClick={() => {
                      if (videoId) {
                        navigate(`/video-detail-edit/${videoId}`);
                      } else {
                        console.error('视频ID不存在:', video);
                      }
                    }}
                  >
                    {/* 视频封面占位 */}
                    <div style={{
                      width: '100%',
                      height: 120,
                      background: '#d1d5db',
                      borderRadius: 8,
                      marginBottom: 12
                    }}></div>
                    <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>
                      {video.title || '未命名视频'}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#666' }}>
                      <Tag color={status.color}>{status.text}</Tag>
                      <span>{formatTime(video.created_at)}</span>
                    </div>
                  </Card>
                </Col>
              );
            })}
          </Row>
        )}
      </div>
    </MainLayout>
  );
};

export default Home;

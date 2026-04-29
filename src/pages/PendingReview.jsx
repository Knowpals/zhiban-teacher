import React, { useState, useEffect } from 'react';
import { Card, Button, Spin } from 'antd';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/MainLayout';
import { getMyUploadedVideos } from '../services/api';

const PendingReview = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [pendingVideos, setPendingVideos] = useState([]);

  useEffect(() => {
    fetchPendingVideos();
  }, []);

  const fetchPendingVideos = async () => {
    setLoading(true);
    try {
      const res = await getMyUploadedVideos();
      const videos = res.data?.videos || [];
      // 筛选待审核的视频（状态为 pending 或 reviewing）
      const pending = videos.filter(
        (v) => v.status === 'pending' || v.status === 'reviewing' || v.status === 'review'
      );
      setPendingVideos(pending);
    } catch (error) {
      console.error('获取待审核列表失败:', error);
    } finally {
      setLoading(false);
    }
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
      <MainLayout pageTitle="待审核" showBack>
        <div style={{ textAlign: 'center', padding: 100 }}>
          <Spin size="large" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout pageTitle="待审核" showBack>
      <div style={{ maxWidth: 800 }}>
        {/* 待审核统计 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, fontSize: 18 }}>
          <span>待审核互动点:</span>
          <span style={{ fontWeight: 700, color: '#4f46e5', fontSize: 24 }}>{pendingVideos.length}</span>
        </div>

        {pendingVideos.length === 0 ? (
          <Card style={{ borderRadius: 12, textAlign: 'center', padding: 40 }}>
            <div style={{ color: '#666', marginBottom: 16 }}>暂无待审核内容</div>
            <Button type="primary" onClick={() => navigate('/video-management')}>
              去上传视频
            </Button>
          </Card>
        ) : (
          pendingVideos.map((video) => (
            <Card key={video.video_id} style={{ borderRadius: 12, marginBottom: 16 }}>
              <div style={{
                width: '100%',
                height: 180,
                background: '#9ca3af',
                borderRadius: 8,
                marginBottom: 16
              }}></div>

              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 4 }}>
                  {video.title || '未命名视频'}
                </div>
                <div style={{ fontSize: 14, color: '#666' }}>
                  最后操作：{formatTime(video.created_at)}
                </div>
              </div>

              <Button
                type="primary"
                block
                className="gradient-btn"
                style={{ height: 36 }}
                onClick={() => {
                  const videoId = video.video_id || video.id || video.videoId;
                  if (videoId) {
                    navigate(`/video-detail-edit/${videoId}`);
                  }
                }}
              >
                查看详情
              </Button>
            </Card>
          ))
        )}
      </div>
    </MainLayout>
  );
};

export default PendingReview;

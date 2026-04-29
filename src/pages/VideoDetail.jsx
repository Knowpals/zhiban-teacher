import React, { useState, useEffect } from 'react';
import { Button, Space, Spin, message } from 'antd';
import { PlayCircleOutlined, EditOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import MainLayout from '../components/MainLayout';
import { getVideoDetail } from '../services/api';

const VideoDetail = () => {
  const navigate = useNavigate();
  const { videoId } = useParams();
  const [loading, setLoading] = useState(true);
  const [videoData, setVideoData] = useState(null);

  // 验证 videoId 是否有效
  const isValidVideoId = videoId && videoId !== 'undefined' && videoId !== 'null' && !isNaN(parseInt(videoId));

  useEffect(() => {
    if (isValidVideoId) {
      fetchVideoDetail();
    } else {
      message.error('视频ID无效');
      setLoading(false);
    }
  }, [videoId]);

  const fetchVideoDetail = async () => {
    setLoading(true);
    try {
      const res = await getVideoDetail(videoId);
      setVideoData(res.data);
    } catch (error) {
      message.error(error.message || '获取视频详情失败');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <MainLayout pageTitle="视频详情" showBack>
        <div style={{ textAlign: 'center', padding: 100 }}>
          <Spin size="large" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout pageTitle={videoData?.title || '视频详情'} showBack>
      {/* 视频标题栏 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16
      }}>
        <Space size={12}>
          <span style={{ fontSize: 18, fontWeight: 500 }}>{videoData?.title || '视频'}</span>
          <span style={{ fontSize: 14, color: '#666' }}>时长: {videoData?.duration || 0}秒</span>
        </Space>
        <Button 
          type="primary" 
          icon={<EditOutlined />}
          onClick={() => {
            const targetVideoId = videoData?.video_id || videoData?.id || videoId;
            if (targetVideoId) {
              navigate(`/video-detail-edit/${targetVideoId}`);
            } else {
              message.error('无法获取视频ID');
            }
          }}
        >
          编辑视频
        </Button>
      </div>

      {/* 视频播放器区域 */}
      <div style={{
        width: '100%',
        background: '#1a1a1a',
        borderRadius: 12,
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        minHeight: 500
      }}>
        {/* 视频进度条 + 互动点 */}
        <div style={{ width: '100%', marginBottom: 16 }}>
          <div style={{
            width: '100%',
            height: 6,
            background: '#666',
            borderRadius: 3,
            position: 'relative'
          }}>
            {/* 互动点标记 */}
            {videoData?.segments?.map((seg, idx) => {
              const percent = videoData.duration > 0 ? (seg.end / videoData.duration) * 100 : 0;
              return (
                <div key={idx} style={{
                  position: 'absolute',
                  left: `${percent}%`,
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  background: seg.question ? '#4f46e5' : '#22c55e',
                  border: '2px solid white',
                  cursor: 'pointer'
                }} />
              );
            })}
          </div>
        </div>

        {/* 播放控制栏 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'white' }}>
          <Space size={12}>
            <PlayCircleOutlined style={{ fontSize: 24, cursor: 'pointer' }} />
            <span>00:00</span>
          </Space>
          <Space size={12}>
            <span>1.0×</span>
            <span>全屏</span>
          </Space>
        </div>
      </div>
    </MainLayout>
  );
};

export default VideoDetail;

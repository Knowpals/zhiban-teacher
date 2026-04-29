import React, { useState, useEffect } from 'react';
import { Form, Select, Button, Space, Spin, message } from 'antd';
import { PlayCircleOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import MainLayout from '../components/MainLayout';
import { getVideoDetail, getVideoTasks } from '../services/api';

const { Option } = Select;

const ClassVideoDetail = () => {
  const navigate = useNavigate();
  const { classId, videoId } = useParams();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [videoData, setVideoData] = useState(null);
  const [videos, setVideos] = useState([]);
  const [selectedVideoId, setSelectedVideoId] = useState(videoId);

  // 验证 classId 是否有效
  const isValidClassId = classId && classId !== 'undefined' && classId !== 'null' && !isNaN(parseInt(classId));

  useEffect(() => {
    if (isValidClassId) {
      fetchData();
    } else {
      message.error('班级ID无效');
      setLoading(false);
    }
  }, [classId, videoId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const tasksRes = await getVideoTasks(classId);
      const videoTasks = tasksRes.data?.video_tasks || [];
      setVideos(videoTasks);
      
      // 如果有视频任务但没有指定videoId，使用第一个
      let currentVideoId = videoId;
      if (!currentVideoId && videoTasks.length > 0) {
        currentVideoId = videoTasks[0].video_id;
        setSelectedVideoId(currentVideoId);
      }
      
      if (currentVideoId) {
        const detailRes = await getVideoDetail(currentVideoId);
        setVideoData(detailRes.data);
      }
    } catch (error) {
      console.error('获取数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVideoChange = (videoId) => {
    setSelectedVideoId(videoId);
    navigate(`/class-video-detail/${classId}/${videoId}`);
  };

  if (loading) {
    return (
      <MainLayout pageTitle="班级所含视频" showBack>
        <div style={{ textAlign: 'center', padding: 100 }}>
          <Spin size="large" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout pageTitle={videoData?.title || '班级所含视频'} showBack>
      {/* 顶部标题栏 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16
      }}>
        <Form form={form} layout="inline">
          <Form.Item name="videoTitle">
            <Select
              value={selectedVideoId}
              onChange={handleVideoChange}
              style={{ width: 200 }}
            >
              {videos.map((v) => (
                <Option key={v.video_id} value={v.video_id}>
                  {v.title}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
        <Button type="link" style={{ color: '#fa8c16' }} onClick={() => navigate('/video-management')}>
          跳转到视频管理部分
        </Button>
      </div>

      {/* 视频播放器区域 */}
      <div style={{
        width: '100%',
        background: '#9ca3af',
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
            height: 4,
            background: '#d1d5db',
            borderRadius: 2,
            position: 'relative'
          }}>
            {/* 已播放进度 */}
            <div style={{ width: '40%', height: '100%', background: '#4f46e5', borderRadius: 2 }}></div>
            {/* 互动点标记 */}
            {videoData?.segments?.map((seg, idx) => {
              const percent = videoData.duration > 0 ? (seg.end / videoData.duration) * 100 : 0;
              return (
                <div key={idx} style={{
                  position: 'absolute',
                  left: `${percent}%`,
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: seg.question ? '#4f46e5' : '#22c55e',
                  border: '2px solid white'
                }}></div>
              );
            })}
          </div>
        </div>

        {/* 播放控制栏 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'white' }}>
          <Space size={12}>
            <PlayCircleOutlined style={{ fontSize: 24, cursor: 'pointer' }} />
            <span>3s</span>
          </Space>
          <Space size={12}>
            <span>1.25×</span>
            <span>全屏</span>
          </Space>
        </div>
      </div>
    </MainLayout>
  );
};

export default ClassVideoDetail;

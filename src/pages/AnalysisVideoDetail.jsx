import React, { useState, useEffect } from 'react';
import { Form, Select, Button, Space, Spin } from 'antd';
import { PlayCircleOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import MainLayout from '../components/MainLayout';
import { getVideoDetail, getMyCreatedClasses, getClassStat } from '../services/api';

const { Option } = Select;

const AnalysisVideoDetail = () => {
  const navigate = useNavigate();
  const { knowledgeId } = useParams();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [videoData, setVideoData] = useState(null);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [videos, setVideos] = useState([]);
  const [selectedVideoId, setSelectedVideoId] = useState(null);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const res = await getMyCreatedClasses();
      const classList = res.data?.class_list || [];
      setClasses(classList);
      if (classList.length > 0) {
        setSelectedClass(classList[0].class_id);
        fetchClassVideos(classList[0].class_id);
      }
    } catch (error) {
      console.error('获取班级列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClassVideos = async (classId) => {
    try {
      const res = await getClassStat({ class_id: classId, video_id: 1 });
      // 模拟获取视频列表
      setVideos([]);
    } catch (error) {
      console.error('获取视频列表失败:', error);
    }
  };

  if (loading) {
    return (
      <MainLayout pageTitle="班级学情数据分析" showBack>
        <div style={{ textAlign: 'center', padding: 100 }}>
          <Spin size="large" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout
      pageTitle="班级学情数据分析-知识点详情"
      showBack
    >
      {/* 顶部标题栏 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16
      }}>
        <Form form={form} layout="inline">
          <Form.Item name="class">
            <Select
              style={{ width: 150 }}
              value={selectedClass}
              onChange={(value) => {
                setSelectedClass(value);
                fetchClassVideos(value);
              }}
            >
              {classes.map((cls) => (
                <Option key={cls.class_id} value={cls.class_id}>
                  {cls.class_name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="videoTitle">
            <Select defaultValue="video1" style={{ width: 200 }} onChange={(v) => setSelectedVideoId(v)}>
              <Option value="video1">二次函数的实际运用</Option>
            </Select>
          </Form.Item>
        </Form>
        <Button type="link" style={{ color: '#fa8c16' }} onClick={() => navigate('/data-analysis')}>
          返回数据分析
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
            <div style={{
              position: 'absolute',
              left: '40%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: '#4f46e5',
              border: '2px solid white'
            }}></div>
            <div style={{
              position: 'absolute',
              left: '45%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: '#4f46e5',
              border: '2px solid white'
            }}></div>
            <div style={{
              position: 'absolute',
              left: '60%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: '#22c55e',
              border: '2px solid white'
            }}></div>
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

export default AnalysisVideoDetail;

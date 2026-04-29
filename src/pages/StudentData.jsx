import { useState, useEffect } from 'react';
import { Form, Select, Card, Progress, Tag, Spin } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import MainLayout from '../components/MainLayout';
import { getStudentStat, getVideoTasks } from '../services/api';

const { Option } = Select;

const StudentData = () => {
  const navigate = useNavigate();
  const { studentId } = useParams();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [statData, setStatData] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [videos, setVideos] = useState([]);
  const [videoLoading, setVideoLoading] = useState(false);

  // 获取班级视频列表
  useEffect(() => {
    fetchVideos();
  }, []);

  // 当选择的视频变化时，获取该视频的统计数据
  useEffect(() => {
    if (selectedVideo) {
      fetchVideoStat(selectedVideo);
    } else {
      setStatData(null);
    }
  }, [selectedVideo]);

  const fetchVideos = async () => {
    setVideoLoading(true);
    try {
      // TODO: 需要后端API支持获取学生的班级列表
      // 暂时使用第一个班级ID，后续需要根据学生所在的班级获取
      const res = await getVideoTasks(1);
      setVideos(res.data.video_tasks || []);
    } catch (error) {
      console.error('获取视频列表失败:', error);
      setVideos([]);
    } finally {
      setVideoLoading(false);
      setLoading(false);
    }
  };

  const fetchVideoStat = async (videoId) => {
    try {
      const res = await getStudentStat(videoId);
      setStatData(res.data);
    } catch (error) {
      console.error('获取视频统计失败:', error);
      setStatData(null);
    }
  };

  if (loading) {
    return (
      <MainLayout pageTitle="学生个人数据" showBack>
        <div style={{ textAlign: 'center', padding: 100 }}>
          <Spin size="large" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout pageTitle={`学生个人数据 #${studentId}`} showBack>
      {/* 顶部筛选栏 */}
      <div style={{ marginBottom: 24 }}>
        <Form form={form} layout="inline">
          <Form.Item name="video">
            <Select
              style={{ width: 200 }}
              placeholder="选择视频查看详情"
              onChange={setSelectedVideo}
              allowClear
              loading={videoLoading}
            >
              {videos.map((v) => (
                <Option key={v.video_id} value={v.video_id}>
                  {v.title}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </div>

      {/* 核心数据卡片 */}
      <div style={{ display: 'flex', gap: 24, marginBottom: 32 }}>
        <Card style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>视频观看时长</div>
              <Progress
                percent={statData?.time_cost ? Math.min((statData.time_cost / 3600) * 100, 100) : 0}
                size="small"
                status="active"
              />
            </div>
            <div style={{ fontSize: 24, fontWeight: 700 }}>
              {statData?.time_cost ? `${Math.floor(statData.time_cost / 60)}分钟` : '0分钟'}
            </div>
          </div>
        </Card>
        <Card style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>答题正确率</div>
              <Progress
                percent={statData?.correct_rate ? statData.correct_rate * 100 : 0}
                size="small"
                strokeColor="#52c41a"
                status="success"
              />
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#52c41a' }}>
              {statData?.correct_rate ? `${(statData.correct_rate * 100).toFixed(1)}%` : '0%'}
            </div>
          </div>
        </Card>
      </div>

      {/* 学习表现模块 */}
      <div style={{ display: 'flex', gap: 24, marginBottom: 32 }}>
        <Card title="任务完成情况" style={{ flex: 1 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#1890ff' }}>
              {statData?.status || '未开始'}
            </div>
            <div style={{ fontSize: 12, color: '#666' }}>
              当前任务状态
            </div>
          </div>
        </Card>

        <Card title="学习行为分析" style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-around' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#ff4d4f' }}>
                {statData?.pause_count || 0}
              </div>
              <div style={{ fontSize: 12, color: '#666' }}>暂停次数</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#722ed1' }}>
                {statData?.replay_count || 0}
              </div>
              <div style={{ fontSize: 12, color: '#666' }}>回放次数</div>
            </div>
          </div>
        </Card>
      </div>

      {/* 个人薄弱点分析 */}
      {statData?.knowledge_points && statData.knowledge_points.length > 0 && (
        <Card title="个人薄弱点分析">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {statData.knowledge_points.map((point, index) => (
              <div key={index}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ fontSize: 14 }}>{point.title}</div>
                  <div style={{ fontSize: 12, color: '#666' }}>
                    掌握度 {point.master_score ? `${(point.master_score * 100).toFixed(0)}%` : '0%'}
                  </div>
                </div>
                <Progress
                  percent={point.master_score ? point.master_score * 100 : 0}
                  size="small"
                  status={point.master_score < 0.5 ? 'exception' : 'active'}
                />
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 默认薄弱点显示 - 当没有选择视频时 */}
      {!statData && (
        <Card title="知识易错点TOP 3" style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 14, marginBottom: 4 }}>一元二次方程求根公式</div>
                <div style={{ fontSize: 12, color: '#666' }}>作业错误 3次 / 练习错误 2次</div>
              </div>
              <Tag color="red">错误率 60%</Tag>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 14, marginBottom: 4 }}>函数图像的性质</div>
                <div style={{ fontSize: 12, color: '#666' }}>作业错误 2次 / 练习错误 1次</div>
              </div>
              <Tag color="orange">错误率 35%</Tag>
            </div>
          </div>
        </Card>
      )}
    </MainLayout>
  );
};

export default StudentData;

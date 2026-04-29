import React, { useState, useEffect } from 'react';
import {
  Form, Select, Card, Row, Col, Progress, Table, Tag,
  Button, Spin
} from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/MainLayout';
import ReactECharts from 'echarts-for-react';
import { getMyCreatedClasses, getClassStat, getVideoTasks } from '../services/api';

const { Option } = Select;

const DataAnalysis = () => {
  const navigate = useNavigate();
  const [classForm] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [statData, setStatData] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [videos, setVideos] = useState([]);

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchVideos(selectedClass);
    }
  }, [selectedClass]);

  useEffect(() => {
    if (selectedClass && selectedVideo) {
      fetchClassStat(selectedClass, selectedVideo);
    }
  }, [selectedClass, selectedVideo]);

  const fetchVideos = async (classId) => {
    try {
      const res = await getVideoTasks(classId);
      const videoList = res.data?.video_tasks || [];
      setVideos(videoList);
      if (videoList.length > 0) {
        setSelectedVideo(videoList[0].video_id);
      } else {
        setSelectedVideo(null);
        setStatData(null);
      }
    } catch (error) {
      console.error('获取视频列表失败:', error);
      setVideos([]);
      setSelectedVideo(null);
    }
  };

  const fetchClasses = async () => {
    try {
      const res = await getMyCreatedClasses();
      const classList = res.data?.class_list || [];
      setClasses(classList);
      if (classList.length > 0) {
        setSelectedClass(classList[0].class_id);
        classForm.setFieldsValue({ class: classList[0].class_id });
      }
    } catch (error) {
      console.error('获取班级列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClassStat = async (classId, videoId) => {
    if (!classId || !videoId) return;
    setLoading(true);
    try {
      const res = await getClassStat({ class_id: classId, video_id: videoId });
      setStatData(res.data);
    } catch (error) {
      console.error('获取统计数据失败:', error);
      setStatData(null);
    } finally {
      setLoading(false);
    }
  };

  // 暂停次数柱状图配置
  const pauseChartOption = {
    grid: { left: 0, right: 0, top: 0, bottom: 0 },
    xAxis: { type: 'category', show: false },
    yAxis: { type: 'value', show: false },
    series: [{
      type: 'bar',
      data: statData?.top_pause_action?.map(p => p.pause_count) || [120, 190, 130, 250, 150, 180, 220, 160, 140, 170, 200, 137],
      itemStyle: { color: '#85a5ff' },
      barWidth: '60%',
    }]
  };

  // 高错误率题目清单
  const errorTableColumns = [
    { title: '排名', dataIndex: 'rank', key: 'rank', render: (_, __, index) => index + 1 },
    { title: '题目内容', dataIndex: 'content', key: 'content' },
    {
      title: '错误率',
      dataIndex: 'error_rate',
      key: 'error_rate',
      render: (text) => <span style={{ color: '#f5222d', fontWeight: 500 }}>{text}%</span>,
    },
  ];

  if (loading && !statData) {
    return (
      <MainLayout pageTitle="班级学情数据分析">
        <div style={{ textAlign: 'center', padding: 100 }}>
          <Spin size="large" />
        </div>
      </MainLayout>
    );
  }

  const overview = statData?.overview || {
    average_correct_rate: 0,
    average_time_cost: 0,
    complete_rate: 0,
    total_pause_count: 0,
  };

  const weakPoints = statData?.weak_knowledge_point || [];
  const topPause = statData?.top_pause_action || [];
  const topReplay = statData?.top_replay_action || [];
  const topQuestions = statData?.top_questions || [];

  return (
    <MainLayout pageTitle="班级学情数据分析">
      {/* 班级和视频选择器 */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <Form form={classForm} layout="inline">
          <Form.Item name="class">
            <Select
              style={{ width: 200 }}
              placeholder="选择班级"
              onChange={(value) => setSelectedClass(value)}
            >
              {classes.map((cls) => (
                <Option key={cls.class_id} value={cls.class_id}>
                  {cls.class_name}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
        <Select
          style={{ width: 250 }}
          placeholder="选择视频"
          value={selectedVideo}
          onChange={(value) => setSelectedVideo(value)}
        >
          {videos.map((video) => (
            <Option key={video.video_id} value={video.video_id}>
              {video.video_title || video.title || `视频 ${video.video_id}`}
            </Option>
          ))}
        </Select>
      </div>

      {/* 顶部统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card style={{ borderRadius: 8, height: '100%' }} styles={{ body: { padding: 16 } }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#1f2937', marginBottom: 8 }}>
                {overview.average_correct_rate ? `${(overview.average_correct_rate * 100).toFixed(1)}%` : '0%'}
              </div>
              <div style={{ fontSize: 12, color: '#52c41a' }}>
                <ArrowUpOutlined /> 较上周 +2.1%
              </div>
            </div>
            <div style={{ fontSize: 12, color: '#666', marginTop: 8 }}>平均正确率</div>
          </Card>
        </Col>
        <Col span={6}>
          <Card style={{ borderRadius: 8, height: '100%' }} styles={{ body: { padding: 16 } }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 600, color: '#1f2937', marginBottom: 8 }}>
                {overview.average_time_cost ? `${Math.floor(overview.average_time_cost / 60)}分${overview.average_time_cost % 60}秒` : '0分0秒'}
              </div>
              <div style={{ fontSize: 12, color: '#52c41a' }}>
                快于年级平均 0.5 分钟
              </div>
            </div>
            <div style={{ fontSize: 12, color: '#666', marginTop: 8 }}>平均答题时间</div>
          </Card>
        </Col>
        <Col span={6}>
          <Card style={{ borderRadius: 8, height: '100%' }} styles={{ body: { padding: 16 } }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#1f2937', marginBottom: 8 }}>
                {overview.complete_rate ? `${(overview.complete_rate * 100).toFixed(1)}%` : '0%'}
              </div>
              <Progress percent={overview.complete_rate ? overview.complete_rate * 100 : 0} size="small" status="success" />
            </div>
            <div style={{ fontSize: 12, color: '#666', marginTop: 8 }}>课程完成率</div>
          </Card>
        </Col>
        <Col span={6}>
          <Card style={{ borderRadius: 8, height: '100%' }} styles={{ body: { padding: 16 } }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#1f2937', marginBottom: 8 }}>
                {overview.total_pause_count?.toLocaleString() || 0}次
              </div>
              <ReactECharts option={pauseChartOption} style={{ height: 40 }} />
            </div>
            <div style={{ fontSize: 12, color: '#666', marginTop: 8 }}>班级总暂停次数</div>
          </Card>
        </Col>
      </Row>

      {/* 知识点薄弱率排行 */}
      <Card title="知识点薄弱率排行榜" style={{ marginBottom: 24, borderRadius: 8 }}>
        {weakPoints.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#666', padding: 20 }}>暂无数据</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {weakPoints.map((point, index) => (
              <div key={index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ fontSize: 14, color: '#666', width: 120 }}>{point.title}</div>
                  <div style={{ width: 200 }}>
                    <Progress
                      percent={point.weak_rate ? point.weak_rate * 100 : 0}
                      size="small"
                      strokeColor={point.weak_rate > 0.35 ? '#f5222d' : '#fa8c16'}
                      status={point.weak_rate > 0.35 ? 'exception' : 'active'}
                    />
                  </div>
                </div>
                <Button
                  type="link"
                  size="small"
                  onClick={() => navigate(`/analysis-video/${point.knowledge_id}`)}
                  style={{ color: '#1890ff' }}
                >
                  查看关联视频
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* 高频暂停/回看模块 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Card title="高频暂停时刻" style={{ borderRadius: 8 }}>
            <Form layout="inline" style={{ marginBottom: 16 }} initialValues={{ pauseVideo: 'video1' }}>
              <Form.Item name="pauseVideo">
                <Select style={{ width: 180 }} onChange={(v) => setSelectedVideo(v)}>
                  <Option value="video1">二次函数的概念引入</Option>
                </Select>
              </Form.Item>
            </Form>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {topPause.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#666', padding: 20 }}>暂无数据</div>
              ) : (
                topPause.slice(0, 3).map((item, index) => (
                  <div key={index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: 14, color: '#666' }}>
                      {item.start}s - {item.end}s
                    </div>
                    <div style={{ fontSize: 14, color: '#f5222d' }}>
                      {item.pause_count} 次暂停
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="高频回看时刻" style={{ borderRadius: 8 }}>
            <Form layout="inline" style={{ marginBottom: 16 }} initialValues={{ reviewVideo: 'video1' }}>
              <Form.Item name="reviewVideo">
                <Select style={{ width: 180 }} onChange={(v) => setSelectedVideo(v)}>
                  <Option value="video1">二次函数的概念引入</Option>
                </Select>
              </Form.Item>
            </Form>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {topReplay.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#666', padding: 20 }}>暂无数据</div>
              ) : (
                topReplay.slice(0, 3).map((item, index) => (
                  <div key={index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: 14, color: '#666' }}>
                      {item.start}s - {item.end}s
                    </div>
                    <div style={{ fontSize: 14, color: '#4096ff' }}>
                      回看 {item.replay_count} 次
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </Col>
      </Row>

      {/* 高错误率题目清单 */}
      <Card title="高错误率题目清单" style={{ borderRadius: 8 }}>
        <Form layout="inline" style={{ marginBottom: 16 }} initialValues={{ errorFilter: 'errorRate' }}>
          <Form.Item name="errorFilter">
            <Select style={{ width: 180 }}>
              <Option value="errorRate">按错误率排序</Option>
              <Option value="score">按平均得分排序</Option>
            </Select>
          </Form.Item>
        </Form>
        {topQuestions.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#666', padding: 20 }}>暂无数据</div>
        ) : (
          <Table
            columns={errorTableColumns}
            dataSource={topQuestions}
            rowKey="question_id"
            pagination={false}
            size="small"
          />
        )}
      </Card>
    </MainLayout>
  );
};

export default DataAnalysis;

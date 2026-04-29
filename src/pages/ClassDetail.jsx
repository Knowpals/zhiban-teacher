import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Modal, Table, Card, message, Space, Spin } from 'antd';
import { PlusOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import MainLayout from '../components/MainLayout';
import { getClassInfo, getClassStudents, getVideoTasks, joinClass } from '../services/api';

const ClassDetail = () => {
  const navigate = useNavigate();
  const { classId } = useParams();
  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [classInfo, setClassInfo] = useState({});
  const [students, setStudents] = useState([]);
  const [videos, setVideos] = useState([]);
  const [addLoading, setAddLoading] = useState(false);

  // 验证 classId 是否有效
  const isValidClassId = classId && classId !== 'undefined' && classId !== 'null' && !isNaN(parseInt(classId));

  useEffect(() => {
    if (isValidClassId) {
      fetchData();
    } else {
      message.error('班级ID无效');
      setLoading(false);
    }
  }, [classId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [infoRes, studentsRes, videosRes] = await Promise.all([
        getClassInfo(classId),
        getClassStudents(classId),
        getVideoTasks(classId),
      ]);
      setClassInfo(infoRes.data?.class_info || {});
      setStudents(studentsRes.data?.students || []);
      // 兼容：后端可能返回数组或单个对象
      const videoData = videosRes.data;
      console.log('班级视频数据:', videoData);
      
      // 处理视频任务数据，可能的结构：
      // 1. video_tasks 数组
      // 2. 直接是视频数组
      // 3. 单个视频对象
      let processedVideos = [];
      if (videoData?.video_tasks && Array.isArray(videoData.video_tasks)) {
        processedVideos = videoData.video_tasks;
      } else if (Array.isArray(videoData)) {
        processedVideos = videoData;
      } else if (videoData && typeof videoData === 'object') {
        processedVideos = [videoData];
      }
      
      console.log('处理后的视频列表:', processedVideos);
      console.log('第一个视频的所有字段:', processedVideos[0] ? Object.keys(processedVideos[0]) : '无');
      
      setVideos(processedVideos);
    } catch (error) {
      message.error(error.message || '获取数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 添加学生（使用邀请码）
  const handleAddStudent = async (values) => {
    setAddLoading(true);
    try {
      await joinClass({ invite_code: values.invite_code.trim() });
      message.success('学生添加成功！');
      setIsModalOpen(false);
      form.resetFields();
      fetchData();
    } catch (error) {
      message.error(error.message || '添加失败');
    } finally {
      setAddLoading(false);
    }
  };

  // 删除学生（模拟）
  const handleDeleteStudent = (studentId) => {
    setStudents(students.filter(s => s.id !== studentId));
    message.success('删除学生成功');
  };

  const studentColumns = [
    {
      title: '学生',
      dataIndex: 'username',
      key: 'username',
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{text}</div>
          <div style={{ fontSize: 12, color: '#666' }}>#{record.id}</div>
        </div>
      ),
    },
    { title: '邮箱', dataIndex: 'email', key: 'email' },
    {
      title: '学习数据',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/student-data/${record.id}`)}
          >
            查看个人学习数据
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteStudent(record.id)}
          >
            删除学生
          </Button>
        </Space>
      ),
    },
  ];

  // 格式化时间
  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <MainLayout pageTitle="班级详情" showBack>
        <div style={{ textAlign: 'center', padding: 100 }}>
          <Spin size="large" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout pageTitle={classInfo.class_name || '班级详情'} showBack>
      {/* 学生列表区域 */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3>学生列表 ({students.length}人)</h3>
          <Button type="primary" onClick={() => setIsModalOpen(true)}>
            添加学生
          </Button>
        </div>
        <Table
          columns={studentColumns}
          dataSource={students}
          rowKey="id"
          pagination={false}
        />
      </div>

      {/* 班级所含视频区域 */}
      <div>
        <h3 style={{ marginBottom: 16 }}>班级所含视频 ({videos.length}个):</h3>
        {videos.length === 0 ? (
          <Card style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ color: '#666', marginBottom: 16 }}>暂无视频</div>
            <Button type="primary" onClick={() => navigate('/video-management')}>
              去发布视频
            </Button>
          </Card>
        ) : (
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {videos.map((video) => {
              const videoId = video.video_id || video.id || video.videoId || video['video-id'];
              const handleVideoClick = () => {
                console.log('视频数据:', video);
                console.log('提取ID:', videoId);
                if (videoId) {
                  navigate(`/video-detail-edit/${videoId}`);
                } else {
                  message.error('视频ID不存在');
                }
              };
              return (
                <Card
                  key={videoId || Math.random()}
                  style={{ width: 200 }}
                  hoverable
                  onClick={handleVideoClick}
                >
                  <div style={{ height: 100, background: '#d9d9d9', marginBottom: 12, borderRadius: 4 }} />
                  <div style={{ fontSize: 14, marginBottom: 8 }}>{video.title}</div>
                  <div style={{ fontSize: 12, color: '#666' }}>
                    截止: {formatTime(video.deadline)}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* 添加学生弹窗 */}
      <Modal
        title="添加学生"
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleAddStudent}>
          <div style={{ marginBottom: 16, fontSize: 12, color: '#666' }}>
            学生可通过班级邀请码自行加入班级，分享邀请码给更多学生：
          </div>
          <div style={{ marginBottom: 16, padding: 12, background: '#f5f5f5', borderRadius: 8 }}>
            <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>班级邀请码</div>
            <div style={{ fontSize: 20, fontWeight: 600, color: '#7c3aed' }}>
              {classInfo.invite_code || '暂无'}
            </div>
          </div>
          <Form.Item
            label="输入邀请码添加学生:"
            name="invite_code"
          >
            <Input placeholder="请输入班级邀请码" />
          </Form.Item>
          <Form.Item style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={() => {
                setIsModalOpen(false);
                form.resetFields();
              }}>
                取消
              </Button>
              <Button type="primary" htmlType="submit" loading={addLoading}>
                确认
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </MainLayout>
  );
};

export default ClassDetail;

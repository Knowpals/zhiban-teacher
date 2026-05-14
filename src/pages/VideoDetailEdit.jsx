import React, { useState, useEffect, useRef } from 'react';
import {
  Modal, Select, Input, Button, message,
  Typography, Space, Alert, Drawer, Spin
} from 'antd';
import { PlusOutlined, RobotOutlined, UploadOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import MainLayout from '../components/MainLayout';
import { getVideoDetail, generateQuestions, postVideoToClass, getMyCreatedClasses, publishVideo, startVideoReview } from '../services/api';

const { TextArea } = Input;
const { Text } = Typography;

const VideoDetailEdit = () => {
  const navigate = useNavigate();
  const { videoId } = useParams();
  const videoRef = useRef(null);
  
  const [loading, setLoading] = useState(true);
  const [videoData, setVideoData] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [questionType, setQuestionType] = useState('选择题');

  // 互动点相关
  const [pointList, setPointList] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [currentPoint, setCurrentPoint] = useState(null);

  // 视频播放相关
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // 班级列表
  const [classList, setClassList] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState(null);

  // 表单数据
  const [formData, setFormData] = useState({
    title: '',
    insertTime: '',
    options: ['', '', '', ''],
    correctAnswer: '',
    analysis: ''
  });

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

  // 当编辑弹窗打开且currentPoint有值时，同步formData
  useEffect(() => {
    if (editModalOpen && currentPoint) {
      // 获取题目类型
      const rawType = currentPoint.type || currentPoint.question_type || currentPoint.questionType || currentPoint.q_type || '选择题';
      const typeMapping = {
        'choice': '选择题',
        'multiple_choice': '选择题',
        'single_choice': '选择题',
        'judge': '判断题',
        'true_false': '判断题',
        'short_answer': '简答题',
        'fill_blank': '填空题',
        'fill_in_blank': '填空题',
      };
      const questionType = typeMapping[rawType.toLowerCase()] || rawType;
      setQuestionType(questionType);
      
      // 处理选项
      let options = currentPoint.options || currentPoint.choices || [];
      if (typeof options === 'string') {
        options = options.split(',').map(opt => opt.trim());
      }
      while (options.length < 4) {
        options.push('');
      }
      
      // 填充表单
      setFormData({
        title: currentPoint.title || currentPoint.question_title || currentPoint.questionTitle || '',
        insertTime: String(currentPoint.time || currentPoint.insert_time || currentPoint.insertTime || currentPoint.timestamp || ''),
        options: options.slice(0, 4),
        correctAnswer: currentPoint.answer || currentPoint.correctAnswer || currentPoint.right_answer || currentPoint.answer_key || '',
        analysis: currentPoint.analysis || currentPoint.explanation || ''
      });
    }
  }, [editModalOpen, currentPoint]);


  // 题目类型中文映射
  const getQuestionTypeLabel = (type) => {
    const typeMap = {
      'choice': '单选题',
      'single_choice': '单选题',
      'multiple_choice': '多选题',
      'true_false': '判断题',
      'fill_blank': '填空题',
      'qa': '问答题',
      'fill': '填空题',
      'subjective': '主观题'
    };
    return typeMap[type] || type || '选择题';
  };
  
  const fetchVideoDetail = async () => {
    setLoading(true);
    try {
      // 只获取视频详情，segments 数据在详情接口中返回
      const res = await getVideoDetail(videoId);
      const detailData = res.data;
      
      // segments 数据从详情中获取
      const segments = detailData?.segments || [];
      
      console.log('获取视频详情原始数据:', detailData);
      console.log('视频分段数据:', segments);
      
      setVideoData(detailData);
      
      // 优先从顶级 questions 字段获取互动点（新接口）
      // 如果不存在则回退到从 segments 中提取（旧接口兼容）
      let questions = detailData?.questions || [];
      if (questions.length === 0 && segments && segments.length > 0) {
        questions = segments
          .filter(seg => seg.question && Object.keys(seg.question).length > 0) // 过滤掉空对象
          .map(seg => ({
            ...seg.question,
            segment_id: seg.id,  // 保存分段的 id 作为 segment_id
            time: seg.start      // 使用分段的 start 时间作为互动点时间
          }));
      }
      
      console.log('从视频分段提取的互动点:', questions);
      if (questions.length > 0) {
        console.log('第一个互动点字段:', Object.keys(questions[0]));
      }
      
      // 处理互动点：为每个互动点添加中文类型标签和时间
      const processedQuestions = questions.map((q, idx) => {
        // 确保 segment_id 不为 null
        const segmentId = q.segment_id ?? q.segmentId ?? (segments.length > 0 ? segments[0].id : 0);
        
        // 通过 segment_id 查找对应分段的时间
        let time = 0;
        if (segments.length > 0) {
          const segment = segments.find(s => s.id === segmentId || s.segment_id === segmentId);
          if (segment) {
            time = segment.start || segment.end || 0;
          }
        }
        
        // 如果找不到对应分段但有 segments，平均分配时间
        if (time === 0 && segments.length > 0 && questions.length > 0) {
          time = Math.floor((detailData.duration / (questions.length + 1)) * (idx + 1));
        }
        
        return {
          ...q,
          segment_id: segmentId,
          time: time,
          typeLabel: getQuestionTypeLabel(q.type || q.question_type) // 添加中文类型标签
        };
      });
      
      console.log('处理后的互动点（含time和typeLabel字段）:', processedQuestions);
      setPointList(processedQuestions);
    } catch (error) {
      console.error('获取视频详情失败:', error);
      message.error(error.message || '获取视频详情失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取班级列表
  const fetchClassList = async () => {
    try {
      const res = await getMyCreatedClasses();
      setClassList(res.data?.class_list || []);
    } catch (error) {
      console.error('获取班级列表失败', error);
    }
  };

  // 打开发布弹窗
  const handleOpenPublish = async () => {
    if (!isValidVideoId) {
      message.error('视频ID无效');
      return;
    }
    
    const currentStatus = videoData?.status || 'pending';
    
    // 检查视频是否有URL
    if (!videoData?.url) {
      message.error('视频未上传，无法发布');
      return;
    }
    
    // 如果视频未发布，需要先提交审核，再发布
    if (currentStatus !== 'published') {
      try {
        // 1. 先提交视频进入审核
        message.loading({ content: '视频审核中...', key: 'publish-video', duration: 0 });
        console.log('开始提交审核, videoId:', videoId);
        await startVideoReview(videoId);
        console.log('审核提交成功');
        
        // 2. 再发布视频
        message.loading({ content: '视频发布中...', key: 'publish-video', duration: 0 });
        console.log('开始发布视频, videoId:', videoId);
        await publishVideo(videoId);
        console.log('视频发布成功');
        
        message.success({ content: '视频发布成功！', key: 'publish-video', duration: 2 });
        // 刷新视频详情并更新本地状态
        const res = await getVideoDetail(videoId);
        setVideoData(res.data);
      } catch (error) {
        console.error('视频发布失败:', error);
        console.error('错误详情:', error.response?.data);
        const errorMsg = error.response?.data?.msg || error.response?.data?.message || error.message || '视频发布失败';
        message.error({ content: errorMsg, key: 'publish-video', duration: 3 });
        return;
      }
    }
    
    fetchClassList();
    setIsPublishModalOpen(true);
  };

  // 视频时间更新
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  // 视频加载完成
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  // 跳转到指定时间
  const seekTo = (time) => {
    if (videoRef.current && time && isFinite(time)) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  // 打开编辑互动点弹窗
  const handleOpenEditPoint = (item) => {
    setCurrentPoint(item);
    setEditModalOpen(true);
  };

  // AI生成互动点
  const handleAIGenerate = async () => {
    if (!isValidVideoId) {
      message.error('视频ID无效，无法生成互动点');
      return;
    }
    setIsGenerating(true);
    message.loading({ content: '互动点生成中...', key: 'ai-generate', duration: 0 });
    try {
      const res = await generateQuestions(videoId);
      console.log('AI生成原始数据:', res.data);
      
      // 兼容多种返回格式
      let questions = res.data?.questions 
        || res.data?.data?.questions 
        || res.data?.question_list 
        || res.data?.interactions 
        || res.data?.items 
        || [];
      
      // 如果返回的是对象而非数组
      if (!Array.isArray(questions) && typeof questions === 'object') {
        questions = Object.values(questions);
      }
      
      console.log('AI生成的问题列表:', questions);
      console.log('AI接口返回的完整数据:', JSON.stringify(res.data, null, 2));
      
      if (questions[0]) {
        console.log('第一个问题的所有字段:', Object.keys(questions[0]));
      }
      
      // 将AI生成的互动点追加到现有列表
      const allPoints = [...pointList, ...questions];
      console.log('更新后的完整列表:', allPoints);
      // 打印每个项目的字段
      allPoints.forEach((point, idx) => {
        console.log(`互动点${idx + 1}的字段:`, Object.keys(point));
        console.log(`互动点${idx + 1}的完整数据:`, point);
      });
      setPointList(allPoints);
      message.success({ content: `成功生成${questions.length}个互动点！`, key: 'ai-generate', duration: 2 });
    } catch (error) {
      const errorMsg = error.response?.data?.msg || error.response?.data?.message || error.message || '生成失败，请重试';
      message.error({ content: errorMsg, key: 'ai-generate', duration: 2 });
    } finally {
      setIsGenerating(false);
    }
  };

  // 新增互动点提交
  const handleAddQuestion = () => {
    if (questionType === '选择题' && formData.options.some(opt => !opt)) {
      message.warning('请先输入题目选项');
      return;
    }
    if (!formData.title || !formData.insertTime || !formData.correctAnswer) {
      message.warning('请填写完整的互动点信息');
      return;
    }
    
    // 获取第一个分段ID作为默认值
    const defaultSegmentId = pointList.length > 0 && pointList[0].segment_id 
      ? pointList[0].segment_id 
      : (videoData?.segments?.[0]?.id || 0);
    
    const newPoint = {
      id: Date.now(),
      segment_id: defaultSegmentId, // 确保有 segment_id
      title: formData.title,
      type: questionType,
      time: parseInt(formData.insertTime) || 0,
      answer: formData.correctAnswer,
      options: questionType === '选择题' ? formData.options : null,
      analysis: formData.analysis
    };
    setPointList([...pointList, newPoint]);
    message.success('互动点添加成功');
    setIsAddModalOpen(false);
    setFormData({ title: '', insertTime: '', options: ['', '', '', ''], correctAnswer: '', analysis: '' });
  };

  // 发布到班级
  const handlePublish = async () => {
    if (!selectedClassId) {
      message.warning('请选择要发布的班级');
      return;
    }
    if (!isValidVideoId) {
      message.error('视频ID无效，无法发布');
      return;
    }
    
    setPublishing(true);
    try {
      const publishData = {
        video_id: parseInt(videoId),
        class_list: [parseInt(selectedClassId)]  // 修改为 class_list 数组格式
      };
      console.log('发布视频到班级，请求数据:', publishData);
      
      const res = await postVideoToClass(publishData);
      console.log('发布响应:', res);
      
      message.success('视频发布成功！');
      setIsPublishModalOpen(false);
      // 提示用户去班级详情页查看
      Modal.confirm({
        title: '发布成功',
        content: '视频已成功发布到班级，是否前往班级详情页查看？',
        onOk: () => navigate(`/class-detail/${selectedClassId}`),
        okText: '前往查看',
        cancelText: '稍后查看',
      });
    } catch (error) {
      message.error(error.message || '发布失败');
    } finally {
      setPublishing(false);
    }
  };

  // 删除互动点
  const handleDeletePoint = (pointId) => {
    setPointList(pointList.filter(p => p.id !== pointId));
    setEditModalOpen(false);
    message.success('删除成功');
  };

  // 获取状态显示
  const getStatusDisplay = () => {
    const status = videoData?.status || 'pending';
    const statusMap = {
      pending: { text: '待发布', color: '#fa8c16', bg: '#fff7e6' },
      reviewing: { text: '审核中', color: '#1890ff', bg: '#e6f7ff' },
      published: { text: '已发布', color: '#52c41a', bg: '#f6ffed' },
    };
    return statusMap[status] || statusMap.pending;
  };

  // 格式化时间
  const formatTime = (seconds) => {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  // 进度百分比
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (loading) {
    return (
      <MainLayout pageTitle="视频编辑" showBack>
        <div style={{ textAlign: 'center', padding: 100 }}>
          <Spin size="large" />
        </div>
      </MainLayout>
    );
  }

  const status = getStatusDisplay();

  return (
    <MainLayout pageTitle={videoData?.title || '视频编辑'} showBack>
      {/* 状态标签 + 发布按钮 */}
      <div style={{ marginBottom: 16, display: 'flex', gap: 16, alignItems: 'center' }}>
        <Text style={{ color: status.color, background: status.bg, padding: '4px 12px', borderRadius: 4 }}>
          {status.text}
        </Text>
        <Text style={{ color: '#666', fontSize: 12 }}>
          互动点数量: {pointList.length}
        </Text>
        <Button
          type="primary"
          icon={<UploadOutlined />}
          style={{ marginLeft: 'auto', background: '#722ed1', borderColor: '#722ed1' }}
          onClick={handleOpenPublish}
        >
          发布到班级
        </Button>
      </div>

      {/* 视频播放器 + 进度条互动点 */}
      <div style={{
        width: '100%',
        background: '#1a1a1a',
        borderRadius: 12,
        padding: 24,
        marginBottom: 24,
        position: 'relative'
      }}>
        {videoData?.url ? (
          <video
            ref={videoRef}
            src={videoData.url}
            style={{ width: '100%', height: 400, objectFit: 'contain', borderRadius: 8 }}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            controls
          />
        ) : (
          <div style={{ 
            width: '100%', 
            height: 400, 
            background: '#333', 
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#666'
          }}>
            暂无视频内容
          </div>
        )}

        {/* 自定义进度条 + 互动点标记 */}
        <div style={{ marginTop: 16 }}>
          <div style={{
            width: '100%',
            height: 8,
            background: '#444',
            borderRadius: 4,
            position: 'relative',
            cursor: 'pointer'
          }}>
            {/* 已播放进度 */}
            <div style={{
              width: `${progressPercent}%`,
              height: '100%',
              background: '#722ed1',
              borderRadius: 4
            }} />
            
            {/* 互动点标记 */}
            {pointList.map((point, idx) => {
              const title = point.title ?? point.question_title ?? point.questionTitle ?? '互动点';
              // 优先使用 typeLabel，否则根据 type 映射
              const type = point.typeLabel || getQuestionTypeLabel(point.type ?? point.question_type ?? point.questionType);
              // 时间处理：如果时间超过10000，可能是毫秒格式，转换为秒
              let rawTime = point.time ?? point.insert_time ?? point.insertTime ?? 0;
              if (rawTime > 10000) {
                rawTime = rawTime / 1000; // 毫秒转秒
              }
              const timeValue = parseFloat(rawTime) || 0;
              const percent = duration > 0 && timeValue > 0 ? (timeValue / duration) * 100 : 0;
              return (
                <div
                  key={point.id ?? point.question_id ?? idx}
                  style={{
                    position: 'absolute',
                    left: `${percent}%`,
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    background: type === '单选题' || type === '选择题' ? '#1890ff' : 
                               type === '多选题' ? '#722ed1' :
                               type === '判断题' ? '#52c41a' : 
                               type === '填空题' ? '#faad14' : '#722ed1',
                    border: '3px solid white',
                    cursor: 'pointer',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                    zIndex: 10
                  }}
                  title={`${title} (${type}) - ${timeValue}秒`}
                  onClick={(e) => {
                    e.stopPropagation();
                    seekTo(timeValue);
                  }}
                />
              );
            })}
          </div>
          
          {/* 时间显示 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fff', marginTop: 8, fontSize: 12 }}>
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>

      {/* 操作按钮 */}
      <Space size="middle" style={{ marginBottom: 24 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsAddModalOpen(true)}>
          添加互动点
        </Button>
        <Button icon={<RobotOutlined />} onClick={handleAIGenerate} loading={isGenerating}>
          AI一键生成互动点
        </Button>
        <Button onClick={() => setDrawerOpen(true)}>
          查看互动点 ({pointList.length})
        </Button>
      </Space>

      {/* 无互动点提示 */}
      {pointList.length === 0 && videoData?.url && (
        <Alert
          title="互动点还未添加"
          description="建议添加互动点，让学生更好地学习"
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}

      {/* 新增互动点弹窗 */}
      <Modal
        title="添加互动点"
        open={isAddModalOpen}
        onCancel={() => {
          setIsAddModalOpen(false);
          setFormData({ title: '', insertTime: '', options: ['', '', '', ''], correctAnswer: '', analysis: '' });
        }}
        footer={null}
        width={500}
      >
        <div style={{ marginBottom: 16 }}>
          <Text strong>题目类型：</Text>
          <Select
            value={questionType}
            onChange={setQuestionType}
            style={{ width: '100%', marginTop: 8 }}
          >
            <Option value="选择题">选择题</Option>
            <Option value="判断题">判断题</Option>
            <Option value="简答题">简答题</Option>
            <Option value="填空题">填空题</Option>
          </Select>
        </div>

        <div style={{ marginBottom: 16 }}>
          <Text strong>题目标题：</Text>
          <Input
            placeholder="请输入题目"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            style={{ marginTop: 8 }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <Text strong>插入时间点（秒）：</Text>
          <Input
            type="number"
            placeholder={`视频时长${duration > 0 ? formatTime(duration) : '0:00'}内`}
            value={formData.insertTime}
            onChange={(e) => setFormData({ ...formData, insertTime: e.target.value })}
            style={{ marginTop: 8 }}
          />
        </div>

        {questionType === '选择题' && (
          <div style={{ marginBottom: 16 }}>
            <Text strong>选项：</Text>
            {['A', 'B', 'C', 'D'].map((opt, index) => (
              <Input
                key={opt}
                placeholder={`选项${opt}`}
                value={formData.options[index]}
                onChange={(e) => {
                  const newOptions = [...formData.options];
                  newOptions[index] = e.target.value;
                  setFormData({ ...formData, options: newOptions });
                }}
                style={{ marginTop: 8 }}
              />
            ))}
            <div style={{ marginTop: 16 }}>
              <Text strong>正确答案：</Text>
              <Select
                placeholder="选择正确答案"
                value={formData.correctAnswer || undefined}
                onChange={(val) => setFormData({ ...formData, correctAnswer: val })}
                style={{ width: '100%', marginTop: 8 }}
              >
                {['A', 'B', 'C', 'D'].map(opt => (
                  <Option key={opt} value={opt}>{opt}. {formData.options[['A', 'B', 'C', 'D'].indexOf(opt)] || `选项${opt}`}</Option>
                ))}
              </Select>
            </div>
          </div>
        )}

        {questionType === '判断题' && (
          <div style={{ marginBottom: 16 }}>
            <Text strong>正确答案：</Text>
            <Select
              placeholder="选择正确答案"
              value={formData.correctAnswer || undefined}
              onChange={(val) => setFormData({ ...formData, correctAnswer: val })}
              style={{ width: '100%', marginTop: 8 }}
            >
              <Option value="对">对</Option>
              <Option value="错">错</Option>
            </Select>
          </div>
        )}

        {(questionType === '简答题' || questionType === '填空题') && (
          <div style={{ marginBottom: 16 }}>
            <Text strong>参考答案：</Text>
            <TextArea
              placeholder="请输入参考答案"
              value={formData.correctAnswer}
              onChange={(e) => setFormData({ ...formData, correctAnswer: e.target.value })}
              rows={3}
              style={{ marginTop: 8 }}
            />
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          <Text strong>答案解析：</Text>
          <TextArea
            placeholder="请输入答案解析"
            value={formData.analysis}
            onChange={(e) => setFormData({ ...formData, analysis: e.target.value })}
            rows={3}
            style={{ marginTop: 8 }}
          />
        </div>

        <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={() => setIsAddModalOpen(false)}>取消</Button>
          <Button type="primary" onClick={handleAddQuestion} style={{ background: '#722ed1', borderColor: '#722ed1' }}>
            确认添加
          </Button>
        </Space>
      </Modal>

      {/* 发布到班级弹窗 */}
      <Modal
        title="发布视频到班级"
        open={isPublishModalOpen}
        onCancel={() => setIsPublishModalOpen(false)}
        footer={null}
      >
        <div style={{ marginBottom: 16 }}>
          <Text strong>选择班级：</Text>
          <Select
            placeholder="请选择要发布的班级"
            style={{ width: '100%', marginTop: 8 }}
            value={selectedClassId || undefined}
            onChange={setSelectedClassId}
          >
            {classList.map(cls => (
              <Option key={cls.class_id} value={cls.class_id}>{cls.class_name}</Option>
            ))}
          </Select>
        </div>
        
        {pointList.length === 0 && (
          <Alert
            message="当前视频暂无互动点"
            description="建议先添加互动点再发布"
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={() => setIsPublishModalOpen(false)}>取消</Button>
          <Button 
            type="primary" 
            onClick={handlePublish} 
            loading={publishing}
            style={{ background: '#722ed1', borderColor: '#722ed1' }}
          >
            确认发布
          </Button>
        </Space>
      </Modal>

      {/* 互动点列表抽屉 */}
      <Drawer
        title="互动点列表"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        extra={
          <Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => {
            setDrawerOpen(false);
            setIsAddModalOpen(true);
          }}>
            添加
          </Button>
        }
      >
        {pointList.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#999', padding: 60 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📝</div>
            <div style={{ fontSize: 15 }}>暂无互动点</div>
            <div style={{ fontSize: 13, color: '#bbb', marginTop: 8 }}>点击上方"添加互动点"创建</div>
          </div>
        ) : (
          <div style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto', padding: '0 4px' }}>
            {pointList.map((item, index) => {
              const title = item.title ?? item.question_title ?? item.questionTitle ?? '无标题';
              // 优先使用 typeLabel，否则调用映射函数
              const type = item.typeLabel || getQuestionTypeLabel(item.type ?? item.question_type ?? item.questionType ?? '');
              // 时间处理：如果时间超过10000，可能是毫秒格式，转换为秒
              let timeValue = item.time ?? item.insert_time ?? item.insertTime ?? 0;
              if (timeValue > 10000) {
                timeValue = timeValue / 1000; // 毫秒转秒
              }
              const id = item.id ?? item.question_id ?? index;
              const answer = item.answer ?? item.correctAnswer ?? item.right_answer ?? '';
              const analysis = item.analysis ?? item.explanation ?? '';
              const options = item.options ?? item.choices ?? [];
              
              // 类型映射和样式
              const typeMapping = {
                '单选题': { bg: '#e6f7ff', color: '#1890ff', border: '#91d5ff', accent: '#1890ff' },
                '多选题': { bg: '#f9f0ff', color: '#722ed1', border: '#d3adf7', accent: '#722ed1' },
                '选择题': { bg: '#e6f7ff', color: '#1890ff', border: '#91d5ff', accent: '#1890ff' },
                '判断题': { bg: '#f6ffed', color: '#52c41a', border: '#b7eb8f', accent: '#52c41a' },
                '简答题': { bg: '#fff7e6', color: '#fa8c16', border: '#ffd591', accent: '#fa8c16' },
                '填空题': { bg: '#fff1f0', color: '#ff4d4f', border: '#ffccc7', accent: '#ff4d4f' },
              };
              const typeStyle = typeMapping[type] || { bg: '#f5f5f5', color: '#666', border: '#d9d9d9', accent: '#666' };
              
              // 判断是否为选择题
              const isChoice = type === '选择题' || type === '单选题' || type === '多选题' || type?.toLowerCase().includes('choice');
              // 判断是否为判断题
              const isJudge = type === '判断题' || type?.toLowerCase().includes('judge') || type?.toLowerCase().includes('true_false');
              // 判断是否为简答题
              const isShortAnswer = type === '简答题' || type?.toLowerCase().includes('short_answer');
              // 判断是否为填空题
              const isFillBlank = type === '填空题' || type?.toLowerCase().includes('fill');
              
              // 判断答案是否正确（用于选择题高亮）
              const isCorrectOption = (_opt, i) => {
                const correctLetter = answer?.toUpperCase();
                return correctLetter === String.fromCharCode(65 + i) || correctLetter === ['A', 'B', 'C', 'D'][i];
              };
              
              return (
                <div
                  key={id}
                  style={{
                    padding: 16,
                    marginBottom: 12,
                    border: `2px solid ${typeStyle.border}`,
                    borderRadius: 12,
                    background: '#fff',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {/* 头部：序号 + 标题 */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 12, paddingLeft: 8 }}>
                    <div style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: `linear-gradient(135deg, ${typeStyle.accent} 0%, ${typeStyle.color} 100%)`,
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 14,
                      fontWeight: 600,
                      marginRight: 12,
                      flexShrink: 0
                    }}>
                      {index + 1}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Text strong style={{ fontSize: 15, color: '#262626', display: 'block', marginBottom: 6 }}>
                        {title}
                      </Text>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                        <span style={{
                          padding: '3px 10px',
                          borderRadius: 12,
                          fontSize: 12,
                          background: typeStyle.bg,
                          color: typeStyle.color,
                          fontWeight: 500
                        }}>
                          {type}
                        </span>
                        <span style={{
                          padding: '3px 10px',
                          borderRadius: 12,
                          fontSize: 12,
                          background: '#f0f0f0',
                          color: '#666'
                        }}>
                          ⏱ {formatTime(timeValue)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* 选择题样式 */}
                  {isChoice && options.length > 0 && (
                    <div style={{ 
                      marginBottom: 12, 
                      padding: 12,
                      background: typeStyle.bg,
                      borderRadius: 10,
                      border: `1px dashed ${typeStyle.border}`
                    }}>
                      <Text style={{ fontSize: 12, color: typeStyle.color, fontWeight: 500, marginBottom: 8, display: 'block' }}>
                        请选择正确答案
                      </Text>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        {options.map((opt, i) => {
                          const correct = isCorrectOption(opt, i);
                          return (
                            <div key={i} style={{
                              padding: '10px 12px',
                              background: correct ? '#52c41a' : '#fff',
                              borderRadius: 8,
                              fontSize: 13,
                              color: correct ? '#fff' : '#333',
                              border: `2px solid ${correct ? '#52c41a' : '#e8e8e8'}`,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              fontWeight: correct ? 600 : 400
                            }}>
                              <span style={{
                                width: 22,
                                height: 22,
                                borderRadius: '50%',
                                background: correct ? '#fff' : typeStyle.bg,
                                color: correct ? '#52c41a' : typeStyle.color,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 11,
                                fontWeight: 700,
                                flexShrink: 0
                              }}>
                                {String.fromCharCode(65 + i)}
                              </span>
                              <span style={{ flex: 1 }}>{opt || '未设置'}</span>
                              {correct && <span>✓</span>}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                  {/* 判断题样式 */}
                  {isJudge && (
                    <div style={{ 
                      marginBottom: 12, 
                      padding: 12,
                      background: typeStyle.bg,
                      borderRadius: 10,
                      border: `1px dashed ${typeStyle.border}`
                    }}>
                      <Text style={{ fontSize: 12, color: typeStyle.color, fontWeight: 500, marginBottom: 8, display: 'block' }}>
                        请判断正误
                      </Text>
                      <div style={{ display: 'flex', gap: 12 }}>
                        {['对', '错'].map((opt) => {
                          const correct = answer === opt;
                          return (
                            <div key={opt} style={{
                              flex: 1,
                              padding: '12px 16px',
                              background: correct ? '#52c41a' : '#fff',
                              borderRadius: 10,
                              fontSize: 14,
                              color: correct ? '#fff' : '#333',
                              border: `2px solid ${correct ? '#52c41a' : '#e8e8e8'}`,
                              textAlign: 'center',
                              fontWeight: correct ? 700 : 500
                            }}>
                              {opt === '对' ? '✓' : '✗'} {opt}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                  {/* 简答题样式 */}
                  {isShortAnswer && (
                    <div style={{ 
                      marginBottom: 12, 
                      padding: 12,
                      background: typeStyle.bg,
                      borderRadius: 10,
                      border: `1px dashed ${typeStyle.border}`
                    }}>
                      <Text style={{ fontSize: 12, color: typeStyle.color, fontWeight: 500, marginBottom: 8, display: 'block' }}>
                        参考答案
                      </Text>
                      <div style={{
                        padding: '12px',
                        background: '#fff',
                        borderRadius: 8,
                        border: '1px solid #e8e8e8',
                        fontSize: 13,
                        color: '#333',
                        minHeight: 40,
                        lineHeight: 1.6
                      }}>
                        {answer || '暂无参考答案'}
                      </div>
                    </div>
                  )}
                  
                  {/* 填空题样式 */}
                  {isFillBlank && (
                    <div style={{ 
                      marginBottom: 12, 
                      padding: 12,
                      background: typeStyle.bg,
                      borderRadius: 10,
                      border: `1px dashed ${typeStyle.border}`
                    }}>
                      <Text style={{ fontSize: 12, color: typeStyle.color, fontWeight: 500, marginBottom: 8, display: 'block' }}>
                        填空答案
                      </Text>
                      <div style={{
                        padding: '12px',
                        background: '#fff',
                        borderRadius: 8,
                        border: '2px dashed #ffd591',
                        fontSize: 13,
                        color: '#333',
                        minHeight: 40,
                        lineHeight: 1.6
                      }}>
                        {answer || '暂无答案'}
                      </div>
                    </div>
                  )}
                  
                  {/* 解析 */}
                  {analysis && (
                    <div style={{ 
                      marginBottom: 12, 
                      padding: '10px 12px',
                      background: '#fffbe6',
                      borderRadius: 8,
                      fontSize: 13,
                      borderLeft: '3px solid #faad14'
                    }}>
                      <Text style={{ color: '#fa8c16', fontWeight: 500 }}>💡 解析：</Text>
                      <Text style={{ color: '#666', marginLeft: 4 }}>{analysis}</Text>
                    </div>
                  )}
                  
                  {/* 操作按钮 */}
                  <div style={{ 
                    display: 'flex', 
                    gap: 6, 
                    marginTop: 8,
                    paddingTop: 8,
                    borderTop: '1px solid #f0f0f0'
                  }}>
                    <Button 
                      size="small" 
                      onClick={() => {
                        seekTo(timeValue);
                        setDrawerOpen(false);
                      }}
                      style={{ 
                        flex: 1,
                        borderColor: typeStyle.accent,
                        color: typeStyle.accent
                      }}
                    >
                      🎬 跳转
                    </Button>
                    <Button 
                      size="small" 
                      onClick={() => handleOpenEditPoint(item)}
                      style={{ 
                        flex: 1,
                        background: typeStyle.accent,
                        borderColor: typeStyle.accent,
                        color: '#fff'
                      }}
                    >
                      ✏️ 编辑
                    </Button>
                    <Button 
                      size="small" 
                      danger 
                      onClick={() => handleDeletePoint(id)}
                    >
                      🗑️
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Drawer>

      {/* 编辑互动点弹窗 */}
      <Modal
        title="编辑互动点"
        open={editModalOpen}
        onCancel={() => {
          setEditModalOpen(false);
          setFormData({ title: '', insertTime: '', options: ['', '', '', ''], correctAnswer: '', analysis: '' });
        }}
        footer={null}
        width={500}
      >
        <div style={{ marginBottom: 16 }}>
          <Text strong>题目类型：</Text>
          <Select
            value={questionType}
            onChange={setQuestionType}
            style={{ width: '100%', marginTop: 8 }}
          >
            <Option value="选择题">选择题</Option>
            <Option value="判断题">判断题</Option>
            <Option value="简答题">简答题</Option>
            <Option value="填空题">填空题</Option>
          </Select>
        </div>

        <div style={{ marginBottom: 16 }}>
          <Text strong>题目标题：</Text>
          <Input
            placeholder="请输入题目"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            style={{ marginTop: 8 }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <Text strong>插入时间点（秒）：</Text>
          <Input
            type="number"
            placeholder={`视频时长${duration > 0 ? formatTime(duration) : '0:00'}内`}
            value={formData.insertTime}
            onChange={(e) => setFormData({ ...formData, insertTime: e.target.value })}
            style={{ marginTop: 8 }}
          />
        </div>

        {questionType === '选择题' && (
          <div style={{ marginBottom: 16 }}>
            <Text strong>选项：</Text>
            {['A', 'B', 'C', 'D'].map((opt, index) => (
              <Input
                key={opt}
                placeholder={`选项${opt}`}
                value={formData.options[index]}
                onChange={(e) => {
                  const newOptions = [...formData.options];
                  newOptions[index] = e.target.value;
                  setFormData({ ...formData, options: newOptions });
                }}
                style={{ marginTop: 8 }}
              />
            ))}
            <div style={{ marginTop: 16 }}>
              <Text strong>正确答案：</Text>
              <Select
                placeholder="选择正确答案"
                value={formData.correctAnswer || undefined}
                onChange={(val) => setFormData({ ...formData, correctAnswer: val })}
                style={{ width: '100%', marginTop: 8 }}
              >
                {['A', 'B', 'C', 'D'].map(opt => (
                  <Option key={opt} value={opt}>{opt}. {formData.options[['A', 'B', 'C', 'D'].indexOf(opt)] || `选项${opt}`}</Option>
                ))}
              </Select>
            </div>
          </div>
        )}

        {questionType === '判断题' && (
          <div style={{ marginBottom: 16 }}>
            <Text strong>正确答案：</Text>
            <Select
              placeholder="选择正确答案"
              value={formData.correctAnswer || undefined}
              onChange={(val) => setFormData({ ...formData, correctAnswer: val })}
              style={{ width: '100%', marginTop: 8 }}
            >
              <Option value="对">对</Option>
              <Option value="错">错</Option>
            </Select>
          </div>
        )}

        {(questionType === '简答题' || questionType === '填空题') && (
          <div style={{ marginBottom: 16 }}>
            <Text strong>参考答案：</Text>
            <TextArea
              placeholder="请输入参考答案"
              value={formData.correctAnswer}
              onChange={(e) => setFormData({ ...formData, correctAnswer: e.target.value })}
              rows={3}
              style={{ marginTop: 8 }}
            />
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          <Text strong>答案解析：</Text>
          <TextArea
            placeholder="请输入答案解析"
            value={formData.analysis}
            onChange={(e) => setFormData({ ...formData, analysis: e.target.value })}
            rows={3}
            style={{ marginTop: 8 }}
          />
        </div>

        <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={() => {
            setEditModalOpen(false);
            setFormData({ title: '', insertTime: '', options: ['', '', '', ''], correctAnswer: '', analysis: '' });
          }}>取消</Button>
          <Button type="primary" onClick={() => {
            if (!formData.title || !formData.insertTime || !formData.correctAnswer) {
              message.warning('请填写完整的互动点信息');
              return;
            }
            // 更新互动点
            const updatedPoints = pointList.map(p => {
              const pointId = currentPoint?.id || currentPoint?.question_id;
              if (p.id === pointId || p.question_id === pointId) {
                return {
                  ...p,
                  title: formData.title,
                  type: questionType,
                  time: parseInt(formData.insertTime) || 0,
                  answer: formData.correctAnswer,
                  options: questionType === '选择题' ? formData.options : null,
                  analysis: formData.analysis
                };
              }
              return p;
            });
            setPointList(updatedPoints);
            setEditModalOpen(false);
            setFormData({ title: '', insertTime: '', options: ['', '', '', ''], correctAnswer: '', analysis: '' });
            message.success('互动点已更新');
          }} style={{ background: '#722ed1', borderColor: '#722ed1' }}>
            保存
          </Button>
        </Space>
      </Modal>
    </MainLayout>
  );
};

export default VideoDetailEdit;

import request from '../utils/request';

// ==================== 用户相关 ====================

// 用户密码登录
export const loginByPassword = (data) => {
  return request.post('/user/loginByPassword', data);
};

// 用户验证码登录
export const loginByCode = (data) => {
  return request.post('/user/loginByCode', data);
};

// 发送验证码
export const sendCode = (data) => {
  return request.post('/user/sendCode', data);
};

// 用户注册
export const register = (data) => {
  return request.post('/user/register', data);
};

// 忘记密码
export const forgotPassword = (data) => {
  return request.post('/user/forgotPassword', data);
};

// 获取用户信息
export const getUserInfo = () => {
  return request.get('/user/getUserInfo');
};

// ==================== 班级相关 ====================

// 创建班级
export const createClass = (data) => {
  return request.post('/class/create', data);
};

// 获取班级详情
export const getClassInfo = (classId) => {
  return request.get(`/class/info/${classId}`);
};

// 获取教师创建的班级列表
export const getMyCreatedClasses = () => {
  return request.get('/class/my-created');
};

// 获取班级内学生列表
export const getClassStudents = (classId) => {
  return request.get(`/class/students/${classId}`);
};

// 学生加入班级
export const joinClass = (data) => {
  return request.post('/class/join', data);
};

// ==================== 视频相关 ====================

// 获取视频详情（包含分段和题目）
export const getVideoDetail = (videoId) => {
  return request.get(`/video/getDetail/${videoId}`);
};

// 获取班级视频任务列表
export const getVideoTasks = (classId) => {
  return request.get(`/video/getTasks/${classId}`);
};

// 获取老师上传的视频列表
export const getMyUploadedVideos = () => {
  return request.get('/video/my-uploaded');
};

// 下发视频任务到班级
export const postVideoToClass = (data) => {
  return request.post('/video/post-to-class', data);
};

// 上传视频
export const uploadVideo = (formData) => {
  return request.post('/video/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

// ==================== 行为统计相关 ====================

// 获取班级内视频观看进度
export const getClassProgress = (classId, status) => {
  return request.get(`/behavior/class-progress/${classId}/${status}`);
};

// ==================== 题目相关 ====================

// 生成课后习题（AI生成）
export const generateQuestions = (videoId) => {
  return request.get(`/question/generate/${videoId}`);
};

// ==================== 统计分析相关 ====================

// 获取班级整体学情统计
export const getClassStat = (data) => {
  return request.get('/stat/class', { data });
};

// 获取学生个人学情统计
export const getStudentStat = (videoId) => {
  return request.get(`/stat/student/${videoId}`);
};

// ==================== AI助手相关 ====================

// 智能对话助手
export const chatWithAgent = (data) => {
  return request.post('/agent/chat', data);
};

// 获取聊天历史记录
export const getChatHistory = (params) => {
  return request.get('/agent/history', { params });
};

// 生成学情报告
export const generateReport = (data) => {
  return request.post('/agent/report', data);
};

// 获取学习报告
export const getReport = (params) => {
  return request.get('/agent/report', { params });
};

// 生成习题（AI生成）
export const generateQuiz = (data) => {
  return request.post('/agent/quiz', data);
};

// ==================== 视频审核相关 ====================

// 发布视频
export const publishVideo = (videoId) => {
  return request.post(`/video/${videoId}/review/publish`);
};

// 视频进入审核
export const startVideoReview = (videoId) => {
  return request.post(`/video/${videoId}/review/start`, { video_id: videoId });
};

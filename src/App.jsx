import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// 登录注册页
import Login from './pages/Login';
import Register from './pages/Register';
// 后台核心页面
import Home from './pages/Home';
import VideoDetail from './pages/VideoDetail';
import PendingReview from './pages/PendingReview';
import MyProfile from './pages/MyProfile';
import DataAnalysis from './pages/DataAnalysis';
import AnalysisVideoDetail from './pages/AnalysisVideoDetail';
import ClassManagement from './pages/ClassManagement';
// 👇 新增这三个导入
import ClassDetail from './pages/ClassDetail';
import VideoManagement from './pages/VideoManagement';
import VideoDetailEdit from './pages/VideoDetailEdit';
import ClassVideoDetail from './pages/ClassVideoDetail';
import StudentData from './pages/StudentData';
// 全局样式
import './index.css';

function App() {
  return (
    <Router>
      <Routes>
        {/* 登录注册路由（默认打开就是登录页） */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* 后台主路由 */}
        <Route path="/home" element={<Home />} />
        <Route path="/video-detail" element={<VideoDetail />} />
        <Route path="/pending-review" element={<PendingReview />} />
        <Route path="/my" element={<MyProfile />} />
        <Route path="/data-analysis" element={<DataAnalysis />} />
        <Route path="/analysis-video" element={<AnalysisVideoDetail />} />
        <Route path="/class-management" element={<ClassManagement />} />
        <Route path="/class-detail/:classId" element={<ClassDetail />} />
        <Route path="/class-video-detail/:classId/:videoId" element={<ClassVideoDetail />} />
        <Route path="/student-data/:studentId" element={<StudentData />} />
        <Route path="/video-management" element={<VideoManagement />} />
        <Route path="/video-detail-edit/:videoId" element={<VideoDetailEdit />} />
      </Routes>
    </Router>
  );
}

export default App;
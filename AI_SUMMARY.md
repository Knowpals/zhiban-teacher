# 知伴教师端 - AI 功能使用总结

| 项目 | 内容 |
|------|------|
| **文档版本** | v1.0 |
| **编写日期** | 2026-05-03 |
| **项目名称** | 知伴教师端 (zhiban-teacher) |

---

## 目录

1. [AI 功能概览](#1-ai-功能概览)
2. [AI 互动点生成](#2-ai-互动点生成)
3. [AI 智能对话助手](#3-ai-智能对话助手)
4. [AI 学情报告生成](#4-ai-学情报告生成)
5. [AI 智能习题生成](#5-ai-智能习题生成)
6. [AI 学情数据分析](#6-ai-学情数据分析)
7. [技术架构](#7-技术架构)
8. [API 接口清单](#8-api-接口清单)

---

## 1. AI 功能概览

知伴教师端集成了多种 AI 能力，贯穿于教学视频制作、学情分析、学习报告等核心场景。

### 1.1 AI 功能矩阵

| 功能模块 | AI 能力 | 调用方式 | 状态 |
|----------|---------|----------|------|
| 视频互动点 | AI 自动生成题目 | `generateQuestions(videoId)` | ✅ 已实现 |
| 智能助手 | AI 对话交互 | `chatWithAgent(data)` | ✅ 已实现 |
| 学情报告 | AI 生成报告 | `generateReport(data)` | ✅ 已实现 |
| 智能习题 | AI 生成练习题 | `generateQuiz(data)` | ✅ 已实现 |
| 数据分析 | AI 学情分析 | `getClassStat(data)` | ✅ 已实现 |

### 1.2 AI 能力分布图

```
┌─────────────────────────────────────────────────────────────┐
│                     知伴教师端 AI 能力                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐   │
│    │  视频教学    │    │  学情分析   │    │  智能助手   │   │
│    │  互动点生成  │    │  数据统计   │    │  对话交互   │   │
│    └──────┬──────┘    └──────┬──────┘    └──────┬──────┘   │
│           │                   │                   │          │
│           ▼                   ▼                   ▼          │
│    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐   │
│    │   AI 大模型  │    │   AI 大模型  │    │   AI 大模型  │   │
│    │  (题目生成)  │    │  (数据分析)  │    │  (对话生成)  │   │
│    └─────────────┘    └─────────────┘    └─────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. AI 互动点生成

### 2.1 功能描述

AI 互动点生成是知伴系统的核心 AI 功能之一，能够根据教师上传的教学视频，自动分析视频内容并生成配套的互动题目。

### 2.2 业务流程

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ 教师上传  │───▶│ 视频处理  │───▶│ AI 分析  │───▶│ 生成题目  │
│ 教学视频  │    │ 分段存储  │    │ 视频内容  │    │ 互动点    │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
                                                       │
                                                       ▼
                                               ┌──────────────┐
                                               │ 题目类型多样  │
                                               │ • 选择题      │
                                               │ • 判断题      │
                                               │ • 填空题      │
                                               │ • 简答题      │
                                               └──────────────┘
```

### 2.3 功能特点

| 特点 | 说明 |
|------|------|
| **智能分析** | 自动识别视频内容，提取关键知识点 |
| **多题型支持** | 支持选择题、判断题、填空题、简答题 |
| **时间点关联** | 自动将题目关联到视频的特定时间点 |
| **可编辑性** | 教师可对 AI 生成的题目进行修改完善 |
| **批量生成** | 一键生成多个互动点，提高备课效率 |

### 2.4 前端实现

**文件位置**：`src/pages/VideoDetailEdit.jsx`

**核心代码**：
```javascript
// AI生成互动点
const handleAIGenerate = async () => {
  setIsGenerating(true);
  message.loading({ content: '互动点生成中...', key: 'ai-generate', duration: 0 });
  try {
    const res = await generateQuestions(videoId);
    // 兼容多种返回格式
    let questions = res.data?.questions 
      || res.data?.data?.questions 
      || res.data?.question_list 
      || res.data?.interactions 
      || [];
    
    // 将AI生成的互动点追加到现有列表
    setPointList([...pointList, ...questions]);
    message.success({ content: `成功生成${questions.length}个互动点！`, key: 'ai-generate' });
  } catch (error) {
    message.error({ content: '生成失败，请重试', key: 'ai-generate' });
  } finally {
    setIsGenerating(false);
  }
};
```

### 2.5 题目数据结构

```javascript
{
  id: number,           // 题目ID
  segment_id: number,    // 关联的分段ID
  time: number,          // 视频时间点（秒）
  title: string,         // 题目内容
  type: string,         // 题目类型（choice/judge/fill/qa）
  options: string[],    // 选项（选择题用）
  answer: string,       // 正确答案
  analysis: string,     // 题目解析
  typeLabel: string     // 中文类型标签
}
```

---

## 3. AI 智能对话助手

### 3.1 功能描述

提供基于 AI 的智能对话功能，教师可以与 AI 助手进行交互，获取教学建议、问题解答等支持。

### 3.2 对话场景

| 场景 | 描述 |
|------|------|
| 教学咨询 | 咨询教学方法、课程设计建议 |
| 问题解答 | 解答教学过程中的疑问 |
| 学习指导 | 为学生提供个性化学习建议 |

### 3.3 API 接口

```javascript
// 发送消息给 AI 助手
export const chatWithAgent = (data) => {
  return request.post('/agent/chat', data);
};

// 获取聊天历史记录
export const getChatHistory = (params) => {
  return request.get('/agent/history', { params });
};
```

### 3.4 对话数据结构

```javascript
// 请求格式
{
  message: string,      // 用户消息
  context?: object,     // 上下文信息（可选）
  user_id?: number      // 用户ID（可选）
}

// 响应格式
{
  code: number,
  message: string,
  data: {
    reply: string,      // AI 回复内容
    suggestions?: [],   // 建议选项（可选）
    timestamp: number   // 回复时间戳
  }
}
```

---

## 4. AI 学情报告生成

### 4.1 功能描述

基于学生的学习行为数据，AI 自动生成个性化的学情分析报告，帮助教师了解学生的学习状况。

### 4.2 报告内容

| 报告模块 | 内容说明 |
|----------|----------|
| 学习概览 | 观看时长、完成率、正确率等基础数据 |
| 知识点掌握 | 各知识点的掌握程度分析 |
| 薄弱环节 | 识别学生的薄弱知识点 |
| 学习建议 | 基于 AI 分析的个性化建议 |
| 行为分析 | 暂停、回放等学习行为分析 |

### 4.3 API 接口

```javascript
// 生成学情报告
export const generateReport = (data) => {
  return request.post('/agent/report', data);
};

// 获取学习报告
export const getReport = (params) => {
  return request.get('/agent/report', { params });
};
```

### 4.4 报告数据格式

```javascript
{
  student_id: number,
  report_date: string,
  overview: {
    total_watch_time: number,    // 总观看时长（秒）
    completion_rate: number,     // 完成率（0-1）
    correct_rate: number,        // 正确率（0-1）
    rank_in_class: number       // 班级排名
  },
  knowledge_points: [
    {
      title: string,
      master_score: number,      // 掌握度（0-1）
      weak_rate: number          // 薄弱率
    }
  ],
  suggestions: string[],         // 学习建议
  learning_behavior: {
    pause_count: number,         // 暂停次数
    replay_count: number,       // 回放次数
    avg_time_per_video: number  // 视频平均时长
  }
}
```

---

## 5. AI 智能习题生成

### 5.1 功能描述

根据指定的知识点、视频内容或条件，AI 自动生成配套的练习题目。

### 5.2 生成方式

| 方式 | 说明 |
|------|------|
| 按知识点生成 | 指定知识点，生成相关练习题 |
| 按视频生成 | 根据视频内容，生成配套习题 |
| 按难度生成 | 指定难度级别，生成相应题目 |
| 混合生成 | 结合多种条件综合生成 |

### 5.3 API 接口

```javascript
// 生成习题
export const generateQuiz = (data) => {
  return request.post('/agent/quiz', data);
};
```

### 5.4 请求参数

```javascript
{
  type?: string,           // 题目类型（choice/judge/fill/qa）
  knowledge_id?: number,   // 知识点ID
  video_id?: number,       // 视频ID
  difficulty?: string,     // 难度（easy/medium/hard）
  count?: number,          // 生成数量
  grade?: string          // 年级
}
```

---

## 6. AI 学情数据分析

### 6.1 功能描述

通过 AI 算法分析学生的学情数据，识别学习模式、薄弱环节，为教学决策提供数据支持。

### 6.2 分析维度

```
┌─────────────────────────────────────────────────────────────┐
│                    AI 学情分析维度                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│   │  知识点分析  │  │  行为分析   │  │  错误分析   │        │
│   ├─────────────┤  ├─────────────┤  ├─────────────┤        │
│   │ • 掌握度    │  │ • 暂停次数  │  │ • 高频错误  │        │
│   │ • 薄弱率    │  │ • 回放次数  │  │ • 错误类型  │        │
│   │ • 关联视频  │  │ • 观看时长  │  │ • 易错点    │        │
│   └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                             │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│   │  趋势分析   │  │  对比分析   │  │  预测分析   │        │
│   ├─────────────┤  ├─────────────┤  ├─────────────┤        │
│   │ • 周环比    │  │ • 班级排名  │  │ • 进步预测  │        │
│   │ • 月趋势    │  │ • 平均水平  │  │ • 风险预警  │        │
│   │ • 提高率    │  │ • 年级排名  │  │ • 学习建议  │        │
│   └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 6.3 API 接口

```javascript
// 获取班级整体学情统计
export const getClassStat = (data) => {
  return request.get('/stat/class', { data });
};

// 获取学生个人学情统计
export const getStudentStat = (videoId) => {
  return request.get(`/stat/student/${videoId}`);
};
```

### 6.4 数据分析页面

**班级学情数据分析** (`DataAnalysis.jsx`)
- 统计概览卡片：平均正确率、平均答题时间、完成率、暂停次数
- 知识点薄弱率排行榜
- 高频暂停/回看时刻分析
- 高错误率题目清单

**学生个人数据** (`StudentData.jsx`)
- 视频观看时长
- 答题正确率
- 学习行为分析（暂停次数、回放次数）
- 个人薄弱点分析

### 6.5 统计数据格式

```javascript
// 班级统计数据
{
  overview: {
    average_correct_rate: number,    // 平均正确率
    average_time_cost: number,        // 平均答题时间（秒）
    complete_rate: number,            // 完成率（0-1）
    total_pause_count: number         // 总暂停次数
  },
  weak_knowledge_point: [
    {
      knowledge_id: number,
      title: string,                  // 知识点标题
      weak_rate: number               // 薄弱率（0-1）
    }
  ],
  top_pause_action: [
    {
      start: number,                  // 开始时间（秒）
      end: number,                    // 结束时间（秒）
      pause_count: number             // 暂停次数
    }
  ],
  top_replay_action: [
    {
      start: number,
      end: number,
      replay_count: number
    }
  ],
  top_questions: [
    {
      question_id: number,
      content: string,                 // 题目内容
      error_rate: number             // 错误率（百分比）
    }
  ]
}
```

---

## 7. 技术架构

### 7.1 AI 服务架构

```
┌──────────────────────────────────────────────────────────────┐
│                       前端应用层                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │   组件层：VideoDetailEdit | DataAnalysis | StudentData │  │
│  └────────────────────────────────────────────────────────┘  │
│                           │                                   │
│                           ▼                                   │
│  ┌────────────────────────────────────────────────────────┐  │
│  │   API 层：src/services/api.js                          │  │
│  │   • generateQuestions()  • chatWithAgent()            │  │
│  │   • generateReport()     • generateQuiz()              │  │
│  │   • getClassStat()      • getStudentStat()            │  │
│  └────────────────────────────────────────────────────────┘  │
│                           │                                   │
│                           ▼                                   │
│  ┌────────────────────────────────────────────────────────┐  │
│  │   网络层：src/utils/request.js (axios)                 │  │
│  │   • 请求拦截器  • 响应拦截器  • 错误处理                │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│                      后端服务层                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  业务接口   │  │  AI 服务    │  │  数据存储   │         │
│  │  /agent/*  │──│  AI大模型   │──│  数据库     │         │
│  │  /stat/*   │  │  API调用    │  │            │         │
│  │  /question │  │             │  │            │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└──────────────────────────────────────────────────────────────┘
```

### 7.2 技术栈

| 层级 | 技术 | 用途 |
|------|------|------|
| 前端框架 | React 19.2.5 | UI 渲染 |
| 路由 | React Router DOM 7.14.2 | 页面导航 |
| UI 组件 | Ant Design 6.3.6 | 组件库 |
| HTTP 客户端 | Axios 1.15.2 | API 请求 |
| 图表 | ECharts 6.0.0 | 数据可视化 |
| 构建工具 | Vite 8.0.9 | 项目构建 |

---

## 8. API 接口清单

### 8.1 AI 相关接口汇总

| 接口路径 | 方法 | 功能 | 状态 |
|----------|------|------|------|
| `/question/generate/{videoId}` | GET | AI 生成互动点 | ✅ |
| `/agent/chat` | POST | AI 智能对话 | ✅ |
| `/agent/history` | GET | 获取对话历史 | ✅ |
| `/agent/report` | POST | 生成学情报告 | ✅ |
| `/agent/report` | GET | 获取学情报告 | ✅ |
| `/agent/quiz` | POST | AI 生成习题 | ✅ |
| `/stat/class` | GET | 班级学情统计 | ✅ |
| `/stat/student/{videoId}` | GET | 学生学情统计 | ✅ |

### 8.2 请求示例

```javascript
// AI 生成互动点
GET /api/v1/question/generate/123

// AI 智能对话
POST /api/v1/agent/chat
{
  "message": "如何提高学生的解题能力？"
}

// AI 生成学情报告
POST /api/v1/agent/report
{
  "class_id": 1,
  "student_id": 101,
  "period": "week"
}

// 班级学情统计
GET /api/v1/stat/class?class_id=1&video_id=1
```

---

## 9. 未来规划

| 功能 | 描述 | 优先级 |
|------|------|--------|
| AI 视频字幕生成 | 自动识别视频语音生成字幕 | P1 |
| AI 智能批改 | 自动批改学生主观题答案 | P1 |
| AI 学习路径规划 | 为学生推荐个性化学习路径 | P2 |
| AI 课堂互动 | 实时生成课堂问答题目 | P2 |
| AI 知识点关联 | 自动关联相关知识点形成知识图谱 | P3 |

---

*文档更新时间：2026-05-03*

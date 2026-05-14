import axios from 'axios';

// const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';
const BASE_URL='/api/v1'

// const request = axios.create({
//   baseURL: BASE_URL.includes('localhost') ? '/api/v1' : `${BASE_URL}/api/v1`,
//   timeout: 15000,
//   headers: {
//     'Content-Type': 'application/json',
//   },
// });

const request = axios.create({
  baseURL: BASE_URL,
  timeout: 30000, // 增加到30秒
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    const res = response.data;
    console.log('响应数据:', res);
    // 兼容不同的 code 判断逻辑：0 或 200 都视为成功
    if (res.code === 0 || res.code === 200) {
      return res;
    }
    return Promise.reject({ message: res.msg || '请求失败', response: response });
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      console.error('请求错误:', status, data);
      if (status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
      // 保留完整的错误对象，包含 response 信息
      return Promise.reject({
        message: data.msg || data.message || data.error || `请求失败(${status})`,
        response: error.response,
        status
      });
    }
    return Promise.reject(error);
  }
);

export default request;

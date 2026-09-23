import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'https://api.example.com',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});


apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token'); // مثال لو الـ Token محفوظ في الـ LocalStorage
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);


apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // الـ Server رد بكود خطأ (زي 401, 404, 500)
      if (error.response.status === 401) {
        console.error('Unauthorized, please login again.');
        // ممكن تعمل Redirect لصفحة تسجيل الدخول هنا
      }
    } else {
      // مشكلة في الشبكة أو الـ Server مش شغال
      console.error('Network error or server is down.');
    }
    return Promise.reject(error);
  }
);

export default apiClient;
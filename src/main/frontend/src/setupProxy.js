// src/setupProxy.js

const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
    app.use(
        '/api', // 이 경로로 요청이 들어오면 프록시를 사용합니다.
        createProxyMiddleware({
            target: 'https://www.opinet.co.kr', // 데이터를 가져올 실제 API 서버 주소
            changeOrigin: true, // CORS 오류를 해결하기 위한 설정
            // 💡 핵심: pathRewrite는 건드리지 마세요.
            // 요청 경로를 변경할 필요가 없습니다. '/api'를 '/api'로 그대로 보내면 됩니다.
        })
    );
};
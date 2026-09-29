require('dotenv').config();
const express = require('express');
const cors = require('cors');
const proxy = require('express-http-proxy');

const app = express();
const PORT = process.env.PORT || process.env.GATEWAY_PORT || 3000;

// Service Discovery - Externalized Service Registry Config
const serviceRegistry = {
  userService: process.env.USER_SERVICE_URL || 'http://localhost:3001',
  productService: process.env.PRODUCT_SERVICE_URL || 'http://localhost:3002',
  orderService: process.env.ORDER_SERVICE_URL || 'http://localhost:3003'
};

app.use(cors());
app.use(express.json());

// Request Logging Middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[API-GATEWAY] ${new Date().toISOString()} | ${req.method} ${req.originalUrl} -> Status: ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Gateway Health Check Endpoint (GET /health)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: "UP",
    service: "API Gateway",
    port: PORT,
    timestamp: new Date().toISOString(),
    serviceRegistry: serviceRegistry
  });
});

// Helper for Proxy Options & Centralized Error Handling
function createProxyOptions(serviceName, targetUrl) {
  return {
    proxyReqPathResolver: (req) => {
      // Retain full request path including originalUrl
      return req.originalUrl;
    },
    userResHeaderDecorator: (headers) => {
      headers['x-proxied-by'] = 'CampusConnect-API-Gateway';
      return headers;
    },
    proxyErrorHandler: (err, res, next) => {
      console.error(`❌ [API-GATEWAY ERROR] Failed to proxy to ${serviceName} (${targetUrl}): ${err.message}`);
      return res.status(503).json({
        timestamp: new Date().toISOString(),
        status: 503,
        error: "Service Unavailable",
        message: `Target service '${serviceName}' at '${targetUrl}' is unreachable or offline.`,
        details: err.message
      });
    }
  };
}

// Gateway Routes - Configuration-Based Reverse Proxying
console.log(`🌐 [API-GATEWAY] Initializing routes with Service Registry:`);
console.log(`   - /users    -> ${serviceRegistry.userService}`);
console.log(`   - /products -> ${serviceRegistry.productService}`);
console.log(`   - /orders   -> ${serviceRegistry.orderService}`);

app.use('/users', (req, res, next) => {
  proxy(serviceRegistry.userService, createProxyOptions('User Service', serviceRegistry.userService))(req, res, next);
});

app.use('/products', (req, res, next) => {
  proxy(serviceRegistry.productService, createProxyOptions('Product Service', serviceRegistry.productService))(req, res, next);
});

app.use('/orders', (req, res, next) => {
  proxy(serviceRegistry.orderService, createProxyOptions('Order Service', serviceRegistry.orderService))(req, res, next);
});

// Root Gateway Endpoint
app.get('/', (req, res) => {
  res.json({
    service: "CampusConnect API Gateway",
    status: "Operational",
    documentation: "Central Entry Point for CampusConnect Microservices",
    endpoints: [
      "GET /health",
      "GET/POST/PUT/DELETE /users*",
      "GET/POST/PUT/DELETE /products*",
      "GET/POST/DELETE /orders*"
    ],
    serviceRegistry
  });
});

// Fallback 404 Handler for Unmapped Routes
app.use((req, res) => {
  res.status(404).json({
    timestamp: new Date().toISOString(),
    status: 404,
    error: "Not Found",
    message: `Route '${req.method} ${req.originalUrl}' is not mapped on API Gateway.`
  });
});

app.listen(PORT, () => {
  console.log(`🚀 API Gateway running on port ${PORT}`);
  console.log(`🔗 Public Health Endpoint: http://localhost:${PORT}/health`);
});

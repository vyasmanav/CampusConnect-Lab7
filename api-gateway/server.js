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

// Prometheus Metrics Tracking
const metrics = {
  requestCount: {},
  requestDurationTotalMs: 0,
  totalRequests: 0,
  errorCount: 0
};

// Request Logging and Prometheus Metric Tracking Middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    metrics.totalRequests++;
    metrics.requestDurationTotalMs += duration;
    const key = `${req.method}_${req.baseUrl || req.path}_${res.statusCode}`;
    metrics.requestCount[key] = (metrics.requestCount[key] || 0) + 1;
    if (res.statusCode >= 400) {
      metrics.errorCount++;
    }
    console.log(`[API-GATEWAY] ${new Date().toISOString()} | ${req.method} ${req.originalUrl} -> Status: ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Prometheus Scrape Endpoint (GET /metrics)
app.get('/metrics', (req, res) => {
  const memoryUsage = process.memoryUsage();
  let promOutput = `# HELP up Application availability\n# TYPE up gauge\nup{service="api-gateway"} 1\n\n`;
  promOutput += `# HELP http_requests_total Total number of HTTP requests processed\n# TYPE http_requests_total counter\n`;
  
  if (Object.keys(metrics.requestCount).length === 0) {
    promOutput += `http_requests_total{method="GET",handler="/health",status="200"} 0\n`;
  } else {
    for (const [key, count] of Object.entries(metrics.requestCount)) {
      const parts = key.split('_');
      const method = parts[0];
      const status = parts[parts.length - 1];
      const handler = parts.slice(1, -1).join('_') || '/';
      promOutput += `http_requests_total{method="${method}",handler="${handler}",status="${status}"} ${count}\n`;
    }
  }

  promOutput += `\n# HELP http_requests_errors_total Total HTTP 4xx/5xx errors\n# TYPE http_requests_errors_total counter\nhttp_requests_errors_total{service="api-gateway"} ${metrics.errorCount}\n\n`;
  promOutput += `# HELP process_resident_memory_bytes Resident memory size in bytes\n# TYPE process_resident_memory_bytes gauge\nprocess_resident_memory_bytes ${memoryUsage.rss}\n\n`;
  promOutput += `# HELP process_uptime_seconds Process uptime in seconds\n# TYPE process_uptime_seconds gauge\nprocess_uptime_seconds ${Math.floor(process.uptime())}\n`;

  res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
  res.send(promOutput);
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

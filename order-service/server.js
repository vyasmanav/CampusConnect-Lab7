require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.ORDER_SERVICE_PORT || process.env.PORT || 3003;
const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/order_db';

const USER_SERVICE_URL = (process.env.USER_SERVICE_URL || 'http://localhost:3001').replace(/\/$/, '');
const PRODUCT_SERVICE_URL = (process.env.PRODUCT_SERVICE_URL || 'http://localhost:3002').replace(/\/$/, '');

app.use(cors());
app.use(express.json());

// In-Memory Database Fallback with Seed Data
let isMongoConnected = false;
let ordersStore = [
  {
    id: "501",
    userId: "1",
    user: { name: "Aarav Patel", email: "aarav@example.com" },
    productId: "101",
    product: { name: "MacBook Pro M3", price: 1299.99 },
    quantity: 1,
    totalAmount: 1299.99,
    status: "CONFIRMED",
    createdAt: new Date().toISOString()
  }
];
let nextOrderNum = 502;

// Mongoose Schema for Order Service DB
const orderSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  productId: { type: String, required: true },
  quantity: { type: Number, required: true, default: 1 },
  totalAmount: { type: Number, required: true },
  user: { type: Object },
  product: { type: Object },
  status: { type: String, default: "CONFIRMED" }
}, { timestamps: true });

const OrderModel = mongoose.model('Order', orderSchema);

async function initDB() {
  try {
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 2000 });
    isMongoConnected = true;
    console.log(`✅ Order Service connected to MongoDB at ${MONGODB_URI}`);
    const count = await OrderModel.countDocuments();
    if (count === 0) {
      await OrderModel.insertMany([
        {
          userId: "1",
          productId: "101",
          quantity: 1,
          totalAmount: 1299.99,
          user: { name: "Aarav Patel", email: "aarav@example.com" },
          product: { name: "MacBook Pro M3", price: 1299.99 },
          status: "CONFIRMED"
        }
      ]);
      console.log("🌱 Seeded initial Order records into MongoDB.");
    }
  } catch (err) {
    console.warn(`⚠️ Order Service MongoDB unavailable (${err.message}). Using in-memory store.`);
    isMongoConnected = false;
  }
}
initDB();

// Helper: Fetch with timeout for inter-service resilience
async function fetchWithTimeout(url, timeoutMs = 3000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

// Root Endpoint
app.get('/', (req, res) => {
  res.json({
    service: "Order Service",
    port: PORT,
    database: isMongoConnected ? "MongoDB" : "In-Memory Data Store",
    dependencies: {
      userServiceUrl: USER_SERVICE_URL,
      productServiceUrl: PRODUCT_SERVICE_URL
    },
    endpoints: [
      "GET /orders",
      "GET /orders/:id",
      "POST /orders"
    ]
  });
});

// GET /orders - List all orders
app.get('/orders', async (req, res) => {
  try {
    if (isMongoConnected) {
      const orders = await OrderModel.find();
      const formatted = orders.map(o => ({
        id: o._id.toString(),
        userId: o.userId,
        user: o.user,
        productId: o.productId,
        product: o.product,
        quantity: o.quantity,
        totalAmount: o.totalAmount,
        status: o.status,
        createdAt: o.createdAt
      }));
      return res.status(200).json(formatted);
    }
    return res.status(200).json(ordersStore);
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", message: err.message });
  }
});

// GET /orders/:id - Get order by ID
app.get('/orders/:id', async (req, res) => {
  const { id } = req.params;
  try {
    if (isMongoConnected) {
      if (mongoose.Types.ObjectId.isValid(id)) {
        const order = await OrderModel.findById(id);
        if (order) {
          return res.status(200).json({
            id: order._id.toString(),
            userId: order.userId,
            user: order.user,
            productId: order.productId,
            product: order.product,
            quantity: order.quantity,
            totalAmount: order.totalAmount,
            status: order.status,
            createdAt: order.createdAt
          });
        }
      }
    }
    const order = ordersStore.find(o => o.id === String(id));
    if (!order) {
      return res.status(404).json({
        timestamp: new Date().toISOString(),
        status: 404,
        error: "Not Found",
        message: `Order with ID '${id}' not found.`
      });
    }
    return res.status(200).json(order);
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", message: err.message });
  }
});

// POST /orders - Create Order with Inter-Service Validation & 503 Graceful Handling
app.post('/orders', async (req, res) => {
  const { userId, productId, quantity } = req.body || {};
  const qty = Number(quantity) > 0 ? Number(quantity) : 1;

  if (!userId || !productId) {
    return res.status(400).json({
      timestamp: new Date().toISOString(),
      status: 400,
      error: "Bad Request",
      message: "Fields 'userId' and 'productId' are required."
    });
  }

  // 1. Inter-service call to User Service
  let userData;
  try {
    const userRes = await fetchWithTimeout(`${USER_SERVICE_URL}/users/${userId}`);
    if (userRes.status === 404) {
      return res.status(404).json({
        timestamp: new Date().toISOString(),
        status: 404,
        error: "Not Found",
        message: `User with ID '${userId}' not found in User Service.`
      });
    }
    if (!userRes.ok) {
      return res.status(503).json({
        timestamp: new Date().toISOString(),
        status: 503,
        error: "Service Unavailable",
        message: `User Service returned error status ${userRes.status}.`
      });
    }
    userData = await userRes.json();
  } catch (err) {
    console.error(`❌ Inter-service error calling User Service (${USER_SERVICE_URL}/users/${userId}):`, err.message);
    return res.status(503).json({
      timestamp: new Date().toISOString(),
      status: 503,
      error: "Service Unavailable",
      message: `User Service is currently unavailable at ${USER_SERVICE_URL}. Order creation failed.`
    });
  }

  // 2. Inter-service call to Product Service
  let productData;
  try {
    const prodRes = await fetchWithTimeout(`${PRODUCT_SERVICE_URL}/products/${productId}`);
    if (prodRes.status === 404) {
      return res.status(404).json({
        timestamp: new Date().toISOString(),
        status: 404,
        error: "Not Found",
        message: `Product with ID '${productId}' not found in Product Service.`
      });
    }
    if (!prodRes.ok) {
      return res.status(503).json({
        timestamp: new Date().toISOString(),
        status: 503,
        error: "Service Unavailable",
        message: `Product Service returned error status ${prodRes.status}.`
      });
    }
    productData = await prodRes.json();
  } catch (err) {
    console.error(`❌ Inter-service error calling Product Service (${PRODUCT_SERVICE_URL}/products/${productId}):`, err.message);
    return res.status(503).json({
      timestamp: new Date().toISOString(),
      status: 503,
      error: "Service Unavailable",
      message: `Product Service is currently unavailable at ${PRODUCT_SERVICE_URL}. Order creation failed.`
    });
  }

  // 3. Validation passed - Save Order
  const price = Number(productData.price) || 0;
  const totalAmount = parseFloat((price * qty).toFixed(2));

  try {
    if (isMongoConnected) {
      const newOrder = new OrderModel({
        userId: String(userId),
        productId: String(productId),
        quantity: qty,
        totalAmount,
        user: { name: userData.name, email: userData.email },
        product: { name: productData.name, price: productData.price },
        status: "CONFIRMED"
      });
      const saved = await newOrder.save();
      return res.status(201).json({
        id: saved._id.toString(),
        userId: saved.userId,
        user: saved.user,
        productId: saved.productId,
        product: saved.product,
        quantity: saved.quantity,
        totalAmount: saved.totalAmount,
        status: saved.status,
        createdAt: saved.createdAt
      });
    }

    const created = {
      id: String(nextOrderNum++),
      userId: String(userId),
      user: { name: userData.name, email: userData.email },
      productId: String(productId),
      product: { name: productData.name, price: productData.price },
      quantity: qty,
      totalAmount,
      status: "CONFIRMED",
      createdAt: new Date().toISOString()
    };
    ordersStore.push(created);
    return res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", message: err.message });
  }
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    timestamp: new Date().toISOString(),
    status: 404,
    error: "Not Found",
    message: `Endpoint ${req.method} ${req.originalUrl} does not exist on Order Service.`
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Order Service running on port ${PORT}`);
  console.log(`   Connected to User Service at: ${USER_SERVICE_URL}`);
  console.log(`   Connected to Product Service at: ${PRODUCT_SERVICE_URL}`);
});

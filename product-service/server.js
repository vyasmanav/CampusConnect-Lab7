require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PRODUCT_SERVICE_PORT || process.env.PORT || 3002;
const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/product_db';

app.use(cors());
app.use(express.json());

// In-Memory Database Fallback with Seed Data
let isMongoConnected = false;
let productsStore = [
  { id: "101", name: "MacBook Pro M3", category: "Electronics", price: 1299.99, stock: 15, createdAt: new Date().toISOString() },
  { id: "102", name: "Wireless Noise-Canceling Headphones", category: "Electronics", price: 199.99, stock: 40, createdAt: new Date().toISOString() },
  { id: "103", name: "Data Structures & Algorithms Textbook", category: "Books", price: 49.99, stock: 100, createdAt: new Date().toISOString() }
];
let nextId = 104;

// Mongoose Schema for MongoDB support
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  price: { type: Number, required: true },
  stock: { type: Number, default: 0 }
}, { timestamps: true });

const ProductModel = mongoose.model('Product', productSchema);

async function initDB() {
  try {
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 2000 });
    isMongoConnected = true;
    console.log(`✅ Product Service connected to MongoDB at ${MONGODB_URI}`);
    const count = await ProductModel.countDocuments();
    if (count === 0) {
      await ProductModel.insertMany([
        { name: "MacBook Pro M3", category: "Electronics", price: 1299.99, stock: 15 },
        { name: "Wireless Noise-Canceling Headphones", category: "Electronics", price: 199.99, stock: 40 },
        { name: "Data Structures & Algorithms Textbook", category: "Books", price: 49.99, stock: 100 }
      ]);
      console.log("🌱 Seeded initial Product records into MongoDB.");
    }
  } catch (err) {
    console.warn(`⚠️ Product Service MongoDB unavailable (${err.message}). Using in-memory store.`);
    isMongoConnected = false;
  }
}
initDB();

// Root Endpoint
app.get('/', (req, res) => {
  res.json({
    service: "Product Service",
    port: PORT,
    database: isMongoConnected ? "MongoDB" : "In-Memory Data Store",
    endpoints: [
      "GET /products",
      "GET /products/:id",
      "POST /products",
      "PUT /products/:id",
      "DELETE /products/:id"
    ]
  });
});

// GET /products - List all products
app.get('/products', async (req, res) => {
  try {
    if (isMongoConnected) {
      const products = await ProductModel.find();
      const formatted = products.map(p => ({
        id: p._id.toString(),
        name: p.name,
        category: p.category,
        price: p.price,
        stock: p.stock,
        createdAt: p.createdAt
      }));
      return res.status(200).json(formatted);
    }
    return res.status(200).json(productsStore);
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", message: err.message });
  }
});

// GET /products/:id - Get product by ID
app.get('/products/:id', async (req, res) => {
  const { id } = req.params;
  try {
    if (isMongoConnected) {
      if (mongoose.Types.ObjectId.isValid(id)) {
        const product = await ProductModel.findById(id);
        if (product) {
          return res.status(200).json({
            id: product._id.toString(),
            name: product.name,
            category: product.category,
            price: product.price,
            stock: product.stock,
            createdAt: product.createdAt
          });
        }
      }
    }
    const product = productsStore.find(p => p.id === String(id));
    if (!product) {
      return res.status(404).json({
        timestamp: new Date().toISOString(),
        status: 404,
        error: "Not Found",
        message: `Product with ID '${id}' not found in Product Service.`
      });
    }
    return res.status(200).json(product);
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", message: err.message });
  }
});

// POST /products - Create new product
app.post('/products', async (req, res) => {
  const { name, category, price, stock } = req.body || {};
  if (!name || price === undefined) {
    return res.status(400).json({
      timestamp: new Date().toISOString(),
      status: 400,
      error: "Bad Request",
      message: "Fields 'name' and 'price' are required."
    });
  }

  try {
    if (isMongoConnected) {
      const newProduct = new ProductModel({
        name: name.trim(),
        category: category ? category.trim() : "General",
        price: Number(price),
        stock: Number(stock) || 0
      });
      const saved = await newProduct.save();
      return res.status(201).json({
        id: saved._id.toString(),
        name: saved.name,
        category: saved.category,
        price: saved.price,
        stock: saved.stock,
        createdAt: saved.createdAt
      });
    }

    const created = {
      id: String(nextId++),
      name: name.trim(),
      category: category ? category.trim() : "General",
      price: Number(price),
      stock: Number(stock) || 0,
      createdAt: new Date().toISOString()
    };
    productsStore.push(created);
    return res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", message: err.message });
  }
});

// PUT /products/:id - Update product
app.put('/products/:id', async (req, res) => {
  const { id } = req.params;
  const { name, category, price, stock } = req.body || {};

  try {
    if (isMongoConnected && mongoose.Types.ObjectId.isValid(id)) {
      const updated = await ProductModel.findByIdAndUpdate(
        id,
        { name, category, price: price !== undefined ? Number(price) : undefined, stock: stock !== undefined ? Number(stock) : undefined },
        { new: true }
      );
      if (updated) {
        return res.status(200).json({
          id: updated._id.toString(),
          name: updated.name,
          category: updated.category,
          price: updated.price,
          stock: updated.stock,
          updatedAt: updated.updatedAt
        });
      }
    }

    const index = productsStore.findIndex(p => p.id === String(id));
    if (index === -1) {
      return res.status(404).json({
        timestamp: new Date().toISOString(),
        status: 404,
        error: "Not Found",
        message: `Product with ID '${id}' not found.`
      });
    }

    productsStore[index] = {
      ...productsStore[index],
      ...(name && { name }),
      ...(category && { category }),
      ...(price !== undefined && { price: Number(price) }),
      ...(stock !== undefined && { stock: Number(stock) }),
      updatedAt: new Date().toISOString()
    };
    return res.status(200).json(productsStore[index]);
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", message: err.message });
  }
});

// DELETE /products/:id - Delete product
app.delete('/products/:id', async (req, res) => {
  const { id } = req.params;
  try {
    if (isMongoConnected && mongoose.Types.ObjectId.isValid(id)) {
      const deleted = await ProductModel.findByIdAndDelete(id);
      if (deleted) {
        return res.status(200).json({ message: `Product with ID ${id} deleted successfully.` });
      }
    }

    const index = productsStore.findIndex(p => p.id === String(id));
    if (index === -1) {
      return res.status(404).json({
        timestamp: new Date().toISOString(),
        status: 404,
        error: "Not Found",
        message: `Product with ID '${id}' not found.`
      });
    }

    const removed = productsStore.splice(index, 1)[0];
    return res.status(200).json({ message: `Product with ID ${id} deleted successfully.`, deletedProduct: removed });
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
    message: `Endpoint ${req.method} ${req.originalUrl} does not exist on Product Service.`
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Product Service running on port ${PORT}`);
});

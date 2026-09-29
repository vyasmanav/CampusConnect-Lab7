require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.USER_SERVICE_PORT || process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/user_db';

app.use(cors());
app.use(express.json());

// In-Memory Database Fallback with Seed Data
let isMongoConnected = false;
let usersStore = [
  { id: "1", name: "Aarav Patel", email: "aarav@example.com", course: "Computer Science", role: "Student", createdAt: new Date().toISOString() },
  { id: "2", name: "Diya Sharma", email: "diya@example.com", course: "Information Technology", role: "Student", createdAt: new Date().toISOString() },
  { id: "3", name: "Rohan Verma", email: "rohan@example.com", course: "Data Science", role: "Student", createdAt: new Date().toISOString() }
];
let nextId = 4;

// Mongoose Schema for MongoDB support
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  course: { type: String, required: true },
  role: { type: String, default: "Student" }
}, { timestamps: true });

const UserModel = mongoose.model('User', userSchema);

async function initDB() {
  try {
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 2000 });
    isMongoConnected = true;
    console.log(`✅ User Service connected to MongoDB at ${MONGODB_URI}`);
    const count = await UserModel.countDocuments();
    if (count === 0) {
      await UserModel.insertMany([
        { name: "Aarav Patel", email: "aarav@example.com", course: "Computer Science", role: "Student" },
        { name: "Diya Sharma", email: "diya@example.com", course: "Information Technology", role: "Student" },
        { name: "Rohan Verma", email: "rohan@example.com", course: "Data Science", role: "Student" }
      ]);
      console.log("🌱 Seeded initial User records into MongoDB.");
    }
  } catch (err) {
    console.warn(`⚠️ User Service MongoDB unavailable (${err.message}). Using in-memory store.`);
    isMongoConnected = false;
  }
}
initDB();

// Root Endpoint
app.get('/', (req, res) => {
  res.json({
    service: "User Service",
    port: PORT,
    database: isMongoConnected ? "MongoDB" : "In-Memory Data Store",
    endpoints: [
      "GET /users",
      "GET /users/:id",
      "POST /users",
      "PUT /users/:id",
      "DELETE /users/:id"
    ]
  });
});

// GET /users - List all users
app.get('/users', async (req, res) => {
  try {
    if (isMongoConnected) {
      const users = await UserModel.find();
      const formatted = users.map(u => ({
        id: u._id.toString(),
        name: u.name,
        email: u.email,
        course: u.course,
        role: u.role,
        createdAt: u.createdAt
      }));
      return res.status(200).json(formatted);
    }
    return res.status(200).json(usersStore);
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", message: err.message });
  }
});

// GET /users/:id - Get user by ID
app.get('/users/:id', async (req, res) => {
  const { id } = req.params;
  try {
    if (isMongoConnected) {
      if (mongoose.Types.ObjectId.isValid(id)) {
        const user = await UserModel.findById(id);
        if (user) {
          return res.status(200).json({
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            course: user.course,
            role: user.role,
            createdAt: user.createdAt
          });
        }
      }
    }
    const user = usersStore.find(u => u.id === String(id));
    if (!user) {
      return res.status(404).json({
        timestamp: new Date().toISOString(),
        status: 404,
        error: "Not Found",
        message: `User with ID '${id}' not found in User Service.`
      });
    }
    return res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", message: err.message });
  }
});

// POST /users - Create new user
app.post('/users', async (req, res) => {
  const { name, email, course, role } = req.body || {};
  if (!name || !email) {
    return res.status(400).json({
      timestamp: new Date().toISOString(),
      status: 400,
      error: "Bad Request",
      message: "Fields 'name' and 'email' are required."
    });
  }

  try {
    if (isMongoConnected) {
      const existing = await UserModel.findOne({ email: email.trim().toLowerCase() });
      if (existing) {
        return res.status(400).json({ error: "Bad Request", message: `Email '${email}' already exists.` });
      }
      const newUser = new UserModel({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        course: course ? course.trim() : "General",
        role: role || "Student"
      });
      const saved = await newUser.save();
      return res.status(201).json({
        id: saved._id.toString(),
        name: saved.name,
        email: saved.email,
        course: saved.course,
        role: saved.role,
        createdAt: saved.createdAt
      });
    }

    const dup = usersStore.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
    if (dup) {
      return res.status(400).json({ error: "Bad Request", message: `Email '${email}' already exists.` });
    }

    const created = {
      id: String(nextId++),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      course: course ? course.trim() : "General",
      role: role || "Student",
      createdAt: new Date().toISOString()
    };
    usersStore.push(created);
    return res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", message: err.message });
  }
});

// PUT /users/:id - Update user
app.put('/users/:id', async (req, res) => {
  const { id } = req.params;
  const { name, email, course, role } = req.body || {};

  try {
    if (isMongoConnected && mongoose.Types.ObjectId.isValid(id)) {
      const updated = await UserModel.findByIdAndUpdate(
        id,
        { name, email, course, role },
        { new: true }
      );
      if (updated) {
        return res.status(200).json({
          id: updated._id.toString(),
          name: updated.name,
          email: updated.email,
          course: updated.course,
          role: updated.role,
          updatedAt: updated.updatedAt
        });
      }
    }

    const index = usersStore.findIndex(u => u.id === String(id));
    if (index === -1) {
      return res.status(404).json({
        timestamp: new Date().toISOString(),
        status: 404,
        error: "Not Found",
        message: `User with ID '${id}' not found.`
      });
    }

    usersStore[index] = {
      ...usersStore[index],
      ...(name && { name }),
      ...(email && { email }),
      ...(course && { course }),
      ...(role && { role }),
      updatedAt: new Date().toISOString()
    };
    return res.status(200).json(usersStore[index]);
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", message: err.message });
  }
});

// DELETE /users/:id - Delete user
app.delete('/users/:id', async (req, res) => {
  const { id } = req.params;
  try {
    if (isMongoConnected && mongoose.Types.ObjectId.isValid(id)) {
      const deleted = await UserModel.findByIdAndDelete(id);
      if (deleted) {
        return res.status(200).json({ message: `User with ID ${id} deleted successfully.` });
      }
    }

    const index = usersStore.findIndex(u => u.id === String(id));
    if (index === -1) {
      return res.status(404).json({
        timestamp: new Date().toISOString(),
        status: 404,
        error: "Not Found",
        message: `User with ID '${id}' not found.`
      });
    }

    const removed = usersStore.splice(index, 1)[0];
    return res.status(200).json({ message: `User with ID ${id} deleted successfully.`, deletedUser: removed });
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
    message: `Endpoint ${req.method} ${req.originalUrl} does not exist on User Service.`
  });
});

app.listen(PORT, () => {
  console.log(`🚀 User Service running on port ${PORT}`);
});

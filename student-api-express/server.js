require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const Student = require('./models/Student');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/campusconnect';

// Fallback in-memory store if MongoDB is not reachable (ensures testing resilience)
let isMongoConnected = false;
let fallbackStudents = [
  { id: "1", name: "Aarav Patel", email: "aarav@example.com", course: "Computer Science", semester: 5 },
  { id: "2", name: "Diya Sharma", email: "diya@example.com", course: "Information Technology", semester: 3 },
  { id: "3", name: "Rohan Verma", email: "rohan@example.com", course: "Data Science", semester: 6 }
];
let fallbackNextId = 4;

// Middleware
app.use(cors()); // Allow React client & Android clients
app.use(express.json());

// Helper: Validation function for client requests
function validateStudentInput(data, isUpdate = false) {
  const errors = [];
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!isUpdate || data.name !== undefined) {
    if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
      errors.push("Field 'name' is required and cannot be empty.");
    }
  }

  if (!isUpdate || data.email !== undefined) {
    if (!data.email || typeof data.email !== 'string' || !emailRegex.test(data.email.trim())) {
      errors.push("Field 'email' must be a valid email address (e.g. user@example.com).");
    }
  }

  if (!isUpdate || data.course !== undefined) {
    if (!data.course || typeof data.course !== 'string' || data.course.trim() === '') {
      errors.push("Field 'course' is required and cannot be empty.");
    }
  }

  if (!isUpdate || data.semester !== undefined) {
    const sem = Number(data.semester);
    if (!Number.isInteger(sem) || sem < 1 || sem > 8) {
      errors.push("Field 'semester' must be an integer between 1 and 8.");
    }
  }

  return errors;
}

// Swagger OpenAPI Documentation UI
try {
  const swaggerDocument = YAML.load(path.join(__dirname, 'swagger.yaml'));
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
} catch (err) {
  console.error("Could not load swagger.yaml:", err.message);
}

// Database Connection
async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 3000
    });
    isMongoConnected = true;
    console.log(`✅ Connected to MongoDB at: ${MONGODB_URI.split('@').pop()}`);

    // Seed default records if collection is empty
    const count = await Student.countDocuments();
    if (count === 0) {
      await Student.insertMany([
        { name: "Aarav Patel", email: "aarav@example.com", course: "Computer Science", semester: 5 },
        { name: "Diya Sharma", email: "diya@example.com", course: "Information Technology", semester: 3 },
        { name: "Rohan Verma", email: "rohan@example.com", course: "Data Science", semester: 6 }
      ]);
      console.log("🌱 Seeded initial Student records into MongoDB.");
    }
  } catch (err) {
    console.warn(`⚠️ MongoDB connection unavailable (${err.message}). Using persistent in-memory fallback.`);
    isMongoConnected = false;
  }
}

connectDB();

// Root check
app.get('/', (req, res) => {
  res.json({
    message: "Lab 4 Full-Stack Student REST API",
    database: isMongoConnected ? "MongoDB Atlas / Database Connected" : "In-Memory Active",
    docs: `http://localhost:${PORT}/api-docs`,
    endpoints: {
      "GET /students": "List all students",
      "GET /students/:id": "Get student by ID",
      "POST /students": "Create a new student",
      "PUT /students/:id": "Update student by ID",
      "DELETE /students/:id": "Delete student by ID"
    }
  });
});

// 1. GET /students - List all students
app.get('/students', async (req, res) => {
  try {
    if (isMongoConnected) {
      const students = await Student.find().sort({ createdAt: -1 });
      return res.status(200).json(students);
    }
    return res.status(200).json(fallbackStudents);
  } catch (err) {
    res.status(500).json({
      timestamp: new Date().toISOString(),
      status: 500,
      error: "Internal Server Error",
      message: err.message
    });
  }
});

// 2. GET /students/:id - Get student by ID
app.get('/students/:id', async (req, res) => {
  const { id } = req.params;

  try {
    if (isMongoConnected) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({
          timestamp: new Date().toISOString(),
          status: 404,
          error: "Not Found",
          message: `Student with ID ${id} not found.`
        });
      }
      const student = await Student.findById(id);
      if (!student) {
        return res.status(404).json({
          timestamp: new Date().toISOString(),
          status: 404,
          error: "Not Found",
          message: `Student with ID ${id} not found.`
        });
      }
      return res.status(200).json(student);
    }

    // Fallback
    const student = fallbackStudents.find(s => s.id === String(id));
    if (!student) {
      return res.status(404).json({
        timestamp: new Date().toISOString(),
        status: 404,
        error: "Not Found",
        message: `Student with ID ${id} not found.`
      });
    }
    return res.status(200).json(student);
  } catch (err) {
    res.status(500).json({
      timestamp: new Date().toISOString(),
      status: 500,
      error: "Internal Server Error",
      message: err.message
    });
  }
});

// 3. POST /students - Create student
app.post('/students', async (req, res) => {
  const { name, email, course, semester } = req.body || {};
  const validationErrors = validateStudentInput(req.body || {});

  if (validationErrors.length > 0) {
    return res.status(400).json({
      timestamp: new Date().toISOString(),
      status: 400,
      error: "Bad Request",
      message: "Invalid or incomplete student request body.",
      details: validationErrors
    });
  }

  try {
    if (isMongoConnected) {
      // Check email uniqueness
      const existing = await Student.findOne({ email: email.trim().toLowerCase() });
      if (existing) {
        return res.status(400).json({
          timestamp: new Date().toISOString(),
          status: 400,
          error: "Bad Request",
          message: `A student with email '${email}' already exists. Email must be unique.`,
          details: ["Email constraint violation: duplicate email address."]
        });
      }

      const newStudent = new Student({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        course: course.trim(),
        semester: parseInt(semester, 10)
      });

      const saved = await newStudent.save();
      return res.status(201).json(saved);
    }

    // Fallback
    const duplicate = fallbackStudents.find(s => s.email.toLowerCase() === email.trim().toLowerCase());
    if (duplicate) {
      return res.status(400).json({
        timestamp: new Date().toISOString(),
        status: 400,
        error: "Bad Request",
        message: `A student with email '${email}' already exists.`,
        details: ["Duplicate email constraint"]
      });
    }

    const created = {
      id: String(fallbackNextId++),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      course: course.trim(),
      semester: parseInt(semester, 10)
    };
    fallbackStudents.push(created);
    return res.status(201).json(created);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        timestamp: new Date().toISOString(),
        status: 400,
        error: "Bad Request",
        message: "Email must be unique. A record with this email already exists.",
        details: ["Unique index constraint violation on 'email'."]
      });
    }
    res.status(500).json({
      timestamp: new Date().toISOString(),
      status: 500,
      error: "Internal Server Error",
      message: err.message
    });
  }
});

// 4. PUT /students/:id - Update student
app.put('/students/:id', async (req, res) => {
  const { id } = req.params;
  const validationErrors = validateStudentInput(req.body || {});

  if (validationErrors.length > 0) {
    return res.status(400).json({
      timestamp: new Date().toISOString(),
      status: 400,
      error: "Bad Request",
      message: "Invalid student update payload.",
      details: validationErrors
    });
  }

  const { name, email, course, semester } = req.body;

  try {
    if (isMongoConnected) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({
          timestamp: new Date().toISOString(),
          status: 404,
          error: "Not Found",
          message: `Student with ID ${id} not found.`
        });
      }

      // Check if email belongs to another student
      const duplicate = await Student.findOne({
        email: email.trim().toLowerCase(),
        _id: { $ne: id }
      });
      if (duplicate) {
        return res.status(400).json({
          timestamp: new Date().toISOString(),
          status: 400,
          error: "Bad Request",
          message: `Email '${email}' is already taken by another student.`
        });
      }

      const updated = await Student.findByIdAndUpdate(
        id,
        {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          course: course.trim(),
          semester: parseInt(semester, 10)
        },
        { new: true, runValidators: true }
      );

      if (!updated) {
        return res.status(404).json({
          timestamp: new Date().toISOString(),
          status: 404,
          error: "Not Found",
          message: `Student with ID ${id} not found.`
        });
      }

      return res.status(200).json(updated);
    }

    // Fallback
    const index = fallbackStudents.findIndex(s => s.id === String(id));
    if (index === -1) {
      return res.status(404).json({
        timestamp: new Date().toISOString(),
        status: 404,
        error: "Not Found",
        message: `Student with ID ${id} not found.`
      });
    }

    fallbackStudents[index] = {
      id: String(id),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      course: course.trim(),
      semester: parseInt(semester, 10)
    };

    return res.status(200).json(fallbackStudents[index]);
  } catch (err) {
    res.status(500).json({
      timestamp: new Date().toISOString(),
      status: 500,
      error: "Internal Server Error",
      message: err.message
    });
  }
});

// 5. DELETE /students/:id - Delete student
app.delete('/students/:id', async (req, res) => {
  const { id } = req.params;

  try {
    if (isMongoConnected) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({
          timestamp: new Date().toISOString(),
          status: 404,
          error: "Not Found",
          message: `Student with ID ${id} not found.`
        });
      }

      const deleted = await Student.findByIdAndDelete(id);
      if (!deleted) {
        return res.status(404).json({
          timestamp: new Date().toISOString(),
          status: 404,
          error: "Not Found",
          message: `Student with ID ${id} not found.`
        });
      }

      return res.status(200).json({
        message: `Student with ID ${id} deleted successfully.`,
        deletedStudent: deleted
      });
    }

    // Fallback
    const index = fallbackStudents.findIndex(s => s.id === String(id));
    if (index === -1) {
      return res.status(404).json({
        timestamp: new Date().toISOString(),
        status: 404,
        error: "Not Found",
        message: `Student with ID ${id} not found.`
      });
    }

    const removed = fallbackStudents.splice(index, 1)[0];
    return res.status(200).json({
      message: `Student with ID ${id} deleted successfully.`,
      deletedStudent: removed
    });
  } catch (err) {
    res.status(500).json({
      timestamp: new Date().toISOString(),
      status: 500,
      error: "Internal Server Error",
      message: err.message
    });
  }
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    timestamp: new Date().toISOString(),
    status: 404,
    error: "Not Found",
    message: `Endpoint ${req.method} ${req.originalUrl} does not exist.`
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`===================================================`);
    console.log(`🚀 Lab 4 Student REST API (MongoDB + CORS) running at:`);
    console.log(`👉 http://localhost:${PORT}`);
    console.log(`📖 Swagger UI Docs: http://localhost:${PORT}/api-docs`);
    console.log(`===================================================`);
  });
}

module.exports = app;

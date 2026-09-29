const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Field 'name' is required and cannot be empty."],
      trim: true,
      minlength: [2, "Name must be at least 2 characters long."]
    },
    email: {
      type: String,
      required: [true, "Field 'email' is required."],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Field 'email' must be a valid email address."]
    },
    course: {
      type: String,
      required: [true, "Field 'course' is required and cannot be empty."],
      trim: true
    },
    semester: {
      type: Number,
      required: [true, "Field 'semester' is required."],
      min: [1, "Field 'semester' must be at least 1."],
      max: [8, "Field 'semester' cannot exceed 8."]
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    },
    toObject: {
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Indexes
studentSchema.index({ email: 1 }, { unique: true });

const Student = mongoose.model('Student', studentSchema);

module.exports = Student;

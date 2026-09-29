package com.lab3.studentapi.service;

import com.lab3.studentapi.model.Student;
import com.lab3.studentapi.repository.StudentRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;

@Service
public class StudentService {

    private final StudentRepository studentRepository;

    public StudentService(StudentRepository studentRepository) {
        this.studentRepository = studentRepository;
    }

    public List<Student> getAllStudents() {
        return studentRepository.findAll();
    }

    public Student getStudentById(Long id) {
        return studentRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Student with ID " + id + " not found."));
    }

    public Student createStudent(Student student) {
        // Clear any ID passed by user to ensure auto-generation
        student.setId(null);
        student.setEmail(student.getEmail().trim().toLowerCase());
        student.setName(student.getName().trim());
        student.setCourse(student.getCourse().trim());
        return studentRepository.save(student);
    }

    public Student updateStudent(Long id, Student updatedStudent) {
        if (!studentRepository.existsById(id)) {
            throw new NoSuchElementException("Student with ID " + id + " not found.");
        }
        updatedStudent.setId(id);
        updatedStudent.setEmail(updatedStudent.getEmail().trim().toLowerCase());
        updatedStudent.setName(updatedStudent.getName().trim());
        updatedStudent.setCourse(updatedStudent.getCourse().trim());
        return studentRepository.save(updatedStudent);
    }

    public void deleteStudent(Long id) {
        if (!studentRepository.existsById(id)) {
            throw new NoSuchElementException("Student with ID " + id + " not found.");
        }
        studentRepository.deleteById(id);
    }
}

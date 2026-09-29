package com.lab3.studentapi.repository;

import com.lab3.studentapi.model.Student;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

@Repository
public class StudentRepository {

    private final ConcurrentHashMap<Long, Student> store = new ConcurrentHashMap<>();
    private final AtomicLong idCounter = new AtomicLong(1);

    public StudentRepository() {
        // Pre-populate with initial sample students for Lab 3 demonstration
        save(new Student(null, "Aarav Patel", "aarav@example.com", "Computer Science", 5));
        save(new Student(null, "Diya Sharma", "diya@example.com", "Information Technology", 3));
        save(new Student(null, "Rohan Verma", "rohan@example.com", "Data Science", 6));
    }

    public List<Student> findAll() {
        return new ArrayList<>(store.values());
    }

    public Optional<Student> findById(Long id) {
        return Optional.ofNullable(store.get(id));
    }

    public Student save(Student student) {
        if (student.getId() == null) {
            student.setId(idCounter.getAndIncrement());
        }
        store.put(student.getId(), student);
        return student;
    }

    public boolean deleteById(Long id) {
        return store.remove(id) != null;
    }

    public boolean existsById(Long id) {
        return store.containsKey(id);
    }
}

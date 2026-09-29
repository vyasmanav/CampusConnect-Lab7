package com.lab3.studentapi.model;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Schema(description = "Student entity representing a registered student")
public class Student {

    @Schema(description = "Unique numeric identifier of the student", example = "1", accessMode = Schema.AccessMode.READ_ONLY)
    private Long id;

    @Schema(description = "Full name of the student", example = "Aarav Patel", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "Field 'name' is required and cannot be empty")
    private String name;

    @Schema(description = "Valid email address of the student", example = "aarav@example.com", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "Field 'email' is required")
    @Email(message = "Field 'email' must be a valid email address")
    private String email;

    @Schema(description = "Enrolled course or major", example = "Computer Science", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "Field 'course' is required and cannot be empty")
    private String course;

    @Schema(description = "Current active semester (between 1 and 8)", example = "5", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "Field 'semester' is required")
    @Min(value = 1, message = "Field 'semester' must be at least 1")
    @Max(value = 8, message = "Field 'semester' cannot exceed 8")
    private Integer semester;

    public Student() {
    }

    public Student(Long id, String name, String email, String course, Integer semester) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.course = course;
        this.semester = semester;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getCourse() {
        return course;
    }

    public void setCourse(String course) {
        this.course = course;
    }

    public Integer getSemester() {
        return semester;
    }

    public void setSemester(Integer semester) {
        this.semester = semester;
    }
}

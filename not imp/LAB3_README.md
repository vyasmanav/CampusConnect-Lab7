# Web Services & SOA Laboratory — Lab 3: RESTful Web Services

## Overview
This repository contains the complete implementation for **Lab 3 Assignment: Building RESTful Web Services**.
It demonstrates building a resource-oriented **Student Management REST API** adhering to standard HTTP semantics, status codes, input validations, structured error formats, interactive **OpenAPI / Swagger documentation**, and **Postman test suites** in both:
1. **Express.js** (Complete CRUD implementation + Swagger UI)
2. **Spring Boot** (Layered Controller $\rightarrow$ Service $\rightarrow$ Repository architecture + Validation + Springdoc Swagger UI)

---

## 1. Project Structure

```text
WSOA/
├── student-api-express/              # Complete Express.js REST API
│   ├── package.json
│   ├── server.js                     # Express server with in-memory CRUD & validation
│   ├── swagger.yaml                  # OpenAPI 3.0 Specification
│   └── test.js                       # Automated API test suite
│
├── student-api-spring/               # Spring Boot REST API
│   ├── pom.xml                       # Maven config (Spring Web, Validation, Springdoc)
│   └── src/
│       └── main/
│           ├── java/com/lab3/studentapi/
│           │   ├── StudentApiApplication.java
│           │   ├── controller/StudentController.java
│           │   ├── service/StudentService.java
│           │   ├── repository/StudentRepository.java
│           │   ├── model/Student.java
│           │   ├── dto/ErrorResponse.java
│           │   └── exception/GlobalExceptionHandler.java
│           └── resources/
│               └── application.properties
│
├── postman/
│   └── RESTful_Web_Services_Lab_3.postman_collection.json # Ready-to-import Postman Collection
│
├── LAB3_ASSIGNMENT_REPORT.md         # Detailed Lab Submission Report & API Design Exercise
└── README.md                         # This file
```

---

## 2. API Endpoints Mapping

| Operation | HTTP Method | Endpoint | Request Body | Success Code | Error Code | Description |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **List Students** | `GET` | `/students` | — | `200 OK` | `500` | Retrieves all students |
| **Get Student** | `GET` | `/students/{id}` | — | `200 OK` | `404 Not Found` | Retrieves single student by ID |
| **Create Student** | `POST` | `/students` | Student JSON | `201 Created` | `400 Bad Request` | Creates a new student |
| **Update Student** | `PUT` | `/students/{id}` | Student JSON | `200 OK` | `400, 404` | Updates existing student |
| **Delete Student** | `DELETE` | `/students/{id}` | — | `200 OK` / `204` | `404 Not Found` | Deletes student by ID |

---

## 3. How to Run

### Part A: Express.js
```bash
cd student-api-express
npm install
npm start
```
- **Base URL**: `http://localhost:3000`
- **Swagger UI Documentation**: [http://localhost:3000/api-docs](http://localhost:3000/api-docs)
- **Run automated test suite**: `npm test`

---

### Part B: Spring Boot
```bash
cd student-api-spring
mvn clean spring-boot:run
```
*(Or import into IntelliJ IDEA / VS Code as a Maven project and run `StudentApiApplication`)*
- **Base URL**: `http://localhost:8080`
- **Swagger UI Documentation**: [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)
- **OpenAPI JSON**: [http://localhost:8080/v3/api-docs](http://localhost:8080/v3/api-docs)

---

## 4. Sample Requests & Responses

### 1. Create Student (Valid Request)
- **Method & URL**: `POST http://localhost:3000/students`
- **Headers**: `Content-Type: application/json`
- **Request Body**:
```json
{
  "name": "Aarav Patel",
  "email": "aarav@example.com",
  "course": "Computer Science",
  "semester": 5
}
```
- **Response Status**: `201 Created`
- **Response Body**:
```json
{
  "id": 4,
  "name": "Aarav Patel",
  "email": "aarav@example.com",
  "course": "Computer Science",
  "semester": 5
}
```

---

### 2. Create Student (Invalid Request - Validation Error)
- **Method & URL**: `POST http://localhost:3000/students`
- **Request Body**:
```json
{
  "name": "",
  "email": "invalid-email",
  "semester": -2
}
```
- **Response Status**: `400 Bad Request`
- **Response Body**:
```json
{
  "timestamp": "2026-08-21T14:31:00.000Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Invalid or incomplete student request body.",
  "details": [
    "Field 'name' is required and cannot be empty.",
    "Field 'email' must be a valid email address (e.g. user@example.com).",
    "Field 'course' is required and cannot be empty.",
    "Field 'semester' must be an integer between 1 and 8."
  ]
}
```

---

### 3. Get Student (Not Found)
- **Method & URL**: `GET http://localhost:3000/students/999`
- **Response Status**: `404 Not Found`
- **Response Body**:
```json
{
  "timestamp": "2026-08-21T14:31:00.000Z",
  "status": 404,
  "error": "Not Found",
  "message": "Student with ID 999 not found."
}
```

---

## 5. Postman Testing
1. Open Postman.
2. Click **Import** and select `postman/RESTful_Web_Services_Lab_3.postman_collection.json`.
3. Set variable `baseUrl` to `http://localhost:3000` (or `http://localhost:8080`).
4. Execute each request to inspect the status code, response time, and payload.

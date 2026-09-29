# Web Services & SOA Laboratory
## Lab 3 Assignment Report: Building RESTful Web Services

---

### Student Submission Evidence & Report

| Item | Details |
| :--- | :--- |
| **Course** | Web Services & SOA Laboratory |
| **Lab No.** | Lab 3 |
| **Topic** | Building RESTful Web Services (Express.js & Spring Boot) |
| **Tools Used** | Node.js, Express.js, Java 21, Spring Boot 3, Swagger UI / OpenAPI 3, Postman |

---

## 1. Executive Summary & Objectives

The goal of this laboratory is to design and construct a production-ready, resource-oriented **Student Management RESTful Web Service**. The implementation illustrates:
- Core REST architectural constraints (uniform interface, statelessness, resource identification through URIs, representation via JSON, and standardized HTTP verbs).
- Complete CRUD functionality in **Express.js** and equivalent layered architecture in **Spring Boot** (`Controller` $\rightarrow$ `Service` $\rightarrow$ `Repository`).
- Input validation and structured JSON error responses with standard HTTP status codes (`200`, `201`, `400`, `404`, `500`).
- Automated interactive API documentation using **OpenAPI 3.0 / Swagger UI**.
- API testing via an exported **Postman Collection**.

---

## 2. API Design Exercise (Section 12 of Lab Manual)

### Table: Endpoint Design Matrix

| Resource | Endpoint | Method | Request Body | Success | Errors | Purpose / Semantics |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Student** | `/students` | `GET` | — | `200 OK` | `500` | Fetch collection of all students |
| **Student** | `/students/{id}` | `GET` | — | `200 OK` | `404` | Fetch individual student record by ID |
| **Student** | `/students` | `POST` | Student JSON | `201 Created` | `400` | Create a new student resource |
| **Student** | `/students/{id}` | `PUT` | Student JSON | `200 OK` | `400, 404` | Replace/Update student resource |
| **Student** | `/students/{id}` | `DELETE` | — | `200 OK` / `204` | `404` | Remove student resource by ID |

### Why are these endpoints resource-oriented?
1. **Noun-Based URIs**: The URIs (`/students` and `/students/{id}`) use plural nouns representing the entity type rather than verbs or actions (e.g. avoiding bad practices like `/getStudents` or `/deleteStudent?id=1`).
2. **Standard HTTP Verbs for Actions**: The operation to be performed on the resource is dictated purely by the HTTP method (`GET` for retrieval, `POST` for creation, `PUT` for modification, and `DELETE` for removal).
3. **Hierarchical Identification**: An individual resource instance is addressed as a sub-path (`/students/{id}`) under the collection (`/students`), establishing clean hierarchical REST semantics.

### Why are the selected HTTP methods and status codes appropriate?
- **`GET` + `200 OK`**: Safe and idempotent method for reading state without side-effects.
- **`POST` + `201 Created`**: Used for non-idempotent creation. Returns `201 Created` indicating that the resource has been instantiated.
- **`PUT` + `200 OK`**: Idempotent replacement of resource state.
- **`DELETE` + `200 OK` / `204 No Content`**: Idempotent deletion.
- **`400 Bad Request`**: Appropriately returned when the client sends malformed JSON, empty mandatory fields, negative semesters, or invalid email formats.
- **`404 Not Found`**: Returned when querying, modifying, or deleting an ID that does not exist in the store.

---

## 3. Architectural Comparison: Express.js vs Spring Boot

| REST Concern | Express.js Implementation | Spring Boot Implementation |
| :--- | :--- | :--- |
| **Routing** | Functional route handlers (`app.get`, `app.post`, `app.put`, `app.delete`) | Annotation-driven `@GetMapping`, `@PostMapping`, `@PutMapping`, `@DeleteMapping` |
| **Request JSON Parsing** | Built-in middleware `express.json()` | `@RequestBody` with Jackson `HttpMessageConverter` |
| **Input Validation** | Custom validation middleware / schema functions | Jakarta validation annotations (`@NotBlank`, `@Email`, `@Min`, `@Max`, `@Valid`) |
| **Business Logic Layer** | Direct router / modular service modules | Distinct `@Service` layer decoupled from `@RestController` |
| **Data Access Layer** | Array / Map store in memory | `@Repository` with thread-safe `ConcurrentHashMap` |
| **Exception Handling** | Fallback middleware / `res.status(code).json(...)` | Centralized `@RestControllerAdvice` + `@ExceptionHandler` |
| **Documentation** | `swagger-ui-express` + `yamljs` serving `swagger.yaml` | `springdoc-openapi-starter-webmvc-ui` with auto-generation |
| **Testing** | Automated Node.js integration script & Postman | Postman Collection / SpringBootTest |

---

## 4. Spring Boot Flow Trace (Controller $\rightarrow$ Service $\rightarrow$ Repository)

### 1. `GET /students`
1. **HTTP Client** dispatches `GET /students`.
2. **`StudentController.getAllStudents()`** intercepts the request and invokes `studentService.getAllStudents()`.
3. **`StudentService`** calls `studentRepository.findAll()`.
4. **`StudentRepository`** retrieves values from the thread-safe `ConcurrentHashMap` data structure.
5. The list travels back up to `StudentController`, which wraps it in `ResponseEntity.ok()` with **HTTP 200**.

### 2. `POST /students`
1. **HTTP Client** dispatches `POST /students` with JSON payload:
   ```json
   {
     "name": "Aarav Patel",
     "email": "aarav@example.com",
     "course": "Computer Science",
     "semester": 5
   }
   ```
2. **`StudentController.createStudent(@Valid @RequestBody Student student)`**:
   - Spring automatically parses JSON into `Student` object and validates fields with `@NotBlank`, `@Email`, `@Min(1)`, `@Max(8)`.
   - If invalid, `GlobalExceptionHandler` intercepts `MethodArgumentNotValidException` and returns **HTTP 400 Bad Request** with validation error details.
3. If valid, the controller invokes `studentService.createStudent(student)`.
4. **`StudentService`** formats and trims data, and invokes `studentRepository.save(student)`.
5. **`StudentRepository`** assigns an auto-incremented ID via `AtomicLong` and stores it into `ConcurrentHashMap`.
6. The created student is returned with **HTTP 201 Created**.

---

## 5. Verification & Test Evidence

### Express.js Automated Test Suite Output:
```text
🧪 Starting Automated API Tests against Express server...

✅ [PASS] GET /students returns 200 and list of students
✅ [PASS] GET /students/1 returns 200 and student details
✅ [PASS] GET /students/999 returns 404 Not Found
✅ [PASS] POST /students creates student and returns 201 Created
✅ [PASS] POST /students with invalid data returns 400 Bad Request
✅ [PASS] PUT /students/4 updates student and returns 200 OK
✅ [PASS] DELETE /students/4 deletes student and returns 200 OK
✅ [PASS] GET /students/4 after delete returns 404 Not Found

🎉 Test Suite Completed: 8/8 passed.
```

---

## 6. Submission Checklist (Section 16 of Manual)

- [x] **Working Project**: Express.js server and complete Spring Boot project generated.
- [x] **Complete CRUD**: `GET /students`, `GET /students/:id`, `POST /students`, `PUT /students/:id`, `DELETE /students/:id`.
- [x] **Equivalent Implementations**: Express.js complete CRUD & Spring Boot layered architecture (`Controller` $\rightarrow$ `Service` $\rightarrow$ `Repository`).
- [x] **Validation & Error Handling**: Rejects invalid payloads with HTTP 400 and structured JSON messages.
- [x] **Postman Collection Export**: Available in `postman/RESTful_Web_Services_Lab_3.postman_collection.json`.
- [x] **OpenAPI / Swagger Documentation**: Available at `http://localhost:3000/api-docs` (Express) and `http://localhost:8080/swagger-ui.html` (Spring Boot).
- [x] **README & Setup Guide**: Full setup and running commands in `README.md`.
- [x] **API Design Exercise**: Completed with full technical rationale.

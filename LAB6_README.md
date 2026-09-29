# CampusConnect - Lab 6 Microservices Architecture

## 1. Project Overview & Relation to Previous Work
In earlier lab work (Labs 1-5), CampusConnect was developed as a monolithic application with Express.js REST APIs, database persistence, React client, and Android client containerized under a single backend service.

In **Lab 6**, the monolithic backend was decomposed into three independently runnable, containerized microservices:
1. **User Service** (Port `3001`)
2. **Product Service** (Port `3002`)
3. **Order Service** (Port `3003`)

These services communicate over a shared Docker network (`campus-network`) using HTTP/REST APIs while adhering to the **Database-per-Service** pattern.

---

## 2. Microservices Architecture & Boundaries

```mermaid
graph TD
    Client["Client / Postman"]
    
    subgraph Docker Network: campus-network
        US["User Service (:3001)"]
        PS["Product Service (:3002)"]
        OS["Order Service (:3003)"]
        
        UDB[("User DB\n(User Owned)")]
        PDB[("Product DB\n(Product Owned)")]
        ODB[("Order DB\n(Order Owned)")]
        
        US --- UDB
        PS --- PDB
        OS --- ODB
    end

    Client -->|REST GET/POST/PUT/DELETE| US
    Client -->|REST GET/POST/PUT/DELETE| PS
    Client -->|REST GET/POST/DELETE| OS
    
    OS -->|GET http://user-service:3001/users/{id}| US
    OS -->|GET http://product-service:3002/products/{id}| PS
```

---

## 3. Service Responsibilities, Ports & Endpoints

| Service | Responsibility | Port | Key Endpoints | Data Ownership |
| :--- | :--- | :--- | :--- | :--- |
| **User Service** | Manage User resources (create, retrieve, update, delete). | `:3001` | `GET /users`<br>`GET /users/{id}`<br>`POST /users`<br>`PUT /users/{id}`<br>`DELETE /users/{id}` | User DB (MongoDB / In-Memory) |
| **Product Service** | Manage Product resources used by the application. | `:3002` | `GET /products`<br>`GET /products/{id}`<br>`POST /products`<br>`PUT /products/{id}`<br>`DELETE /products/{id}` | Product DB (MongoDB / In-Memory) |
| **Order Service** | Create and retrieve Orders; validate referenced User and Product data via REST APIs. | `:3003` | `GET /orders`<br>`GET /orders/{id}`<br>`POST /orders` | Order DB (MongoDB / In-Memory) |

---

## 4. Completed API & Communication Exercise (Lab 6 Design Tables)

### Design Table: Microservices Summary

| Item | User Service | Product Service | Order Service |
| :--- | :--- | :--- | :--- |
| **Responsibility** | Create, retrieve, update & delete User resources | Manage Product resources | Create & retrieve Orders; validate User & Product via APIs |
| **Port** | `:3001` | `:3002` | `:3003` |
| **Main Resources** | Users | Products | Orders |
| **Key Endpoints** | `GET/POST/PUT/DELETE /users` | `GET/POST/PUT/DELETE /products` | `POST/GET /orders` |
| **Data/Database** | User-owned | Product-owned | Order-owned |

### Design Table: Service-to-Service Call

| Field | Your Design Details |
| :--- | :--- |
| **Calling Service** | Order Service (`:3003`) |
| **Target Service** | User Service (`:3001`) / Product Service (`:3002`) |
| **HTTP Method** | `GET` |
| **Endpoint** | `/users/{id}` or `/products/{id}` |
| **Request Data** | Referenced `userId` or `productId` |
| **Expected Response** | `200 OK` + requested user/product object |
| **Failure Response** | `404 Not Found` for invalid resource; `503 Service Unavailable` when target dependency is offline/down |

---

## 5. How to Run Each Service Independently

Each microservice is completely standalone with zero hardcoded cross-dependencies.

```bash
# Run User Service independently
cd user-service
npm install
npm start

# Run Product Service independently
cd product-service
npm install
npm start

# Run Order Service independently
cd order-service
npm install
npm start
```

---

## 6. Dockerfile Explanation for Each Service

Each microservice contains a multi-stage optimized Dockerfile (`user-service/Dockerfile`, `product-service/Dockerfile`, `order-service/Dockerfile`):

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3001  # Exposes 3001 (User), 3002 (Product), or 3003 (Order)
CMD ["node", "server.js"]
```

Key features:
- Uses lightweight `node:22-alpine` base image.
- `WORKDIR /app` establishes working directory inside container.
- Layer caching by copying `package*.json` before `npm install`.
- Exposes specific service ports (`3001`, `3002`, `3003`).

---

## 7. Docker Image Build Commands

```bash
docker build -t user-service:v1 ./user-service
docker build -t product-service:v1 ./product-service
docker build -t order-service:v1 ./order-service
docker images
```

---

## 8. Shared Docker Network & Communication

All microservices are attached to a shared custom Docker bridge network called `campus-network`.

Inside Docker, container-to-container communication uses container names as hostnames instead of `localhost`:
- Order Service -> User Service: `http://user-service:3001/users/{id}`
- Order Service -> Product Service: `http://product-service:3002/products/{id}`

---

## 9. Environment Variables Configuration

Service ports and URLs are fully configurable through environment variables:

```env
USER_SERVICE_PORT=3001
PRODUCT_SERVICE_PORT=3002
ORDER_SERVICE_PORT=3003

USER_SERVICE_URL=http://user-service:3001
PRODUCT_SERVICE_URL=http://product-service:3002
```

---

## 10. Database per Service Pattern

Each service strictly owns its database persistence layer:
- **User Service** writes to its own isolated database store (`user_db`).
- **Product Service** writes to its own isolated database store (`product_db`).
- **Order Service** writes to its own isolated database store (`order_db`).

Direct database queries across service boundaries are strictly forbidden (`Order Service -> REST API -> User Service`, NOT `Order Service -> User Database`).

---

## 11. Orchestrating with Docker Compose

Complete multi-service orchestration is managed via `compose.yaml` (or `docker-compose.yml`):

```bash
# Verify configuration
docker compose config

# Build and launch all services in detached mode
docker compose up -d

# Check running containers
docker compose ps

# View logs for all microservices
docker compose logs -f
```

---

## 12. Inter-Service Error Handling & Resilience Behavior

When Order Service creates an order (`POST /orders`):
1. **Valid User & Product**: Resolves both REST endpoints successfully and returns `201 Created`.
2. **Invalid Resource ID**: If User Service or Product Service returns `404 Not Found`, Order Service catches this and returns `404 Not Found` to the client.
3. **Dependency Unavailable**: If User Service or Product Service is offline/unreachable, Order Service handles the error gracefully and returns a controlled `503 Service Unavailable` response:
   ```json
   {
     "timestamp": "2026-09-29T10:05:34.231Z",
     "status": 503,
     "error": "Service Unavailable",
     "message": "User Service is currently unavailable. Order creation failed."
   }
   ```
4. **Recovery**: Once the dependency service is restarted, subsequent order requests succeed immediately with `201 Created`.

---

## 13. Postman Testing Suite & Expected Results

The Postman collection `RESTful_Web_Services_Lab_6.postman_collection.json` verifies all testing requirements:

| Test Case | Method & Endpoint | Expected Status |
| :--- | :--- | :--- |
| Direct User List | `GET http://localhost:3001/users` | `200 OK` |
| Direct Product List | `GET http://localhost:3002/products` | `200 OK` |
| Direct Order List | `GET http://localhost:3003/orders` | `200 OK` |
| Valid Inter-Service Order Creation | `POST http://localhost:3003/orders` (userId: "1", productId: "101") | `201 Created` |
| Invalid User ID Test | `POST http://localhost:3003/orders` (userId: "9999", productId: "101") | `404 Not Found` |
| Dependency Offline Test | `POST http://localhost:3003/orders` (when User Service stopped) | `503 Service Unavailable` |
| Recovery Test | `POST http://localhost:3003/orders` (after User Service restart) | `201 Created` |

---

## 14. Troubleshooting

- **Port Conflict**: If port 3001, 3002, or 3003 is occupied, update `USER_SERVICE_PORT`, `PRODUCT_SERVICE_PORT`, or `ORDER_SERVICE_PORT` in `.env`.
- **Host Resolution Error in Docker**: Ensure containers are joined to `campus-network`.
- **Database Fallback**: If MongoDB instance is unreachable, services automatically fallback to in-memory store so testing is unblocked.

---

## 15. Submission Files Included

- `user-service/` (Source code, `package.json`, `Dockerfile`, `.dockerignore`)
- `product-service/` (Source code, `package.json`, `Dockerfile`, `.dockerignore`)
- `order-service/` (Source code, `package.json`, `Dockerfile`, `.dockerignore`)
- `compose.yaml` / `docker-compose.yml`
- `.env` and `.env.example`
- `RESTful_Web_Services_Lab_6.postman_collection.json`
- `README.md` & `LAB6_README.md`

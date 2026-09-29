# CampusConnect - Lab 7: API Gateway, Configuration-Based Service Discovery & Cloud Deployment

## 1. Project Overview & Relation to Lab 6
In **Lab 6**, CampusConnect was decomposed into three independently runnable, containerized microservices (`User Service`, `Product Service`, `Order Service`) communicating directly over a Docker network (`campus-network`), with the API Gateway introduced only conceptually.

In **Lab 7**, we make the API Gateway concrete by introducing a dedicated **API Gateway microservice (`api-gateway`)** running on port `:3000`. The gateway acts as the **single public entry point** for all clients, externalizing service locations via **environment-variable configuration (Service Discovery)**, and providing containerized cloud deployment setup.

- **GitHub Repository**: [https://github.com/vyasmanav/CampusConnect-Lab7](https://github.com/vyasmanav/CampusConnect-Lab7)


---

## 2. System Architecture & Docker Network Layering

```mermaid
graph TD
    Client["Client / Postman / Browser"]
    
    subgraph Public Internet / Cloud Entry
        GW["API Gateway (:3000)\nReverse Proxy, Logging & Health Check"]
    end
    
    subgraph Docker Network: campus-network (Internal Only)
        US["User Service (:3001)"]
        PS["Product Service (:3002)"]
        OS["Order Service (:3003)"]
    end
    
    subgraph Database Layer
        UDB[("User DB / Atlas")]
        PDB[("Product DB / Atlas")]
        ODB[("Order DB / Atlas")]
    end

    Client -->|REST Requests| GW
    
    GW -->|GET/POST/PUT/DELETE /users/*| US
    GW -->|GET/POST/PUT/DELETE /products/*| PS
    GW -->|GET/POST/DELETE /orders/*| OS
    
    OS -->|Internal REST GET /users/{id}| US
    OS -->|Internal REST GET /products/{id}| PS
    
    US --- UDB
    PS --- PDB
    OS --- ODB
```

> **Security & Encapsulation Boundary**: In Docker Compose (`compose.yaml`), **only the API Gateway port (`3000`) is exposed externally**. `User Service` (`3001`), `Product Service` (`3002`), and `Order Service` (`3003`) are kept strictly internal to `campus-network` and cannot be reached directly from outside the network.

---

## 3. Gateway Endpoints & Routing Table

| Gateway Path | Target Microservice | Target Service URL (Configured) | Method Supported | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET /health` | Gateway Itself | Local / Self | `GET` | Health check endpoint reporting gateway status & service registry |
| `/users/*` | **User Service** | `USER_SERVICE_URL` (`:3001`) | `GET`, `POST`, `PUT`, `DELETE` | Manages user profiles & authentication data |
| `/products/*` | **Product Service** | `PRODUCT_SERVICE_URL` (`:3002`) | `GET`, `POST`, `PUT`, `DELETE` | Manages course catalog & products |
| `/orders/*` | **Order Service** | `ORDER_SERVICE_URL` (`:3003`) | `GET`, `POST`, `DELETE` | Manages order creation with inter-service validation |

---

## 4. Discussion Answers (Required PDF Deliverables)

### Part A Discussion: Why introduce an API Gateway instead of letting clients call each service directly?
Direct client-to-microservice communication introduces several significant drawbacks:
1. **Coupling to Internal Topology**: Clients must maintain URLs for every microservice. If services split, merge, or change ports, all client applications break.
2. **Security Vulnerability**: Exposing multiple microservice ports increases the attack surface.
3. **Cross-Cutting Concerns Duplication**: Authentication, CORS headers, rate limiting, request logging, and SSL termination would need to be re-implemented inside every microservice.
4. **Network Efficiency**: An API Gateway aggregates requests, hides backend microservice locations, and provides a single secure ingress point over HTTPS.

### Part B Discussion: Static/Config-Based vs. Dynamic Service Discovery
- **Static / Configuration-Based Service Discovery (Implemented)**:
  Service locations are passed to the API Gateway at startup via environment variables (`USER_SERVICE_URL`, `PRODUCT_SERVICE_URL`, `ORDER_SERVICE_URL`).
  - *Pros*: Extremely simple, zero external runtime overhead, perfect for Docker Compose / fixed container environments.
  - *Cons*: Updating a service location requires updating environment variables and restarting the gateway container.
- **Dynamic Service Discovery (e.g., Consul, Netflix Eureka, Kubernetes DNS)**:
  Services dynamically register themselves with a central registry upon startup and send periodic heartbeats.
  - *Pros*: Supports dynamic auto-scaling, automatic instance registration/deregistration, client-side load balancing, and zero-downtime routing.
  - *What Dynamic Registry Adds*: Automatic health-check eviction, dynamic IP binding, and multi-instance load balancing that static configuration files cannot provide without manual intervention.

---

## 5. How to Run & Verify Locally

### Option A: Via Docker Compose (Recommended)
```bash
# 1. Build images and start all 4 containers
docker compose up -d --build

# 2. Check running containers
docker compose ps

# 3. View API Gateway logs
docker compose logs -f api-gateway
```

### Option B: Run Standalone Services
```bash
# Terminal 1: User Service
cd user-service && npm start

# Terminal 2: Product Service
cd product-service && npm start

# Terminal 3: Order Service
cd order-service && npm start

# Terminal 4: API Gateway
cd api-gateway && npm start
```

---

## 6. Testing Guide & Expected Responses

Import `RESTful_Web_Services_Lab_7.postman_collection.json` into Postman:

| Test Scenario | Endpoint | Expected Status |
| :--- | :--- | :--- |
| **Gateway Health Check** | `GET http://localhost:3000/health` | `200 OK` |
| **Routed Users Request** | `GET http://localhost:3000/users` | `200 OK` |
| **Routed Products Request** | `GET http://localhost:3000/products` | `200 OK` |
| **Routed Orders Request** | `GET http://localhost:3000/orders` | `200 OK` |
| **Routed Valid Order Creation** | `POST http://localhost:3000/orders` | `201 Created` |
| **Unreachable Service Error** | `GET http://localhost:3000/users` *(when User Service stopped)* | `503 Service Unavailable` |

---

## 7. Cloud Deployment Guide (Render / Railway / Fly.io / AWS)

### Deploying to Cloud (e.g., Render / Railway)
1. **Container Images**: Push individual Dockerfiles or use GitHub repository integration.
2. **Environment Variables**:
   - `PORT`: `3000`
   - `USER_SERVICE_URL`: `https://campusconnect-user-service.onrender.com`
   - `PRODUCT_SERVICE_URL`: `https://campusconnect-product-service.onrender.com`
   - `ORDER_SERVICE_URL`: `https://campusconnect-order-service.onrender.com`
   - `MONGO_URI`: MongoDB Atlas connection string (`mongodb+srv://...`)
3. **Public URL Verification**: Once deployed, verify `https://<your-gateway-cloud-url>/health` and re-run Postman collection against the cloud domain.

---

## 8. Written Reflection (Lab 6 vs Lab 7)
Moving from Lab 6 to Lab 7 transformed our microservices system from an internal collection of exposed containers into a production-ready cloud architecture. By introducing the API Gateway, external clients no longer need knowledge of individual microservice ports or internal topologies. Hiding the backend services behind Docker network boundaries improved overall system security. Furthermore, configuration-driven service discovery simplified environment switching between local development (`localhost`) and cloud deployment (`Render/AWS`) without modifying a single line of application code.

---

## 9. Submission Files Checklist
- `api-gateway/` (`server.js`, `package.json`, `Dockerfile`, `.dockerignore`)
- `user-service/`, `product-service/`, `order-service/`
- `compose.yaml` & `docker-compose.yml` (Gateway port `3000` exposed, microservices internal)
- `.env` & `.env.example`
- `RESTful_Web_Services_Lab_7.postman_collection.json`
- `README.md` & `LAB7_README.md`
- `make_zip_lab7.js` -> produces `Lab7_202512062.zip`

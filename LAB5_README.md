# Web Services & SOA Laboratory
## Lab 5: Docker & Containerization — Dockerizing the Lab 4 Student REST API

---

### Student Information
- **Course**: Web Services & SOA Laboratory
- **Lab No.**: Lab 5
- **Student ID**: `202512062`
- **Topic**: Docker & Containerization of Student REST API with MongoDB & Docker Compose
- **Technology Stack**: Express.js • Node.js • MongoDB • Docker • Docker Compose

---

## 1. Project Overview & Relation to Lab 4

This laboratory builds directly on the Student REST API developed in **Lab 4**. In Lab 4, the service was connected to persistent database storage (MongoDB Atlas) and consumed by multiple clients (React SPA and Android).

In **Lab 5**, we package, containerize, network, configure, persist, and orchestrate this complete Student REST API ecosystem using **Docker** and **Docker Compose**:
1. **Packaging**: Containerizing the Node.js / Express.js REST API into an immutable, portable Docker image (`student-api:v1`).
2. **Networking**: Isolating the API and MongoDB containers on a custom Docker bridge network (`student-network`) with automatic DNS resolution.
3. **Configuration**: Decoupling environment-specific configurations (`PORT`, `MONGO_URI`) from source code using environment variables.
4. **Data Persistence**: Employing named Docker volumes (`student-mongo-data`) mounted to `/data/db` to preserve data across container lifecycles.
5. **Multi-Container Orchestration**: Declaratively defining and managing the entire multi-service stack with **Docker Compose** (`compose.yaml`).

---

## 2. Docker Installation & Verification

Docker Desktop for Windows was verified using the official CLI commands:

```bash
# Check Docker version
docker --version
# Output: Docker version 29.7.2, build a7dcaa6

# Verify Docker daemon and container execution
docker run hello-world
```

---

## 3. Dockerfile Explanation

The `Dockerfile` is placed in the backend directory (`student-api-express/Dockerfile`) and at project root:

```dockerfile
# Base image: Lightweight Node.js 20 Alpine Linux
FROM node:20-alpine

# Set working directory inside container
WORKDIR /app

# Copy dependency definitions first (enables Docker build caching)
COPY package*.json ./

# Install production dependencies only
RUN npm install --omit=dev

# Copy application source code
COPY . .

# Expose Student API port
EXPOSE 3000

# Specify start command
CMD ["npm", "start"]
```

### Breakdown of Instructions:
- **`FROM node:20-alpine`**: Uses the official, security-hardened, and lightweight Alpine-based Node.js runtime (~140MB vs ~1GB for full image).
- **`WORKDIR /app`**: Creates and sets `/app` as the execution context for all following instructions.
- **`COPY package*.json ./` & `RUN npm install --omit=dev`**: Leverages Docker layer caching. Dependencies are only re-installed if `package.json` or `package-lock.json` changes.
- **`COPY . .`**: Copies application code while respecting `.dockerignore` (excluding `node_modules`, `.env`, and git artifacts).
- **`EXPOSE 3000`**: Informs Docker that the application inside listens on port 3000.
- **`CMD ["npm", "start"]`**: Launches the Express server (`node server.js`) on container startup.

---

## 4. Docker Image Build Command

To build the Docker image with tag `student-api:v1`:

```bash
docker build -t student-api:v1 ./student-api-express
```

Verify the image in local registry:
```bash
docker images
```

---

## 5. Container Run & Port Mapping

Run the Student API container standalone with host-to-container port mapping:

```bash
docker run -d --name student-api -p 3000:3000 student-api:v1
```

- **`-p 3000:3000`**: Maps port `3000` on the host machine to port `3000` inside the container.
- **`docker ps`**: Verifies the container is up and running.
- **`docker logs student-api`**: Displays application startup logs.

---

## 6. Postman API Testing (Containerized REST API)

All existing Lab 4 CRUD endpoints work seamlessly when containerized:

| Operation | Method | Container Endpoint | Expected Status |
|:---|:---|:---|:---:|
| **List Students** | `GET` | `http://localhost:3000/students` | `200 OK` |
| **Get Student by ID** | `GET` | `http://localhost:3000/students/:id` | `200 OK` / `404 Not Found` |
| **Create Student** | `POST` | `http://localhost:3000/students` | `201 Created` / `400 Bad Request` |
| **Update Student** | `PUT` | `http://localhost:3000/students/:id` | `200 OK` / `400` / `404` |
| **Delete Student** | `DELETE` | `http://localhost:3000/students/:id` | `200 OK` / `404 Not Found` |

---

## 7. Multi-Container Setup: Docker Network Configuration

### Localhost vs. Container Service Name (Core Concept)
- **Inside Host / Postman / React**: `localhost:3000` accesses the mapped container port from the host OS.
- **Inside Docker Container**: `localhost` refers to the container's **own internal network loopback**, NOT the host and NOT another container.
- **Inter-Container Communication**: Containers on a user-defined bridge network resolve each other by **service/container name** via Docker's embedded DNS server.
  - `student-api` reaches MongoDB at: `mongodb://mongodb:27017/campusconnect`

### Creating and Connecting the Network:
```bash
# 1. Create dedicated network
docker network create student-network

# 2. Run MongoDB container on the network
docker run -d --name mongodb --network student-network mongo

# 3. Connect API container to the network
docker network connect student-network student-api

# 4. Verify network members
docker network inspect student-network
```

---

## 8. Environment Variables Configuration

The application reads runtime configuration from environment variables rather than hardcoded strings:

```bash
docker run -d --name student-api \
  --network student-network \
  -p 3000:3000 \
  -e PORT=3000 \
  -e MONGO_URI=mongodb://mongodb:27017/campusconnect \
  student-api:v1
```

- **`PORT`**: Defines the listening port (default: 3000).
- **`MONGO_URI`**: Defines the MongoDB connection string using the container name `mongodb`.

---

## 9. MongoDB Volume & Persistence Test

Containers have ephemeral storage; destroying a container deletes all unmounted data. To persist database files across container lifecycles, a named Docker volume is used:

```bash
# 1. Create named Docker volume
docker volume create student-mongo-data

# 2. Run MongoDB mounting volume to /data/db
docker run -d --name mongodb \
  --network student-network \
  -v student-mongo-data:/data/db \
  mongo
```

### Persistence Exercise Verification:
1. Insert student record (`"Persistent Student"`, `persist@test.com`) via `POST /students`.
2. Confirm retrieval via `GET /students`.
3. Stop and completely delete the MongoDB container:
   ```bash
   docker rm -f mongodb
   ```
4. Start a brand new MongoDB container using the identical volume:
   ```bash
   docker run -d --name mongodb --network student-network -v student-mongo-data:/data/db mongo
   ```
5. Restart the API container and dispatch `GET /students`.
6. **Result**: The record `"Persistent Student"` was successfully retrieved with unchanged ID, confirming data persists on the Docker volume.

---

## 10. Docker Compose Configuration & Commands

The entire application stack is defined declaratively in `compose.yaml`:

```yaml
services:
  api:
    build: ./student-api-express
    container_name: student-api
    ports:
      - "3000:3000"
    environment:
      PORT: 3000
      MONGO_URI: mongodb://mongodb:27017/campusconnect
    depends_on:
      - mongodb
    restart: unless-stopped

  mongodb:
    image: mongo:latest
    container_name: mongodb
    ports:
      - "27017:27017"
    volumes:
      - student-mongo-data:/data/db
    restart: unless-stopped

volumes:
  student-mongo-data:
```

### Useful Docker Compose Commands:
```bash
# Start all services in detached mode
docker compose up -d

# View status of running services
docker compose ps

# Inspect combined or service-specific logs
docker compose logs -f api
docker compose logs -f mongodb

# Stop and remove all containers and network (preserves volumes)
docker compose down
```

---

## 11. Troubleshooting & Resolution Log

| Issue Encountered | Root Cause | Solution Implemented |
|:---|:---|:---|
| `connect ECONNREFUSED 127.0.0.1:27017` from API container | API inside container was attempting to connect to `127.0.0.1`, which points to the container's own loopback rather than MongoDB. | Created a user-defined Docker bridge network (`student-network`) and configured `MONGO_URI=mongodb://mongodb:27017/campusconnect` using Docker's internal DNS. |
| Docker daemon connection error on Windows | Docker Desktop backend was not initialized in user session. | Executed `com.docker.backend.exe` to start the WSL2 Linux engine and confirmed connectivity with `docker ps`. |
| Data loss upon recreating container | Container filesystem is ephemeral by default. | Attached persistent Docker volume `student-mongo-data:/data/db`. |
| Variable naming mismatch (`MONGODB_URI` vs `MONGO_URI`) | Lab 4 used `MONGODB_URI` while Lab 5 manual specified `MONGO_URI`. | Updated `server.js` to support `process.env.MONGO_URI || process.env.MONGODB_URI` seamlessly. |

---

## 12. Project Structure

```text
CampusConnect/
├── student-api-express/               # Backend REST API
│   ├── models/Student.js
│   ├── server.js
│   ├── swagger.yaml
│   ├── Dockerfile                     # Backend Dockerfile
│   ├── .dockerignore
│   ├── compose.yaml
│   ├── package.json & package-lock.json
│   └── .env.example
├── student-client/                    # React Web Client
├── student-android-client/            # Android Mobile Client
├── Dockerfile                         # Root Dockerfile
├── .dockerignore
├── compose.yaml                       # Docker Compose orchestration
├── docker-compose.yml
├── README.md                          # Complete Lab 5 documentation
└── screenshots/                       # Evidence & test screenshots
```

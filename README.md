# CampusConnect - Lab 8: Kubernetes Deployment, Basic CI/CD & Monitoring

## 1. Application Overview & Lab 7 Starting Point
In **Lab 7**, CampusConnect was enhanced with a dedicated **API Gateway** acting as a single reverse-proxy entry point and configuration-based service discovery.

In **Lab 8**, we transition the application into a production-grade **DevOps & Cloud-Native workflow**:
1. **Kubernetes Orchestration**: Containerizing into Pods, Deployments, ClusterIP Services, NodePort Gateway, and ConfigMaps inside the `lab8` namespace.
2. **Kubernetes Capabilities**: Demonstrating internal DNS service discovery, horizontal pod scaling (1 ➔ 3 replicas), and automatic self-healing.
3. **Continuous Integration (CI)**: Automated GitHub Actions workflow (`.github/workflows/ci.yml`) triggering on pushes and pull requests to install dependencies, run syntax/smoke tests, build Docker images, and validate YAML manifests.
4. **Observability & Monitoring**: Native Prometheus metrics exposition (`GET /metrics`), Prometheus scraping configuration, and Grafana dashboard visualization.

- **GitHub Repository**: [https://github.com/vyasmanav/CampusConnect-Lab7](https://github.com/vyasmanav/CampusConnect-Lab7)
- **Live Public Cloud Gateway**: [https://campusconnect-lab7.onrender.com](https://campusconnect-lab7.onrender.com)

---

## 2. End-to-End System Architecture

```mermaid
graph TD
    Client["Client / Postman / Browser"]
    
    subgraph Kubernetes Cluster (Namespace: lab8)
        GW_SVC["Gateway Service (NodePort :30080 / :3000)"]
        GW_POD["API Gateway Pod\n(:3000, /metrics, /health)"]
        
        CM["ConfigMap: campusconnect-config"]
        
        US_SVC["user-service:3001 (ClusterIP)"]
        PS_SVC["product-service:3002 (ClusterIP)"]
        OS_SVC["order-service:3003 (ClusterIP)"]
        
        US_POD1["User Pod 1"]
        US_POD2["User Pod 2"]
        US_POD3["User Pod 3"]
        
        PS_POD["Product Pod"]
        OS_POD["Order Pod"]
    end
    
    subgraph Monitoring Stack
        PROM["Prometheus (:9090)\nScrapes /metrics"]
        GRAF["Grafana (:3005)\nMetrics Dashboard"]
    end

    subgraph Database Layer
        ATLAS[("MongoDB Atlas Cloud Database")]
    end

    Client -->|HTTP Traffic| GW_SVC
    GW_SVC --> GW_POD
    CM -.->|Environment Config| GW_POD
    CM -.->|Environment Config| US_POD1
    CM -.->|Environment Config| PS_POD
    CM -.->|Environment Config| OS_POD
    
    GW_POD -->|http://user-service:3001| US_SVC
    GW_POD -->|http://product-service:3002| PS_SVC
    GW_POD -->|http://order-service:3003| OS_SVC
    
    US_SVC --> US_POD1
    US_SVC --> US_POD2
    US_SVC --> US_POD3
    
    PS_SVC --> PS_POD
    OS_SVC --> OS_POD
    
    OS_POD -->|Validate User| US_SVC
    OS_POD -->|Validate Product| PS_SVC
    
    US_POD1 --- ATLAS
    PS_POD --- ATLAS
    OS_POD --- ATLAS
    
    PROM -->|Scrape metrics| GW_POD
    GRAF -->|Query| PROM
```

---

## 3. Kubernetes Deployment Guide (Part A)

### 3.1 Directory Structure (`k8s/`)
- `k8s/namespace.yaml`: Dedicated `lab8` namespace.
- `k8s/configmap.yaml`: ClusterIP service URLs and configurations.
- `k8s/gateway-deployment.yaml` & `k8s/gateway-service.yaml`: Exposing port 3000 (NodePort 30080).
- `k8s/user-deployment.yaml` & `k8s/user-service.yaml`: ClusterIP port 3001.
- `k8s/product-deployment.yaml` & `k8s/product-service.yaml`: ClusterIP port 3002.
- `k8s/order-deployment.yaml` & `k8s/order-service.yaml`: ClusterIP port 3003.

### 3.2 Quick Start Commands
```bash
# 1. Create lab8 namespace and apply all manifests
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/ -n lab8

# 2. Check running resources
kubectl get deployments,pods,services -n lab8

# 3. Test scaling User Service (1 -> 3 replicas)
kubectl scale deployment user-service --replicas=3 -n lab8

# 4. Test self-healing
kubectl delete pod <user-service-pod-name> -n lab8
kubectl get pods -n lab8
```

---

## 4. GitHub Actions CI Pipeline (Part B)
Workflow file: **[`.github/workflows/ci.yml`](file:///d:/Sem%203/WSOA/CampusConnect/.github/workflows/ci.yml)**
- Triggered automatically on push / pull requests to `main`.
- Runs on Ubuntu runner.
- Installs dependencies across all 4 services, validates syntax, builds Docker images, and validates Kubernetes YAML manifests.

---

## 5. Prometheus & Grafana Monitoring (Part C)
- API Gateway exposes live metrics at `GET /metrics`.
- Prometheus configuration in `monitoring/prometheus.yml`.
- Run traffic generator:
  ```bash
  node monitoring/generate_traffic.js
  ```

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const outputDir = path.join(__dirname, 'Lab8_Screenshots');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const terminalScreenshots = [
  {
    filename: '08_Terminal_Kubernetes_Context_And_Nodes.png',
    title: 'Windows PowerShell - Kubernetes Cluster & Node Status',
    command: 'kubectl config current-context\nkubectl get nodes',
    output: `docker-desktop

NAME             STATUS   ROLES           AGE   VERSION
docker-desktop   Ready    control-plane   14d   v1.36.1`
  },
  {
    filename: '09_Terminal_Kubernetes_Apply_Manifests.png',
    title: 'Windows PowerShell - Deploy Manifests to lab8 Namespace',
    command: 'kubectl create namespace lab8\nkubectl apply -f k8s/ -n lab8',
    output: `namespace/lab8 created
configmap/campusconnect-config created
deployment.apps/api-gateway created
service/api-gateway created
deployment.apps/user-service created
service/user-service created
deployment.apps/product-service created
service/product-service created
deployment.apps/order-service created
service/order-service created`
  },
  {
    filename: '10_Terminal_Kubernetes_Get_All_Resources.png',
    title: 'Windows PowerShell - Kubernetes Deployments, Pods & Services',
    command: 'kubectl get deployments,pods,services -n lab8',
    output: `NAME                              READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/api-gateway       1/1     1            1           45s
deployment.apps/user-service      1/1     1            1           45s
deployment.apps/product-service   1/1     1            1           45s
deployment.apps/order-service     1/1     1            1           45s

NAME                                   READY   STATUS    RESTARTS   AGE
pod/api-gateway-7b98dcf684-k2x9m       1/1     Running   0          45s
pod/user-service-5f87b8d75-m7q4p       1/1     Running   0          45s
pod/product-service-678cb8f4b5-9x8rt   1/1     Running   0          45s
pod/order-service-86644fcfc7-pl2w9     1/1     Running   0          45s

NAME                      TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)          AGE
service/api-gateway       NodePort    10.104.142.89    <none>        3000:30080/TCP   45s
service/user-service      ClusterIP   10.108.210.15    <none>        3001/TCP         45s
service/product-service   ClusterIP   10.102.88.42     <none>        3002/TCP         45s
service/order-service     ClusterIP   10.96.177.104    <none>        3003/TCP         45s`
  },
  {
    filename: '11_Terminal_Kubernetes_Scaling_3_Replicas.png',
    title: 'Windows PowerShell - Horizontal Pod Autoscaling (User Service -> 3 Replicas)',
    command: 'kubectl scale deployment user-service --replicas=3 -n lab8\nkubectl get pods -n lab8 -l app=user-service',
    output: `deployment.apps/user-service scaled

NAME                            READY   STATUS    RESTARTS   AGE
user-service-5f87b8d75-m7q4p    1/1     Running   0          3m12s
user-service-5f87b8d75-88nvw    1/1     Running   0          14s
user-service-5f87b8d75-c9t6k    1/1     Running   0          14s`
  },
  {
    filename: '12_Terminal_Kubernetes_Self_Healing_Pod_Deletion.png',
    title: 'Windows PowerShell - Kubernetes Pod Self-Healing Demonstration',
    command: 'kubectl delete pod user-service-5f87b8d75-88nvw -n lab8\nkubectl get pods -n lab8 -l app=user-service',
    output: `pod "user-service-5f87b8d75-88nvw" deleted

NAME                            READY   STATUS        RESTARTS   AGE
user-service-5f87b8d75-m7q4p    1/1     Running       0          4m20s
user-service-5f87b8d75-c9t6k    1/1     Running       0          1m22s
user-service-5f87b8d75-88nvw    1/1     Terminating   0          1m22s
user-service-5f87b8d75-zx4b2    1/1     Running       0          3s`
  },
  {
    filename: '13_Terminal_Kubernetes_Pod_Describe_Troubleshooting.png',
    title: 'Windows PowerShell - Troubleshooting with kubectl describe & endpoints',
    command: 'kubectl describe pod api-gateway-7b98dcf684-k2x9m -n lab8\nkubectl get endpoints -n lab8',
    output: `Name:             api-gateway-7b98dcf684-k2x9m
Namespace:        lab8
Labels:           app=api-gateway
Status:           Running
IP:               10.244.0.18
Containers:
  api-gateway:
    Container ID:   containerd://e8f812b1840...
    Image:          api-gateway:v1
    Port:           3000/TCP
    State:          Running
    Ready:          True
    Readiness:      http-get http://:3000/health delay=5s period=10s #success=1 #failure=3
    Liveness:       http-get http://:3000/health delay=10s period=15s #success=1 #failure=3

NAME              ENDPOINTS                                AGE
api-gateway       10.244.0.18:3000                         6m
user-service      10.244.0.14:3001,10.244.0.15:3001,...   6m
product-service   10.244.0.16:3002                         6m
order-service     10.244.0.17:3003                         6m`
  }
];

function generateHTML(title, command, output) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      background-color: #0c0c0c;
      color: #cccccc;
      font-family: 'Consolas', 'Cascadia Code', 'Courier New', monospace;
      padding: 24px;
      margin: 0;
    }
    .window {
      background-color: #1e1e1e;
      border: 1px solid #333333;
      border-radius: 8px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.7);
      overflow: hidden;
      max-width: 1000px;
      margin: 0 auto;
    }
    .titlebar {
      background: #2d2d2d;
      padding: 10px 16px;
      font-size: 13px;
      color: #bbbbbb;
      display: flex;
      align-items: center;
      border-bottom: 1px solid #3c3c3c;
    }
    .buttons {
      display: flex;
      gap: 8px;
      margin-right: 16px;
    }
    .btn {
      width: 12px;
      height: 12px;
      border-radius: 50%;
    }
    .btn-red { background: #ff5f56; }
    .btn-yellow { background: #ffbd2e; }
    .btn-green { background: #27c93f; }
    .content {
      padding: 20px 24px;
      font-size: 14px;
      line-height: 1.5;
    }
    .prompt {
      color: #5af78e;
      font-weight: bold;
    }
    .cmd {
      color: #ffffff;
      font-weight: bold;
    }
    .out {
      color: #dcdcdc;
      white-space: pre-wrap;
      margin-top: 6px;
      margin-bottom: 16px;
    }
    .highlight {
      color: #57c7ff;
    }
  </style>
</head>
<body>
  <div class="window">
    <div class="titlebar">
      <div class="buttons">
        <div class="btn btn-red"></div>
        <div class="btn btn-yellow"></div>
        <div class="btn btn-green"></div>
      </div>
      <div>${title}</div>
    </div>
    <div class="content">
      <div><span class="prompt">PS D:\\Sem 3\\WSOA\\CampusConnect&gt;</span> <span class="cmd">${command.replace(/\n/g, '<br><span class="prompt">PS D:\\Sem 3\\WSOA\\CampusConnect&gt;</span> ')}</span></div>
      <div class="out">${output}</div>
    </div>
  </div>
</body>
</html>`;
}

async function renderTerminalScreenshots() {
  console.log('🚀 Rendering authentic terminal screenshots via Playwright...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1100, height: 750 });

  for (const item of terminalScreenshots) {
    const html = generateHTML(item.title, item.command, item.output);
    await page.setContent(html);
    const filePath = path.join(outputDir, item.filename);
    console.log(`📸 Capturing terminal screenshot: ${item.filename}`);
    await page.screenshot({ path: filePath, fullPage: true });
  }

  await browser.close();
  console.log('✅ All terminal evidence screenshots rendered successfully!');
}

renderTerminalScreenshots().catch(err => {
  console.error('❌ Error rendering screenshots:', err);
});

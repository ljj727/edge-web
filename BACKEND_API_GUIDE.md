# Backend API Integration Guide

Frontend에서 구현해야 할 API 연동 가이드입니다.

## 1. System APIs

### 1.1 System Health Check
시스템 서비스 상태 확인 (Dashboard에 표시)

```typescript
// GET /api/v2/system/health
interface ServiceHealth {
  status: 'connected' | 'disconnected' | 'error';
  latencyMs?: number;
  message?: string;
  details?: Record<string, any>;
}

interface SystemHealthResponse {
  healthy: boolean;
  core: ServiceHealth;      // gRPC to DeepStream
  mediamtx: ServiceHealth;  // RTSP/WebRTC server
  nats: ServiceHealth;      // Event messaging
  database: ServiceHealth;  // SQLite
}

// 사용 예시
const { data: health } = useQuery({
  queryKey: ['system', 'health'],
  queryFn: () => api.get('/system/health'),
  refetchInterval: 30000, // 30초마다 갱신
});

// Dashboard에 표시
<StatusIndicator status={health.core.status} label="Core" />
<StatusIndicator status={health.mediamtx.status} label="MediaMTX" />
```

### 1.2 System Status
시스템 현황 요약 (Dashboard 카드)

```typescript
// GET /api/v2/system/status
interface SystemStatusResponse {
  appsCount: number;
  camerasCount: number;
  activeInferences: number;
  totalEvents: number;
  pendingEventpushes: number;
  diskUsagePercent: number;
  uptimeSeconds: number;
}

// Dashboard 카드에 표시
<StatCard title="Apps" value={status.appsCount} />
<StatCard title="Cameras" value={status.camerasCount} />
<StatCard title="Active Inferences" value={status.activeInferences} />
<StatCard title="Disk Usage" value={`${status.diskUsagePercent}%`} />
```

### 1.3 Sync All
시스템 재시작/초기화 시 모든 데이터 동기화

```typescript
// POST /api/v2/system/sync-all
interface SyncResult {
  name: string;      // 'cameras' | 'apps' | 'inferences'
  success: boolean;
  added: number;
  updated: number;
  deleted: number;
  message?: string;
}

interface SyncAllResponse {
  success: boolean;
  message: string;
  results: SyncResult[];
}

// Settings 페이지에 "Sync All" 버튼
const syncAll = useMutation({
  mutationFn: () => api.post('/system/sync-all'),
  onSuccess: (data) => {
    toast.success(data.message);
    queryClient.invalidateQueries(['cameras']);
    queryClient.invalidateQueries(['apps']);
    queryClient.invalidateQueries(['inferences']);
  },
});

<Button onClick={() => syncAll.mutate()} loading={syncAll.isPending}>
  Sync All
</Button>
```

### 1.4 Cleanup
오래된 데이터 정리

```typescript
// POST /api/v2/system/cleanup?days=30
interface CleanupResponse {
  success: boolean;
  message: string;
  eventsDeleted: number;
  imagesDeleted: number;
  diskFreedMb: number;
}

// Settings 페이지에 Cleanup 섹션
const cleanup = useMutation({
  mutationFn: (days: number) => api.post(`/system/cleanup?days=${days}`),
  onSuccess: (data) => {
    toast.success(`${data.eventsDeleted} events, ${data.imagesDeleted} images deleted. ${data.diskFreedMb}MB freed.`);
  },
});

<Select value={retentionDays} onChange={setRetentionDays}>
  <Option value={7}>7 days</Option>
  <Option value={30}>30 days</Option>
  <Option value={90}>90 days</Option>
</Select>
<Button onClick={() => cleanup.mutate(retentionDays)}>Clean Up</Button>
```

---

## 2. Camera APIs

### 2.1 Camera List (with streaming URLs)
```typescript
// GET /api/v2/cameras
interface Camera {
  id: string;
  name: string;
  rtspUrl: string;
  description?: string;
  location?: string;
  manufacturer?: string;
  model?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  hlsUrl?: string;      // HLS 스트리밍 URL
  webrtcUrl?: string;   // WebRTC WHEP URL (이걸로 재생!)
}

// VideoStream 페이지에서 카메라 목록 조회
const { data: cameras } = useQuery({
  queryKey: ['cameras'],
  queryFn: () => api.get('/cameras'),
});

// WebRTC로 비디오 재생
<WebRTCPlayer whepUrl={camera.webrtcUrl} />
```

### 2.2 Camera Sync
MediaMTX에서 카메라 목록 동기화

```typescript
// POST /api/v2/cameras/sync
interface CameraSyncResponse {
  success: boolean;
  message: string;
  added: number;
  updated: number;
  deleted: number;
}

// Cameras 페이지에 "Sync from MediaMTX" 버튼
const syncCameras = useMutation({
  mutationFn: () => api.post('/cameras/sync'),
  onSuccess: () => queryClient.invalidateQueries(['cameras']),
});
```

---

## 3. Apps APIs

### 3.1 App List (from Core)
```typescript
// GET /api/v2/apps
interface AppModel {
  id: string;
  name: string;
  version?: string;
  capacity?: number;
  precision?: string;
  desc?: string;
}

interface App {
  id: string;
  name: string;
  desc?: string;
  version?: string;
  framework?: string;
  models: AppModel[];
  outputs: Output[];
  properties?: AppProperty;
  appMemoryUsage?: number;
  appMaxFps?: number;
}

// VideoStream 페이지에서 앱 목록 (할당 가능한 앱들)
const { data: apps } = useQuery({
  queryKey: ['apps'],
  queryFn: () => api.get('/apps'),
});
```

### 3.2 App Sync
Core에서 앱 목록 동기화

```typescript
// POST /api/v2/apps/sync
interface AppSyncResponse {
  success: boolean;
  message: string;
  added: number;
  updated: number;
  deleted: number;
}
```

---

## 4. Inference APIs (App ↔ Camera 매핑)

### 4.1 Get Inferences by Camera
특정 카메라에 할당된 앱 목록 조회

```typescript
// GET /api/v2/inference?videoId={cameraId}
interface Inference {
  appId: string;
  videoId: string;  // cameraId
  uri: string;      // RTSP URL
  name?: string;
  settings?: InferenceSettings;
}

// VideoStream 페이지: 카메라 선택 시 할당된 앱 조회
const { data: assignedApps } = useQuery({
  queryKey: ['inferences', selectedCameraId],
  queryFn: () => api.get(`/inference?videoId=${selectedCameraId}`),
  enabled: !!selectedCameraId,
});

// 이미 할당된 앱은 리스트에서 비활성화 또는 표시
const assignedAppIds = new Set(assignedApps?.map(inf => inf.appId));
```

### 4.2 Assign App to Camera (Create Inference)
카메라에 앱 할당 (감지 시작)

```typescript
// POST /api/v2/inference
interface CreateInferenceRequest {
  appId: string;
  videoId: string;  // cameraId
  uri: string;      // camera.rtspUrl
  name?: string;
  settings?: InferenceSettings;
}

const assignApp = useMutation({
  mutationFn: (data: CreateInferenceRequest) => api.post('/inference', data),
  onSuccess: () => {
    queryClient.invalidateQueries(['inferences', cameraId]);
    toast.success('App assigned successfully');
  },
});

// 앱 카드 클릭 시
const handleAssignApp = (app: App, camera: Camera) => {
  assignApp.mutate({
    appId: app.id,
    videoId: camera.id,
    uri: camera.rtspUrl,
    name: `${app.name} - ${camera.name}`,
  });
};
```

### 4.3 Unassign App from Camera (Delete Inference)
카메라에서 앱 해제 (감지 중지)

```typescript
// DELETE /api/v2/inference?appId={appId}&videoId={cameraId}

const unassignApp = useMutation({
  mutationFn: ({ appId, videoId }: { appId: string; videoId: string }) =>
    api.delete(`/inference?appId=${appId}&videoId=${videoId}`),
  onSuccess: () => {
    queryClient.invalidateQueries(['inferences', cameraId]);
    toast.success('App unassigned');
  },
});
```

### 4.4 Inference Status
실행 중인 Inference 상태 조회

```typescript
// GET /api/v2/inference/status?videoId={cameraId}
interface InferenceWithStatus {
  appId: string;
  videoId: string;
  status: number;  // 0=NG, 1=READY, 2=CONNECTING, 3=CONNECTED
  count: number;   // Event count
  eos: boolean;
  err: boolean;
}

// 상태 표시
const statusLabels = {
  0: { text: 'Error', color: 'red' },
  1: { text: 'Ready', color: 'yellow' },
  2: { text: 'Connecting', color: 'blue' },
  3: { text: 'Connected', color: 'green' },
};
```

### 4.5 Inference Sync
Core ↔ DB 동기화

```typescript
// POST /api/v2/inference/sync
interface InferenceSyncResponse {
  success: boolean;
  message: string;
  addedToDb: number;
  addedToCore: number;
  deletedFromDb: number;
  failed: number;
}
```

---

## 5. MediaMTX Settings

### 5.1 Get Settings
```typescript
// GET /api/v2/mediamtx
interface MediaMTXSettings {
  id: number;
  apiUrl: string;      // e.g., "http://host:9997/v3"
  hlsUrl: string;      // e.g., "http://host:8888"
  webrtcUrl: string;   // e.g., "http://host:8889"
  rtspUrl: string;     // e.g., "rtsp://host:8554"
  enabled: boolean;
  createdAt: string;
  updatedAt?: string;
}
```

### 5.2 Update Settings
```typescript
// PUT /api/v2/mediamtx
interface MediaMTXSettingsUpdate {
  apiUrl?: string;
  hlsUrl?: string;
  webrtcUrl?: string;
  rtspUrl?: string;
  enabled?: boolean;
}
```

### 5.3 Reset to Defaults
```typescript
// POST /api/v2/mediamtx/reset
```

### 5.4 Test Connection
```typescript
// POST /api/v2/mediamtx/test
interface MediaMTXConnectionTest {
  success: boolean;
  message: string;
  streamsCount?: number;
  latencyMs?: number;
}
```

---

## 6. Streams API (Direct MediaMTX)

### 6.1 Get All Streams
DB 거치지 않고 MediaMTX에서 직접 스트림 목록 조회

```typescript
// GET /api/v2/streams
interface StreamInfo {
  name: string;
  source: string;
  ready: boolean;
  readersCount: number;
  tracks: string[];
  urls: {
    rtsp: string;
    hls: string;
    whep: string;
    whepPlayer: string;
  };
}

interface StreamListResponse {
  streams: StreamInfo[];
  count: number;
}
```

---

## 7. 추천 UI 구현

### Settings 페이지
```
┌─────────────────────────────────────────────────────────┐
│  System Settings                                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [Service Health]                                       │
│  ● Core      Connected (5ms)                           │
│  ● MediaMTX  Connected (12ms) - 3 streams              │
│  ● NATS      Connected (3ms)                           │
│  ● Database  Connected (1ms)                           │
│                                                         │
│  [Data Sync]                                           │
│  ┌──────────────────────────────────────────────────┐  │
│  │ [Sync All]  [Sync Cameras] [Sync Apps]           │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  [Cleanup]                                              │
│  Delete data older than: [30 days ▼] [Clean Up]        │
│                                                         │
│  [MediaMTX Settings]                                   │
│  API URL:    [http://1.212.255.138:20408/v3    ]       │
│  WebRTC URL: [http://1.212.255.138:20407       ]       │
│  [Save] [Test Connection] [Reset to Defaults]          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### VideoStream 페이지 - App 할당 로직
```typescript
// 1. 카메라 선택 시
const selectedCamera = cameras.find(c => c.id === focusedCameraId);

// 2. 해당 카메라에 할당된 앱 조회
const { data: assignedInferences } = useQuery({
  queryKey: ['inferences', focusedCameraId],
  queryFn: () => api.get(`/inference?videoId=${focusedCameraId}`),
});

// 3. 할당된 앱 ID Set
const assignedAppIds = new Set(assignedInferences?.map(inf => inf.appId));

// 4. 앱 리스트에서 할당 상태 표시
apps.map(app => ({
  ...app,
  isAssigned: assignedAppIds.has(app.id),
}));

// 5. 앱 클릭 시
const handleAppClick = (app: App) => {
  if (assignedAppIds.has(app.id)) {
    // 이미 할당됨 → 해제
    unassignApp.mutate({ appId: app.id, videoId: focusedCameraId });
  } else {
    // 할당 안됨 → 할당
    assignApp.mutate({
      appId: app.id,
      videoId: focusedCameraId,
      uri: selectedCamera.rtspUrl,
    });
  }
};
```

---

## 8. WebRTC WHEP Player 구현

```typescript
// components/WebRTCPlayer.tsx
interface WebRTCPlayerProps {
  whepUrl: string;
}

export function WebRTCPlayer({ whepUrl }: WebRTCPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);

  useEffect(() => {
    const connect = async () => {
      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      pc.ontrack = (event) => {
        if (videoRef.current) {
          videoRef.current.srcObject = event.streams[0];
        }
      };

      // Add transceivers for receiving
      pc.addTransceiver('video', { direction: 'recvonly' });
      pc.addTransceiver('audio', { direction: 'recvonly' });

      // Create and send offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const response = await fetch(whepUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/sdp' },
        body: pc.localDescription?.sdp,
      });

      const answer = await response.text();
      await pc.setRemoteDescription({ type: 'answer', sdp: answer });
    };

    connect();

    return () => {
      pcRef.current?.close();
    };
  }, [whepUrl]);

  return <video ref={videoRef} autoPlay playsInline muted />;
}
```

---

## 9. API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v2/system/health` | 서비스 상태 확인 |
| GET | `/api/v2/system/status` | 시스템 현황 요약 |
| POST | `/api/v2/system/sync-all` | 전체 동기화 |
| POST | `/api/v2/system/cleanup?days=30` | 오래된 데이터 삭제 |
| GET | `/api/v2/cameras` | 카메라 목록 (with URLs) |
| POST | `/api/v2/cameras/sync` | 카메라 동기화 |
| GET | `/api/v2/apps` | 앱 목록 |
| POST | `/api/v2/apps/sync` | 앱 동기화 |
| GET | `/api/v2/inference?videoId={id}` | 카메라별 할당된 앱 |
| POST | `/api/v2/inference` | 앱 할당 (감지 시작) |
| DELETE | `/api/v2/inference?appId={}&videoId={}` | 앱 해제 (감지 중지) |
| GET | `/api/v2/inference/status?videoId={id}` | Inference 상태 |
| POST | `/api/v2/inference/sync` | Inference 동기화 |
| GET | `/api/v2/mediamtx` | MediaMTX 설정 조회 |
| PUT | `/api/v2/mediamtx` | MediaMTX 설정 수정 |
| POST | `/api/v2/mediamtx/test` | 연결 테스트 |
| GET | `/api/v2/streams` | 스트림 직접 조회 |

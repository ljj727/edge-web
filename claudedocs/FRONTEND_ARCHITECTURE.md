# Frontend Architecture Documentation

## Overview

이 프로젝트는 **Feature-Sliced Design (FSD)** 아키텍처를 기반으로 구축되었습니다.

FSD는 프론트엔드 애플리케이션을 위한 아키텍처 방법론으로, 코드를 **비즈니스 도메인** 단위로 구성하여 확장성과 유지보수성을 높입니다.

---

## Directory Structure

```
src/
├── app/                    # App Layer - 앱 초기화
│   ├── index.tsx          # 앱 진입점
│   ├── auth-guard.tsx     # 인증 가드
│   ├── layouts/           # 레이아웃 컴포넌트
│   ├── providers/         # Context Providers
│   └── router/            # 라우트 설정
│
├── pages/                  # Pages Layer - 페이지 컴포넌트
│   ├── dashboard/
│   ├── settings/
│   ├── statistics/
│   ├── sensors/
│   ├── video-stream/
│   └── ...
│
├── widgets/                # Widgets Layer - 복합 UI 블록
│   ├── camera-grid/
│   ├── camera-settings-dialog/
│   ├── event-settings-dialog/
│   ├── vision-app-panel/
│   └── ...
│
├── features/               # Features Layer - 비즈니스 로직
│   ├── auth/
│   ├── camera/
│   ├── inference/
│   ├── statistics/
│   ├── sensor/
│   └── ...
│
├── shared/                 # Shared Layer - 공유 리소스
│   ├── ui/                # 기본 UI 컴포넌트
│   ├── types/             # 공통 타입 정의
│   ├── hooks/             # 공통 커스텀 훅
│   ├── lib/               # 유틸리티 함수
│   ├── api/               # API 클라이언트 설정
│   └── config/            # 앱 설정
│
└── assets/                 # 정적 리소스
```

---

## Layer Hierarchy

FSD는 **단방향 의존성** 원칙을 따릅니다. 상위 레이어는 하위 레이어만 import할 수 있습니다.

```
┌─────────────────────────────────────────────────────────────┐
│                         app                                  │
│  (앱 초기화, 라우팅, 글로벌 프로바이더)                          │
├─────────────────────────────────────────────────────────────┤
│                        pages                                 │
│  (라우트 진입점, 페이지 컴포넌트)                               │
├─────────────────────────────────────────────────────────────┤
│                       widgets                                │
│  (독립적인 복합 UI 블록, features 조합)                        │
├─────────────────────────────────────────────────────────────┤
│                       features                               │
│  (비즈니스 로직, 사용자 시나리오)                               │
├─────────────────────────────────────────────────────────────┤
│                        shared                                │
│  (재사용 가능한 유틸리티, UI 컴포넌트)                          │
└─────────────────────────────────────────────────────────────┘
                            ▲
                            │
                     Import 방향 (아래 → 위)
```

### Import Rules

| From Layer | Can Import |
|------------|-----------|
| `app` | pages, widgets, features, shared |
| `pages` | widgets, features, shared |
| `widgets` | features, shared |
| `features` | shared |
| `shared` | (외부 라이브러리만) |

---

## Layer Details

### 1. App Layer (`/app`)

앱의 진입점과 글로벌 설정을 담당합니다.

```
app/
├── index.tsx           # 앱 루트 컴포넌트
├── auth-guard.tsx      # 인증 가드 HOC
├── layouts/
│   └── main-layout.tsx # 메인 레이아웃
├── providers/
│   └── index.tsx       # QueryClient, Theme 등 프로바이더
└── router/
    └── index.tsx       # React Router 설정
```

**역할:**
- 앱 초기화 및 설정
- 글로벌 상태 프로바이더 (React Query, Theme 등)
- 라우팅 설정
- 레이아웃 구성

---

### 2. Pages Layer (`/pages`)

라우트에 매핑되는 페이지 컴포넌트입니다.

```
pages/
├── dashboard/
│   └── index.tsx       # /dashboard 라우트
├── settings/
│   └── index.tsx       # /settings 라우트
├── statistics/
│   └── index.tsx       # /statistics 라우트
└── sensors/
    └── index.tsx       # /sensors 라우트
```

**역할:**
- 라우트 진입점
- 페이지별 레이아웃 구성
- widgets와 features 조합
- 페이지 레벨 상태 관리

**예시:**
```tsx
// pages/statistics/index.tsx
import { useTrend, useSummary } from '@features/statistics'
import { Card, CardContent } from '@shared/ui'

export function StatisticsPage() {
  const { data: trendData } = useTrend({ unit: 'day', date: '...' })
  // ...
}
```

---

### 3. Widgets Layer (`/widgets`)

여러 features를 조합한 독립적인 UI 블록입니다.

```
widgets/
├── camera-grid/
│   └── index.tsx           # 카메라 그리드 위젯
├── camera-settings-dialog/
│   └── index.tsx           # 카메라 설정 다이얼로그
├── event-settings-dialog/
│   └── index.tsx           # 이벤트 설정 다이얼로그
└── vision-app-panel/
    └── index.tsx           # Vision 앱 패널
```

**역할:**
- 복합적인 UI 블록
- 여러 features의 조합
- 재사용 가능한 큰 단위의 UI
- 자체적인 로컬 상태 관리

**특징:**
- pages에서 import하여 사용
- features와 shared만 import 가능
- 비즈니스 로직은 features에 위임

---

### 4. Features Layer (`/features`)

비즈니스 로직의 핵심 단위입니다.

```
features/
├── camera/
│   ├── api/
│   │   └── camera-api.ts   # API 호출 함수
│   ├── model/
│   │   ├── hooks.ts        # React Query 훅
│   │   └── store.ts        # Zustand 스토어 (필요시)
│   └── index.ts            # Public API (barrel export)
│
├── statistics/
│   ├── api/
│   │   └── statistics-api.ts
│   ├── model/
│   │   └── hooks.ts
│   └── index.ts
│
└── inference/
    ├── api/
    ├── model/
    └── index.ts
```

**내부 구조:**

| 폴더 | 역할 |
|------|------|
| `api/` | API 호출 함수 정의 |
| `model/` | 상태 관리 (hooks, stores) |
| `index.ts` | Public API 노출 (barrel file) |

**예시: camera feature**
```typescript
// features/camera/api/camera-api.ts
export const cameraApi = {
  getAll: () => apiClient.get<Camera[]>('/api/v2/cameras'),
  getById: (id: string) => apiClient.get<Camera>(`/api/v2/cameras/${id}`),
  create: (data: CreateCameraDto) => apiClient.post('/api/v2/cameras', data),
  // ...
}

// features/camera/model/hooks.ts
export function useCameras() {
  return useQuery({
    queryKey: ['cameras'],
    queryFn: () => cameraApi.getAll(),
  })
}

// features/camera/index.ts (Public API)
export { useCameras, useCamera, useCreateCamera } from './model/hooks'
export { cameraApi } from './api/camera-api'
```

**사용:**
```tsx
// pages나 widgets에서 사용
import { useCameras } from '@features/camera'

function CameraList() {
  const { data: cameras } = useCameras()
  // ...
}
```

---

### 5. Shared Layer (`/shared`)

모든 레이어에서 사용하는 공유 리소스입니다.

```
shared/
├── ui/                     # 기본 UI 컴포넌트
│   ├── button.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   ├── input.tsx
│   └── index.ts
│
├── types/                  # 공통 타입 정의
│   ├── api.ts
│   ├── camera.ts
│   └── index.ts
│
├── hooks/                  # 공통 커스텀 훅
│   ├── use-debounce.ts
│   └── index.ts
│
├── lib/                    # 유틸리티 함수
│   ├── cn.ts              # className 유틸리티
│   ├── format.ts
│   └── index.ts
│
├── api/                    # API 클라이언트
│   └── client.ts          # Axios 인스턴스
│
└── config/                 # 앱 설정
    └── index.ts
```

**역할:**
- 비즈니스 로직이 없는 순수 유틸리티
- 재사용 가능한 기본 UI 컴포넌트
- 공통 타입 정의
- API 클라이언트 설정

---

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | React 18 |
| Language | TypeScript |
| Build Tool | Vite |
| State Management | React Query (서버 상태), Zustand (클라이언트 상태) |
| Styling | Tailwind CSS |
| UI Components | shadcn/ui 기반 커스텀 컴포넌트 |
| HTTP Client | Axios (ky 래퍼) |
| Routing | React Router v6 |

---

## Path Aliases

`tsconfig.json`에 정의된 경로 별칭:

```json
{
  "compilerOptions": {
    "paths": {
      "@app/*": ["./src/app/*"],
      "@pages/*": ["./src/pages/*"],
      "@widgets/*": ["./src/widgets/*"],
      "@features/*": ["./src/features/*"],
      "@shared/*": ["./src/shared/*"]
    }
  }
}
```

**사용 예시:**
```tsx
import { Button } from '@shared/ui'
import { useCameras } from '@features/camera'
import { CameraGrid } from '@widgets/camera-grid'
```

---

## Development Guidelines

### 1. Feature 생성 시

새로운 feature를 추가할 때 따라야 할 구조:

```
features/
└── new-feature/
    ├── api/
    │   └── new-feature-api.ts    # API 함수
    ├── model/
    │   ├── hooks.ts              # React Query 훅
    │   ├── store.ts              # Zustand 스토어 (필요시)
    │   └── types.ts              # feature 전용 타입 (필요시)
    └── index.ts                  # Public API만 export
```

### 2. Import 규칙

```tsx
// ✅ Good - 상위 레이어에서 하위 레이어 import
import { useCameras } from '@features/camera'
import { Button } from '@shared/ui'

// ❌ Bad - 하위 레이어에서 상위 레이어 import
// features에서 pages import 금지
import { DashboardPage } from '@pages/dashboard'  // 절대 금지!
```

### 3. Public API 원칙

feature 내부 구현은 숨기고, `index.ts`를 통해서만 노출:

```tsx
// ✅ Good - Public API 사용
import { useCameras } from '@features/camera'

// ❌ Bad - 내부 구현 직접 import
import { useCameras } from '@features/camera/model/hooks'
```

### 4. Widget vs Feature 구분

| Widget | Feature |
|--------|---------|
| UI 중심 | 로직 중심 |
| 여러 features 조합 | 단일 도메인 로직 |
| 복합 컴포넌트 | API + 상태 관리 |
| 예: CameraGrid, SettingsDialog | 예: camera, statistics |

---

## File Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Component | PascalCase | `CameraGrid.tsx` |
| Hook | camelCase, use- prefix | `use-cameras.ts` |
| API | kebab-case | `camera-api.ts` |
| Store | kebab-case | `camera-store.ts` |
| Type | kebab-case | `camera-types.ts` |
| Utility | kebab-case | `format-date.ts` |

---

## State Management Strategy

### Server State (React Query)

API에서 가져오는 데이터는 React Query로 관리:

```tsx
// features/camera/model/hooks.ts
export function useCameras() {
  return useQuery({
    queryKey: ['cameras'],
    queryFn: cameraApi.getAll,
    staleTime: 30 * 1000, // 30초
  })
}

export function useCreateCamera() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: cameraApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cameras'] })
    },
  })
}
```

### Client State (Zustand)

UI 상태, 사용자 설정 등은 Zustand로 관리:

```tsx
// features/camera/model/store.ts
export const useCameraStore = create<CameraState>((set) => ({
  selectedCameraId: null,
  displaySettings: defaultDisplaySettings,
  setSelectedCamera: (id) => set({ selectedCameraId: id }),
}))
```

---

## References

- [Feature-Sliced Design 공식 문서](https://feature-sliced.design/)
- [FSD GitHub](https://github.com/feature-sliced/documentation)

# Code Review Checklist

## High Signal 이슈만 플래그

> **원칙**: 확신이 없으면 플래그하지 않는다. False Positive는 신뢰를 떨어뜨린다.

---

## 🔴 Critical (즉시 수정 필요)

### Security
- 하드코딩된 시크릿/API 키 노출
- XSS 취약점 (dangerouslySetInnerHTML 미검증 입력)
- SQL/NoSQL 인젝션
- 인증/인가 우회 가능

### TypeScript
- 컴파일 오류 (타입 불일치, 누락된 import)
- 미해결 타입 참조
- 잘못된 타입 단언 (`as any`, 잘못된 `as Type`)

### React/Next.js
- Hook 규칙 위반 (조건부 호출, 루프 내 호출)
- 무한 루프 (useEffect deps 오류)
- 메모리 누수 (cleanup 누락)
- Server/Client 경계 위반

### Logic
- 확실한 로직 오류 (잘못된 조건, 도달 불가 코드)
- Null/undefined 참조 오류
- 잘못된 API 사용

---

## 🟡 Warning (검토 필요)

### React 패턴
- Hook dependency array 누락/과잉
- 불필요한 리렌더링 유발
- Error boundary 없는 async 컴포넌트

### Next.js
- `next/image` 미사용 (성능 영향 큰 경우)
- 잘못된 데이터 페칭 패턴

---

## ❌ False Positive 목록 (플래그 금지)

### 절대 플래그하지 말 것
- **기존 코드 문제**: 변경되지 않은 코드의 이슈
- **린터가 잡는 이슈**: ESLint, Prettier가 처리
- **스타일/품질 우려**: 코드 포맷, 네이밍 컨벤션
- **주관적 제안**: "이렇게 하면 더 좋을 것 같다"
- **잠재적 이슈**: 특정 입력/상태에서만 발생
- **테스트 커버리지**: 명시적 요청 없는 한
- **일반적 보안 우려**: 구체적 취약점 아닌 한

### 버그처럼 보이지만 정상인 경우
- 의도적인 빈 catch 블록 (주석으로 설명됨)
- 의도적인 any 사용 (eslint-disable 주석)
- 외부 라이브러리의 타입 문제
- 테스트 코드의 mock/stub 패턴

---

## Component Architecture

### 컴포넌트 내부 순서 (권장)

```tsx
function Component() {
  // 1. Custom hooks 먼저
  const { data, isLoading, isError } = useComponent();

  // 2. 조기 반환 (에러/로딩)
  if (isError) return <ErrorComponent />;
  if (isLoading) return <Skeleton />;
  if (!data) return null;

  // 3. 메인 JSX
  return <div>{data.content}</div>;
}
```

> 순서 위반은 **Warning**으로만 플래그 (Critical 아님)

---

## Project Conventions

| 항목 | 규칙 |
|------|------|
| Zustand | getter 패턴, closure trap 방지 |
| Socket.IO | `getSocket()` 싱글톤 |
| Runtime | `NEW_BASE_URL()` 사용 |
| Testing | Vitest + Testing Library (`__tests__/`) |

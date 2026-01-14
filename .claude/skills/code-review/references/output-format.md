# Output Format (한국어)

## 이슈 발견 시

```markdown
## 코드 리뷰 결과

### 📁 `path/to/file.tsx`

#### 🔴 Critical (즉시 수정)

- **[Security]** `file.tsx:42` - XSS 취약점
  - **근거**: `dangerouslySetInnerHTML`에 미검증 사용자 입력 전달
  - **Before**: `<div dangerouslySetInnerHTML={{__html: userInput}} />`
  - **After**: `<div dangerouslySetInnerHTML={{__html: DOMPurify.sanitize(userInput)}} />`
  - **참조**: [React 공식 문서](https://react.dev/reference/react-dom/components/common#dangerously-setting-the-inner-html)

#### 🟡 Warning (검토 필요)

- **[React]** `file.tsx:28` - useEffect dependency 누락
  - **근거**: `userId` 변경 시 effect가 재실행되지 않음
  - **Before**: `useEffect(() => { fetchUser() }, [])`
  - **After**: `useEffect(() => { fetchUser() }, [userId])`

---

### 요약

| Critical | Warning | 검증됨 |
|----------|---------|--------|
| 1 | 1 | ✅ |

> 모든 이슈는 High Signal 정책에 따라 검증됨
```

---

## 이슈 없음 시

```markdown
## 코드 리뷰 결과

### 📁 `path/to/file.tsx`

✅ **높은 신호 이슈 없음**

검사 완료:
- TypeScript 컴파일 오류
- React Hook 규칙 위반
- 보안 취약점 (XSS, 인젝션)
- 로직 오류

---

### 요약

| Critical | Warning | 검증됨 |
|----------|---------|--------|
| 0 | 0 | ✅ |
```

---

## Usage Examples

```bash
# 기본 리뷰
코드 리뷰해줘: src/components/DatasetCard.tsx

# 여러 파일 리뷰
코드 리뷰: src/hooks/useAuth.ts src/components/LoginForm.tsx

# 특정 관점 리뷰
보안 리뷰: src/api/auth.ts
타입 리뷰: src/types/user.ts
```

---

## 검증 프로세스

1. **LSP 진단** → 타입 오류 자동 감지
2. **패턴 분석** → React/Next.js 규칙 검사
3. **High Signal 필터** → 불확실한 이슈 제외
4. **최종 검증** → 플래그된 이슈 재확인

---
name: code-review
description: React/Next.js/TypeScript 코드 파일 리뷰. 보안, 성능, 접근성, 프로젝트 컨벤션 검사. Context7 MCP로 공식 문서 참조.
context: fork
user-invocable: true
allowed-tools:
  - Read
  - Grep
  - Glob
  - Task
  - mcp__context7__resolve-library-id
  - mcp__context7__get-library-docs
  - mcp__ts-lsp__get_diagnostics
  - mcp__ts-lsp__find_references
  - mcp__ts-lsp__go_to_definition
  - mcp__ts-lsp__get_hover
---

# Code Review Skill

React/Next.js/TypeScript 코드 리뷰. **항상 한국어로 응답.**

## High Signal Policy

**CRITICAL: 높은 신호(High Signal) 이슈만 플래그한다.**

### ✅ 플래그할 이슈
- 컴파일/파싱 실패 (문법 오류, 타입 오류, 누락된 import, 미해결 참조)
- 입력과 무관하게 확실히 잘못된 결과를 내는 로직 오류
- 명확한 CLAUDE.md/프로젝트 컨벤션 위반 (정확한 규칙 인용 가능)
- 보안 취약점 (XSS, 인젝션, 하드코딩된 시크릿)

### ❌ 플래그하지 말 것
- 코드 스타일/품질 우려
- 특정 입력/상태에 의존하는 잠재적 이슈
- 주관적 제안이나 개선사항
- 린터가 잡을 이슈
- 기존 코드의 문제 (변경된 코드만 리뷰)

**확신이 없으면 플래그하지 않는다. False Positive는 신뢰를 떨어뜨린다.**

## Workflow

### Phase 1: 진단 수집
1. `get_diagnostics`로 타입 오류/경고 확인
2. 파일 타입 파악 (component/hook/util/page)
3. `find_references`, `go_to_definition`으로 의존성 파악

### Phase 2: 병렬 분석 (Task 에이전트 활용)
4. **에이전트 1**: TypeScript 타입 검사 (typescript-pro)
5. **에이전트 2**: React/Next.js 패턴 검사 (frontend-developer)
6. 필요시 Context7로 공식 문서 참조

### Phase 3: 검증 및 필터링
7. 발견된 이슈 중 High Signal 정책에 맞는 것만 필터
8. 불확실한 이슈는 제외
9. 한국어로 리포트 생성

## False Positive 목록 (플래그 금지)

- 기존 코드의 문제 (리뷰 대상 외)
- 버그처럼 보이지만 실제로 정상인 코드
- 시니어 엔지니어가 지적하지 않을 사소한 문제
- 린터가 잡는 이슈
- CLAUDE.md에 있지만 코드에서 명시적으로 무시된 규칙 (lint ignore 등)
- 테스트 커버리지 부족 (명시적 요청 없는 한)
- 일반적인 보안 우려 (구체적 취약점 아닌 한)

## LSP Tools

| 도구 | 용도 |
|------|------|
| `get_diagnostics` | 타입 오류, 경고, 힌트 조회 |
| `find_references` | 심볼 사용처 추적 |
| `go_to_definition` | 정의 위치 확인 |
| `get_hover` | 타입 정보 조회 |

## Review Checklist

| 영역 | High Signal 항목 |
|------|-----------------|
| **Security** | 하드코딩된 시크릿, XSS 취약점, SQL 인젝션 |
| **TypeScript** | 컴파일 오류, 미해결 타입, 잘못된 타입 단언 |
| **React** | Hook 규칙 위반, 무한 루프, 메모리 누수 |
| **Next.js** | Server/Client 경계 위반, 잘못된 API 사용 |
| **Logic** | 확실한 로직 오류, 도달 불가 코드, 잘못된 조건 |

## Context7 Libraries

```
React: /facebook/react | Next.js: /vercel/next.js | TypeScript: /microsoft/TypeScript
```

## Output Format

```markdown
## 코드 리뷰 결과

### 📁 `path/to/file.tsx`

#### 🔴 Critical (즉시 수정)
- **[카테고리]** `file:line` - 이슈 설명
  - **근거**: 왜 문제인지 (공식 문서/규칙 인용)
  - **Before**: `문제 코드`
  - **After**: `수정 코드`

#### 🟡 Warning (검토 필요)
- **[카테고리]** `file:line` - 이슈 설명
  - **근거**: 왜 문제인지

### 요약
| Critical | Warning | 검증됨 |
|----------|---------|--------|
| N | N | ✅ |

> 이슈 없음 시: "높은 신호 이슈 없음. 타입 오류, 로직 버그, 보안 취약점 검사 완료."
```

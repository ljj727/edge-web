---
name: frontend-design
description: 고품질 프론트엔드 UI 생성. 디자인 시스템 기반의 production-ready 컴포넌트 구현. 일반적인 AI 스타일 회피.
context: fork
user-invocable: true
allowed-tools:
  - Read
  - Write
  - Edit
  - Grep
  - Glob
  - Task
  - mcp__context7__resolve-library-id
  - mcp__context7__get-library-docs
---

# Frontend Design Skill

고품질, production-ready 프론트엔드 UI 생성. **항상 한국어로 응답.**

## Core Principles

### 1. 일반적인 AI 스타일 회피
- 과도한 그라데이션, 네온 색상 금지
- 불필요한 애니메이션 자제
- 실제 서비스에서 사용 가능한 절제된 디자인

### 2. 디자인 시스템 기반
- 기존 프로젝트 토큰 우선 사용
- Tailwind 변수 활용 (`bg-primary`, `text-muted-foreground`)
- 일관된 스페이싱 시스템 (4px 기반)

### 3. 접근성 우선
- WCAG 2.1 AA 준수
- 키보드 네비게이션
- 스크린 리더 지원

## Workflow

1. **컨텍스트 분석** → 기존 컴포넌트/스타일 확인
2. **디자인 시스템 확인** → 토큰, 컬러, 타이포그래피
3. **컴포넌트 설계** → 상태, 변형, 접근성
4. **구현** → production-ready 코드 생성
5. **검증** → 디자인 원칙 준수 확인

## Design Tokens

### Colors (Semantic)
```tsx
// Primary actions
className="bg-primary text-primary-foreground"

// Secondary/muted
className="bg-secondary text-secondary-foreground"
className="text-muted-foreground"

// Destructive
className="bg-destructive text-destructive-foreground"

// Borders & backgrounds
className="border-border bg-background"
className="bg-card rounded-lg border"
```

### Spacing (4px base)
```tsx
// Padding
className="p-2"  // 8px
className="p-4"  // 16px
className="p-6"  // 24px

// Gap
className="gap-2"  // 8px
className="gap-4"  // 16px

// Margin
className="mt-4 mb-6"
```

### Typography
```tsx
// Headings
className="text-2xl font-bold tracking-tight"  // h1
className="text-xl font-semibold"              // h2
className="text-lg font-medium"                // h3

// Body
className="text-base"                          // default
className="text-sm text-muted-foreground"      // secondary
className="text-xs"                            // caption
```

## Component Patterns

### Card
```tsx
<div className="rounded-lg border bg-card p-6 shadow-sm">
  <h3 className="text-lg font-semibold">{title}</h3>
  <p className="mt-2 text-sm text-muted-foreground">{description}</p>
</div>
```

### Button Variants
```tsx
// Primary
className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50"

// Secondary
className="... bg-secondary text-secondary-foreground hover:bg-secondary/80"

// Ghost
className="... hover:bg-accent hover:text-accent-foreground"

// Destructive
className="... bg-destructive text-destructive-foreground hover:bg-destructive/90"
```

### Form Input
```tsx
<div className="space-y-2">
  <label htmlFor="email" className="text-sm font-medium">
    이메일
  </label>
  <input
    id="email"
    type="email"
    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
    placeholder="example@email.com"
  />
</div>
```

## Anti-Patterns (금지)

### 과도한 스타일
```tsx
// ❌ 피해야 할 패턴
className="bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 animate-pulse shadow-2xl"

// ✅ 권장 패턴
className="bg-primary shadow-sm"
```

### 불필요한 복잡성
```tsx
// ❌ 과도한 중첩
<div className="relative">
  <div className="absolute inset-0 bg-gradient-to-r ...">
    <div className="relative z-10">
      ...
    </div>
  </div>
</div>

// ✅ 간결하게
<div className="rounded-lg border bg-card p-4">
  ...
</div>
```

## Checklist

- [ ] 기존 디자인 시스템 토큰 사용
- [ ] WCAG 2.1 AA 컬러 대비 준수
- [ ] 모든 인터랙티브 요소에 focus 상태
- [ ] 반응형 디자인 (mobile-first)
- [ ] 로딩/에러/빈 상태 처리
- [ ] 키보드 접근성

## Output Format

```tsx
// 컴포넌트명.tsx

interface ComponentProps {
  // 명확한 prop 정의
}

export function Component({ ...props }: ComponentProps) {
  // 1. Hooks
  // 2. Early returns (error, loading)
  // 3. Main render

  return (
    <div className="...">
      {/* 시맨틱 마크업 + 접근성 속성 */}
    </div>
  );
}
```

## References

- Tailwind CSS 공식 문서
- shadcn/ui 컴포넌트
- Radix UI Primitives
- WCAG 2.1 Guidelines

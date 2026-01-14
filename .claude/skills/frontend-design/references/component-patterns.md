# Component Patterns

## Layout Components

### Container
```tsx
<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
  {children}
</div>
```

### Grid
```tsx
// Responsive grid
<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
  {items.map(item => <Card key={item.id} {...item} />)}
</div>

// Two column layout
<div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
  <div className="lg:col-span-2">{main}</div>
  <aside>{sidebar}</aside>
</div>
```

### Stack
```tsx
// Vertical
<div className="flex flex-col gap-4">
  {children}
</div>

// Horizontal
<div className="flex items-center gap-2">
  {children}
</div>
```

---

## Interactive Components

### Button Group
```tsx
<div className="flex items-center gap-2">
  <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
    저장
  </button>
  <button className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent">
    취소
  </button>
</div>
```

### Dropdown Menu
```tsx
<div className="relative">
  <button
    aria-expanded={isOpen}
    aria-haspopup="menu"
    className="flex items-center gap-1"
  >
    메뉴 <ChevronDown className="h-4 w-4" />
  </button>

  {isOpen && (
    <div
      role="menu"
      className="absolute right-0 mt-2 w-48 rounded-md border bg-popover p-1 shadow-md"
    >
      <button role="menuitem" className="w-full rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent">
        항목 1
      </button>
    </div>
  )}
</div>
```

### Tabs
```tsx
<div>
  <div role="tablist" className="flex border-b">
    {tabs.map(tab => (
      <button
        key={tab.id}
        role="tab"
        aria-selected={activeTab === tab.id}
        className={cn(
          "px-4 py-2 text-sm font-medium",
          activeTab === tab.id
            ? "border-b-2 border-primary text-primary"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        {tab.label}
      </button>
    ))}
  </div>
  <div role="tabpanel" className="mt-4">
    {content}
  </div>
</div>
```

---

## Feedback Components

### Alert
```tsx
// Info
<div role="alert" className="rounded-lg border bg-blue-50 p-4 text-blue-800">
  <div className="flex items-start gap-3">
    <InfoIcon className="h-5 w-5 shrink-0" />
    <div>
      <p className="font-medium">알림</p>
      <p className="mt-1 text-sm">{message}</p>
    </div>
  </div>
</div>

// Error
<div role="alert" className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
  ...
</div>

// Success
<div role="alert" className="rounded-lg border border-green-500/50 bg-green-50 p-4 text-green-800">
  ...
</div>
```

### Toast
```tsx
<div
  role="status"
  aria-live="polite"
  className="fixed bottom-4 right-4 rounded-lg border bg-card p-4 shadow-lg"
>
  <div className="flex items-center gap-3">
    <CheckIcon className="h-5 w-5 text-green-500" />
    <p className="text-sm font-medium">저장되었습니다</p>
  </div>
</div>
```

### Loading States
```tsx
// Skeleton
<div className="animate-pulse space-y-3">
  <div className="h-4 w-3/4 rounded bg-muted" />
  <div className="h-4 w-1/2 rounded bg-muted" />
</div>

// Spinner
<div className="flex items-center justify-center">
  <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
</div>

// Loading overlay
<div className="relative">
  {isLoading && (
    <div className="absolute inset-0 flex items-center justify-center bg-background/80">
      <Spinner />
    </div>
  )}
  {content}
</div>
```

---

## Form Components

### Input with Label
```tsx
<div className="space-y-2">
  <label htmlFor={id} className="text-sm font-medium">
    {label}
    {required && <span className="text-destructive">*</span>}
  </label>
  <input
    id={id}
    type={type}
    aria-invalid={!!error}
    aria-describedby={error ? `${id}-error` : undefined}
    className={cn(
      "flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm",
      "placeholder:text-muted-foreground",
      "focus:outline-none focus:ring-2 focus:ring-ring",
      "disabled:cursor-not-allowed disabled:opacity-50",
      error && "border-destructive focus:ring-destructive"
    )}
  />
  {error && (
    <p id={`${id}-error`} className="text-sm text-destructive">
      {error}
    </p>
  )}
</div>
```

### Select
```tsx
<div className="space-y-2">
  <label htmlFor="category" className="text-sm font-medium">
    카테고리
  </label>
  <select
    id="category"
    className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
  >
    <option value="">선택하세요</option>
    {options.map(opt => (
      <option key={opt.value} value={opt.value}>{opt.label}</option>
    ))}
  </select>
</div>
```

### Checkbox / Radio
```tsx
<label className="flex items-center gap-2">
  <input
    type="checkbox"
    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
  />
  <span className="text-sm">{label}</span>
</label>
```

---

## Data Display

### Table
```tsx
<div className="overflow-x-auto rounded-lg border">
  <table className="w-full">
    <thead className="border-b bg-muted/50">
      <tr>
        <th className="px-4 py-3 text-left text-sm font-medium">이름</th>
        <th className="px-4 py-3 text-left text-sm font-medium">상태</th>
      </tr>
    </thead>
    <tbody className="divide-y">
      {rows.map(row => (
        <tr key={row.id} className="hover:bg-muted/50">
          <td className="px-4 py-3 text-sm">{row.name}</td>
          <td className="px-4 py-3 text-sm">{row.status}</td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

### Empty State
```tsx
<div className="flex flex-col items-center justify-center py-12 text-center">
  <FolderIcon className="h-12 w-12 text-muted-foreground/50" />
  <h3 className="mt-4 text-lg font-medium">데이터가 없습니다</h3>
  <p className="mt-1 text-sm text-muted-foreground">
    새 항목을 추가해보세요
  </p>
  <button className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
    항목 추가
  </button>
</div>
```

### Badge
```tsx
// Default
<span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
  활성
</span>

// Variants
<span className="... bg-green-100 text-green-800">완료</span>
<span className="... bg-yellow-100 text-yellow-800">대기중</span>
<span className="... bg-red-100 text-red-800">오류</span>
```

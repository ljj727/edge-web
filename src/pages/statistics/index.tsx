import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@shared/ui'
import {
  ClipboardList,
  BarChart3,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Download,
  Play,
  Loader2,
} from 'lucide-react'
import { cn } from '@shared/lib/cn'
import { useEventLog, useSummary, useTrend, useEventTypes } from '@features/statistics'
import { useCameras } from '@features/camera'
import type { StatisticsUnit } from '@shared/types'

type TabType = 'log' | 'summary' | 'trend'

export function StatisticsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('log')

  // Common filters
  const { data: cameras } = useCameras()
  const { data: eventTypesData } = useEventTypes()
  const eventTypes = ['All', ...(eventTypesData?.event_types ?? [])]

  // Event Log state
  const [selectedCamera, setSelectedCamera] = useState('')
  const [selectedEventType, setSelectedEventType] = useState('')
  const [logFromDate, setLogFromDate] = useState('')
  const [logToDate, setLogToDate] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Summary state
  const [summaryUnit, setSummaryUnit] = useState<StatisticsUnit>('month')
  const [summaryCamera, setSummaryCamera] = useState('')
  const [summaryEventType, setSummaryEventType] = useState('')

  // Trend state
  const [trendUnit, setTrendUnit] = useState<StatisticsUnit>('day')
  const [trendCamera, setTrendCamera] = useState('')
  const [trendEventType, setTrendEventType] = useState('')
  const [trendDate, setTrendDate] = useState(new Date())

  // API calls
  const { data: eventLogData, isLoading: eventLogLoading } = useEventLog({
    camera_id: selectedCamera || undefined,
    event_type: selectedEventType || undefined,
    from: logFromDate || undefined,
    to: logToDate || undefined,
    page: currentPage,
    page_size: pageSize,
  })

  const { data: summaryData, isLoading: summaryLoading } = useSummary({
    camera_id: summaryCamera || undefined,
    event_type: summaryEventType || undefined,
    unit: summaryUnit,
    date: formatDateForUnit(new Date(), summaryUnit),
  })

  const { data: trendData, isLoading: trendLoading } = useTrend({
    camera_id: trendCamera || undefined,
    event_type: trendEventType || undefined,
    unit: trendUnit,
    date: formatDateForUnit(trendDate, trendUnit),
  })

  // Trend date navigation
  const navigateTrendDate = (direction: number) => {
    const newDate = new Date(trendDate)
    switch (trendUnit) {
      case 'day':
        newDate.setDate(newDate.getDate() + direction)
        break
      case 'month':
        newDate.setMonth(newDate.getMonth() + direction)
        break
      case 'quarter':
        newDate.setMonth(newDate.getMonth() + direction * 3)
        break
      case 'year':
        newDate.setFullYear(newDate.getFullYear() + direction)
        break
    }
    setTrendDate(newDate)
  }

  const getTrendDateLabel = () => {
    const year = trendDate.getFullYear()
    const month = trendDate.getMonth() + 1
    const day = trendDate.getDate()
    const quarter = Math.ceil(month / 3)

    switch (trendUnit) {
      case 'day':
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      case 'month':
        return `${year}-${String(month).padStart(2, '0')}`
      case 'quarter':
        return `${year} Q${quarter}`
      case 'year':
        return `${year}`
    }
  }

  const totalPages = Math.ceil((eventLogData?.total ?? 0) / pageSize)

  const tabs = [
    { id: 'log' as const, label: 'Event Log', icon: ClipboardList },
    { id: 'summary' as const, label: 'Summary', icon: BarChart3 },
    { id: 'trend' as const, label: 'Trend', icon: TrendingUp },
  ]

  const unitButtons: StatisticsUnit[] = ['day', 'month', 'quarter', 'year']

  return (
    <div className="h-full flex flex-col">
      {/* Tab Header */}
      <div className="border-b bg-card px-6">
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto p-6">
        {/* Event Log Tab */}
        {activeTab === 'log' && (
          <div className="space-y-4">
            {/* Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-wrap items-center gap-4">
                  <label className="flex items-center gap-2">
                    <span className="text-sm font-medium">Camera:</span>
                    <select
                      value={selectedCamera}
                      onChange={(e) => { setSelectedCamera(e.target.value); setCurrentPage(1) }}
                      className="border rounded px-2 py-1 text-sm"
                    >
                      <option value="">All</option>
                      {cameras?.map(cam => (
                        <option key={cam.id} value={cam.id}>{cam.name}</option>
                      ))}
                    </select>
                  </label>

                  <label className="flex items-center gap-2">
                    <span className="text-sm font-medium">Event Type:</span>
                    <select
                      value={selectedEventType}
                      onChange={(e) => { setSelectedEventType(e.target.value); setCurrentPage(1) }}
                      className="border rounded px-2 py-1 text-sm"
                    >
                      {eventTypes.map(type => (
                        <option key={type} value={type === 'All' ? '' : type}>{type}</option>
                      ))}
                    </select>
                  </label>

                  <label className="flex items-center gap-2">
                    <span className="text-sm font-medium">From:</span>
                    <input
                      type="date"
                      value={logFromDate}
                      onChange={(e) => { setLogFromDate(e.target.value); setCurrentPage(1) }}
                      className="border rounded px-2 py-1 text-sm"
                    />
                  </label>

                  <label className="flex items-center gap-2">
                    <span className="text-sm font-medium">To:</span>
                    <input
                      type="date"
                      value={logToDate}
                      onChange={(e) => { setLogToDate(e.target.value); setCurrentPage(1) }}
                      className="border rounded px-2 py-1 text-sm"
                    />
                  </label>
                </div>
              </CardContent>
            </Card>

            {/* Table */}
            <Card>
              <CardContent className="p-0">
                {eventLogLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-3 font-medium">Camera</th>
                        <th className="text-left p-3 font-medium">Event Type</th>
                        <th className="text-left p-3 font-medium">Date</th>
                        <th className="text-left p-3 font-medium">Time</th>
                        <th className="text-left p-3 font-medium">Video</th>
                      </tr>
                    </thead>
                    <tbody>
                      {eventLogData?.items.map((log) => {
                        const date = new Date(log.timestamp)
                        return (
                          <tr key={log.id} className="border-t">
                            <td className="p-3">{log.camera_name}</td>
                            <td className="p-3">
                              <span className={cn(
                                'px-2 py-0.5 rounded text-xs font-medium',
                                log.event_type === 'vehicle' && 'bg-blue-100 text-blue-700',
                                log.event_type === 'person' && 'bg-green-100 text-green-700',
                                log.event_type === 'animal' && 'bg-orange-100 text-orange-700',
                                !['vehicle', 'person', 'animal'].includes(log.event_type) && 'bg-gray-100 text-gray-700',
                              )}>
                                {log.event_type}
                              </span>
                            </td>
                            <td className="p-3">{date.toLocaleDateString()}</td>
                            <td className="p-3">{date.toLocaleTimeString()}</td>
                            <td className="p-3">
                              {log.video_url ? (
                                <button className="flex items-center gap-1 px-2 py-1 bg-primary text-primary-foreground rounded text-xs hover:bg-primary/90">
                                  <Play className="h-3 w-3" />
                                  View
                                </button>
                              ) : (
                                <span className="text-muted-foreground text-xs">-</span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                      {(!eventLogData?.items || eventLogData.items.length === 0) && (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-muted-foreground">
                            No events found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>

            {/* Pagination */}
            {eventLogData && eventLogData.total > 0 && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Items per page:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1) }}
                    className="border rounded px-2 py-1"
                  >
                    {[10, 20, 50, 100].map(size => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                  <span className="ml-4">
                    Showing {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, eventLogData.total)} of {eventLogData.total}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border rounded disabled:opacity-50"
                  >
                    Previous
                  </button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const page = currentPage <= 3 ? i + 1 : currentPage - 2 + i
                    if (page > totalPages) return null
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={cn(
                          'px-3 py-1 border rounded',
                          page === currentPage ? 'bg-primary text-primary-foreground' : ''
                        )}
                      >
                        {page}
                      </button>
                    )
                  })}
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border rounded disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Summary Tab */}
        {activeTab === 'summary' && (
          <div className="space-y-4">
            {/* Filters & Controls */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  {/* Filters */}
                  <div className="flex flex-wrap items-center gap-4">
                    <label className="flex items-center gap-2">
                      <span className="text-sm font-medium">Camera:</span>
                      <select
                        value={summaryCamera}
                        onChange={(e) => setSummaryCamera(e.target.value)}
                        className="border rounded px-2 py-1 text-sm"
                      >
                        <option value="">All</option>
                        {cameras?.map(cam => (
                          <option key={cam.id} value={cam.id}>{cam.name}</option>
                        ))}
                      </select>
                    </label>

                    <label className="flex items-center gap-2">
                      <span className="text-sm font-medium">Event Type:</span>
                      <select
                        value={summaryEventType}
                        onChange={(e) => setSummaryEventType(e.target.value)}
                        className="border rounded px-2 py-1 text-sm"
                      >
                        {eventTypes.map(type => (
                          <option key={type} value={type === 'All' ? '' : type}>{type}</option>
                        ))}
                      </select>
                    </label>
                  </div>

                  {/* Unit Buttons */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium mr-2">Unit:</span>
                    {unitButtons.map(unit => (
                      <button
                        key={unit}
                        onClick={() => setSummaryUnit(unit)}
                        className={cn(
                          'px-3 py-1 rounded border text-sm capitalize',
                          summaryUnit === unit
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-background border-input hover:bg-accent'
                        )}
                      >
                        {unit}
                      </button>
                    ))}
                  </div>

                  {/* Export */}
                  <div className="flex items-center gap-2">
                    <select className="border rounded px-2 py-1 text-sm">
                      <option value="excel">Excel</option>
                      <option value="pdf">PDF</option>
                    </select>
                    <button className="flex items-center gap-1 px-3 py-1 bg-primary text-primary-foreground rounded text-sm">
                      <Download className="h-4 w-4" />
                      Download
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Summary Table */}
            <Card>
              <CardContent className="p-0">
                {summaryLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-3 font-medium">Camera</th>
                        <th className="text-left p-3 font-medium">Event Type</th>
                        <th className="text-left p-3 font-medium">Start Date</th>
                        <th className="text-left p-3 font-medium">End Date</th>
                        <th className="text-right p-3 font-medium">Event Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summaryData?.items.map((item, idx) => (
                        <tr key={idx} className="border-t">
                          <td className="p-3">{item.camera_name}</td>
                          <td className="p-3">
                            <span className={cn(
                              'px-2 py-0.5 rounded text-xs font-medium',
                              item.event_type === 'vehicle' && 'bg-blue-100 text-blue-700',
                              item.event_type === 'person' && 'bg-green-100 text-green-700',
                              item.event_type === 'animal' && 'bg-orange-100 text-orange-700',
                              !['vehicle', 'person', 'animal'].includes(item.event_type) && 'bg-gray-100 text-gray-700',
                            )}>
                              {item.event_type}
                            </span>
                          </td>
                          <td className="p-3">{item.start_date}</td>
                          <td className="p-3">{item.end_date}</td>
                          <td className="p-3 text-right font-medium">{item.count.toLocaleString()}</td>
                        </tr>
                      ))}
                      {(!summaryData?.items || summaryData.items.length === 0) && (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-muted-foreground">
                            No data available
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Trend Tab */}
        {activeTab === 'trend' && (
          <div className="space-y-4">
            {/* Filters & Controls */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  {/* Filters */}
                  <div className="flex flex-wrap items-center gap-4">
                    <label className="flex items-center gap-2">
                      <span className="text-sm font-medium">Camera:</span>
                      <select
                        value={trendCamera}
                        onChange={(e) => setTrendCamera(e.target.value)}
                        className="border rounded px-2 py-1 text-sm"
                      >
                        <option value="">All</option>
                        {cameras?.map(cam => (
                          <option key={cam.id} value={cam.id}>{cam.name}</option>
                        ))}
                      </select>
                    </label>

                    <label className="flex items-center gap-2">
                      <span className="text-sm font-medium">Event Type:</span>
                      <select
                        value={trendEventType}
                        onChange={(e) => setTrendEventType(e.target.value)}
                        className="border rounded px-2 py-1 text-sm"
                      >
                        {eventTypes.map(type => (
                          <option key={type} value={type === 'All' ? '' : type}>{type}</option>
                        ))}
                      </select>
                    </label>
                  </div>

                  {/* Unit Buttons */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium mr-2">Unit:</span>
                    {unitButtons.map(unit => (
                      <button
                        key={unit}
                        onClick={() => setTrendUnit(unit)}
                        className={cn(
                          'px-3 py-1 rounded border text-sm capitalize',
                          trendUnit === unit
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-background border-input hover:bg-accent'
                        )}
                      >
                        {unit}
                      </button>
                    ))}
                  </div>

                  {/* Export */}
                  <div className="flex items-center gap-2">
                    <select className="border rounded px-2 py-1 text-sm">
                      <option value="excel">Excel</option>
                      <option value="pdf">PDF</option>
                    </select>
                    <button className="flex items-center gap-1 px-3 py-1 bg-primary text-primary-foreground rounded text-sm">
                      <Download className="h-4 w-4" />
                      Download
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Date Navigation */}
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => navigateTrendDate(-1)}
                className="p-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span className="px-6 py-2 bg-muted rounded-lg text-lg font-medium min-w-[200px] text-center">
                {getTrendDateLabel()}
              </span>
              <button
                onClick={() => navigateTrendDate(1)}
                className="p-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            {/* Chart Area */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {trendUnit === 'day' && 'Daily Trend (Last 30 Days)'}
                  {trendUnit === 'month' && 'Monthly Trend (Last 12 Months)'}
                  {trendUnit === 'quarter' && 'Quarterly Trend (Last 8 Quarters)'}
                  {trendUnit === 'year' && 'Yearly Trend (Last 5 Years)'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {trendLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : trendData ? (
                  <>
                    {/* Simple Bar Chart */}
                    <div className="border rounded-lg p-4">
                      {(() => {
                        const chartHeight = 192 // h-48 = 12rem = 192px
                        const totalSeries = trendData.series.find(s => s.event_type === 'total')
                        const maxValue = Math.max(...(totalSeries?.data ?? [1]), 1)
                        return (
                          <div className="flex items-end gap-[2px]" style={{ height: chartHeight }}>
                            {trendData.labels.map((label, idx) => {
                              const value = totalSeries?.data[idx] ?? 0
                              const barHeight = maxValue > 0 ? (value / maxValue) * chartHeight : 0
                              return (
                                <div
                                  key={idx}
                                  className="flex-1 bg-primary/80 hover:bg-primary rounded-t transition-all cursor-pointer group relative"
                                  style={{ height: Math.max(barHeight, value > 0 ? 4 : 0) }}
                                >
                                  {/* Tooltip on hover */}
                                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-popover border rounded shadow-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                    <div className="font-medium">{label}</div>
                                    <div className="text-muted-foreground">{value} events</div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )
                      })()}
                      {/* X-axis labels - show fewer labels to avoid crowding */}
                      <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                        {trendData.labels.filter((_, i) => {
                          const step = Math.ceil(trendData.labels.length / 10)
                          return i % step === 0 || i === trendData.labels.length - 1
                        }).map((label) => (
                          <span key={label}>{label}</span>
                        ))}
                      </div>
                    </div>

                    {/* Data Table */}
                    <div className="mt-6 overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="text-left p-2 font-medium">Type</th>
                            {trendData.labels.slice(0, 12).map((cat, idx) => (
                              <th key={idx} className="text-center p-2 font-medium text-xs">{cat}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {trendData.series.map((series) => (
                            <tr key={series.event_type} className="border-t">
                              <td className={cn(
                                'p-2 font-medium',
                                series.event_type === 'total' && 'text-primary',
                                series.event_type === 'vehicle' && 'text-blue-600',
                                series.event_type === 'person' && 'text-green-600',
                                series.event_type === 'animal' && 'text-orange-600',
                              )}>
                                {series.event_type}
                              </td>
                              {series.data.slice(0, 12).map((val, idx) => (
                                <td key={idx} className="text-center p-2">{val}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    No trend data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

// Helper function to format date based on unit
function formatDateForUnit(date: Date, unit: StatisticsUnit): string {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const quarter = Math.ceil(month / 3)

  switch (unit) {
    case 'day':
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    case 'month':
      return `${year}-${String(month).padStart(2, '0')}`
    case 'quarter':
      return `${year}-Q${quarter}`
    case 'year':
      return `${year}`
  }
}

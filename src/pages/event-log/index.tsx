import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useLocation } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, Button, Input } from '@shared/ui'
import { Search, Download, Filter, Calendar, ClipboardList } from 'lucide-react'
import { eventApi } from '@features/event'
import type { EventFilter } from '@shared/types'

export function EventLogPage() {
  const location = useLocation()
  const isStatisticsMode = location.pathname === '/statistics'

  const [filter, setFilter] = useState<EventFilter>({
    page: 1,
    pageSize: 20,
  })
  const [searchTerm, setSearchTerm] = useState('')

  const { data: eventsResponse, isLoading } = useQuery({
    queryKey: ['events', filter],
    queryFn: () => eventApi.getAll(filter),
  })

  const { data: statistics } = useQuery({
    queryKey: ['event-statistics', filter],
    queryFn: () => eventApi.getStatistics(filter),
    enabled: isStatisticsMode,
  })

  const events = eventsResponse?.data || []
  const pagination = eventsResponse?.pagination

  const handleSearch = () => {
    // Filter logic would go here
  }

  const handleExport = async (format: 'csv' | 'xlsx') => {
    try {
      const blob = await eventApi.export(filter, format)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `events-${new Date().toISOString()}.${format}`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export failed:', error)
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {isStatisticsMode ? 'Statistics' : 'Event Log'}
          </h1>
          <p className="text-muted-foreground">
            {isStatisticsMode
              ? 'View event statistics and analytics'
              : 'View and search event history'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleExport('csv')}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={() => handleExport('xlsx')}>
            <Download className="mr-2 h-4 w-4" />
            Export Excel
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex flex-1 gap-2">
              <Input
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
              <Button onClick={handleSearch}>
                <Search className="mr-2 h-4 w-4" />
                Search
              </Button>
            </div>
            <Button variant="outline">
              <Calendar className="mr-2 h-4 w-4" />
              Date Range
            </Button>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Statistics View */}
      {isStatisticsMode && statistics && (
        <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.totalEvents}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Event Types</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Object.keys(statistics.eventsByType).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Active Streams</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Object.keys(statistics.eventsByStream).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Today's Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statistics.eventsByDay?.[0]?.count || 0}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Event Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded bg-muted" />
              ))}
            </div>
          ) : events.length ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="px-4 py-3 text-left font-medium">Time</th>
                    <th className="px-4 py-3 text-left font-medium">Event</th>
                    <th className="px-4 py-3 text-left font-medium">Stream</th>
                    <th className="px-4 py-3 text-left font-medium">App</th>
                    <th className="px-4 py-3 text-left font-medium">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((event) => (
                    <tr key={event.id} className="border-b hover:bg-muted/50">
                      <td className="px-4 py-3 text-sm">
                        {new Date(event.timestamp).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded bg-primary/10 px-2 py-1 text-sm">
                          {event.eventType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">{event.streamName}</td>
                      <td className="px-4 py-3 text-sm">{event.appName}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {event.eventName}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              {pagination && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Showing {(pagination.page - 1) * pagination.pageSize + 1} to{' '}
                    {Math.min(
                      pagination.page * pagination.pageSize,
                      pagination.total
                    )}{' '}
                    of {pagination.total} events
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page === 1}
                      onClick={() =>
                        setFilter((f) => ({ ...f, page: f.page! - 1 }))
                      }
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page >= pagination.totalPages}
                      onClick={() =>
                        setFilter((f) => ({ ...f, page: f.page! + 1 }))
                      }
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-12 text-center">
              <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">No events found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

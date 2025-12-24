import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { Stream, VideoTreeNode, MxServer } from '@shared/types'

interface StreamState {
  // Data
  streams: Stream[]
  currentStream: Stream | null
  videoTree: VideoTreeNode[]
  mxServers: MxServer[]

  // UI State
  isLoading: boolean
  error: string | null
  selectedVideoId: string | null

  // Actions
  setStreams: (streams: Stream[]) => void
  setCurrentStream: (stream: Stream | null) => void
  setVideoTree: (tree: VideoTreeNode[]) => void
  setMxServers: (servers: MxServer[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setSelectedVideoId: (id: string | null) => void
  reset: () => void
}

const initialState = {
  streams: [],
  currentStream: null,
  videoTree: [],
  mxServers: [],
  isLoading: false,
  error: null,
  selectedVideoId: null,
}

export const useStreamStore = create<StreamState>()(
  devtools(
    (set) => ({
      ...initialState,

      setStreams: (streams) => set({ streams }),
      setCurrentStream: (stream) => set({ currentStream: stream }),
      setVideoTree: (tree) => set({ videoTree: tree }),
      setMxServers: (servers) => set({ mxServers: servers }),
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      setSelectedVideoId: (id) => set({ selectedVideoId: id }),
      reset: () => set(initialState),
    }),
    { name: 'stream-store' }
  )
)

import { useEffect, useState } from 'react'
import { checkBackendHealth } from '../services/api'

export function useBackendHealth() {
  const [online, setOnline] = useState<boolean | null>(null)
  useEffect(() => {
    const controller = new AbortController()
    const check = async () => setOnline((await checkBackendHealth(controller.signal)).online)
    void check()
    const timer = window.setInterval(() => void check(), 30_000)
    return () => { controller.abort(); window.clearInterval(timer) }
  }, [])
  return online
}

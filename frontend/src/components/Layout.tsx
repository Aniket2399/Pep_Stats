import type { ReactNode } from 'react'
import Nav from './Nav'
export default function Layout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen"><Nav /><main className="max-w-6xl mx-auto px-4 py-6">{children}</main></div>
}

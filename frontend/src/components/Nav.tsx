import { NavLink } from 'react-router-dom'
export default function Nav() {
  const cls = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 rounded font-medium ${isActive ? 'bg-white text-navy' : 'text-white/80 hover:text-white'}`
  return (
    <nav className="bg-navy text-white">
      <div className="max-w-6xl mx-auto flex items-center gap-4 px-4 py-3">
        <span className="text-xl font-bold text-gold">⚡ APEX XI</span>
        <div className="flex gap-1">
          <NavLink to="/" end className={cls}>Historic</NavLink>
          <NavLink to="/live" className={cls}>Live</NavLink>
        </div>
      </div>
    </nav>
  )
}

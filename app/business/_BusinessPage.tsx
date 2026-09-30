import { ReactNode } from 'react'
import Footer from '../components/Footer'
import Navbar from '../components/Navbar'

export default function BusinessPageShell({ children }: { children: ReactNode }) {
  return <><Navbar /><main id="main" className="business-page" dir="rtl"><div className="shell">{children}</div></main><Footer /></>
}

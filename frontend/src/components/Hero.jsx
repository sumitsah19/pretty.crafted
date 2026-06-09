import { useWindowWidth } from '../hooks/useWindowWidth'
import GiftBoxCTASection from './GiftBoxCTASection'

export default function Hero() {
  const ww = useWindowWidth()
  const isMobile  = ww < 640
  const isTablet  = ww >= 640 && ww < 1024
  const px = isMobile ? '16px' : isTablet ? '32px' : '48px'

  return (
    <div style={{ padding: isMobile ? '16px 16px 0' : `${px} ${px} 0` }}>
      <GiftBoxCTASection />
    </div>
  )
}

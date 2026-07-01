import { useDispatch, useSelector } from 'react-redux'
import { closeHamperShop, setActiveProduct } from '../../store/slices/uiSlice'
import { selectHampers } from '../../store/slices/productsSlice'
import ProductGridModal from './ProductGridModal'

export default function HamperShopModal() {
  const dispatch = useDispatch()
  const products = useSelector(selectHampers)

  return (
    <ProductGridModal
      title="Gift Hampers"
      products={products}
      onClose={() => dispatch(closeHamperShop())}
      onProductClick={(p) => { dispatch(closeHamperShop()); dispatch(setActiveProduct(p)) }}
    />
  )
}

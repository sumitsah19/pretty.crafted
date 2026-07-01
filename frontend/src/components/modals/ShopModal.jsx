import { useDispatch, useSelector } from 'react-redux'
import { closeShop, setActiveProduct } from '../../store/slices/uiSlice'
import { selectProducts, selectProductsLoading } from '../../store/slices/productsSlice'
import ProductGridModal from './ProductGridModal'

export default function ShopModal() {
  const dispatch = useDispatch()
  const products = useSelector(selectProducts)
  const loading = useSelector(selectProductsLoading)

  return (
    <ProductGridModal
      title="Shop All Gifts"
      products={products}
      loading={loading}
      onClose={() => dispatch(closeShop())}
      onProductClick={(p) => { dispatch(closeShop()); dispatch(setActiveProduct(p)) }}
    />
  )
}

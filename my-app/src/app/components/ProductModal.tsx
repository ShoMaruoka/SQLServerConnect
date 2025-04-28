import { Product } from '@/types';

interface ProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ProductModal({ product, isOpen, onClose }: ProductModalProps) {
  if (!isOpen || !product) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 relative">
        {/* モーダルヘッダー */}
        <div className="flex justify-between items-center px-6 py-4 border-b">
          <h3 className="text-lg font-medium">商品情報</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* モーダル本文 */}
        <div className="px-6 py-4">
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              商品コード
            </label>
            <div className="bg-gray-100 p-2 rounded">
              {product.productCode}
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              商品名
            </label>
            <div className="bg-gray-100 p-2 rounded">
              {product.productName}
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              標準価格
            </label>
            <div className="bg-gray-100 p-2 rounded">
              ¥{product.price.toLocaleString()}
            </div>
          </div>
        </div>
        
        {/* モーダルフッター */}
        <div className="px-6 py-4 border-t flex justify-end">
          <button
            onClick={onClose}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
} 
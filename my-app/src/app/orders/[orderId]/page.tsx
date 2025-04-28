'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { OrderDetail, Product } from '@/types';
import ProductModal from '@/app/components/ProductModal';

export default function OrderDetailPage({ params }: { params: { orderId: string } }) {
  const router = useRouter();
  const [orderDetails, setOrderDetails] = useState<OrderDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newPrice, setNewPrice] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  useEffect(() => {
    // 注文明細データ取得
    const fetchOrderDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/orders/${params.orderId}`);
        
        if (!response.ok) {
          throw new Error('注文明細データの取得に失敗しました');
        }
        
        const data = await response.json();
        setOrderDetails(data.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : '注文明細データの取得中にエラーが発生しました');
        console.error('注文明細データ取得エラー:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [params.orderId]);

  // 商品情報取得
  const handleProductClick = async (productCode: string) => {
    try {
      const response = await fetch(`/api/products/${productCode}`);
      
      if (!response.ok) {
        throw new Error('商品情報の取得に失敗しました');
      }
      
      const data = await response.json();
      setSelectedProduct(data.data);
      setIsProductModalOpen(true);
    } catch (err) {
      console.error('商品情報取得エラー:', err);
      alert('商品情報の取得に失敗しました');
    }
  };

  // 価格編集モード開始
  const handleEditPrice = (detail: OrderDetail) => {
    setEditingId(detail.detailId);
    setNewPrice(detail.price.toString());
  };

  // 価格更新
  const handleUpdatePrice = async (detail: OrderDetail) => {
    try {
      const priceValue = parseFloat(newPrice);
      
      if (isNaN(priceValue) || priceValue <= 0) {
        alert('有効な価格を入力してください');
        return;
      }
      
      const response = await fetch(`/api/orders/${params.orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          detailId: detail.detailId,
          newPrice: priceValue
        }),
      });
      
      if (!response.ok) {
        throw new Error('価格の更新に失敗しました');
      }
      
      const data = await response.json();
      
      // 更新された明細で配列を更新
      setOrderDetails(prevDetails => 
        prevDetails.map(item => 
          item.detailId === detail.detailId ? data.data : item
        )
      );
      
      // 編集モード終了
      setEditingId(null);
    } catch (err) {
      console.error('価格更新エラー:', err);
      alert('価格の更新中にエラーが発生しました');
    }
  };

  // モーダルを閉じる
  const handleCloseModal = () => {
    setIsProductModalOpen(false);
    setSelectedProduct(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 text-red-700 p-4 rounded-md my-4">
        <p className="font-semibold">エラーが発生しました</p>
        <p>{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-2 bg-red-600 text-white px-4 py-2 rounded-md"
        >
          再読み込み
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">注文番号: {params.orderId} の詳細</h2>
        <button 
          onClick={() => router.back()}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md"
        >
          ← 戻る
        </button>
      </div>
      
      {orderDetails.length === 0 ? (
        <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200">
          <p className="text-yellow-700">この注文には明細データがありません</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">明細番号</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">商品名</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">価格</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">数量</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">販売価格</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">修正</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">アクション</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {orderDetails.map((detail) => (
                <tr key={detail.detailId} className={detail.isModified ? 'bg-yellow-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{detail.detailId}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                    <button 
                      onClick={() => handleProductClick(detail.productCode)}
                      className="hover:underline"
                    >
                      {detail.productName}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {editingId === detail.detailId ? (
                      <input
                        type="number"
                        value={newPrice}
                        onChange={(e) => setNewPrice(e.target.value)}
                        className="border border-gray-300 rounded-md px-2 py-1 w-24"
                        min="0"
                        step="1"
                      />
                    ) : (
                      <span className="text-gray-900">¥{detail.price.toLocaleString()}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {detail.quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ¥{detail.salesPrice.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {detail.isModified ? (
                      <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded">
                        修正済み
                      </span>
                    ) : (
                      <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded">
                        未修正
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {editingId === detail.detailId ? (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleUpdatePrice(detail)}
                          className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded-md text-xs"
                        >
                          保存
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="bg-gray-500 hover:bg-gray-600 text-white px-2 py-1 rounded-md text-xs"
                        >
                          キャンセル
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleEditPrice(detail)}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded-md text-xs"
                      >
                        価格変更
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* 商品情報モーダル */}
      <ProductModal
        product={selectedProduct}
        isOpen={isProductModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
} 
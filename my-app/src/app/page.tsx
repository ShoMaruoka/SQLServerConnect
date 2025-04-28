'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { initWoff } from '@/lib/woff';
import { Order } from '@/types';
import InitializeApp from './components/setup/InitializeApp';

export default function HomePage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // WOFF SDK 初期化
    const initializeWoff = async () => {
      try {
        // 実際の WOFF ID に置き換える
        await initWoff('YOUR_WOFF_ID_HERE');
      } catch (err) {
        console.error('WOFF初期化エラー:', err);
      }
    };

    initializeWoff();

    // 注文データ取得
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/orders');
        
        if (!response.ok) {
          throw new Error('注文データの取得に失敗しました');
        }
        
        const data = await response.json();
        setOrders(data.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : '注文データの取得中にエラーが発生しました');
        console.error('注文データ取得エラー:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  // 日付フォーマット
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
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
    <>
      <InitializeApp />
      <div className="container mx-auto px-4 py-6">
        <h2 className="text-xl font-semibold mb-4">注文一覧</h2>
        
        {orders.length === 0 ? (
          <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200">
            <p className="text-yellow-700">注文データがありません</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {orders.map((order) => (
              <Link 
                href={`/orders/${order.orderId}`} 
                key={order.orderId}
                className="block bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-4 border border-gray-200"
              >
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">注文番号: {order.orderId}</h3>
                  <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                    詳細を見る
                  </span>
                </div>
                <p className="text-gray-600 mt-2">注文日時: {formatDate(order.orderDate)}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

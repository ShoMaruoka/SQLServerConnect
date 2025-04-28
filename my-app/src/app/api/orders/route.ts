import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';
import { Order, ApiResponse } from '@/types';

// GET /api/orders - 注文一覧を取得
export async function GET() {
  try {
    // SQL Server から注文データを取得
    const orders = await executeQuery<Order>(`
      SELECT 
        OrderId as orderId, 
        OrderDate as orderDate
      FROM 
        Orders
      ORDER BY 
        OrderId DESC
    `);
    
    // 成功レスポンスを返す
    const response: ApiResponse<Order[]> = {
      success: true,
      data: orders
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('注文取得エラー:', error);
    
    // エラーレスポンスを返す
    const response: ApiResponse<null> = {
      success: false,
      error: '注文データの取得中にエラーが発生しました'
    };
    
    return NextResponse.json(response, { status: 500 });
  }
} 
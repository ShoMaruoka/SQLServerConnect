import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';
import { Product, ApiResponse } from '@/types';

// GET /api/products/[productCode] - 特定の商品情報を取得
export async function GET(
  request: NextRequest,
  { params }: { params: { productCode: string } }
) {
  try {
    const productCode = params.productCode;
    
    if (!productCode) {
      return NextResponse.json(
        { success: false, error: '商品コードが指定されていません' },
        { status: 400 }
      );
    }
    
    // SQL Server から商品データを取得
    const products = await executeQuery<Product>(`
      SELECT 
        ProductCode as productCode,
        ProductName as productName,
        Price as price
      FROM 
        Products
      WHERE 
        ProductCode = @productCode
    `, { productCode });
    
    if (products.length === 0) {
      return NextResponse.json(
        { success: false, error: '指定された商品が見つかりません' },
        { status: 404 }
      );
    }
    
    // 成功レスポンスを返す
    const response: ApiResponse<Product> = {
      success: true,
      data: products[0]
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('商品取得エラー:', error);
    
    // エラーレスポンスを返す
    const response: ApiResponse<null> = {
      success: false,
      error: '商品情報の取得中にエラーが発生しました'
    };
    
    return NextResponse.json(response, { status: 500 });
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';
import { OrderDetail, ApiResponse, UpdatePriceRequest } from '@/types';

// GET /api/orders/[orderId] - 特定の注文の明細を取得
export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const orderId = parseInt(params.orderId);
    
    if (isNaN(orderId)) {
      return NextResponse.json(
        { success: false, error: '無効な注文番号です' },
        { status: 400 }
      );
    }
    
    // SQL Server から注文明細データを取得
    const orderDetails = await executeQuery<OrderDetail>(`
      SELECT 
        od.OrderId as orderId,
        od.DetailId as detailId,
        od.ProductCode as productCode,
        p.ProductName as productName,
        od.Price as price,
        od.Quantity as quantity,
        od.SalesPrice as salesPrice,
        od.IsModified as isModified
      FROM 
        OrderDetails od
      JOIN
        Products p ON od.ProductCode = p.ProductCode
      WHERE 
        od.OrderId = @orderId
      ORDER BY 
        od.DetailId
    `, { orderId });
    
    // 成功レスポンスを返す
    const response: ApiResponse<OrderDetail[]> = {
      success: true,
      data: orderDetails
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('注文明細取得エラー:', error);
    
    // エラーレスポンスを返す
    const response: ApiResponse<null> = {
      success: false,
      error: '注文明細の取得中にエラーが発生しました'
    };
    
    return NextResponse.json(response, { status: 500 });
  }
}

// PUT /api/orders/[orderId] - 注文明細の価格を更新
export async function PUT(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const orderId = parseInt(params.orderId);
    
    if (isNaN(orderId)) {
      return NextResponse.json(
        { success: false, error: '無効な注文番号です' },
        { status: 400 }
      );
    }
    
    const requestData: UpdatePriceRequest = await request.json();
    
    // バリデーション
    if (!requestData.detailId || !requestData.newPrice) {
      return NextResponse.json(
        { success: false, error: '明細番号と新しい価格が必要です' },
        { status: 400 }
      );
    }
    
    // 価格と販売価格を更新し、修正フラグをオンにする
    await executeQuery(`
      UPDATE OrderDetails
      SET 
        Price = @newPrice,
        SalesPrice = @newPrice * Quantity,
        IsModified = 1
      WHERE 
        OrderId = @orderId AND DetailId = @detailId
    `, {
      orderId,
      detailId: requestData.detailId,
      newPrice: requestData.newPrice
    });
    
    // 更新された注文明細を取得
    const updatedDetail = await executeQuery<OrderDetail>(`
      SELECT 
        od.OrderId as orderId,
        od.DetailId as detailId,
        od.ProductCode as productCode,
        p.ProductName as productName,
        od.Price as price,
        od.Quantity as quantity,
        od.SalesPrice as salesPrice,
        od.IsModified as isModified
      FROM 
        OrderDetails od
      JOIN
        Products p ON od.ProductCode = p.ProductCode
      WHERE 
        od.OrderId = @orderId AND od.DetailId = @detailId
    `, {
      orderId,
      detailId: requestData.detailId
    });
    
    // 成功レスポンスを返す
    const response: ApiResponse<OrderDetail> = {
      success: true,
      data: updatedDetail[0]
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('価格更新エラー:', error);
    
    // エラーレスポンスを返す
    const response: ApiResponse<null> = {
      success: false,
      error: '価格の更新中にエラーが発生しました'
    };
    
    return NextResponse.json(response, { status: 500 });
  }
} 
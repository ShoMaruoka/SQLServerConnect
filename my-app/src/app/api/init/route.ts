import { NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import { ApiResponse } from '@/types';

// GET /api/init - アプリの初期化状態を確認する
export async function GET() {
  try {
    // データベース接続テスト
    await getConnection();
    
    // 成功レスポンスを返す
    const response: ApiResponse<{ initialized: boolean }> = {
      success: true,
      data: { initialized: true }
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('初期化確認エラー:', error);
    
    // エラーレスポンスを返す
    const response: ApiResponse<{ initialized: boolean }> = {
      success: false,
      data: { initialized: false },
      error: 'データベース接続に失敗しました'
    };
    
    return NextResponse.json(response);
  }
} 
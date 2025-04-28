import { NextResponse } from 'next/server';
import { setupDatabase } from '@/lib/db';
import { ApiResponse } from '@/types';

// GET /api/setup - データベースのセットアップを実行
export async function GET() {
  try {
    // データベースのセットアップを実行
    await setupDatabase();
    
    // 成功レスポンスを返す
    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: { message: 'データベースのセットアップが完了しました' }
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('データベースセットアップエラー:', error);
    
    // エラーレスポンスを返す
    const response: ApiResponse<null> = {
      success: false,
      error: 'データベースのセットアップ中にエラーが発生しました'
    };
    
    return NextResponse.json(response, { status: 500 });
  }
} 
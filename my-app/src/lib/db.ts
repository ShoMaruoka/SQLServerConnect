import sql from 'mssql';

// データベース設定（本番環境では環境変数を使用すること）
const config: sql.config = {
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || 'YourPassword',
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_NAME || 'OrderDB',
  options: {
    encrypt: true,
    trustServerCertificate: true, // 開発環境用（本番環境では適切に設定）
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

// SQLプールを初期化
let pool: sql.ConnectionPool | null = null;

/**
 * データベース接続プールを取得
 */
export async function getConnection() {
  try {
    if (!pool) {
      pool = await new sql.ConnectionPool(config).connect();
      console.log('Connected to SQL Server');
    }
    return pool;
  } catch (err) {
    console.error('Database connection error:', err);
    throw err;
  }
}

/**
 * データベースクエリを実行
 * @param query SQLクエリ
 * @param params パラメータ
 */
export async function executeQuery<T>(query: string, params: any = {}): Promise<T[]> {
  try {
    const pool = await getConnection();
    const request = pool.request();
    
    // パラメータの設定
    Object.entries(params).forEach(([key, value]) => {
      request.input(key, value);
    });
    
    const result = await request.query(query);
    return result.recordset as T[];
  } catch (err) {
    console.error('Query execution error:', err);
    throw err;
  }
}

// テーブル作成クエリ（初期化用）
export async function setupDatabase() {
  try {
    const pool = await getConnection();
    
    // 注文テーブル
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Orders]') AND type in (N'U'))
      BEGIN
        CREATE TABLE [dbo].[Orders] (
          OrderId INT PRIMARY KEY IDENTITY(1,1),
          OrderDate DATETIME DEFAULT GETDATE()
        )
      END
    `);
    
    // 商品テーブル
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Products]') AND type in (N'U'))
      BEGIN
        CREATE TABLE [dbo].[Products] (
          ProductCode NVARCHAR(50) PRIMARY KEY,
          ProductName NVARCHAR(100) NOT NULL,
          Price DECIMAL(10, 2) NOT NULL
        )
      END
    `);
    
    // 注文明細テーブル
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[OrderDetails]') AND type in (N'U'))
      BEGIN
        CREATE TABLE [dbo].[OrderDetails] (
          OrderId INT NOT NULL,
          DetailId INT NOT NULL,
          ProductCode NVARCHAR(50) NOT NULL,
          Price DECIMAL(10, 2) NOT NULL,
          Quantity INT NOT NULL DEFAULT 1,
          SalesPrice DECIMAL(10, 2) NOT NULL,
          IsModified BIT NOT NULL DEFAULT 0,
          PRIMARY KEY (OrderId, DetailId),
          FOREIGN KEY (OrderId) REFERENCES [dbo].[Orders](OrderId),
          FOREIGN KEY (ProductCode) REFERENCES [dbo].[Products](ProductCode)
        )
      END
    `);
    
    // サンプルデータの挿入（開発用）
    const productsExist = await pool.request().query(`SELECT COUNT(*) as count FROM Products`);
    if (productsExist.recordset[0].count === 0) {
      await pool.request().query(`
        INSERT INTO Products (ProductCode, ProductName, Price) VALUES
        ('P001', '商品A', 1000),
        ('P002', '商品B', 2000),
        ('P003', '商品C', 1500),
        ('P004', '商品D', 3000),
        ('P005', '商品E', 2500)
      `);
    }
    
    const ordersExist = await pool.request().query(`SELECT COUNT(*) as count FROM Orders`);
    if (ordersExist.recordset[0].count === 0) {
      // サンプル注文データ
      await pool.request().query(`
        INSERT INTO Orders DEFAULT VALUES;
        INSERT INTO Orders DEFAULT VALUES;
      `);
      
      // サンプル注文明細データ
      await pool.request().query(`
        INSERT INTO OrderDetails (OrderId, DetailId, ProductCode, Price, Quantity, SalesPrice, IsModified) VALUES
        (1, 1, 'P001', 1000, 2, 2000, 0),
        (1, 2, 'P002', 2000, 1, 2000, 0),
        (2, 1, 'P003', 1500, 3, 4500, 0),
        (2, 2, 'P004', 3000, 1, 3000, 0),
        (2, 3, 'P005', 2500, 2, 5000, 0)
      `);
    }
    
    console.log('Database setup completed');
  } catch (err) {
    console.error('Database setup error:', err);
    throw err;
  }
} 
import pool from "@/lib/db";

export const runtime = "nodejs";

type CartItem = {
  id: number;
  name: string;
  price: number;
  quantity: number;
  optionSummary?: string;
  image?: string;
};

type OrderStatus = "접수됨" | "완료";

type OrderData = {
  orderId: string;
  tableId: string;
  items: CartItem[];
  totalPrice: number;
  createdAt: string;
  status: OrderStatus;
};

async function ensureOrdersTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS orders (
      order_id TEXT PRIMARY KEY,
      table_id TEXT NOT NULL,
      items JSONB NOT NULL,
      total_price INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT '접수됨',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

function formatRow(row: {
  order_id: string;
  table_id: string;
  items: CartItem[];
  total_price: number;
  status: OrderStatus;
  created_at: string | Date;
}): OrderData {
  return {
    orderId: row.order_id,
    tableId: row.table_id,
    items: row.items,
    totalPrice: row.total_price,
    status: row.status,
    createdAt: new Date(row.created_at).toLocaleString("ko-KR"),
  };
}

export async function GET() {
  try {
    await ensureOrdersTable();

    const result = await pool.query(`
      SELECT order_id, table_id, items, total_price, status, created_at
      FROM orders
      ORDER BY created_at DESC
    `);

    return Response.json(result.rows.map(formatRow), { status: 200 });
  } catch (error) {
    console.error("GET /api/orders error:", error);
    return Response.json(
      {
        message: "주문 목록을 불러오지 못했습니다.",
        debug: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await ensureOrdersTable();

    const body = await request.json();
    const { tableId, items, totalPrice } = body;

    if (!tableId || !Array.isArray(items) || items.length === 0 || !totalPrice) {
      return Response.json(
        { message: "잘못된 주문 데이터입니다." },
        { status: 400 }
      );
    }

    const orderId = Date.now().toString();

    await pool.query(
      `
      INSERT INTO orders (order_id, table_id, items, total_price, status)
      VALUES ($1, $2, $3::jsonb, $4, $5)
      `,
      [orderId, tableId, JSON.stringify(items), totalPrice, "접수됨"]
    );

    const inserted = await pool.query(
      `
      SELECT order_id, table_id, items, total_price, status, created_at
      FROM orders
      WHERE order_id = $1
      `,
      [orderId]
    );

    return Response.json(
      {
        message: "주문이 저장되었습니다.",
        order: formatRow(inserted.rows[0]),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/orders error:", error);
    return Response.json(
      {
        message: "주문 저장 중 오류가 발생했습니다.",
        debug: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    await ensureOrdersTable();

    const body = await request.json();
    const { orderId, status } = body;

    if (!orderId || status !== "완료") {
      return Response.json(
        { message: "잘못된 상태 변경 요청입니다." },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `
      UPDATE orders
      SET status = '완료'
      WHERE order_id = $1
      RETURNING order_id, table_id, items, total_price, status, created_at
      `,
      [orderId]
    );

    if (result.rowCount === 0) {
      return Response.json(
        { message: "해당 주문을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return Response.json(
      {
        message: "주문이 완료 처리되었습니다.",
        order: formatRow(result.rows[0]),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("PATCH /api/orders error:", error);
    return Response.json(
      {
        message: "주문 상태 변경 중 오류가 발생했습니다.",
        debug: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    await ensureOrdersTable();

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("orderId");

    if (!orderId) {
      return Response.json(
        { message: "orderId가 없습니다." },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `
      DELETE FROM orders
      WHERE order_id = $1
      RETURNING order_id
      `,
      [orderId]
    );

    if (result.rowCount === 0) {
      return Response.json(
        { message: "삭제할 주문을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return Response.json(
      { message: "완료 주문이 삭제되었습니다." },
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE /api/orders error:", error);
    return Response.json(
      {
        message: "완료 주문 삭제 중 오류가 발생했습니다.",
        debug: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
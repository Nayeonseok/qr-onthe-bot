import { promises as fs } from "fs";
import path from "path";

export const runtime = "nodejs";

type CartItem = {
  id: number;
  name: string;
  price: number;
  quantity: number;
};

type OrderStatus = "접수됨" | "조리중" | "서빙중" | "완료";

type OrderData = {
  orderId: number;
  tableId: string;
  items: CartItem[];
  totalPrice: number;
  createdAt: string;
  status: OrderStatus;
};

const filePath = path.join(process.cwd(), "data", "orders.json");

async function readOrders(): Promise<OrderData[]> {
  try {
    const data = await fs.readFile(filePath, "utf-8");
    return JSON.parse(data);
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, "[]", "utf-8");
      return [];
    }
    throw error;
  }
}

async function writeOrders(orders: OrderData[]) {
  await fs.writeFile(filePath, JSON.stringify(orders, null, 2), "utf-8");
}

export async function GET() {
  try {
    const orders = await readOrders();
    return Response.json(orders, { status: 200 });
  } catch {
    return Response.json(
      { message: "주문 목록을 불러오지 못했습니다." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tableId, items, totalPrice } = body;

    if (!tableId || !Array.isArray(items) || items.length === 0 || !totalPrice) {
      return Response.json(
        { message: "잘못된 주문 데이터입니다." },
        { status: 400 }
      );
    }

    const orders = await readOrders();

    const newOrder: OrderData = {
      orderId: Date.now(),
      tableId,
      items,
      totalPrice,
      createdAt: new Date().toLocaleString("ko-KR"),
      status: "접수됨",
    };

    orders.push(newOrder);
    await writeOrders(orders);

    return Response.json(
      { message: "주문이 저장되었습니다.", order: newOrder },
      { status: 201 }
    );
  } catch {
    return Response.json(
      { message: "주문 저장 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { orderId, status } = body;

    if (!orderId || status !== "완료") {
      return Response.json(
        { message: "잘못된 상태 변경 요청입니다." },
        { status: 400 }
      );
    }

    const orders = await readOrders();
    const targetIndex = orders.findIndex((order) => order.orderId === orderId);

    if (targetIndex === -1) {
      return Response.json(
        { message: "해당 주문을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    orders[targetIndex].status = "완료";
    await writeOrders(orders);

    return Response.json(
      { message: "주문이 완료 처리되었습니다.", order: orders[targetIndex] },
      { status: 200 }
    );
  } catch {
    return Response.json(
      { message: "주문 상태 변경 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = Number(searchParams.get("orderId"));

    if (!orderId) {
      return Response.json(
        { message: "삭제할 주문 ID가 없습니다." },
        { status: 400 }
      );
    }

    const orders = await readOrders();
    const targetOrder = orders.find((order) => order.orderId === orderId);

    if (!targetOrder) {
      return Response.json(
        { message: "해당 주문을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const updatedOrders = orders.filter((order) => order.orderId !== orderId);
    await writeOrders(updatedOrders);

    return Response.json(
      { message: "완료 주문이 삭제되었습니다." },
      { status: 200 }
    );
  } catch {
    return Response.json(
      { message: "주문 삭제 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
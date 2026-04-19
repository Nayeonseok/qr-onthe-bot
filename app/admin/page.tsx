"use client";

import { useEffect, useState } from "react";

type CartItem = {
  id: number;
  name: string;
  price: number;
  quantity: number;
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

export default function AdminPage() {
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const response = await fetch("/api/orders");
      const data = await response.json();
      setOrders([...data].reverse());
    } catch {
      console.error("주문 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const completeOrder = async (orderId: string) => {
    try {
      const response = await fetch("/api/orders", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId,
          status: "완료",
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        alert(result.message || "완료 처리에 실패했습니다.");
        return;
      }

      setOrders((prev) =>
        prev.map((order) =>
          order.orderId === orderId ? { ...order, status: "완료" } : order
        )
      );
    } catch {
      alert("서버와 통신 중 오류가 발생했습니다.");
    }
  };

  const activeOrders = orders.filter((order) => order.status !== "완료");
  const completedOrders = orders.filter((order) => order.status === "완료");

  return (
    <main
      style={{
        maxWidth: "1000px",
        margin: "0 auto",
        padding: "40px 20px",
        color: "white",
      }}
    >
      <h1 style={{ fontSize: "32px", marginBottom: "24px" }}>관리자 페이지</h1>

      <div style={{ marginBottom: "24px" }}>
        <button
          onClick={fetchOrders}
          style={{
            padding: "10px 16px",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          새로고침
        </button>
      </div>

      {loading ? (
        <p>주문 목록을 불러오는 중입니다...</p>
      ) : (
        <>
          <section style={{ marginBottom: "50px" }}>
            <h2 style={{ fontSize: "26px", marginBottom: "20px" }}>
              진행 중 주문
            </h2>

            {activeOrders.length === 0 ? (
              <p>현재 진행 중인 주문이 없습니다.</p>
            ) : (
              <div style={{ display: "grid", gap: "20px" }}>
                {activeOrders.map((order) => (
                  <div
                    key={order.orderId}
                    style={{
                      border: "1px solid #444",
                      borderRadius: "12px",
                      padding: "20px",
                      backgroundColor: "#111",
                    }}
                  >
                    <h3 style={{ marginBottom: "8px" }}>
                      {order.tableId}번 테이블 주문
                    </h3>
                    <p style={{ marginBottom: "8px" }}>
                      주문 시간: {order.createdAt}
                    </p>
                    <p style={{ marginBottom: "16px" }}>
                      현재 상태: <strong>{order.status}</strong>
                    </p>

                    <ul style={{ paddingLeft: "20px", marginBottom: "16px" }}>
                      {order.items.map((item) => (
                        <li key={item.id} style={{ marginBottom: "8px" }}>
                          {item.name} / 수량: {item.quantity} / 금액:{" "}
                          {(item.price * item.quantity).toLocaleString()}원
                        </li>
                      ))}
                    </ul>

                    <div style={{ fontWeight: "bold", marginBottom: "16px" }}>
                      총 금액: {order.totalPrice.toLocaleString()}원
                    </div>

                    <button
                      onClick={() => completeOrder(order.orderId)}
                      style={{
                        padding: "10px 16px",
                        borderRadius: "8px",
                        cursor: "pointer",
                      }}
                    >
                      완료
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 style={{ fontSize: "26px", marginBottom: "20px" }}>
              완료 주문 보관 목록
            </h2>

            {completedOrders.length === 0 ? (
              <p>완료된 주문이 없습니다.</p>
            ) : (
              <div style={{ display: "grid", gap: "20px" }}>
                {completedOrders.map((order) => (
                  <div
                    key={order.orderId}
                    style={{
                      border: "1px solid #444",
                      borderRadius: "12px",
                      padding: "20px",
                      backgroundColor: "#1a1a1a",
                    }}
                  >
                    <h3 style={{ marginBottom: "8px" }}>
                      {order.tableId}번 테이블 주문
                    </h3>
                    <p style={{ marginBottom: "8px" }}>
                      주문 시간: {order.createdAt}
                    </p>
                    <p style={{ marginBottom: "16px" }}>
                      상태: <strong>{order.status}</strong>
                    </p>

                    <ul style={{ paddingLeft: "20px", marginBottom: "16px" }}>
                      {order.items.map((item) => (
                        <li key={item.id} style={{ marginBottom: "8px" }}>
                          {item.name} / 수량: {item.quantity} / 금액:{" "}
                          {(item.price * item.quantity).toLocaleString()}원
                        </li>
                      ))}
                    </ul>

                    <div style={{ fontWeight: "bold" }}>
                      총 금액: {order.totalPrice.toLocaleString()}원
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}
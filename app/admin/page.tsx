"use client";

import { clear } from "console";
import { useEffect, useState } from "react";

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

    const interval = setInterval(() => {
      fetchOrders();
    }, 5000);

    return () => clearInterval(interval);
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

  const deleteCompletedOrder = async (orderId: string) => {
    try {
      const response = await fetch(`/api/orders?orderId=${orderId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        alert(result.message || "삭제에 실패했습니다.");
        return;
      }

      setOrders((prev) => prev.filter((order) => order.orderId !== orderId));
    } catch {
      alert("서버와 통신 중 오류가 발생했습니다.");
    }
  };

  const activeOrders = orders.filter((order) => order.status !== "완료");
  const completedOrders = orders.filter((order) => order.status === "완료");

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "#f8fafc",
        color: "#0f172a",
        padding: "32px 20px 60px",
      }}
    >
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
            marginBottom: "28px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <h1 style={{ fontSize: "32px", marginBottom: "8px" }}>관리자 페이지</h1>
            <p style={{ color: "#64748b", fontSize: "16px", margin: 0 }}>
              주문 현황을 확인하고 완료 처리할 수 있습니다.
            </p>
          </div>

          <button
            onClick={fetchOrders}
            style={{
              padding: "12px 18px",
              borderRadius: "12px",
              border: "none",
              backgroundColor: "#38bdf8",
              color: "#0f172a",
              fontWeight: "bold",
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            }}
          >
            새로고침
          </button>
        </div>

        {loading ? (
          <div
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid #cbd5e1",
              borderRadius: "16px",
              padding: "24px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
            }}
          >
            <p style={{ color: "#64748b", margin: 0 }}>
              주문 목록을 불러오는 중입니다...
            </p>
          </div>
        ) : (
          <>
            <section style={{ marginBottom: "48px" }}>
              <h2
                style={{
                  fontSize: "24px",
                  marginBottom: "18px",
                }}
              >
                진행 중 주문
              </h2>

              {activeOrders.length === 0 ? (
                <div
                  style={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #cbd5e1",
                    borderRadius: "16px",
                    padding: "24px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                  }}
                >
                  <p style={{ color: "#64748b", margin: 0 }}>
                    현재 진행 중인 주문이 없습니다.
                  </p>
                </div>
              ) : (
                <div style={{ display: "grid", gap: "20px" }}>
                  {activeOrders.map((order) => (
                    <div
                      key={order.orderId}
                      style={{
                        border: "1px solid #cbd5e1",
                        borderRadius: "16px",
                        padding: "22px",
                        backgroundColor: "#ffffff",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          gap: "12px",
                          marginBottom: "16px",
                          flexWrap: "wrap",
                        }}
                      >
                        <div>
                          <h3
                            style={{
                              margin: "0 0 8px 0",
                              fontSize: "24px",
                            }}
                          >
                            {order.tableId}번 테이블
                          </h3>
                          <p
                            style={{
                              margin: "0 0 6px 0",
                              color: "#64748b",
                              fontSize: "15px",
                            }}
                          >
                            주문 시간: {order.createdAt}
                          </p>
                          <p
                            style={{
                              margin: 0,
                              color: "#0f172a",
                              fontSize: "15px",
                            }}
                          >
                            상태: <strong>{order.status}</strong>
                          </p>
                        </div>

                        <div
                          style={{
                            padding: "8px 12px",
                            borderRadius: "999px",
                            backgroundColor: "#e0f2fe",
                            color: "#0369a1",
                            fontWeight: "bold",
                            fontSize: "14px",
                          }}
                        >
                          진행 중
                        </div>
                      </div>

                      <div
                        style={{
                          borderTop: "1px solid #e2e8f0",
                          paddingTop: "16px",
                          marginBottom: "18px",
                        }}
                      >
                        {order.items.map((item, index) => (
                          <div
                            key={`${item.id}-${item.name}-${item.optionSummary ?? ""}-${index}`}
                            style={{
                              padding: "12px 0",
                              borderBottom:
                                index !== order.items.length - 1
                                  ? "1px solid #e2e8f0"
                                  : "none",
                            }}
                          >
                            <div
                              style={{
                                fontWeight: "bold",
                                fontSize: "17px",
                                marginBottom: "6px",
                              }}
                            >
                              {item.name}
                            </div>

                            <div style={{ color: "#475569", fontSize: "15px", marginBottom: "4px" }}>
                              수량: {item.quantity}
                            </div>

                            <div style={{ color: "#475569", fontSize: "15px", marginBottom: "4px" }}>
                              옵션: {item.optionSummary || "옵션 없음"}
                            </div>

                            <div style={{ color: "#475569", fontSize: "15px" }}>
                              금액: {(item.price * item.quantity).toLocaleString()}원
                            </div>
                          </div>
                        ))}
                      </div>

                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: "12px",
                          flexWrap: "wrap",
                        }}
                      >
                        <div
                          style={{
                            fontWeight: "bold",
                            fontSize: "20px",
                          }}
                        >
                          총 금액: {order.totalPrice.toLocaleString()}원
                        </div>

                        <button
                          onClick={() => completeOrder(order.orderId)}
                          style={{
                            padding: "12px 18px",
                            borderRadius: "12px",
                            border: "none",
                            backgroundColor: "#22c55e",
                            color: "#ffffff",
                            fontWeight: "bold",
                            cursor: "pointer",
                          }}
                        >
                          완료
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section>
              <h2
                style={{
                  fontSize: "24px",
                  marginBottom: "18px",
                }}
              >
                완료 주문 보관 목록
              </h2>

              {completedOrders.length === 0 ? (
                <div
                  style={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #cbd5e1",
                    borderRadius: "16px",
                    padding: "24px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                  }}
                >
                  <p style={{ color: "#64748b", margin: 0 }}>
                    완료된 주문이 없습니다.
                  </p>
                </div>
              ) : (
                <div style={{ display: "grid", gap: "20px" }}>
                  {completedOrders.map((order) => (
                    <div
                      key={order.orderId}
                      style={{
                        border: "1px solid #cbd5e1",
                        borderRadius: "16px",
                        padding: "22px",
                        backgroundColor: "#ffffff",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          gap: "12px",
                          marginBottom: "16px",
                          flexWrap: "wrap",
                        }}
                      >
                        <div>
                          <h3
                            style={{
                              margin: "0 0 8px 0",
                              fontSize: "22px",
                            }}
                          >
                            {order.tableId}번 테이블
                          </h3>
                          <p
                            style={{
                              margin: "0 0 6px 0",
                              color: "#64748b",
                              fontSize: "15px",
                            }}
                          >
                            주문 시간: {order.createdAt}
                          </p>
                          <p
                            style={{
                              margin: 0,
                              color: "#0f172a",
                              fontSize: "15px",
                            }}
                          >
                            상태: <strong>{order.status}</strong>
                          </p>
                        </div>

                        <div
                          style={{
                            padding: "8px 12px",
                            borderRadius: "999px",
                            backgroundColor: "#dcfce7",
                            color: "#166534",
                            fontWeight: "bold",
                            fontSize: "14px",
                          }}
                        >
                          완료
                        </div>
                      </div>

                      <div
                        style={{
                          borderTop: "1px solid #e2e8f0",
                          paddingTop: "16px",
                          marginBottom: "18px",
                        }}
                      >
                        {order.items.map((item, index) => (
                          <div
                            key={`${item.id}-${item.name}-${item.optionSummary ?? ""}-${index}`}
                            style={{
                              padding: "12px 0",
                              borderBottom:
                                index !== order.items.length - 1
                                  ? "1px solid #e2e8f0"
                                  : "none",
                            }}
                          >
                            <div
                              style={{
                                fontWeight: "bold",
                                fontSize: "17px",
                                marginBottom: "6px",
                              }}
                            >
                              {item.name}
                            </div>

                            <div style={{ color: "#475569", fontSize: "15px", marginBottom: "4px" }}>
                              수량: {item.quantity}
                            </div>

                            <div style={{ color: "#475569", fontSize: "15px", marginBottom: "4px" }}>
                              옵션: {item.optionSummary || "옵션 없음"}
                            </div>

                            <div style={{ color: "#475569", fontSize: "15px" }}>
                              금액: {(item.price * item.quantity).toLocaleString()}원
                            </div>
                          </div>
                        ))}
                      </div>

                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: "12px",
                          flexWrap: "wrap",
                        }}
                      >
                        <div
                          style={{
                            fontWeight: "bold",
                            fontSize: "20px",
                          }}
                        >
                          총 금액: {order.totalPrice.toLocaleString()}원
                        </div>

                        <button
                          onClick={() => deleteCompletedOrder(order.orderId)}
                          style={{
                            padding: "12px 18px",
                            borderRadius: "12px",
                            border: "none",
                            backgroundColor: "#ef4444",
                            color: "#ffffff",
                            fontWeight: "bold",
                            cursor: "pointer",
                          }}
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
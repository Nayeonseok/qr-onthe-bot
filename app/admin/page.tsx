"use client";

import { signOut } from "next-auth/react";
import { useEffect, useRef, useState } from "react";

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
  const [refreshCountdown, setRefreshCountdown] = useState(5);

  const [alertsEnabled, setAlertsEnabled] = useState(false);
  const [bannerVisible, setBannerVisible] = useState(false);
  const [bannerMessage, setBannerMessage] = useState("");
  const [flashOn, setFlashOn] = useState(false);
  const [highlightedOrderIds, setHighlightedOrderIds] = useState<string[]>([]);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const knownOrderIdsRef = useRef<Set<string>>(new Set());
  const isFirstLoadRef = useRef(true);

  const flashIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const bannerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const highlightTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeOrders = orders.filter((order) => order.status !== "완료");
  const completedOrders = orders.filter((order) => order.status === "완료");

  const clearAlertTimers = () => {
    if (flashIntervalRef.current) {
      clearInterval(flashIntervalRef.current);
      flashIntervalRef.current = null;
    }

    if (bannerTimeoutRef.current) {
      clearTimeout(bannerTimeoutRef.current);
      bannerTimeoutRef.current = null;
    }

    if (highlightTimeoutRef.current) {
      clearTimeout(highlightTimeoutRef.current);
      highlightTimeoutRef.current = null;
    }
  };

  const playAlertSound = async () => {
    if (!alertsEnabled || !audioRef.current) return;

    try {
      audioRef.current.currentTime = 0;
      await audioRef.current.play();
    } catch {
      console.warn("소리 알림 재생에 실패했습니다.");
    }
  };

  const triggerNewOrderAlert = async (newOrders: OrderData[]) => {
    if (newOrders.length === 0) return;

    const newIds = newOrders.map((order) => order.orderId);

    if (newOrders.length === 1) {
      setBannerMessage(`${newOrders[0].tableId}번 테이블에서 새 주문이 들어왔습니다.`);
    } else {
      setBannerMessage(`${newOrders.length}건의 새 주문이 들어왔습니다.`);
    }

    setBannerVisible(true);
    setFlashOn(true);
    setHighlightedOrderIds((prev) => Array.from(new Set([...prev, ...newIds])));

    clearAlertTimers();

    flashIntervalRef.current = setInterval(() => {
      setFlashOn((prev) => !prev);
    }, 500);

    bannerTimeoutRef.current = setTimeout(() => {
      if (flashIntervalRef.current) {
        clearInterval(flashIntervalRef.current);
        flashIntervalRef.current = null;
      }
      setFlashOn(false);
      setBannerVisible(false);
      setBannerMessage("");
    }, 6000);

    highlightTimeoutRef.current = setTimeout(() => {
      setHighlightedOrderIds((prev) =>
        prev.filter((id) => !newIds.includes(id))
      );
    }, 8000);

    await playAlertSound();
  };

  const fetchOrders = async () => {
    try {
      const response = await fetch("/api/orders");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "주문 목록을 불러오지 못했습니다.");
      }

      const nextOrders: OrderData[] = Array.isArray(data) ? [...data].reverse() : [];

      if (isFirstLoadRef.current) {
        knownOrderIdsRef.current = new Set(nextOrders.map((order) => order.orderId));
        isFirstLoadRef.current = false;
      } else {
        const knownIds = knownOrderIdsRef.current;
        const newOrders = nextOrders.filter((order) => !knownIds.has(order.orderId));

        if (newOrders.length > 0) {
          await triggerNewOrderAlert(newOrders);
        }

        knownOrderIdsRef.current = new Set(nextOrders.map((order) => order.orderId));
      }

      setOrders(nextOrders);
    } catch (error) {
      console.error("주문 목록을 불러오지 못했습니다.", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    audioRef.current = new Audio("/order-alert.mp3");
    audioRef.current.preload = "auto";

    fetchOrders();

    const refreshInterval = setInterval(() => {
      fetchOrders();
      setRefreshCountdown(5);
    }, 5000);

    const countdownInterval = setInterval(() => {
      setRefreshCountdown((prev) => (prev === 1 ? 5 : prev - 1));
    }, 1000);

    return () => {
      clearInterval(refreshInterval);
      clearInterval(countdownInterval);
      clearAlertTimers();
    };
  }, []);

  const handleToggleAlerts = async () => {
    if (alertsEnabled) {
      setAlertsEnabled(false);
      return;
    }

    if (!audioRef.current) {
      audioRef.current = new Audio("/order-alert.mp3");
      audioRef.current.preload = "auto";
    }

    try {
      const originalVolume = audioRef.current.volume;
      audioRef.current.volume = 0;
      audioRef.current.currentTime = 0;
      await audioRef.current.play();
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.volume = originalVolume;
    } catch {
      console.warn("브라우저에서 오디오 권한 준비에 실패했습니다.");
    }

    setAlertsEnabled(true);
  };

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
      setRefreshCountdown(5);
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
      setRefreshCountdown(5);
    } catch {
      alert("서버와 통신 중 오류가 발생했습니다.");
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: flashOn ? "#fff7ed" : "#f8fafc",
        color: "#0f172a",
        padding: "32px 20px 60px",
        transition: "background-color 0.25s ease",
      }}
    >
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        {bannerVisible && (
          <div
            style={{
              marginBottom: "20px",
              padding: "14px 18px",
              borderRadius: "14px",
              backgroundColor: flashOn ? "#f97316" : "#fdba74",
              color: "#ffffff",
              fontWeight: "bold",
              boxShadow: "0 8px 20px rgba(249,115,22,0.25)",
              transition: "all 0.25s ease",
            }}
          >
            🔔 {bannerMessage}
          </div>
        )}

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

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            <button
              onClick={() => {
                fetchOrders();
                setRefreshCountdown(5);
              }}
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

            <button
              onClick={handleToggleAlerts}
              style={{
                padding: "12px 18px",
                borderRadius: "12px",
                border: "none",
                backgroundColor: alertsEnabled ? "#22c55e" : "#e2e8f0",
                color: alertsEnabled ? "#ffffff" : "#0f172a",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              {alertsEnabled ? "알림 켜짐" : "알림 켜기"}
            </button>

            <button
              onClick={() => signOut({ callbackUrl: "/admin/login" })}
              style={{
                padding: "12px 18px",
                borderRadius: "12px",
                border: "none",
                backgroundColor: "#0f172a",
                color: "#ffffff",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              로그아웃
            </button>
          </div>
        </div>

        <div style={{ marginBottom: "24px", color: "#64748b", fontSize: "15px" }}>
          다음 자동 새로고침까지 {refreshCountdown}초
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
                  {activeOrders.map((order) => {
                    const isHighlighted = highlightedOrderIds.includes(order.orderId);

                    return (
                      <div
                        key={order.orderId}
                        style={{
                          border: isHighlighted
                            ? "2px solid #f97316"
                            : "1px solid #cbd5e1",
                          borderRadius: "16px",
                          padding: "22px",
                          backgroundColor: isHighlighted
                            ? flashOn
                              ? "#fff7ed"
                              : "#ffffff"
                            : "#ffffff",
                          boxShadow: isHighlighted
                            ? "0 0 0 4px rgba(249,115,22,0.12)"
                            : "0 4px 12px rgba(0,0,0,0.06)",
                          transition: "all 0.25s ease",
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
                              backgroundColor: isHighlighted ? "#ffedd5" : "#e0f2fe",
                              color: isHighlighted ? "#c2410c" : "#0369a1",
                              fontWeight: "bold",
                              fontSize: "14px",
                            }}
                          >
                            {isHighlighted ? "새 주문" : "진행 중"}
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

                              <div
                                style={{
                                  color: "#475569",
                                  fontSize: "15px",
                                  marginBottom: "4px",
                                }}
                              >
                                수량: {item.quantity}
                              </div>

                              <div
                                style={{
                                  color: "#475569",
                                  fontSize: "15px",
                                  marginBottom: "4px",
                                }}
                              >
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
                    );
                  })}
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

                            <div
                              style={{
                                color: "#475569",
                                fontSize: "15px",
                                marginBottom: "4px",
                              }}
                            >
                              수량: {item.quantity}
                            </div>

                            <div
                              style={{
                                color: "#475569",
                                fontSize: "15px",
                                marginBottom: "4px",
                              }}
                            >
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
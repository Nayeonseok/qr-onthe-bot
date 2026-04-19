"use client";

import { useParams } from "next/navigation";
import { useState } from "react";

type MenuItem = {
  id: number;
  name: string;
  price: number;
  quantity: number;
};

const menus: MenuItem[] = [
  { id: 1, name: "1번 메뉴", price: 5000, quantity: 1 },
  { id: 2, name: "2번 메뉴", price: 6000, quantity: 1 },
  { id: 3, name: "3번 메뉴", price: 7000, quantity: 1 },
];

export default function OrderPage() {
  const params = useParams<{ tableId: string }>();
  const tableId = params.tableId;

  const [menuList, setMenuList] = useState<MenuItem[]>(menus);
  const [cart, setCart] = useState<MenuItem[]>([]);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const increaseQuantity = (id: number) => {
    setMenuList((prev) =>
      prev.map((menu) =>
        menu.id === id ? { ...menu, quantity: menu.quantity + 1 } : menu
      )
    );
  };

  const decreaseQuantity = (id: number) => {
    setMenuList((prev) =>
      prev.map((menu) =>
        menu.id === id
          ? { ...menu, quantity: menu.quantity > 1 ? menu.quantity - 1 : 1 }
          : menu
      )
    );
  };

  const addToCart = (menu: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === menu.id);

      if (existing) {
        return prev.map((item) =>
          item.id === menu.id
            ? { ...item, quantity: item.quantity + menu.quantity }
            : item
        );
      }

      return [...prev, { ...menu }];
    });

    setMenuList((prev) =>
      prev.map((item) =>
        item.id === menu.id ? { ...item, quantity: 1 } : item
      )
    );
  };

  const removeFromCart = (id: number) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const getTotalPrice = () => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const handleSubmitOrder = async () => {
    if (cart.length === 0) {
      setMessage("주문 목록이 비어 있습니다.");
      return;
    }

    try {
      setIsSubmitting(true);
      setMessage("");

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tableId,
          items: cart,
          totalPrice: getTotalPrice(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage(result.message || "주문 저장에 실패했습니다.");
        return;
      }

      setMessage("주문이 정상적으로 저장되었습니다.");
      setCart([]);
    } catch {
      setMessage("서버와 통신 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main
      style={{
        maxWidth: "900px",
        margin: "0 auto",
        padding: "40px 20px",
        minHeight: "100vh",
        backgroundColor: "#0f172a",
        color: "#f8fafc",
      }}
    >
      <h1 style={{ fontSize: "32px", marginBottom: "8px" }}>주문 페이지</h1>
      <h2 style={{ fontSize: "24px", marginBottom: "30px", color: "#cbd5e1" }}>
        {tableId}번 테이블
      </h2>

      <section style={{ marginBottom: "40px" }}>
        <h3 style={{ fontSize: "22px", marginBottom: "20px" }}>메뉴 목록</h3>

        <div style={{ display: "grid", gap: "20px" }}>
          {menuList.map((menu) => (
            <div
              key={menu.id}
              style={{
                border: "1px solid #334155",
                borderRadius: "12px",
                padding: "20px",
                backgroundColor: "#1e293b",
                boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
              }}
            >
              <h4 style={{ fontSize: "20px", marginBottom: "10px" }}>
                {menu.name}
              </h4>

              <p style={{ marginBottom: "16px", color: "#cbd5e1" }}>
                {menu.price.toLocaleString()}원
              </p>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  marginBottom: "16px",
                }}
              >
                <button
                  onClick={() => decreaseQuantity(menu.id)}
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "8px",
                    border: "none",
                    backgroundColor: "#334155",
                    color: "#f8fafc",
                    cursor: "pointer",
                    fontSize: "18px",
                    fontWeight: "bold",
                  }}
                >
                  -
                </button>

                <span
                  style={{
                    minWidth: "40px",
                    textAlign: "center",
                    fontSize: "18px",
                    fontWeight: "bold",
                  }}
                >
                  {menu.quantity}
                </span>

                <button
                  onClick={() => increaseQuantity(menu.id)}
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "8px",
                    border: "none",
                    backgroundColor: "#334155",
                    color: "#f8fafc",
                    cursor: "pointer",
                    fontSize: "18px",
                    fontWeight: "bold",
                  }}
                >
                  +
                </button>
              </div>

              <button
                onClick={() => addToCart(menu)}
                style={{
                  padding: "10px 16px",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: "#38bdf8",
                  color: "#0f172a",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                담기
              </button>
            </div>
          ))}
        </div>
      </section>

      <section
        style={{
          borderTop: "1px solid #334155",
          paddingTop: "30px",
        }}
      >
        <h3 style={{ fontSize: "22px", marginBottom: "20px" }}>주문 목록</h3>

        {cart.length === 0 ? (
          <p style={{ color: "#cbd5e1" }}>아직 담은 메뉴가 없습니다.</p>
        ) : (
          <>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {cart.map((item) => (
                <li
                  key={item.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderBottom: "1px solid #334155",
                    padding: "12px 0",
                    gap: "12px",
                  }}
                >
                  <div>
                    {item.name} x {item.quantity} /{" "}
                    {(item.price * item.quantity).toLocaleString()}원
                  </div>

                  <button
                    onClick={() => removeFromCart(item.id)}
                    style={{
                      padding: "8px 14px",
                      borderRadius: "8px",
                      border: "none",
                      backgroundColor: "#ef4444",
                      color: "#ffffff",
                      fontWeight: "bold",
                      cursor: "pointer",
                    }}
                  >
                    삭제
                  </button>
                </li>
              ))}
            </ul>

            <div
              style={{
                marginTop: "20px",
                fontWeight: "bold",
                fontSize: "20px",
              }}
            >
              총 금액: {getTotalPrice().toLocaleString()}원
            </div>

            <div style={{ marginTop: "20px" }}>
              <button
                onClick={handleSubmitOrder}
                disabled={isSubmitting}
                style={{
                  padding: "12px 20px",
                  borderRadius: "10px",
                  border: "none",
                  backgroundColor: isSubmitting ? "#64748b" : "#22c55e",
                  color: "#ffffff",
                  fontWeight: "bold",
                  cursor: isSubmitting ? "default" : "pointer",
                }}
              >
                {isSubmitting ? "주문 저장 중..." : "최종 주문하기"}
              </button>
            </div>
          </>
        )}

        {message && (
          <p
            style={{
              marginTop: "20px",
              color: message.includes("정상적으로")
                ? "#4ade80"
                : "#fca5a5",
            }}
          >
            {message}
          </p>
        )}
      </section>
    </main>
  );
}
"use client";

import Image from "next/image";
import { useParams } from "next/navigation";
import { useState } from "react";

type MenuKind = "tteokbokki" | "chicken" | "drink";
type MenuCategory = "food" | "drink";

type MenuItem = {
  id: number;
  name: string;
  price: number;
  image: string;
  kind: MenuKind;
  category: MenuCategory;
};

type CartItem = {
  id: number;
  name: string;
  price: number;
  image: string;
  quantity: number;
  optionSummary: string;
};

const menus: MenuItem[] = [
  {
    id: 1,
    name: "떡볶이",
    price: 6000,
    image: "/tteokbokki.png",
    kind: "tteokbokki",
    category: "food",
  },
  {
    id: 2,
    name: "치킨",
    price: 18000,
    image: "/chicken.png",
    kind: "chicken",
    category: "food",
  },
  {
    id: 3,
    name: "블루 에이드",
    price: 3000,
    image: "/blue-ade.png",
    kind: "drink",
    category: "drink",
  },
  {
    id: 4,
    name: "오렌지 에이드",
    price: 3000,
    image: "/orange-ade.png",
    kind: "drink",
    category: "drink",
  },
];

export default function OrderPage() {
  const params = useParams<{ tableId: string }>();
  const tableId = params.tableId;

  const [showOrderScreen, setShowOrderScreen] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState<MenuItem | null>(null);

  const [quantity, setQuantity] = useState(1);

  const [spicyLevel, setSpicyLevel] = useState<1 | 2 | 3>(1);

  const [chickenFlavor, setChickenFlavor] = useState<"후라이드" | "양념">(
    "후라이드"
  );
  const [chickenType, setChickenType] = useState<"순살" | "뼈">("순살");

  const [cart, setCart] = useState<CartItem[]>([]);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const foodMenus = menus.filter((menu) => menu.category === "food");
  const drinkMenus = menus.filter((menu) => menu.category === "drink");

  const openMenuModal = (menu: MenuItem) => {
    setSelectedMenu(menu);
    setQuantity(1);
    setSpicyLevel(1);
    setChickenFlavor("후라이드");
    setChickenType("순살");
  };

  const closeMenuModal = () => {
    setSelectedMenu(null);
    setQuantity(1);
    setSpicyLevel(1);
    setChickenFlavor("후라이드");
    setChickenType("순살");
  };

  const getOptionSummary = () => {
    if (!selectedMenu) return "";

    if (selectedMenu.kind === "tteokbokki") {
      return `맵기 ${spicyLevel}단계`;
    }

    if (selectedMenu.kind === "chicken") {
      return `${chickenFlavor} / ${chickenType}`;
    }

    return "옵션 없음";
  };

  const addToCart = () => {
    if (!selectedMenu) return;

    const optionSummary = getOptionSummary();

    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (item) =>
          item.id === selectedMenu.id && item.optionSummary === optionSummary
      );

      if (existingIndex !== -1) {
        return prev.map((item, index) =>
          index === existingIndex
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }

      return [
        ...prev,
        {
          id: selectedMenu.id,
          name: selectedMenu.name,
          price: selectedMenu.price,
          image: selectedMenu.image,
          quantity,
          optionSummary,
        },
      ];
    });

    closeMenuModal();
  };

  const removeFromCart = (indexToRemove: number) => {
    setCart((prev) => prev.filter((_, index) => index !== indexToRemove));
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

  if (!showOrderScreen) {
    return (
      <main
        style={{
          minHeight: "100vh",
          backgroundColor: "#ffffff",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: "24px",
          color: "#0f172a",
        }}
      >
        <div
          style={{
            width: "300px",
            height: "300px",
            position: "relative",
            borderRadius: "20px",
            overflow: "hidden",
            boxShadow: "0 6px 20px rgba(0,0,0,0.15)",
            marginBottom: "24px",
          }}
        >
          <Image
            src="/start-image.jpg"
            alt="대표 이미지"
            fill
            style={{ objectFit: "cover" }}
            priority
          />
        </div>

        <p
          style={{
            fontSize: "22px",
            fontWeight: "bold",
            marginBottom: "16px",
          }}
        >
          {tableId}번 테이블
        </p>

        <button
          onClick={() => setShowOrderScreen(true)}
          style={{
            padding: "14px 24px",
            fontSize: "18px",
            fontWeight: "bold",
            border: "none",
            borderRadius: "12px",
            backgroundColor: "#38bdf8",
            color: "#0f172a",
            cursor: "pointer",
          }}
        >
          주문하기
        </button>
      </main>
    );
  }

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
        <h1 style={{ fontSize: "32px", marginBottom: "8px" }}>주문 페이지</h1>
        <h2 style={{ fontSize: "22px", marginBottom: "28px", color: "#475569" }}>
          {tableId}번 테이블
        </h2>

        <section style={{ marginBottom: "40px" }}>
          <h3 style={{ fontSize: "24px", marginBottom: "20px" }}>음식 메뉴</h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 280px))",
              gap: "20px",
            }}
          >
            {foodMenus.map((menu) => (
              <button
                key={menu.id}
                onClick={() => openMenuModal(menu)}
                style={{
                  textAlign: "left",
                  border: "1px solid #cbd5e1",
                  borderRadius: "16px",
                  backgroundColor: "#ffffff",
                  overflow: "hidden",
                  cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                  padding: 0,
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: "190px",
                    position: "relative",
                  }}
                >
                  <Image
                    src={menu.image}
                    alt={menu.name}
                    fill
                    style={{ objectFit: "cover" }}
                  />
                </div>

                <div style={{ padding: "16px" }}>
                  <div
                    style={{
                      fontSize: "20px",
                      fontWeight: "bold",
                      marginBottom: "8px",
                    }}
                  >
                    {menu.name}
                  </div>
                  <div style={{ fontSize: "18px", color: "#334155" }}>
                    {menu.price.toLocaleString()}원
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section style={{ marginBottom: "40px" }}>
          <h3 style={{ fontSize: "24px", marginBottom: "20px" }}>음료 메뉴</h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 280px))",
              gap: "20px",
            }}
          >
            {drinkMenus.map((menu) => (
              <button
                key={menu.id}
                onClick={() => openMenuModal(menu)}
                style={{
                  textAlign: "left",
                  border: "1px solid #cbd5e1",
                  borderRadius: "16px",
                  backgroundColor: "#ffffff",
                  overflow: "hidden",
                  cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                  padding: 0,
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: "190px",
                    position: "relative",
                  }}
                >
                  <Image
                    src={menu.image}
                    alt={menu.name}
                    fill
                    style={{ objectFit: "cover" }}
                  />
                </div>

                <div style={{ padding: "16px" }}>
                  <div
                    style={{
                      fontSize: "20px",
                      fontWeight: "bold",
                      marginBottom: "8px",
                    }}
                  >
                    {menu.name}
                  </div>
                  <div style={{ fontSize: "18px", color: "#334155" }}>
                    {menu.price.toLocaleString()}원
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #cbd5e1",
            borderRadius: "16px",
            padding: "20px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
          }}
        >
          <h3 style={{ fontSize: "22px", marginBottom: "20px" }}>주문 목록</h3>

          {cart.length === 0 ? (
            <p style={{ color: "#64748b" }}>아직 담은 메뉴가 없습니다.</p>
          ) : (
            <>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {cart.map((item, index) => (
                  <li
                    key={`${item.id}-${item.optionSummary}-${index}`}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "12px",
                      padding: "14px 0",
                      borderBottom: "1px solid #e2e8f0",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: "bold", marginBottom: "6px" }}>
                        {item.name}
                      </div>
                      <div style={{ color: "#475569", fontSize: "15px" }}>
                        수량: {item.quantity}
                      </div>
                      <div style={{ color: "#475569", fontSize: "15px" }}>
                        옵션: {item.optionSummary}
                      </div>
                      <div style={{ color: "#475569", fontSize: "15px" }}>
                        {(item.price * item.quantity).toLocaleString()}원
                      </div>
                    </div>

                    <button
                      onClick={() => removeFromCart(index)}
                      style={{
                        padding: "8px 14px",
                        border: "none",
                        borderRadius: "10px",
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
                  fontSize: "20px",
                  fontWeight: "bold",
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
                    border: "none",
                    borderRadius: "12px",
                    backgroundColor: isSubmitting ? "#94a3b8" : "#22c55e",
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
                marginTop: "18px",
                color: message.includes("정상적으로") ? "#16a34a" : "#dc2626",
              }}
            >
              {message}
            </p>
          )}
        </section>
      </div>

      {selectedMenu && (
        <div
          onClick={closeMenuModal}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15, 23, 42, 0.55)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "20px",
            zIndex: 1000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: "420px",
              backgroundColor: "#ffffff",
              borderRadius: "18px",
              padding: "24px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
              color: "#0f172a",
            }}
          >
            <div
              style={{
                width: "100%",
                height: "220px",
                position: "relative",
                borderRadius: "14px",
                overflow: "hidden",
                marginBottom: "18px",
              }}
            >
              <Image
                src={selectedMenu.image}
                alt={selectedMenu.name}
                fill
                style={{ objectFit: "cover" }}
              />
            </div>

            <h3 style={{ fontSize: "24px", marginBottom: "8px" }}>
              {selectedMenu.name}
            </h3>
            <p style={{ fontSize: "18px", marginBottom: "20px", color: "#475569" }}>
              {selectedMenu.price.toLocaleString()}원
            </p>

            <div style={{ marginBottom: "20px" }}>
              <div
                style={{
                  fontWeight: "bold",
                  marginBottom: "10px",
                  fontSize: "17px",
                }}
              >
                수량 선택
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <button
                  onClick={() =>
                    setQuantity((prev) => (prev > 1 ? prev - 1 : 1))
                  }
                  style={{
                    width: "38px",
                    height: "38px",
                    border: "none",
                    borderRadius: "10px",
                    backgroundColor: "#334155",
                    color: "#ffffff",
                    fontWeight: "bold",
                    cursor: "pointer",
                  }}
                >
                  -
                </button>

                <span style={{ minWidth: "40px", textAlign: "center", fontSize: "18px" }}>
                  {quantity}
                </span>

                <button
                  onClick={() => setQuantity((prev) => prev + 1)}
                  style={{
                    width: "38px",
                    height: "38px",
                    border: "none",
                    borderRadius: "10px",
                    backgroundColor: "#334155",
                    color: "#ffffff",
                    fontWeight: "bold",
                    cursor: "pointer",
                  }}
                >
                  +
                </button>
              </div>
            </div>

            {selectedMenu.kind === "tteokbokki" && (
              <div style={{ marginBottom: "24px" }}>
                <div
                  style={{
                    fontWeight: "bold",
                    marginBottom: "10px",
                    fontSize: "17px",
                  }}
                >
                  맵기 선택
                </div>

                <div style={{ display: "flex", gap: "10px" }}>
                  {[1, 2, 3].map((level) => (
                    <button
                      key={level}
                      onClick={() => setSpicyLevel(level as 1 | 2 | 3)}
                      style={{
                        flex: 1,
                        padding: "10px 0",
                        borderRadius: "10px",
                        border: "none",
                        backgroundColor:
                          spicyLevel === level ? "#38bdf8" : "#e2e8f0",
                        color: spicyLevel === level ? "#0f172a" : "#334155",
                        fontWeight: "bold",
                        cursor: "pointer",
                      }}
                    >
                      {level}단계
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedMenu.kind === "chicken" && (
              <>
                <div style={{ marginBottom: "20px" }}>
                  <div
                    style={{
                      fontWeight: "bold",
                      marginBottom: "10px",
                      fontSize: "17px",
                    }}
                  >
                    맛 선택
                  </div>

                  <div style={{ display: "flex", gap: "10px" }}>
                    {(["후라이드", "양념"] as const).map((flavor) => (
                      <button
                        key={flavor}
                        onClick={() => setChickenFlavor(flavor)}
                        style={{
                          flex: 1,
                          padding: "10px 0",
                          borderRadius: "10px",
                          border: "none",
                          backgroundColor:
                            chickenFlavor === flavor ? "#38bdf8" : "#e2e8f0",
                          color:
                            chickenFlavor === flavor ? "#0f172a" : "#334155",
                          fontWeight: "bold",
                          cursor: "pointer",
                        }}
                      >
                        {flavor}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: "24px" }}>
                  <div
                    style={{
                      fontWeight: "bold",
                      marginBottom: "10px",
                      fontSize: "17px",
                    }}
                  >
                    부위 선택
                  </div>

                  <div style={{ display: "flex", gap: "10px" }}>
                    {(["순살", "뼈"] as const).map((type) => (
                      <button
                        key={type}
                        onClick={() => setChickenType(type)}
                        style={{
                          flex: 1,
                          padding: "10px 0",
                          borderRadius: "10px",
                          border: "none",
                          backgroundColor:
                            chickenType === type ? "#38bdf8" : "#e2e8f0",
                          color: chickenType === type ? "#0f172a" : "#334155",
                          fontWeight: "bold",
                          cursor: "pointer",
                        }}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
              }}
            >
              <button
                onClick={closeMenuModal}
                style={{
                  padding: "10px 16px",
                  border: "none",
                  borderRadius: "10px",
                  backgroundColor: "#cbd5e1",
                  color: "#0f172a",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                취소
              </button>

              <button
                onClick={addToCart}
                style={{
                  padding: "10px 16px",
                  border: "none",
                  borderRadius: "10px",
                  backgroundColor: "#22c55e",
                  color: "#ffffff",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                담기
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
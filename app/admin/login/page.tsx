"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    const result = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });

    setIsLoading(false);

    if (result?.error) {
      setErrorMessage("아이디 또는 비밀번호가 올바르지 않습니다.");
      return;
    }

    router.push("/admin");
    router.refresh();
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "#f8fafc",
        color: "#0f172a",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "24px",
      }}
    >
      <form
        onSubmit={handleLogin}
        style={{
          width: "100%",
          maxWidth: "420px",
          backgroundColor: "#ffffff",
          border: "1px solid #cbd5e1",
          borderRadius: "16px",
          padding: "28px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
          color: "#0f172a",
        }}
      >
        <h1
          style={{
            fontSize: "28px",
            marginBottom: "10px",
            color: "#0f172a",
          }}
        >
          관리자 로그인
        </h1>

        <p
          style={{
            marginBottom: "24px",
            color: "#64748b",
            fontSize: "15px",
          }}
        >
          관리자 계정으로 로그인해 주세요.
        </p>

        <div style={{ marginBottom: "16px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: "bold",
              color: "#0f172a",
            }}
          >
            아이디
          </label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            type="text"
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "10px",
              border: "1px solid #cbd5e1",
              fontSize: "16px",
              outline: "none",
            }}
          />
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: "bold",
              color: "#0f172a",
            }}
          >
            비밀번호
          </label>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "10px",
              border: "1px solid #cbd5e1",
              fontSize: "16px",
              outline: "none",
            }}
          />
        </div>

        {errorMessage && (
          <p
            style={{
              marginBottom: "16px",
              color: "#dc2626",
              fontSize: "14px",
            }}
          >
            {errorMessage}
          </p>
        )}

        <button
          type="submit"
          disabled={isLoading}
          style={{
            width: "100%",
            padding: "12px 16px",
            borderRadius: "10px",
            border: "none",
            backgroundColor: isLoading ? "#94a3b8" : "#38bdf8",
            color: "#0f172a",
            fontWeight: "bold",
            fontSize: "16px",
            cursor: isLoading ? "default" : "pointer",
          }}
        >
          {isLoading ? "로그인 중..." : "로그인"}
        </button>
      </form>
    </main>
  );
}
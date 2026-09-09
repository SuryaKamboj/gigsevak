import React, { useEffect, useState } from "react";
import { useAccount } from "../../context/AccountContext";

export const Toast: React.FC = () => {
  const { toastMessage, showToast } = useAccount();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (toastMessage) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(() => showToast(""), 300);
      }, 2600);
      return () => clearTimeout(timer);
    }
  }, [toastMessage, showToast]);

  if (!toastMessage && !visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 40,
        left: "50%",
        transform: "translateX(-50%)",
        backgroundColor: "rgba(26, 31, 38, 0.95)",
        color: "#FFFFFF",
        padding: "10px 20px",
        borderRadius: "9999px",
        fontSize: "13.5px",
        fontWeight: 600,
        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.25)",
        zIndex: 9999,
        transition: "opacity 0.25s ease, transform 0.25s ease",
        opacity: visible ? 1 : 0,
        pointerEvents: "none",
        whiteSpace: "nowrap"
      }}
    >
      {toastMessage}
    </div>
  );
};

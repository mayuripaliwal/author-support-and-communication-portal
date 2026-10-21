
import { useEffect, useState } from "react";
import authStatus from "./authStatus";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export default function Logout({ setAuth }) {
  const [message, setMessage] = useState("Logging out...");

  useEffect(() => {
    async function logout() {
      try {
        const response = await fetch(`${BACKEND_URL}/logout`, {
          method: "POST",
          credentials: "include",
        });

        if (!response.ok) {
          setMessage("Something went wrong. Please try again.");
        }

        setMessage("You have been logged out successfully.");
      } catch (error) {
        setMessage("Something went wrong. Please try again.");
      } finally {
        setAuth(authStatus.LOGGED_OUT);
      }
    }

    logout();
  }, [setAuth]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <h1 className="text-xl font-semibold">
        {message}
      </h1>
    </div>
  );
}

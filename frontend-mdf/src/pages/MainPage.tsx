import { useState } from "react";

export default function MainPage() {
  type User = {
    name: string;
    email: string;
  };

  const [user] = useState<User | null>(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  return (
    <div>
      <h1>Main Page</h1>
      {user && (
        <p>
          Welcome, {user.name} ({user.email})
        </p>
      )}
    </div>
  );
}

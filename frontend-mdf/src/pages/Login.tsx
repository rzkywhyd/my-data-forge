// import { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import { toast } from "sonner";

// export default function Login() {
//   const navigate = useNavigate();

//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");

//   const [loading, setLoading] = useState(false);
//   const [dots, setDots] = useState(".");

//   // animasi titik
//   useEffect(() => {
//     if (!loading) return;

//     const interval = setInterval(() => {
//       setDots((prev) => (prev.length >= 3 ? "." : prev + "."));
//     }, 400);

//     return () => clearInterval(interval);
//   }, [loading]);

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();

//     if (loading) return; // cegah double click

//     setLoading(true);

//     try {
//       const res = await fetch(`${import.meta.env.VITE_API_URL}/login`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           email: email.trim(),
//           password: password.trim(),
//         }),
//       });

//       const data = await res.json();

//       if (!res.ok) {
//         toast.error("Login gagal", {
//           description: data.message || "Wrong email or password",
//         });
//         return;
//       }

//       // simpan token & user
//       localStorage.setItem("token", data.token);
//       localStorage.setItem("user", JSON.stringify(data.user));

//       navigate("/main");
//     } catch (error) {
//       console.error(error);
//       toast.error("Terjadi kesalahan server");
//     } finally {
//       setLoading(false); // penting!
//     }
//   };

//   return (
//     <div className="flex min-h-screen flex-col justify-center px-6 py-12 lg:px-8">
//       <div className="sm:mx-auto sm:w-full sm:max-w-sm">
//         <img
//           alt="Logo"
//           src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=600"
//           className="mx-auto h-10 w-auto"
//         />

//         <h2 className="mt-10 text-center text-2xl font-bold text-gray-900">
//           Sign in to your account
//         </h2>
//       </div>

//       <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
//         <form onSubmit={handleSubmit} className="space-y-6">
//           {/* Email */}
//           <div>
//             <label className="block text-sm font-medium text-gray-900">
//               Email address
//             </label>

//             <div className="mt-2">
//               <input
//                 type="email"
//                 required
//                 className="block w-full rounded-md border px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-indigo-600"
//                 value={email}
//                 onChange={(e) => setEmail(e.target.value)}
//               />
//             </div>
//           </div>

//           {/* Password */}
//           <div>
//             <div className="flex items-center justify-between">
//               <label className="block text-sm font-medium text-gray-900">
//                 Password
//               </label>

//               <div className="text-sm">
//                 <a
//                   href="#"
//                   className="font-semibold text-indigo-600 hover:text-indigo-500"
//                 >
//                   Forgot password?
//                 </a>
//               </div>
//             </div>

//             <div className="mt-2">
//               <input
//                 type="password"
//                 required
//                 className="block w-full rounded-md border px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-indigo-600"
//                 value={password}
//                 onChange={(e) => setPassword(e.target.value)}
//               />
//             </div>
//           </div>

//           {/* Button */}
//           <button
//             type="submit"
//             disabled={loading}
//             className={`w-full rounded-md px-3 py-2 text-white font-semibold transition
//               ${
//                 loading
//                   ? "bg-blue-400 cursor-not-allowed"
//                   : "bg-blue-800 hover:bg-blue-700"
//               }`}
//           >
//             {loading ? `Signing in${dots}` : "Sign in"}
//           </button>
//         </form>
//       </div>
//     </div>
//   );
// }

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [dots, setDots] = useState(".");

  // Animasi titik saat loading
  useEffect(() => {
    if (!loading) return;

    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "." : prev + "."));
    }, 400);

    return () => clearInterval(interval);
  }, [loading]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (loading) return;

    setLoading(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password.trim(),
        }),
      });

      const data: {
        token?: string;
        user?: unknown;
        message?: string;
      } = await res.json();

      if (!res.ok) {
        toast.error("Login gagal", {
          description: data.message || "Wrong email or password",
        });
        return;
      }

      localStorage.setItem("token", data.token ?? "");
      localStorage.setItem("user", JSON.stringify(data.user));

      navigate("/main");
    } catch (error) {
      console.error(error);

      toast.error("Terjadi kesalahan server", {
        description: "Tidak dapat terhubung ke server.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white lg:flex">
      {/* =====================================================
          LEFT - COMPANY BRANDING
      ====================================================== */}
      <section className="relative hidden min-h-screen overflow-hidden bg-gradient-to-br from-blue-950 via-blue-800 to-blue-600 lg:flex lg:w-[48%]">
        {/* Decorative circles */}
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-blue-500/20" />

        <div className="absolute -bottom-32 -right-16 h-80 w-80 rounded-full bg-blue-400/20" />

        <div className="absolute left-10 top-24 grid grid-cols-6 gap-3 opacity-20">
          {Array.from({ length: 36 }).map((_, index) => (
            <span key={index} className="h-1 w-1 rounded-full bg-white" />
          ))}
        </div>

        {/* Background abstract building */}
        <div className="absolute bottom-0 left-0 right-0 h-[55%] opacity-10">
          <div className="absolute bottom-0 left-[8%] h-[75%] w-[32%] -skew-x-12 border-l border-t border-white" />
          <div className="absolute bottom-0 left-[25%] h-[90%] w-[42%] -skew-x-12 border-l border-t border-white" />

          <div className="absolute bottom-0 left-[12%] h-[65%] w-[28%] border-r border-white">
            <div className="grid h-full grid-cols-4 gap-5 p-5">
              {Array.from({ length: 24 }).map((_, index) => (
                <span key={index} className="border border-white/40" />
              ))}
            </div>
          </div>
        </div>

        {/* Branding content */}
        <div className="relative z-10 flex w-full flex-col justify-center px-16 xl:px-24">
          {/* Logo */}
          <div className="mb-8 flex items-center gap-5">
            {/* Ganti dengan logo perusahaan kamu */}
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white shadow-xl">
              <svg
                viewBox="0 0 64 64"
                className="h-12 w-12 text-blue-700"
                fill="none"
              >
                <path
                  d="M32 5L55 18V46L32 59L9 46V18L32 5Z"
                  stroke="currentColor"
                  strokeWidth="5"
                />
                <path
                  d="M22 23L32 17L42 23V35L32 41L22 35V23Z"
                  fill="currentColor"
                />
              </svg>
            </div>

            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white xl:text-4xl">
                Dynamic Table
              </h1>
              <h1 className="text-3xl font-bold tracking-tight text-white xl:text-4xl">
                Builder
              </h1>
            </div>
          </div>

          {/* Divider */}
          <div className="mb-8 h-1 w-16 rounded-full bg-cyan-400" />

          {/* Description */}
          <p className="max-w-md text-lg leading-8 text-blue-100 xl:text-xl">
            Build, manage, and analyze your data with a flexible dynamic table
            platform.
          </p>

          <p className="mt-5 max-w-md text-sm leading-6 text-blue-200">
            Powerful data management tools designed to make your workflow
            simpler and more efficient.
          </p>

          {/* Bottom text */}
          <div className="absolute bottom-10 left-16 text-sm text-blue-200 xl:left-24">
            © 2026 Dynamic Table Builder.
            <br />
            All rights reserved.
          </div>
        </div>

        {/* =====================================================
            CURVED WHITE DIVIDER
        ====================================================== */}
        <svg
          className="absolute right-[-1px] top-0 z-20 h-full w-[180px]"
          viewBox="0 0 180 1000"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="
              M180 0
              L95 0
              C145 120 155 250 125 370
              C95 490 95 510 125 630
              C155 750 145 880 95 1000
              L180 1000
              Z
            "
            fill="white"
          />
        </svg>

        {/* Blue highlight following curve */}
        <svg
          className="absolute right-[165px] top-0 z-10 h-full w-[55px]"
          viewBox="0 0 55 1000"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="
              M55 0
              L25 0
              C48 120 52 250 38 370
              C24 490 24 510 38 630
              C52 750 48 880 25 1000
              L55 1000
              Z
            "
            fill="rgb(56 189 248 / 0.45)"
          />
        </svg>
      </section>

      {/* =====================================================
          RIGHT - LOGIN FORM
      ====================================================== */}
      <section className="flex min-h-screen w-full items-center justify-center bg-white px-6 py-12 lg:w-[52%] lg:px-16 xl:px-24">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-700">
              <svg
                viewBox="0 0 64 64"
                className="h-8 w-8 text-white"
                fill="none"
              >
                <path
                  d="M32 5L55 18V46L32 59L9 46V18L32 5Z"
                  stroke="currentColor"
                  strokeWidth="5"
                />
                <path
                  d="M22 23L32 17L42 23V35L32 41L22 35V23Z"
                  fill="currentColor"
                />
              </svg>
            </div>

            <span className="text-xl font-bold text-gray-900">
              Dynamic Table Builder
            </span>
          </div>

          {/* Heading */}
          <div className="mb-10">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-blue-700">
              Welcome back
            </p>

            <h2 className="text-4xl font-bold tracking-tight text-gray-900">
              Sign in
            </h2>

            <p className="mt-3 text-gray-500">
              Sign in to continue to Dynamic Table Builder.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-semibold text-gray-800"
              >
                Email address
              </label>

              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <path d="M20 21a8 8 0 0 0-16 0" strokeLinecap="round" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>

                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-xl border border-gray-200 bg-white py-3.5 pl-12 pr-4 text-gray-900 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-gray-800"
                >
                  Password
                </label>

                <button
                  type="button"
                  className="text-sm font-semibold text-blue-600 transition hover:text-blue-700"
                  onClick={() => {
                    toast.info("Forgot password", {
                      description:
                        "Password reset functionality belum tersedia.",
                    });
                  }}
                >
                  Forgot password?
                </button>
              </div>

              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <rect x="4" y="10" width="16" height="11" rx="2" />
                    <path d="M8 10V7a4 4 0 0 1 8 0v3" strokeLinecap="round" />
                  </svg>
                </div>

                <input
                  id="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-xl border border-gray-200 bg-white py-3.5 pl-12 pr-4 text-gray-900 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>
            </div>

            {/* Remember me */}
            <div className="flex items-center justify-between">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />

                <span className="text-sm text-gray-600">Remember me</span>
              </label>
            </div>

            {/* Login button */}
            <button
              type="submit"
              disabled={loading}
              className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-semibold text-white shadow-lg transition ${
                loading
                  ? "cursor-not-allowed bg-blue-400"
                  : "bg-blue-700 shadow-blue-700/20 hover:bg-blue-800 hover:shadow-blue-700/30"
              }`}
            >
              {loading ? (
                <>
                  <svg
                    className="h-5 w-5 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="9"
                      className="opacity-30"
                      stroke="currentColor"
                      strokeWidth="3"
                    />
                    <path
                      d="M21 12a9 9 0 0 0-9-9"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  </svg>
                  Signing in{dots}
                </>
              ) : (
                <>
                  <span>Sign in</span>

                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M5 12h13" strokeLinecap="round" />
                    <path
                      d="M13 6l6 6-6 6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="mt-10 text-center text-xs text-gray-400">
            © 2026 Dynamic Table Builder. All rights reserved.
          </p>
        </div>
      </section>
    </div>
  );
}

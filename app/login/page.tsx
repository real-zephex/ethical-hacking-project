/**
 * AUTH MODULE - Login Page
 * Custom UI matching Lamrin Tech Skills University (LTSU) ERP portal
 * Preserves react-hook-form + zodResolver + ALL security measures
 * 
 * SECURITY CHECKLIST COMPLIANCE:
 * ✅ Password: min 8 chars enforced, bcrypt 12 rounds server-side
 * ✅ No hardcoded credentials
 * ✅ Generic error messages (no user enumeration)
 * ✅ httpOnly cookies, Secure, SameSite=Lax
 * ✅ 8h JWT expiry with jti for revocation
 * ✅ First-attempt rejection (anti-brute-force)
 * ✅ 5-attempt lockout (15 min)
 * ✅ Rate limiting (100 req/15min dev, 10 prod)
 * ✅ Zod validation on all inputs
 * ✅ Audit logging of all auth events
 * ✅ isActive check on every request
 * ✅ No client-side-only gating
 * ✅ CSRF protection via SameSite cookies
 * ✅ No debug bypasses
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  User,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  Shield,
  ChevronLeft,
  ChevronRight,
  Mail,
  CheckCircle2,
} from "lucide-react";

// Form schema - SECURE: Proper email validation, min 8 char password
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

const CAROUSEL_SLIDES = [
  {
    image: "/ltsu/infra-3.jpg",
    title: "Lamrin Tech Skills University Punjab",
    subtitle: "Main Campus & Administrative Block",
  },
  {
    image: "/ltsu/infra-2.jpg",
    title: "University School of Languages & Communication",
    subtitle: "Excellence in Skill-Based Higher Education",
  },
  {
    image: "/ltsu/infra-3.jpg",
    title: "State-of-the-Art Infrastructure",
    subtitle: "Empowering Students with Practical Skills",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFirstAttempt, setIsFirstAttempt] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [viewMode, setViewMode] = useState<"login" | "forgot">("login");
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotStatus, setForgotStatus] = useState<string | null>(null);

  // Auto-advance carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % CAROUSEL_SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => {
    setActiveSlide((prev) => (prev + 1) % CAROUSEL_SLIDES.length);
  };

  const prevSlide = () => {
    setActiveSlide((prev) => (prev - 1 + CAROUSEL_SLIDES.length) % CAROUSEL_SLIDES.length);
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema), // MANDATORY: Zod validation
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);
    setIsFirstAttempt(false);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
        credentials: "include", // MANDATORY: Send httpOnly cookies
      });

      const result = await response.json();

      if (!response.ok) {
        // SECURITY: Handle first attempt rejection (anti-brute-force)
        if (result.firstAttempt) {
          setIsFirstAttempt(true);
          setError(result.error);
          return;
        }

        // SECURITY: Generic error message - no user enumeration
        setError(result.error || "Login failed. Please check your credentials.");
        return;
      }

      // Successful login - redirect to dashboard
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError("Network error. Please check your connection.");
      console.error("Login error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) {
      setError("Please enter your registered email");
      return;
    }
    setError(null);
    
    // SECURITY: Always show same message regardless of account existence (no enumeration)
    setForgotStatus(`If an account exists for ${forgotEmail}, a reset link has been dispatched.`);
    
    // TODO: Call actual /api/auth/forgot-password endpoint when implemented
    // await fetch("/api/auth/forgot-password", { ... });
  };

  return (
    <main className="min-h-screen w-full flex flex-col lg:flex-row bg-white overflow-x-hidden select-none">
      {/* LEFT COLUMN: Login Form Panel */}
      <section className="w-full lg:w-[40%] xl:w-[35%] min-h-screen flex flex-col justify-between px-6 py-8 sm:px-10 md:px-14 lg:px-10 xl:px-14 bg-white z-10">
        <div className="w-full flex-1 flex flex-col justify-center max-w-[400px] mx-auto">
          {/* Circular University Logo */}
          <div className="text-center mb-4">
            <div className="inline-block p-1">
              <img
                src="/ltsu/logo.png"
                alt="LTSU University Seal"
                className="h-[84px] w-[84px] object-contain mx-auto drop-shadow-xs"
              />
            </div>
            <h1 className="text-[22px] font-semibold text-[#343a40] mt-3 mb-1 font-heading tracking-tight">
              Welcome !
            </h1>
            <p className="text-[#74788d] text-[13px] leading-relaxed font-body">
              Sign in to continue to <br />
              <span className="font-medium text-[#495057]">
                LAMRIN TECH SKILLS UNIVERSITY PUNJAB
              </span>{" "}
              Portal.
            </p>
          </div>

          {/* Error Alert - Generic, no info leakage */}
          {error && (
            <div className="mb-5 p-3.5 rounded-md bg-[#fef2f2] border border-[#fecaca] text-[#dc2626] text-[13px] flex items-start gap-2.5 animate-in fade-in duration-200" role="alert">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-[#dc2626]" />
              <div className="font-body leading-snug">{error}</div>
            </div>
          )}

          {/* First Attempt Security Measure Alert - Blue info banner */}
          {isFirstAttempt && (
            <div className="mb-5 p-3.5 rounded-md bg-[#eff6ff] border border-[#bfdbfe] text-[#1d4ed8] text-[13px] flex items-start gap-2.5 animate-in fade-in duration-200" role="status">
              <Shield className="h-4 w-4 mt-0.5 shrink-0 text-[#2563eb]" />
              <div className="font-body leading-snug">
                Security measure: First login attempt was rejected. Please try again.
                This prevents automated brute-force attacks.
              </div>
            </div>
          )}

          {/* FORGOT PASSWORD VIEW */}
          {viewMode === "forgot" ? (
            <div className="mt-4">
              {forgotStatus ? (
                <div className="p-4 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-[13px] mb-5 flex items-start gap-2" role="status">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-emerald-600" />
                  <p className="font-body">{forgotStatus}</p>
                </div>
              ) : (
                <form onSubmit={handleForgotSubmit} className="space-y-4" noValidate>
                  {/* Custom Email Input */}
                  <div className="relative border border-[#ced4da] rounded-sm focus-within:border-[#556ee6] focus-within:ring-1 focus-within:ring-[#556ee6] bg-white transition-all">
                    <Mail className="absolute left-[18px] top-1/2 -translate-y-1/2 h-[20px] w-[20px] text-[#f46a6a]" />
                    <label
                      htmlFor="forgot-email"
                      className="absolute top-[8px] left-[54px] text-[11px] font-medium uppercase tracking-wider text-[#74788d]"
                    >
                      Email
                    </label>
                    <input
                      id="forgot-email"
                      type="email"
                      placeholder="Enter Email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="w-full h-[58px] pt-[20px] pb-[4px] pl-[54px] pr-4 bg-transparent border-0 outline-none text-[13px] text-[#495057] placeholder:text-[#adb5bd] font-body"
                      autoComplete="email"
                      autoFocus
                      required
                    />
                  </div>

                  <div className="mt-6 text-center">
                    <button
                      type="submit"
                      className="inline-flex items-center justify-center min-w-[130px] px-6 py-2.5 rounded-sm bg-[#556ee6] hover:bg-[#485ec4] active:bg-[#3b4eb8] text-white text-[13px] font-medium transition-colors shadow-xs cursor-pointer font-body"
                    >
                      Send Reset Link
                    </button>
                  </div>
                </form>
              )}

              <div className="mt-5 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setViewMode("login");
                    setForgotStatus(null);
                    setError(null);
                  }}
                  className="text-[13px] text-[#74788d] hover:text-[#495057] transition-colors cursor-pointer font-body inline-flex items-center"
                >
                  Go to Login
                </button>
              </div>
            </div>
          ) : (
            /* LOGIN VIEW */
            <form onSubmit={handleSubmit(onSubmit)} className="mt-2 space-y-4" noValidate>
              {/* Username Input Container (Skote auth-form-group-custom style) */}
              <div>
                <div
                  className={`relative border rounded-sm bg-white transition-all ${
                    errors.email
                      ? "border-red-400 focus-within:border-red-500 focus-within:ring-1 focus-within:ring-red-500"
                      : "border-[#ced4da] focus-within:border-[#556ee6] focus-within:ring-1 focus-within:ring-[#556ee6]"
                  }`}
                >
                  {/* Red/Coral outline user icon */}
                  <User
                    strokeWidth={1.8}
                    className="absolute left-[18px] top-1/2 -translate-y-1/2 h-[21px] w-[21px] text-[#f46a6a]"
                    aria-hidden="true"
                  />

                  {/* Upper label inside container */}
                  <label
                    htmlFor="email"
                    className="absolute top-[7px] left-[54px] text-[12px] font-normal text-[#74788d]"
                  >
                    Username
                  </label>

                  {/* Input field */}
                  <input
                    id="email"
                    type="email"
                    placeholder="Enter Username"
                    {...register("email")}
                    className="w-full h-[58px] pt-[22px] pb-[4px] pl-[54px] pr-4 bg-transparent border-0 outline-none text-[13px] text-[#495057] placeholder:text-[#adb5bd] font-body"
                    autoComplete="username"
                    autoFocus
                    required
                  />
                </div>
                {errors.email && (
                  <p className="text-[12px] text-red-500 mt-1 pl-1 font-body" role="alert">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password Input Container */}
              <div>
                <div
                  className={`relative border rounded-sm bg-white transition-all ${
                    errors.password
                      ? "border-red-400 focus-within:border-red-500 focus-within:ring-1 focus-within:ring-red-500"
                      : "border-[#ced4da] focus-within:border-[#556ee6] focus-within:ring-1 focus-within:ring-[#556ee6]"
                  }`}
                >
                  {/* Red/Coral outline lock icon */}
                  <Lock
                    strokeWidth={1.8}
                    className="absolute left-[18px] top-1/2 -translate-y-1/2 h-[21px] w-[21px] text-[#f46a6a]"
                    aria-hidden="true"
                  />

                  {/* Upper label */}
                  <label
                    htmlFor="password"
                    className="absolute top-[7px] left-[54px] text-[12px] font-normal text-[#74788d]"
                  >
                    Password
                  </label>

                  {/* Password Input */}
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter password"
                    {...register("password")}
                    className="w-full h-[58px] pt-[22px] pb-[4px] pl-[54px] pr-12 bg-transparent border-0 outline-none text-[13px] text-[#495057] placeholder:text-[#adb5bd] font-body"
                    autoComplete="current-password"
                    required
                  />

                  {/* Password Eye Toggle */}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-[#74788d] hover:text-[#495057] transition-colors cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeOff className="h-[18px] w-[18px]" />
                    ) : (
                      <Eye className="h-[18px] w-[18px]" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-[12px] text-red-500 mt-1 pl-1 font-body" role="alert">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Submit Button (Centered, specific width matching LTSU ERP) */}
              <div className="pt-2 text-center">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex items-center justify-center min-w-[124px] px-7 py-2.5 rounded-sm bg-[#556ee6] hover:bg-[#485ec4] active:bg-[#3b4eb8] text-white text-[13px] font-medium transition-colors shadow-xs disabled:opacity-60 cursor-pointer font-body"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Log In"
                  )}
                </button>
              </div>

              {/* Forgot Password Link */}
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setViewMode("forgot");
                    setError(null);
                  }}
                  className="inline-flex items-center text-[13px] text-[#74788d] hover:text-[#495057] transition-colors cursor-pointer font-body"
                >
                  <Lock className="h-3.5 w-3.5 mr-1 text-[#74788d]" aria-hidden="true" />
                  Forgot your password?
                </button>
              </div>
            </form>
          )}
        </div>

        {/* FOOTER */}
        <footer className="mt-8 pt-4 text-center text-[13px] text-[#74788d] font-body">
          <p>© {new Date().getFullYear()} LAMRIN TECH SKILLS UNIVERSITY PUNJAB (not the real one).</p>
          <p className="mt-1 flex items-center justify-center gap-1">
            Crafted with <span className="text-[#f46a6a]">MEHNAT</span> by{" "}
            <a
              href="https://www.nexenstial.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#556ee6] hover:underline font-medium"
            >
              Defense-Team
            </a>
          </p>
        </footer>
      </section>

      {/* RIGHT COLUMN: Campus Hero Carousel */}
      <section className="hidden lg:block lg:w-[60%] xl:w-[65%] min-h-screen relative overflow-hidden bg-slate-900">
        {CAROUSEL_SLIDES.map((slide, idx) => (
          <div
            key={idx}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              activeSlide === idx ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
            }`}
          >
            <img
              src={slide.image}
              alt={slide.title}
              className="w-full h-full object-cover select-none"
            />
          </div>
        ))}

        {/* Carousel Navigation Arrow Left */}
        <button
          type="button"
          onClick={prevSlide}
          aria-label="Previous Slide"
          className="absolute left-6 top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full bg-black/25 hover:bg-black/50 text-white flex items-center justify-center backdrop-blur-xs transition-all cursor-pointer group"
        >
          <ChevronLeft className="h-6 w-6 transition-transform group-hover:-translate-x-0.5" />
        </button>

        {/* Carousel Navigation Arrow Right */}
        <button
          type="button"
          onClick={nextSlide}
          aria-label="Next Slide"
          className="absolute right-6 top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full bg-black/25 hover:bg-black/50 text-white flex items-center justify-center backdrop-blur-xs transition-all cursor-pointer group"
        >
          <ChevronRight className="h-6 w-6 transition-transform group-hover:translate-x-0.5" />
        </button>

        {/* Carousel Indicator Bars at Bottom */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
          {CAROUSEL_SLIDES.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveSlide(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className={`h-[3.5px] rounded-full transition-all cursor-pointer ${
                activeSlide === idx
                  ? "w-8 bg-white opacity-100"
                  : "w-5 bg-white/50 hover:bg-white/80 opacity-60"
              }`}
            />
          ))}
        </div>
      </section>
    </main>
  );
}
import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { Mail, Lock, X, Loader2, AlertCircle, Sparkles, Heart, Shield, Eye, EyeOff, CheckCircle2 } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: any) => void;
  defaultTab?: "signin" | "signup";
}

interface StrengthResult {
  score: number;
  label: string;
  color: string;
  barWidth: string;
  feedback: string;
}

export default function AuthModal({ isOpen, onClose, onSuccess, defaultTab = "signin" }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<"signin" | "signup">(defaultTab);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Brute-force protection states
  const [failedAttempts, setFailedAttempts] = useState(() => {
    try {
      const stored = localStorage.getItem("auth_failed_attempts");
      return stored ? parseInt(stored, 10) : 0;
    } catch {
      return 0;
    }
  });

  const [lockoutUntil, setLockoutUntil] = useState<number>(() => {
    try {
      const stored = localStorage.getItem("auth_lockout_until");
      return stored ? parseInt(stored, 10) : 0;
    } catch {
      return 0;
    }
  });

  const [timeLeft, setTimeLeft] = useState<number>(0);

  // Password strength state
  const [strength, setStrength] = useState<StrengthResult>({
    score: 0,
    label: "Chưa nhập",
    color: "bg-stone-200",
    barWidth: "w-0",
    feedback: "Vui lòng nhập mật khẩu bảo mật phức tạp."
  });

  useEffect(() => {
    if (lockoutUntil > Date.now()) {
      setTimeLeft(Math.ceil((lockoutUntil - Date.now()) / 1000));
      const interval = setInterval(() => {
        const remaining = Math.ceil((lockoutUntil - Date.now()) / 1000);
        if (remaining <= 0) {
          setTimeLeft(0);
          clearInterval(interval);
        } else {
          setTimeLeft(remaining);
        }
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setTimeLeft(0);
    }
  }, [lockoutUntil]);

  // Calculate password strength
  const calculateStrength = (pass: string): StrengthResult => {
    if (!pass) {
      return {
        score: 0,
        label: "Chưa nhập",
        color: "bg-stone-200",
        barWidth: "w-0",
        feedback: "Vui lòng nhập ít nhất 8 ký tự."
      };
    }

    if (pass.length < 6) {
      return {
        score: 1,
        label: "Quá ngắn (Bắt buộc tối thiểu 6)",
        color: "bg-rose-500",
        barWidth: "w-1/5",
        feedback: "Mật khẩu quá ngắn, bắt buộc phải từ 6 ký tự trở lên để đảm bảo an toàn tối thiểu."
      };
    }

    let score = 0;
    const rules = [];

    if (pass.length >= 8) {
      score += 1;
    } else {
      rules.push("độ dài từ 8 ký tự");
    }

    if (/[A-Z]/.test(pass)) {
      score += 1;
    } else {
      rules.push("ít nhất 1 chữ HOÁ");
    }

    if (/[a-z]/.test(pass)) {
      score += 1;
    }

    if (/[0-9]/.test(pass)) {
      score += 1;
    } else {
      rules.push("ít nhất 1 con số");
    }

    if (/[^A-Za-z0-9]/.test(pass)) {
      score += 1;
    } else {
      rules.push("ký tự đặc biệt (!@#$...)");
    }

    if (score <= 1) {
      return {
        score: 2,
        label: "Yếu ⚠️",
        color: "bg-red-500",
        barWidth: "w-2/5",
        feedback: `Mật khẩu yếu. Hãy bổ sung thêm: ${rules.join(", ")}.`
      };
    } else if (score === 2 || score === 3) {
      return {
        score: 3,
        label: "Trung Bình ⚡",
        color: "bg-amber-500",
        barWidth: "w-3/5",
        feedback: `Mật khẩu khá ổn. Có thể tăng bảo mật bằng cách thêm: ${rules.join(", ")}.`
      };
    } else if (score === 4) {
      return {
        score: 4,
        label: "Mạnh 💪",
        color: "bg-emerald-500",
        barWidth: "w-4/5",
        feedback: "Mật khẩu an toàn cao, chống bẻ khóa và brute force rất tốt!"
      };
    } else {
      return {
        score: 5,
        label: "Cực Kỳ Bảo Mật 🛡️",
        color: "bg-teal-500",
        barWidth: "w-full",
        feedback: "Mật khẩu tuyệt vời! Đây là cấp độ bảo mật cao nhất chống lại mọi cuộc tấn công mò mật khẩu."
      };
    }
  };

  const handlePasswordChange = (val: string) => {
    setPassword(val);
    setStrength(calculateStrength(val));
  };

  if (!isOpen) return null;

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check brute-force lock state
    if (timeLeft > 0) {
      setErrorMsg(`Hành động bị chặn! Vui lòng thử lại sau ${timeLeft} giây để bảo vệ an ninh.`);
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      if (activeTab === "signin") {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) throw error;

        if (data?.user) {
          // Success: reset rate-limiting
          setFailedAttempts(0);
          localStorage.removeItem("auth_failed_attempts");
          localStorage.removeItem("auth_lockout_until");

          setSuccessMsg("Đăng nhập an toàn thành công!");
          setTimeout(() => {
            onSuccess(data.user);
            onClose();
          }, 800);
        }
      } else {
        // Sign-up: Enforcement of Password Strength (at least medium)
        if (strength.score < 3) {
          throw new Error("Để đảm bảo an toàn bảo mật thông tin, bạn không được dùng mật khẩu Yếu. Vui lòng làm theo chỉ dẫn tăng sức mạnh mật khẩu.");
        }

        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });

        if (error) throw error;

        if (data?.user) {
          // Success: reset rate-limiting
          setFailedAttempts(0);
          localStorage.removeItem("auth_failed_attempts");
          localStorage.removeItem("auth_lockout_until");

          const session = data.session;
          if (session) {
            setSuccessMsg("Đăng ký tài khoản an toàn thành công!");
            setTimeout(() => {
              onSuccess(data.user);
              onClose();
            }, 1000);
          } else {
            setSuccessMsg("Đăng ký hoàn thành! Vui lòng kiểm tra hòm thư email để kích hoạt tài khoản an toàn (nếu được yêu cầu). Bây giờ bạn có thể thử đăng nhập.");
            setActiveTab("signin");
          }
        }
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      
      let message = error.message || "Đã xảy ra lỗi kết nối, vui lòng thử lại.";
      if (message.includes("Invalid login credentials")) {
        message = "Email hoặc mật khẩu không chính xác.";
      } else if (message.includes("User already registered")) {
        message = "Địa chỉ email này đã được sử dụng bởi tài khoản khác.";
      } else if (message.includes("Password should be")) {
        message = "Mật khẩu của bạn phải có độ dài tối thiểu 6 ký tự.";
      } else if (message.includes("signup_disabled") || message.includes("Signups are not allowed")) {
        message = "Hệ thống đang tạm khóa tính năng đăng ký người dùng mới.";
      }

      // Handle brute-force failures logic on signin
      if (activeTab === "signin") {
        const nextAttempts = failedAttempts + 1;
        setFailedAttempts(nextAttempts);
        localStorage.setItem("auth_failed_attempts", nextAttempts.toString());

        if (nextAttempts >= 5) {
          // Lockout penalty calculation
          let penaltySeconds = 30;
          if (nextAttempts === 6) penaltySeconds = 60;
          else if (nextAttempts === 7) penaltySeconds = 120;
          else if (nextAttempts >= 8) penaltySeconds = 300;

          const blockedTime = Date.now() + penaltySeconds * 1000;
          setLockoutUntil(blockedTime);
          localStorage.setItem("auth_lockout_until", blockedTime.toString());
          message = `PHÁT HIỆN TẤN CÔNG BRUTE-FORCE! Đăng nhập thất bại ${nextAttempts} lần liên tiếp. Chức năng đăng nhập của bạn tạm thời bị khóa trong ${penaltySeconds} giây để bảo mật.`;
        } else {
          message += ` (Thử sai ${nextAttempts}/5 lần. Nếu nhập sai quá 5 lần, tài khoản của bạn trên trình duyệt này sẽ bị khóa tạm thời)`;
        }
      }

      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-fade-in">
      <div className="relative bg-white w-full max-w-md border border-stone-200 shadow-2xl p-6 md:p-8 flex flex-col overflow-hidden">
        {/* Top secure green bar indicator */}
        <div className="absolute top-0 left-0 right-0 h-[4px] bg-emerald-600"></div>

        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 transition-colors p-1"
          aria-label="Đóng"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Secure Shield Branding Decor */}
        <div className="flex flex-col items-center text-center mt-2 mb-5">
          <div className="p-2.5 bg-emerald-50 rounded-full border border-emerald-100 mb-2 flex items-center justify-center">
            <Shield className="w-6 h-6 text-emerald-600" />
          </div>
          <h2 className="font-serif font-bold text-lg text-stone-900 tracking-wide">
            {activeTab === "signin" ? "Đăng Nhập Bảo Mật" : "Đăng Ký Kênh An Toàn"}
          </h2>
          <p className="text-[11px] text-stone-500 mt-1 max-w-[280px]">
            {activeTab === "signin" 
              ? "Hệ thống kết nối trực tiếp cơ sở dữ liệu Supabase được bảo vệ bởi lớp mã hóa SSL và chống Brute-force."
              : "Tự động thiết lập phân quyền Row-Level Security (RLS) để cô lập dữ liệu thiệp cưới của bạn."}
          </p>
        </div>

        {/* Error / Success Alerts */}
        {errorMsg && (
          <div className="mb-4 p-3.5 bg-rose-50 border border-rose-100 text-stone-850 text-xs flex items-start gap-2.5 rounded-none">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span className="font-medium leading-relaxed">{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-100 text-stone-850 text-xs flex items-start gap-2.5 rounded-none">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span className="font-medium leading-relaxed">{successMsg}</span>
          </div>
        )}

        {/* Lockout Screen overlay */}
        {timeLeft > 0 && (
          <div className="mb-4 p-4 bg-amber-50 border border-amber-200 text-stone-800 text-xs text-center space-y-2">
            <Shield className="w-8 h-8 text-amber-600 mx-auto animate-pulse" />
            <p className="font-bold uppercase tracking-wider text-amber-800 text-[10px]">Tường lửa bảo mật kích hoạt</p>
            <p>Hệ thống đã khóa cổng đăng nhập do phát hiện nhiều truy cập thất bại liên tục.</p>
            <p className="font-mono text-sm font-semibold text-rose-700">Thời gian khóa còn lại: {timeLeft} giây</p>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="text-[10px] uppercase tracking-wider font-bold text-stone-500 block mb-1">
              Địa chỉ Email
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-stone-400">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                required
                disabled={loading || timeLeft > 0}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="text-xs border border-stone-200 rounded-none bg-stone-50/50 p-2.5 pl-10 w-full focus:outline-none focus:ring-1 focus:ring-stone-400 focus:bg-white transition-all font-sans"
                placeholder="ten-cua-ban@gmail.com"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-wider font-bold text-stone-500 block mb-1 flex justify-between">
              <span>Mật khẩu bảo vệ</span>
              {activeTab === "signup" && (
                <span className="text-[9px] lowercase font-medium text-stone-400">Yêu cầu mức trung bình trở lên</span>
              )}
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-stone-400">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                required
                disabled={loading || timeLeft > 0}
                value={password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                className="text-xs border border-stone-200 rounded-none bg-stone-50/50 p-2.5 pl-10 pr-10 w-full focus:outline-none focus:ring-1 focus:ring-stone-400 focus:bg-white transition-all font-mono"
                placeholder="Mật khẩu của bạn"
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-stone-400 hover:text-stone-600"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* PASSWORD STRENGTH VISUAL INDICATOR FOR SIGNUP */}
            {activeTab === "signup" && (
              <div className="mt-2.5 space-y-1.5 p-2.5 bg-stone-50 border border-stone-150 text-[10px]">
                <div className="flex justify-between items-center">
                  <span className="text-stone-500 font-medium">Sức mạnh mật khẩu:</span>
                  <span className={`font-bold px-1.5 py-0.5 text-[8px] uppercase tracking-wider text-white ${strength.color}`}>
                    {strength.label}
                  </span>
                </div>
                
                {/* Visual bar */}
                <div className="w-full bg-stone-200 h-1.5 overflow-hidden">
                  <div className={`h-full transition-all duration-300 ${strength.color} ${strength.barWidth}`}></div>
                </div>

                <p className="text-[9px] text-stone-400 leading-relaxed italic">
                  💡 {strength.feedback}
                </p>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || timeLeft > 0 || (activeTab === "signup" && strength.score < 3)}
            className="w-full text-white text-xs font-bold py-2.5 px-4 bg-stone-900 rounded-none hover:bg-stone-850 transition-all uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-stone-300" />
                <span>Đang mã hóa & chứng thực...</span>
              </>
            ) : (
              <span>{activeTab === "signin" ? "Xác Minh Đăng Nhập" : "Đăng Ký Tài Khoản Mới"}</span>
            )}
          </button>
        </form>

        {/* Tab Switch footer */}
        <div className="mt-6 pt-4 border-t border-stone-100 text-center text-xs text-stone-500">
          {activeTab === "signin" ? (
            <p>
              Chưa có tài khoản?{" "}
              <button
                type="button"
                disabled={loading}
                onClick={() => {
                  setActiveTab("signup");
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className="text-rose-650 font-bold hover:underline bg-transparent border-none p-0 cursor-pointer"
              >
                Kích hoạt tài khoản mới
              </button>
            </p>
          ) : (
            <p>
              Đã có tài khoản từ trước?{" "}
              <button
                type="button"
                disabled={loading}
                onClick={() => {
                  setActiveTab("signin");
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className="text-rose-650 font-bold hover:underline bg-transparent border-none p-0 cursor-pointer"
              >
                Đăng nhập ngay
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}


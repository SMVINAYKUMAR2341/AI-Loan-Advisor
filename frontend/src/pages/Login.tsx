"use client";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { SmokeyBackground } from "@/components/ui/login-form";
import { login } from "@/services/api";
import { Phone, Lock, ArrowRight, RefreshCw, Shield, User, Mail, KeyRound } from "lucide-react";

// Generate random CAPTCHA
function generateCaptcha(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let captcha = "";
    for (let i = 0; i < 6; i++) {
        captcha += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return captcha;
}

export default function Login() {
    const navigate = useNavigate();
    const [mobileNumber, setMobileNumber] = useState("");
    const [customerId, setCustomerId] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [pin, setPin] = useState("");
    const [captchaInput, setCaptchaInput] = useState("");
    const [captchaCode, setCaptchaCode] = useState(generateCaptcha());
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const refreshCaptcha = () => {
        setCaptchaCode(generateCaptcha());
        setCaptchaInput("");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        // Validate CAPTCHA
        if (captchaInput.toUpperCase() !== captchaCode) {
            setError("Invalid verification code");
            refreshCaptcha();
            return;
        }

        // Validate mobile number
        if (!/^\d{10}$/.test(mobileNumber)) {
            setError("Please enter a valid 10-digit mobile number");
            return;
        }

        // Validate customer ID
        if (!customerId.trim()) {
            setError("Please enter your Customer ID");
            return;
        }

        // Validate email
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setError("Please enter a valid email address");
            return;
        }

        // Validate password
        if (password.length < 8) {
            setError("Password must be at least 8 characters");
            return;
        }

        // Validate PIN
        if (!/^\d{4,6}$/.test(pin)) {
            setError("PIN must be 4-6 digits");
            return;
        }

        setIsLoading(true);
        try {
            // Login API with all credentials
            const result = await login({
                mobile_number: mobileNumber,
                password,
                customer_id: customerId,
                email,
                pin
            });

            // JWT token is automatically stored by the login function
            // Redirect to dashboard
            navigate("/dashboard", { replace: true });
        } catch (err) {
            setError(err instanceof Error ? err.message : "Login failed");
            refreshCaptcha();
        } finally {
            setIsLoading(false);
        }
    };

    const inputClass =
        "w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors";
    const labelClass = "block text-sm font-medium text-gray-300 mb-2";

    return (
            <main className="relative min-h-screen bg-gray-900">
                <SmokeyBackground className="fixed inset-0" />
                <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
                    <div className="w-full max-w-md p-8 bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 shadow-2xl max-h-[90vh] overflow-y-auto">
                        {/* Back to Home Link */}
                        <div className="mb-4">
                            <Link
                                to="/"
                                className="inline-flex items-center text-blue-400 hover:text-blue-300 font-semibold text-sm transition"
                            >
                                <ArrowRight className="mr-1 h-4 w-4 rotate-180" /> Back to Home
                            </Link>
                        </div>
                        {/* Header */}
                        <div className="text-center mb-6">
                        <div className="w-14 h-14 mx-auto mb-3 bg-blue-500/20 rounded-full flex items-center justify-center">
                            <Shield className="w-7 h-7 text-blue-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white">Welcome Back</h2>
                        <p className="mt-1 text-gray-300 text-sm">Sign in to your account</p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Mobile Number */}
                        <div>
                            <label className={labelClass}>
                                <Phone className="inline-block mr-2 -mt-0.5" size={14} />
                                Mobile Number
                            </label>
                            <input
                                type="text"
                                value={mobileNumber}
                                onChange={(e) =>
                                    setMobileNumber(e.target.value.replace(/\D/g, "").slice(0, 10))
                                }
                                placeholder="Enter 10-digit mobile number"
                                className={inputClass}
                                required
                            />
                        </div>

                        {/* Customer ID */}
                        <div>
                            <label className={labelClass}>
                                <User className="inline-block mr-2 -mt-0.5" size={14} />
                                Customer ID
                            </label>
                            <input
                                type="text"
                                value={customerId}
                                onChange={(e) => setCustomerId(e.target.value.toUpperCase())}
                                placeholder="Enter your Customer ID"
                                className={inputClass}
                                required
                            />
                        </div>

                        {/* Email */}
                        <div>
                            <label className={labelClass}>
                                <Mail className="inline-block mr-2 -mt-0.5" size={14} />
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email"
                                className={inputClass}
                                required
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label className={labelClass}>
                                <Lock className="inline-block mr-2 -mt-0.5" size={14} />
                                Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                className={inputClass}
                                required
                            />
                        </div>

                        {/* PIN */}
                        <div>
                            <label className={labelClass}>
                                <KeyRound className="inline-block mr-2 -mt-0.5" size={14} />
                                PIN
                            </label>
                            <input
                                type="password"
                                value={pin}
                                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                placeholder="Enter 4-6 digit PIN"
                                className={inputClass}
                                required
                            />
                        </div>

                        {/* CAPTCHA */}
                        <div>
                            <label className={labelClass}>Verification Code</label>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="flex-1 px-4 py-2.5 bg-white/10 border border-white/20 rounded-lg font-mono text-lg tracking-widest text-white select-none text-center">
                                    {captchaCode}
                                </div>
                                <button
                                    type="button"
                                    onClick={refreshCaptcha}
                                    className="p-2.5 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 transition"
                                    aria-label="Refresh CAPTCHA"
                                >
                                    <RefreshCw className="w-5 h-5 text-white" />
                                </button>
                            </div>
                            <input
                                type="text"
                                value={captchaInput}
                                onChange={(e) => setCaptchaInput(e.target.value.toUpperCase())}
                                placeholder="Enter code above"
                                className={inputClass}
                                required
                            />
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="group w-full flex items-center justify-center py-3 px-4 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500 transition-all duration-300 disabled:opacity-50"
                        >
                            {isLoading ? "Signing In..." : "Sign In"}
                            {!isLoading && (
                                <ArrowRight className="ml-2 h-5 w-5 transform group-hover:translate-x-1 transition-transform" />
                            )}
                        </button>
                    </form>

                    {/* Footer Links */}
                    <div className="mt-6 pt-4 border-t border-white/10">
                        <p className="text-center text-sm text-gray-400">
                            Don't have an account?{" "}
                            <Link
                                to="/signup"
                                className="font-semibold text-blue-400 hover:text-blue-300 transition"
                            >
                                Sign Up
                            </Link>
                        </p>
                    </div>

                    {/* Security Badge */}
                    <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500">
                        <Lock size={12} />
                        <span>Your data is encrypted with banking-grade protection</span>
                    </div>
                </div>
            </div>
        </main>
    );
}

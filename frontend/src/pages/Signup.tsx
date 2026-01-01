"use client";
import { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { SmokeyBackground } from "@/components/ui/login-form";
import { signup } from "@/services/api";
import { Phone, Mail, Lock, RefreshCw, ArrowRight, ArrowLeft, Check, Shield, User, MapPin, FileText, PenTool, Eye, EyeOff, Home, Key } from "lucide-react";

// Generate random CAPTCHA
function generateCaptcha(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let captcha = "";
    for (let i = 0; i < 6; i++) {
        captcha += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return captcha;
}

// Password strength calculator
function calculatePasswordStrength(password: string): { score: number; label: string; color: string } {
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 2) return { score: 25, label: "Weak", color: "#ef4444" };
    if (score <= 3) return { score: 50, label: "Fair", color: "#f59e0b" };
    if (score <= 4) return { score: 75, label: "Good", color: "#3b82f6" };
    return { score: 100, label: "Strong", color: "#22c55e" };
}

// Indian states list
const INDIAN_STATES = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa",
    "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala",
    "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland",
    "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
    "Uttar Pradesh", "Uttarakhand", "West Bengal"
];

interface FormData {
    // Step 1: Account Creation
    mobileNumber: string;
    email: string;
    password: string;
    confirmPassword: string;
    pin: string;
    confirmPin: string;
    securityHint: string;
    termsConsent: boolean;
    privacyConsent: boolean;
    dataConsent: boolean;
    rememberDevice: boolean;
    enablePasskey: boolean;
    // Step 2: Personal Details
    title: string;
    firstName: string;
    middleName: string;
    lastName: string;
    dob: string;
    gender: string;
    // Step 3: Address
    address1: string;
    address2: string;
    city: string;
    state: string;
    pincode: string;
    sameAddress: boolean;
    // Step 4: KYC
    panNumber: string;
    aadhaarNumber: string;
    aadhaarConsent: boolean;
    kycSkipped: boolean;
    // Step 5: Final Consent
    finalConsent: boolean;
    hasSignature: boolean;
}

export default function Signup() {
    const navigate = useNavigate();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [currentStep, setCurrentStep] = useState(1);
    const [captchaCode, setCaptchaCode] = useState(generateCaptcha());
    const [captchaInput, setCaptchaInput] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [customerId, setCustomerId] = useState("");
    const [isDrawing, setIsDrawing] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passkeySetup, setPasskeySetup] = useState<"pending" | "done" | "skipped">("pending");

    const [formData, setFormData] = useState<FormData>({
        mobileNumber: "", email: "", password: "", confirmPassword: "",
        pin: "", confirmPin: "", securityHint: "",
        termsConsent: false, privacyConsent: false, dataConsent: false,
        rememberDevice: false, enablePasskey: false,
        title: "", firstName: "", middleName: "", lastName: "", dob: "", gender: "",
        address1: "", address2: "", city: "", state: "", pincode: "", sameAddress: false,
        panNumber: "", aadhaarNumber: "", aadhaarConsent: false, kycSkipped: false,
        finalConsent: false, hasSignature: false,
    });

    const stepTitles = [
        "Account Creation",
        "Personal Details",
        "Address Information",
        "KYC Verification",
        "Consent & Signature",
        "Registration Complete",
    ];
    const totalSteps = 6;

    // Password strength calculation
    const passwordStrength = useMemo(() => calculatePasswordStrength(formData.password), [formData.password]);

    const updateFormData = <K extends keyof FormData>(field: K, value: FormData[K]) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const refreshCaptcha = () => {
        setCaptchaCode(generateCaptcha());
        setCaptchaInput("");
    };

    // Signature pad setup
    useEffect(() => {
        if (currentStep === 5 && canvasRef.current) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext("2d");
            if (ctx) {
                ctx.strokeStyle = "#ffffff";
                ctx.lineWidth = 2;
                ctx.lineCap = "round";
            }
        }
    }, [currentStep]);

    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (!canvas || !ctx) return;
        setIsDrawing(true);
        const rect = canvas.getBoundingClientRect();
        ctx.beginPath();
        ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
        updateFormData("hasSignature", true);
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (!canvas || !ctx) return;
        const rect = canvas.getBoundingClientRect();
        ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
        ctx.stroke();
    };

    const handleMouseUp = () => setIsDrawing(false);

    const clearSignature = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (!canvas || !ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        updateFormData("hasSignature", false);
    };

    // Validation functions
    const validateStep1 = (): boolean => {
        setError("");
        if (!/^\d{10}$/.test(formData.mobileNumber)) { setError("Please enter a valid 10-digit mobile number"); return false; }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) { setError("Please enter a valid email address"); return false; }
        if (formData.password.length < 8) { setError("Password must be at least 8 characters"); return false; }
        if (formData.password !== formData.confirmPassword) { setError("Passwords do not match"); return false; }
        if (!/^\d{6}$/.test(formData.pin)) { setError("PIN must be exactly 6 digits"); return false; }
        if (formData.pin !== formData.confirmPin) { setError("PINs do not match"); return false; }
        if (captchaInput.toUpperCase() !== captchaCode) { setError("Invalid verification code"); refreshCaptcha(); return false; }
        if (!formData.termsConsent || !formData.privacyConsent || !formData.dataConsent) { setError("Please accept all mandatory consents"); return false; }
        return true;
    };

    const validateStep2 = (): boolean => {
        setError("");
        if (!formData.title) { setError("Please select a title"); return false; }
        if (formData.firstName.trim().length < 2) { setError("Please enter a valid first name"); return false; }
        if (formData.lastName.trim().length < 2) { setError("Please enter a valid last name"); return false; }
        if (!formData.dob) { setError("Please enter your date of birth"); return false; }
        const age = new Date().getFullYear() - new Date(formData.dob).getFullYear();
        if (age < 18) { setError("You must be at least 18 years old"); return false; }
        if (!formData.gender) { setError("Please select your gender"); return false; }
        return true;
    };

    const validateStep3 = (): boolean => {
        setError("");
        if (formData.address1.trim().length < 5) { setError("Please enter a valid address line 1"); return false; }
        if (formData.address2.trim().length < 5) { setError("Please enter a valid address line 2"); return false; }
        if (formData.city.trim().length < 2) { setError("Please enter a valid city"); return false; }
        if (!formData.state) { setError("Please select a state"); return false; }
        if (!/^\d{6}$/.test(formData.pincode)) { setError("Please enter a valid 6-digit PIN code"); return false; }
        return true;
    };

    const validateStep4 = (): boolean => {
        if (formData.kycSkipped) return true;
        setError("");
        const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
        if (!panRegex.test(formData.panNumber.toUpperCase())) { setError("Please enter a valid PAN number (Format: ABCDE1234F)"); return false; }
        if (formData.aadhaarNumber.trim().length < 4) { setError("Please enter Aadhaar last 4 digits"); return false; }
        if (!formData.aadhaarConsent) { setError("Please provide consent for Aadhaar verification"); return false; }
        return true;
    };

    const validateStep5 = (): boolean => {
        setError("");
        if (!formData.finalConsent) { setError("Please accept the terms and conditions"); return false; }
        if (!formData.hasSignature) { setError("Please provide your digital signature"); return false; }
        return true;
    };

    // Get signature data from canvas
    const getSignatureData = (): string | undefined => {
        const canvas = canvasRef.current;
        if (!canvas || !formData.hasSignature) return undefined;
        return canvas.toDataURL('image/png');
    };

    const handleSubmit = async () => {
        setIsLoading(true);
        setError("");
        try {
            // Send all form data to PostgreSQL backend
            const response = await signup({
                // Account Credentials
                mobile_number: formData.mobileNumber,
                email: formData.email,
                password: formData.password,
                pin: formData.pin,
                security_hint: formData.securityHint || undefined,

                // Consents
                terms_consent: formData.termsConsent,
                privacy_consent: formData.privacyConsent,
                data_consent: formData.dataConsent,
                remember_device: formData.rememberDevice,
                enable_passkey: formData.enablePasskey,

                // Personal Details
                title: formData.title || undefined,
                first_name: formData.firstName || undefined,
                middle_name: formData.middleName || undefined,
                last_name: formData.lastName || undefined,
                date_of_birth: formData.dob || undefined,
                gender: formData.gender || undefined,
                nationality: "Indian",

                // Address
                address_line1: formData.address1 || undefined,
                address_line2: formData.address2 || undefined,
                city: formData.city || undefined,
                state: formData.state || undefined,
                pincode: formData.pincode || undefined,
                same_as_permanent: formData.sameAddress,

                // KYC
                pan_number: formData.panNumber || undefined,
                aadhaar_last4: formData.aadhaarNumber || undefined,
                aadhaar_consent: formData.aadhaarConsent,
                kyc_skipped: formData.kycSkipped,

                // Final
                final_consent: formData.finalConsent,
                has_signature: formData.hasSignature,
                signature_data: getSignatureData(),
            });

            // Use customer_id from backend response
            setCustomerId(response.customer_id || response.id);
            setCurrentStep(6);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Registration failed");
        } finally {
            setIsLoading(false);
        }
    };

    const goToNextStep = () => {
        const validators: Record<number, () => boolean> = {
            1: validateStep1, 2: validateStep2, 3: validateStep3, 4: validateStep4, 5: validateStep5,
        };
        if (validators[currentStep] && validators[currentStep]()) {
            if (currentStep === 5) handleSubmit();
            else setCurrentStep(currentStep + 1);
        }
    };

    const skipKyc = () => {
        updateFormData("kycSkipped", true);
        setCurrentStep(5);
    };

    const inputClass = "w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors";
    const labelClass = "block text-sm text-gray-300 mb-1";
    const radioClass = "flex-1 min-w-[80px] text-center py-2 px-3 bg-white/10 border border-white/20 rounded-lg cursor-pointer hover:bg-white/15 transition";
    const radioActiveClass = "flex-1 min-w-[80px] text-center py-2 px-3 bg-blue-500/30 border-2 border-blue-400 rounded-lg cursor-pointer";
    const infoTextClass = "text-xs text-gray-400 mt-1";

    return (
        <main className="relative min-h-screen bg-gray-900">
            <SmokeyBackground className="fixed inset-0" />

            {/* Back to Home Link */}
            <Link to="/" className="fixed top-4 left-4 z-20 flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white text-sm hover:bg-white/20 transition-colors">
                <Home size={16} />
                <span>Back to Home</span>
            </Link>

            <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
                <div className="w-full max-w-xl p-6 space-y-5 bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 shadow-2xl">
                    {/* Header */}
                    <div className="text-center">
                        <div className="w-12 h-12 mx-auto mb-3 bg-white/20 rounded-full flex items-center justify-center">
                            <User className="w-6 h-6 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-white">Create Your Account</h2>
                        <p className="mt-1 text-sm text-gray-300">Start your secure loan application journey</p>
                        <p className="mt-2 text-sm text-gray-400">Step {currentStep} of {totalSteps}: {stepTitles[currentStep - 1]}</p>
                        <div className="mt-3 w-full bg-white/20 rounded-full h-2">
                            <div className="bg-blue-500 h-2 rounded-full transition-all duration-300" style={{ width: `${(currentStep / totalSteps) * 100}%` }} />
                        </div>
                    </div>

                    {error && <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm">{error}</div>}

                    {/* STEP 1: Account Creation */}
                    {currentStep === 1 && (
                        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                            {/* Mobile Number */}
                            <div>
                                <label className={labelClass}><Phone className="inline mr-1" size={14} />Mobile Number <span className="text-red-400">*</span></label>
                                <input type="text" value={formData.mobileNumber} onChange={(e) => updateFormData("mobileNumber", e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="Enter 10-digit mobile number" className={inputClass} />
                                <p className={infoTextClass}>Used for account verification and alerts</p>
                            </div>

                            {/* Email */}
                            <div>
                                <label className={labelClass}><Mail className="inline mr-1" size={14} />Email Address <span className="text-red-400">*</span></label>
                                <input type="email" value={formData.email} onChange={(e) => updateFormData("email", e.target.value)} placeholder="your.email@example.com" className={inputClass} />
                            </div>

                            {/* Password with visibility toggle and strength indicator */}
                            <div>
                                <label className={labelClass}><Lock className="inline mr-1" size={14} />Create Password <span className="text-red-400">*</span></label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={formData.password}
                                        onChange={(e) => updateFormData("password", e.target.value)}
                                        placeholder="Create a strong password"
                                        className={`${inputClass} pr-10`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                                        aria-label="Toggle password visibility"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                {/* Password Strength Indicator */}
                                {formData.password && (
                                    <div className="mt-2">
                                        <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                                            <div
                                                className="h-full transition-all duration-300 rounded-full"
                                                style={{ width: `${passwordStrength.score}%`, backgroundColor: passwordStrength.color }}
                                            />
                                        </div>
                                        <p className="text-xs mt-1" style={{ color: passwordStrength.color }}>{passwordStrength.label}</p>
                                    </div>
                                )}
                            </div>

                            {/* Confirm Password with visibility toggle */}
                            <div>
                                <label className={labelClass}>Confirm Password <span className="text-red-400">*</span></label>
                                <div className="relative">
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        value={formData.confirmPassword}
                                        onChange={(e) => updateFormData("confirmPassword", e.target.value)}
                                        placeholder="Re-enter your password"
                                        className={`${inputClass} pr-10`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                                        aria-label="Toggle confirm password visibility"
                                    >
                                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                {/* Password Match Indicator */}
                                {formData.confirmPassword && (
                                    <p className={`text-xs mt-1 flex items-center gap-1 ${formData.password === formData.confirmPassword ? 'text-green-400' : 'text-red-400'}`}>
                                        {formData.password === formData.confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                                    </p>
                                )}
                            </div>

                            {/* PIN Fields */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className={labelClass}>Create 6-Digit PIN <span className="text-red-400">*</span></label>
                                    <input type="password" value={formData.pin} onChange={(e) => updateFormData("pin", e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="••••••" className={inputClass} />
                                </div>
                                <div>
                                    <label className={labelClass}>Confirm PIN <span className="text-red-400">*</span></label>
                                    <input type="password" value={formData.confirmPin} onChange={(e) => updateFormData("confirmPin", e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="••••••" className={inputClass} />
                                    {/* PIN Match Indicator */}
                                    {formData.confirmPin && (
                                        <p className={`text-xs mt-1 flex items-center gap-1 ${formData.pin === formData.confirmPin ? 'text-green-400' : 'text-red-400'}`}>
                                            {formData.pin === formData.confirmPin ? '✓ PINs match' : '✗ PINs do not match'}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Security Hint */}
                            <div>
                                <label className={labelClass}>Security Hint <span className="text-gray-500">(Optional)</span></label>
                                <input type="text" value={formData.securityHint} onChange={(e) => updateFormData("securityHint", e.target.value)} placeholder="e.g., Your favorite color or pet name" maxLength={50} className={inputClass} />
                                <p className={infoTextClass}>Reminder only, not used for authentication</p>
                            </div>

                            {/* Mandatory Consents */}
                            <div className="space-y-2">
                                <label className={labelClass}>Mandatory Consents <span className="text-red-400">*</span></label>
                                <label className="flex items-start gap-2 text-gray-300 text-sm cursor-pointer"><input type="checkbox" checked={formData.termsConsent} onChange={(e) => updateFormData("termsConsent", e.target.checked)} className="mt-1 accent-blue-500" /><span>I agree to the <a href="#terms" className="text-blue-400 hover:underline">Terms & Conditions</a></span></label>
                                <label className="flex items-start gap-2 text-gray-300 text-sm cursor-pointer"><input type="checkbox" checked={formData.privacyConsent} onChange={(e) => updateFormData("privacyConsent", e.target.checked)} className="mt-1 accent-blue-500" /><span>I agree to the <a href="#privacy" className="text-blue-400 hover:underline">Privacy Policy</a></span></label>
                                <label className="flex items-start gap-2 text-gray-300 text-sm cursor-pointer"><input type="checkbox" checked={formData.dataConsent} onChange={(e) => updateFormData("dataConsent", e.target.checked)} className="mt-1 accent-blue-500" /><span>I consent to data processing as per <a href="#dpdp" className="text-blue-400 hover:underline">DPDP Act</a></span></label>
                            </div>

                            {/* Optional Preferences */}
                            <div className="space-y-2">
                                <label className={labelClass}>Optional Preferences</label>
                                <label className="flex items-start gap-2 text-gray-300 text-sm cursor-pointer"><input type="checkbox" checked={formData.rememberDevice} onChange={(e) => updateFormData("rememberDevice", e.target.checked)} className="mt-1 accent-blue-500" /><span>Remember this device for 30 days</span></label>
                                <label className="flex items-start gap-2 text-gray-300 text-sm cursor-pointer"><input type="checkbox" checked={formData.enablePasskey} onChange={(e) => updateFormData("enablePasskey", e.target.checked)} className="mt-1 accent-blue-500" /><span>Enable passkey login on this device</span></label>
                            </div>

                            {/* Passkey Setup Section */}
                            {passkeySetup === "pending" && (
                                <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Key className="text-blue-400" size={20} />
                                        <h4 className="text-white font-semibold">Passkey Login (Recommended)</h4>
                                    </div>
                                    <p className="text-gray-400 text-sm mb-3">
                                        Passkeys are a secure, password-free way to sign in using your device's biometrics or screen lock. You can set this up now or skip and add it later from settings.
                                    </p>
                                    <div className="flex gap-2">
                                        <button type="button" onClick={() => setPasskeySetup("done")} className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-sm font-medium transition-colors">Set up passkey now</button>
                                        <button type="button" onClick={() => setPasskeySetup("skipped")} className="flex-1 py-2 px-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white text-sm font-medium transition-colors">Skip for now</button>
                                    </div>
                                </div>
                            )}
                            {passkeySetup === "done" && (
                                <div className="p-3 bg-green-500/20 border border-green-500/50 rounded-lg text-green-300 text-sm flex items-center gap-2">
                                    <Check size={16} /> Passkey setup complete!
                                </div>
                            )}

                            {/* CAPTCHA */}
                            <div className="space-y-2">
                                <label className={labelClass}>Verification Code <span className="text-red-400">*</span></label>
                                <div className="flex items-center gap-3">
                                    <div className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg font-mono text-lg tracking-widest text-white text-center select-none">{captchaCode}</div>
                                    <button type="button" onClick={refreshCaptcha} className="p-3 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 transition-colors"><RefreshCw className="w-5 h-5 text-white" /></button>
                                </div>
                                <input type="text" value={captchaInput} onChange={(e) => setCaptchaInput(e.target.value.toUpperCase())} placeholder="Enter code above" maxLength={6} className={inputClass} />
                            </div>

                            {/* Security Badge */}
                            <div className="flex items-center gap-2 text-sm text-gray-400 p-3 bg-white/5 rounded-lg"><Shield size={16} className="text-green-400" /><span>Your data is encrypted and secured with banking-grade protection</span></div>
                        </div>
                    )}

                    {/* STEP 2: Personal Details */}
                    {currentStep === 2 && (
                        <div className="space-y-4">
                            <div>
                                <label className={labelClass}>Title <span className="text-red-400">*</span></label>
                                <div className="flex gap-2 flex-wrap">
                                    {["Mr", "Ms", "Mrs", "Other"].map((t) => (
                                        <div key={t} className={formData.title === t ? radioActiveClass : radioClass} onClick={() => updateFormData("title", t)}>
                                            <span className="text-white text-sm font-medium">{t}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                <div><label className={labelClass}>First Name <span className="text-red-400">*</span></label><input type="text" value={formData.firstName} onChange={(e) => updateFormData("firstName", e.target.value)} placeholder="Enter first name" className={inputClass} /></div>
                                <div><label className={labelClass}>Middle Name <span className="text-gray-500">(Optional)</span></label><input type="text" value={formData.middleName} onChange={(e) => updateFormData("middleName", e.target.value)} placeholder="Enter middle name" className={inputClass} /></div>
                                <div><label className={labelClass}>Last Name <span className="text-red-400">*</span></label><input type="text" value={formData.lastName} onChange={(e) => updateFormData("lastName", e.target.value)} placeholder="Enter last name" className={inputClass} /></div>
                            </div>
                            <div>
                                <label className={labelClass}>Date of Birth <span className="text-red-400">*</span></label>
                                <input type="date" value={formData.dob} onChange={(e) => updateFormData("dob", e.target.value)} className={inputClass} />
                                <p className={infoTextClass}>You must be at least 18 years old</p>
                            </div>
                            <div>
                                <label className={labelClass}>Gender <span className="text-red-400">*</span></label>
                                <div className="flex gap-2">
                                    {["Male", "Female", "Other"].map((g) => (
                                        <div key={g} className={formData.gender === g ? radioActiveClass : radioClass} onClick={() => updateFormData("gender", g)}>
                                            <span className="text-white text-sm font-medium">{g}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className={labelClass}>Nationality <span className="text-red-400">*</span></label>
                                <input type="text" value="Indian" disabled className={`${inputClass} opacity-50 cursor-not-allowed`} />
                                <p className={infoTextClass}>Currently available only for Indian nationals</p>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: Address */}
                    {currentStep === 3 && (
                        <div className="space-y-4">
                            <div><label className={labelClass}><MapPin className="inline mr-1" size={14} />Address Line 1 <span className="text-red-400">*</span></label><input type="text" value={formData.address1} onChange={(e) => updateFormData("address1", e.target.value)} placeholder="Flat/House No., Building Name" className={inputClass} /></div>
                            <div><label className={labelClass}>Address Line 2 <span className="text-red-400">*</span></label><input type="text" value={formData.address2} onChange={(e) => updateFormData("address2", e.target.value)} placeholder="Street, Area, Locality" className={inputClass} /></div>
                            <div className="grid grid-cols-2 gap-3">
                                <div><label className={labelClass}>City <span className="text-red-400">*</span></label><input type="text" value={formData.city} onChange={(e) => updateFormData("city", e.target.value)} placeholder="Enter city" className={inputClass} /></div>
                                <div><label className={labelClass}>State <span className="text-red-400">*</span></label><select value={formData.state} onChange={(e) => updateFormData("state", e.target.value)} className="w-full px-4 py-2.5 bg-gray-800 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"><option value="" className="bg-gray-800 text-gray-400">Select State</option>{INDIAN_STATES.map((s) => <option key={s} value={s} className="bg-gray-800 text-white">{s}</option>)}</select></div>
                            </div>
                            <div><label className={labelClass}>PIN Code <span className="text-red-400">*</span></label><input type="text" value={formData.pincode} onChange={(e) => updateFormData("pincode", e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="Enter 6-digit PIN" maxLength={6} className={inputClass} /></div>
                            <label className="flex items-center gap-2 text-gray-300 text-sm cursor-pointer"><input type="checkbox" checked={formData.sameAddress} onChange={(e) => updateFormData("sameAddress", e.target.checked)} className="accent-blue-500" /><span>Permanent address same as current address</span></label>
                        </div>
                    )}

                    {/* STEP 4: KYC */}
                    {currentStep === 4 && (
                        <div className="space-y-4">
                            <div>
                                <label className={labelClass}><FileText className="inline mr-1" size={14} />PAN Number <span className="text-red-400">*</span></label>
                                <input type="text" value={formData.panNumber} onChange={(e) => updateFormData("panNumber", e.target.value.toUpperCase())} placeholder="Enter PAN (e.g., ABCDE1234F)" maxLength={10} className={`${inputClass} uppercase`} />
                                <p className={infoTextClass}>Format: AAAAA1234A (5 letters, 4 digits, 1 letter)</p>
                            </div>
                            <div>
                                <label className={labelClass}>Aadhaar Number <span className="text-red-400">*</span></label>
                                <input type="text" value={formData.aadhaarNumber} onChange={(e) => updateFormData("aadhaarNumber", e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="Last 4 digits only" maxLength={4} className={inputClass} />
                                <p className={infoTextClass}>Last 4 digits only for verification purposes</p>
                            </div>
                            <label className="flex items-start gap-2 text-gray-300 text-sm cursor-pointer"><input type="checkbox" checked={formData.aadhaarConsent} onChange={(e) => updateFormData("aadhaarConsent", e.target.checked)} className="mt-1 accent-blue-500" /><span>I consent to use my Aadhaar for KYC verification. My Aadhaar will not be stored or used for any other purpose.</span></label>
                            <div className="p-3 bg-blue-500/20 border border-blue-500/50 rounded-lg text-blue-300 text-sm flex items-center gap-2">ℹ️ Your KYC details will be verified as per RBI guidelines. This is a one-time process.</div>
                        </div>
                    )}

                    {/* STEP 5: Consent & Signature */}
                    {currentStep === 5 && (
                        <div className="space-y-4">
                            <div>
                                <label className={labelClass}>Terms & Conditions <span className="text-red-400">*</span></label>
                                <div className="p-4 bg-white/10 border border-white/20 rounded-lg max-h-40 overflow-y-auto text-sm text-gray-300">
                                    <h4 className="text-white font-semibold mb-2">Loan Application Agreement</h4>
                                    <p className="mb-2">By proceeding, you acknowledge and agree to the following:</p>
                                    <ul className="list-disc pl-5 space-y-1">
                                        <li>All information provided is accurate and complete</li>
                                        <li>You authorize us to verify your details with credit bureaus</li>
                                        <li>You understand loan approval is subject to credit assessment</li>
                                        <li>Interest rates are as per RBI guidelines and market conditions</li>
                                        <li>Processing fees are non-refundable</li>
                                        <li>You consent to receive communications via SMS/Email/Phone</li>
                                        <li>Your data will be processed as per DPDP Act 2023</li>
                                        <li>You have read and understood our Privacy Policy</li>
                                    </ul>
                                </div>
                            </div>
                            <label className="flex items-center gap-2 text-gray-300 text-sm cursor-pointer"><input type="checkbox" checked={formData.finalConsent} onChange={(e) => updateFormData("finalConsent", e.target.checked)} className="accent-blue-500" /><span>I have read and accept all terms and conditions <span className="text-red-400">*</span></span></label>
                            <div>
                                <label className={labelClass}><PenTool className="inline mr-1" size={14} />Digital Signature <span className="text-red-400">*</span></label>
                                <canvas ref={canvasRef} width={400} height={150} className="w-full bg-white/10 border-2 border-dashed border-white/30 rounded-lg cursor-crosshair" onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} />
                                <div className="flex items-center gap-3 mt-2">
                                    <button type="button" onClick={clearSignature} className="px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/50 rounded-lg text-sm font-semibold hover:bg-red-500/30 transition-colors">Clear Signature</button>
                                    <p className="text-xs text-gray-400">Draw your signature above using mouse or touch</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 6: Success */}
                    {currentStep === 6 && (
                        <div className="text-center space-y-4 py-4">
                            <div className="w-20 h-20 mx-auto bg-green-500/20 rounded-full flex items-center justify-center text-4xl">✅</div>
                            <h3 className="text-2xl font-bold text-white">Registration Complete!</h3>
                            <p className="text-gray-300">Your account has been successfully created</p>
                            <div className="p-5 bg-white/10 border border-white/20 rounded-lg">
                                <p className="text-sm text-gray-400 mb-1">Your Customer ID</p>
                                <p className="text-2xl font-mono font-bold text-white">{customerId}</p>
                            </div>
                            <div className="py-3">
                                <p className="text-sm text-gray-400 mb-2">KYC Status</p>
                                <span className="inline-block px-4 py-2 bg-yellow-500/20 border border-yellow-500/50 rounded-lg text-yellow-400 font-semibold text-sm">
                                    ⏳ {formData.kycSkipped ? "Pending - Complete KYC to access all features" : "Pending Verification"}
                                </span>
                            </div>
                            <p className="text-sm text-gray-400">
                                Your KYC verification is in progress. You will receive an update within 24-48 hours via SMS and email.
                            </p>
                            <button onClick={() => navigate("/dashboard")} className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-semibold transition-colors">Go to Dashboard</button>
                        </div>
                    )}

                    {/* Navigation */}
                    {currentStep < 6 && (
                        <div className="flex gap-3">
                            {currentStep > 1 && <button onClick={() => setCurrentStep(currentStep - 1)} className="flex-1 py-2.5 px-4 bg-white/10 border border-white/20 rounded-lg text-white font-medium hover:bg-white/20 flex items-center justify-center transition-colors"><ArrowLeft className="mr-2" size={18} />Back</button>}
                            {currentStep === 4 && <button onClick={skipKyc} className="flex-1 py-2.5 px-4 bg-yellow-500/20 border border-yellow-500/50 rounded-lg text-yellow-400 font-medium hover:bg-yellow-500/30 transition-colors">Skip for now</button>}
                            <button onClick={goToNextStep} disabled={isLoading} className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium disabled:opacity-50 flex items-center justify-center transition-colors">{isLoading ? "Submitting..." : currentStep === 5 ? "Submit Application" : "Continue"}<ArrowRight className="ml-2" size={18} /></button>
                        </div>
                    )}

                    {/* Footer */}
                    {currentStep === 1 && (
                        <div className="text-center space-y-2 pt-2 border-t border-white/10">
                            <p className="text-sm text-gray-400">Already have an account? <Link to="/login" className="font-semibold text-blue-400 hover:text-blue-300">Login here</Link></p>
                            <p className="text-xs text-gray-500">Protected by RBI-compliant security protocols</p>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}

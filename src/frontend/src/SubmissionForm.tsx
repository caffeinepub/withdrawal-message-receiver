import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CheckCircle2,
  ChevronRight,
  Eye,
  EyeOff,
  Loader2,
  QrCode,
  Upload,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import QRCode from "qrcode";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { useActor } from "./hooks/useActor";

interface Props {
  onAdminClick: () => void;
}

export default function SubmissionForm({ onAdminClick }: Props) {
  const { actor } = useActor();
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  // Step 1 fields
  const [fullName, setFullName] = useState("");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");
  const [contactNo, setContactNo] = useState("");

  // Step 2 fields
  const [pointsAmount, setPointsAmount] = useState("");
  const [upiId, setUpiId] = useState("");
  const [upiQr, setUpiQr] = useState<string | null>(null);
  const [uploadedQr, setUploadedQr] = useState<string | null>(null);
  const [uploadedQrBytes, setUploadedQrBytes] = useState<Uint8Array | null>(
    null,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateUpiQr = async (id: string) => {
    if (!id.trim()) {
      setUpiQr(null);
      return;
    }
    try {
      const url = await QRCode.toDataURL(`upi://pay?pa=${id}`, {
        width: 200,
        margin: 2,
        color: { dark: "#1a0a3d", light: "#ffffff" },
      });
      setUpiQr(url);
    } catch {
      setUpiQr(null);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setUploadedQr(result);
      const arr = new Uint8Array(
        atob(result.split(",")[1])
          .split("")
          .map((c) => c.charCodeAt(0)),
      );
      setUploadedQrBytes(arr);
    };
    reader.readAsDataURL(file);
  };

  const validateStep1 = () => {
    if (!fullName.trim()) {
      toast.error("Full name is required");
      return false;
    }
    if (!address.trim()) {
      toast.error("Address is required");
      return false;
    }
    if (!email.trim() || !email.includes("@")) {
      toast.error("Valid email is required");
      return false;
    }
    if (!contactNo.trim()) {
      toast.error("Contact number is required");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!pointsAmount || Number(pointsAmount) < 3000) {
      toast.error("Minimum withdrawal is 3,000 points");
      return;
    }
    if (!actor) {
      toast.error("Not connected to backend");
      return;
    }
    setLoading(true);
    try {
      await actor.submitWithdrawalRequest({
        fullName,
        email,
        address,
        upiId,
        contactNo,
        pointsAmount: BigInt(pointsAmount),
        qrCode: uploadedQrBytes ?? undefined,
      });
      setSubmitted(true);
    } catch (err) {
      toast.error("Failed to submit request. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", bounce: 0.4 }}
          className="text-center max-w-md"
          data-ocid="submission.success_state"
        >
          <CheckCircle2 className="mx-auto mb-4 h-20 w-20 text-accent" />
          <h2 className="text-2xl font-bold text-gold mb-3">
            Request Submitted!
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Your withdrawal request has been submitted successfully! The admin
            will process it shortly.
          </p>
          <Button
            className="mt-6 btn-gold"
            onClick={() => {
              setSubmitted(false);
              setStep(1);
              setFullName("");
              setAddress("");
              setEmail("");
              setContactNo("");
              setPointsAmount("");
              setUpiId("");
              setUpiQr(null);
              setUploadedQr(null);
              setUploadedQrBytes(null);
            }}
          >
            Submit Another Request
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="inline-flex items-center gap-2 mb-2">
          <QrCode className="h-7 w-7 text-gold" />
          <h1 className="text-3xl font-extrabold text-gold tracking-tight">
            WITHDRAWAL REQUEST
          </h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Submit your withdrawal details securely
        </p>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-3 mt-5">
          <StepDot active={step >= 1} label="1" title="Personal Details" />
          <div className="h-px w-12 bg-border" />
          <StepDot active={step >= 2} label="2" title="Payment Details" />
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            className="w-full max-w-md"
          >
            <Card className="card-dark border-gold/20">
              <CardHeader>
                <CardTitle className="text-gold text-lg">
                  Personal Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Field
                  label="Full Name"
                  id="fullName"
                  value={fullName}
                  onChange={setFullName}
                  placeholder="Enter your full name"
                  data-ocid="submission.input"
                />
                <Field
                  label="Address"
                  id="address"
                  value={address}
                  onChange={setAddress}
                  placeholder="Your complete address"
                  data-ocid="submission.input"
                />
                <Field
                  label="Email"
                  id="email"
                  type="email"
                  value={email}
                  onChange={setEmail}
                  placeholder="you@example.com"
                  data-ocid="submission.input"
                />
                <Field
                  label="Contact Number"
                  id="contact"
                  type="tel"
                  value={contactNo}
                  onChange={setContactNo}
                  placeholder="+91 98765 43210"
                  data-ocid="submission.input"
                />

                <Button
                  className="w-full btn-gold mt-2"
                  onClick={() => validateStep1() && setStep(2)}
                  data-ocid="submission.primary_button"
                >
                  Next <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 30 }}
            className="w-full max-w-md"
          >
            <Card className="card-dark border-gold/20">
              <CardHeader>
                <CardTitle className="text-gold text-lg">
                  Payment Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Points */}
                <div>
                  <Label className="text-sm font-semibold text-foreground/80 mb-1 block">
                    Points Amount <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="number"
                    min={3000}
                    value={pointsAmount}
                    onChange={(e) => setPointsAmount(e.target.value)}
                    placeholder="Minimum 3,000 points"
                    className="input-dark"
                    data-ocid="submission.input"
                  />
                  {pointsAmount && Number(pointsAmount) >= 3000 && (
                    <p className="text-xs text-accent mt-1">
                      Payout: ₹{((Number(pointsAmount) / 100) * 0.5).toFixed(0)}
                    </p>
                  )}
                </div>

                {/* UPI ID */}
                <div>
                  <Label className="text-sm font-semibold text-foreground/80 mb-1 block">
                    UPI ID
                  </Label>
                  <Input
                    value={upiId}
                    onChange={(e) => {
                      setUpiId(e.target.value);
                      generateUpiQr(e.target.value);
                    }}
                    placeholder="yourname@upi"
                    className="input-dark"
                    data-ocid="submission.input"
                  />
                  {upiQr && (
                    <div className="mt-3 flex flex-col items-center">
                      <p className="text-xs text-muted-foreground mb-2">
                        Auto-generated QR Code
                      </p>
                      <div className="p-2 bg-white rounded-lg">
                        <img src={upiQr} alt="UPI QR" className="w-36 h-36" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Upload QR */}
                <div>
                  <Label className="text-sm font-semibold text-foreground/80 mb-1 block">
                    Upload QR Code (optional)
                  </Label>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-gold/30 rounded-lg p-4 text-center cursor-pointer hover:border-gold/60 transition-colors"
                    data-ocid="submission.dropzone"
                  >
                    <Upload className="mx-auto h-6 w-6 text-muted-foreground mb-1" />
                    <p className="text-xs text-muted-foreground">
                      Click to upload QR image
                    </p>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileUpload}
                    data-ocid="submission.upload_button"
                  />
                  {uploadedQr && (
                    <div className="mt-3 flex flex-col items-center">
                      <p className="text-xs text-muted-foreground mb-2">
                        Uploaded QR Preview
                      </p>
                      <div className="p-2 bg-white rounded-lg">
                        <img
                          src={uploadedQr}
                          alt="Uploaded QR"
                          className="w-36 h-36 object-contain"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-1">
                  <Button
                    variant="outline"
                    className="flex-1 border-border"
                    onClick={() => setStep(1)}
                    data-ocid="submission.secondary_button"
                  >
                    Back
                  </Button>
                  <Button
                    className="flex-1 btn-gold"
                    onClick={handleSubmit}
                    disabled={loading}
                    data-ocid="submission.submit_button"
                  >
                    {loading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    {loading ? "Submitting..." : "Submit Request"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Admin link */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-10 text-center"
      >
        <button
          type="button"
          onClick={onAdminClick}
          className="text-xs text-muted-foreground hover:text-gold transition-colors underline underline-offset-2"
          data-ocid="submission.link"
        >
          Admin Login
        </button>
      </motion.div>

      <footer className="mt-8 text-center text-xs text-muted-foreground/50">
        © {new Date().getFullYear()}. Built with love using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-gold transition-colors"
        >
          caffeine.ai
        </a>
      </footer>
    </div>
  );
}

function StepDot({
  active,
  label,
  title,
}: { active: boolean; label: string; title: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
          active ? "bg-gold text-background" : "bg-muted text-muted-foreground"
        }`}
      >
        {label}
      </div>
      <span
        className={`text-xs ${active ? "text-gold" : "text-muted-foreground"}`}
      >
        {title}
      </span>
    </div>
  );
}

function Field({
  label,
  id,
  type = "text",
  value,
  onChange,
  placeholder,
  "data-ocid": dataOcid,
}: {
  label: string;
  id: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  "data-ocid"?: string;
}) {
  return (
    <div>
      <Label
        htmlFor={id}
        className="text-sm font-semibold text-foreground/80 mb-1 block"
      >
        {label} <span className="text-destructive">*</span>
      </Label>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="input-dark"
        data-ocid={dataOcid}
      />
    </div>
  );
}

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle,
  Coins,
  Eye,
  EyeOff,
  Loader2,
  LogOut,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  ShieldCheck,
  User,
  XCircle,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import QRCode from "qrcode";
import { useState } from "react";
import { useEffect } from "react";
import { toast } from "sonner";
import { RequestStatus, type WithdrawalRequest } from "./backend.d";
import { useActor } from "./hooks/useActor";

const ADMIN_USER = "ADARSH_CHAUDHARY_OWNER";
const ADMIN_PASS = "admin123";

interface Props {
  onBack: () => void;
}

export default function AdminPanel({ onBack }: Props) {
  const [loggedIn, setLoggedIn] = useState(false);

  if (!loggedIn) {
    return <AdminLogin onLogin={() => setLoggedIn(true)} onBack={onBack} />;
  }
  return <AdminDashboard onLogout={() => setLoggedIn(false)} />;
}

function AdminLogin({
  onLogin,
  onBack,
}: { onLogin: () => void; onBack: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = () => {
    if (username === ADMIN_USER && password === ADMIN_PASS) {
      onLogin();
    } else {
      setError("Invalid credentials. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <ShieldCheck className="mx-auto h-12 w-12 text-gold mb-3" />
          <h1 className="text-2xl font-extrabold text-gold">Admin Login</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Withdrawal Message Receiver
          </p>
        </div>

        <Card className="card-dark border-gold/20">
          <CardContent className="pt-6 space-y-4">
            <div>
              <Label className="text-sm font-semibold text-foreground/80 mb-1 block">
                Username
              </Label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter admin username"
                className="input-dark"
                data-ocid="admin.input"
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
            </div>
            <div>
              <Label className="text-sm font-semibold text-foreground/80 mb-1 block">
                Password
              </Label>
              <div className="relative">
                <Input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="input-dark pr-10"
                  data-ocid="admin.input"
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  data-ocid="admin.toggle"
                >
                  {showPass ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <p
                className="text-destructive text-sm"
                data-ocid="admin.error_state"
              >
                {error}
              </p>
            )}

            <Button
              className="w-full btn-gold"
              onClick={handleLogin}
              data-ocid="admin.submit_button"
            >
              Login
            </Button>

            <button
              type="button"
              onClick={onBack}
              className="w-full text-xs text-muted-foreground hover:text-gold transition-colors"
              data-ocid="admin.link"
            >
              ← Back to Submission Form
            </button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();

  const {
    data: requests = [],
    isLoading,
    refetch,
  } = useQuery<WithdrawalRequest[]>({
    queryKey: ["withdrawal-requests"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllWithdrawalRequests();
    },
    enabled: !!actor && !isFetching,
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      status,
    }: { id: bigint; status: RequestStatus }) => {
      if (!actor) throw new Error("Not connected");
      await actor.updateRequestStatus({ id, status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["withdrawal-requests"] });
      toast.success("Status updated successfully");
    },
    onError: () => toast.error("Failed to update status"),
  });

  const filterRequests = (status: string) => {
    if (status === "all") return requests;
    return requests.filter((r) => r.status === status);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-gold/20 px-4 py-4 flex items-center justify-between sticky top-0 z-10 bg-background/90 backdrop-blur">
        <div>
          <h1 className="text-lg font-extrabold text-gold">Admin Dashboard</h1>
          <p className="text-xs text-muted-foreground">Withdrawal Requests</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="border-border"
            onClick={() => refetch()}
            data-ocid="admin.secondary_button"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
            onClick={onLogout}
            data-ocid="admin.delete_button"
          >
            <LogOut className="h-4 w-4 mr-1" /> Logout
          </Button>
        </div>
      </header>

      <main className="flex-1 px-4 py-6 max-w-4xl mx-auto w-full">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            {
              label: "Total",
              value: requests.length,
              color: "text-foreground",
            },
            {
              label: "Pending",
              value: requests.filter((r) => r.status === RequestStatus.pending)
                .length,
              color: "text-yellow-400",
            },
            {
              label: "Paid",
              value: requests.filter((r) => r.status === RequestStatus.paid)
                .length,
              color: "text-accent",
            },
            {
              label: "Rejected",
              value: requests.filter((r) => r.status === RequestStatus.rejected)
                .length,
              color: "text-destructive",
            },
          ].map((stat) => (
            <Card key={stat.label} className="card-dark border-gold/10">
              <CardContent className="p-3 text-center">
                <div className={`text-2xl font-extrabold ${stat.color}`}>
                  {stat.value}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {stat.label}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="all">
          <TabsList className="bg-muted/50 mb-4" data-ocid="admin.tab">
            <TabsTrigger value="all" data-ocid="admin.tab">
              All ({requests.length})
            </TabsTrigger>
            <TabsTrigger value="pending" data-ocid="admin.tab">
              Pending
            </TabsTrigger>
            <TabsTrigger value="paid" data-ocid="admin.tab">
              Paid
            </TabsTrigger>
            <TabsTrigger value="rejected" data-ocid="admin.tab">
              Rejected
            </TabsTrigger>
          </TabsList>

          {["all", "pending", "paid", "rejected"].map((tab) => (
            <TabsContent key={tab} value={tab}>
              {isLoading ? (
                <div
                  className="flex items-center justify-center py-16"
                  data-ocid="admin.loading_state"
                >
                  <Loader2 className="h-8 w-8 animate-spin text-gold" />
                </div>
              ) : filterRequests(tab).length === 0 ? (
                <div
                  className="text-center py-16 text-muted-foreground"
                  data-ocid="admin.empty_state"
                >
                  <p className="text-lg">
                    No {tab === "all" ? "" : tab} requests
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filterRequests(tab).map((req, i) => (
                    <RequestCard
                      key={req.id.toString()}
                      request={req}
                      index={i + 1}
                      onMarkPaid={() =>
                        updateMutation.mutate({
                          id: req.id,
                          status: RequestStatus.paid,
                        })
                      }
                      onMarkRejected={() =>
                        updateMutation.mutate({
                          id: req.id,
                          status: RequestStatus.rejected,
                        })
                      }
                      isUpdating={updateMutation.isPending}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </main>
    </div>
  );
}

function RequestCard({
  request,
  index,
  onMarkPaid,
  onMarkRejected,
  isUpdating,
}: {
  request: WithdrawalRequest;
  index: number;
  onMarkPaid: () => void;
  onMarkRejected: () => void;
  isUpdating: boolean;
}) {
  const [upiQrUrl, setUpiQrUrl] = useState<string | null>(null);
  const [uploadedQrUrl, setUploadedQrUrl] = useState<string | null>(null);

  useEffect(() => {
    if (request.upiId) {
      QRCode.toDataURL(`upi://pay?pa=${request.upiId}`, {
        width: 150,
        margin: 2,
      })
        .then(setUpiQrUrl)
        .catch(() => null);
    }
    if (request.qrCode && request.qrCode.length > 0) {
      const blob = new Blob([new Uint8Array(request.qrCode as Uint8Array)]);
      const url = URL.createObjectURL(blob);
      setUploadedQrUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [request.upiId, request.qrCode]);

  const ts = Number(request.timestamp / 1_000_000n);
  const dateStr = new Date(ts).toLocaleString("en-IN");
  const statusColors: Record<string, string> = {
    pending: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    paid: "bg-accent/20 text-accent border-accent/30",
    rejected: "bg-destructive/20 text-destructive border-destructive/30",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      data-ocid={`admin.item.${index}`}
    >
      <Card className="card-dark border-gold/15">
        <CardContent className="p-4">
          {/* Top row: ID, timestamp, status */}
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div>
              <span className="text-xs text-muted-foreground">
                Request #{request.id.toString()}
              </span>
              <p className="text-xs text-muted-foreground/60">{dateStr}</p>
            </div>
            <Badge
              className={`text-xs border ${statusColors[request.status] ?? ""}`}
            >
              {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
            </Badge>
          </div>

          {/* Personal Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
            <InfoRow
              icon={<User className="h-3.5 w-3.5" />}
              label="Name"
              value={request.fullName}
            />
            <InfoRow
              icon={<Mail className="h-3.5 w-3.5" />}
              label="Email"
              value={request.email}
            />
            <InfoRow
              icon={<MapPin className="h-3.5 w-3.5" />}
              label="Address"
              value={request.address}
            />
            <InfoRow
              icon={<Phone className="h-3.5 w-3.5" />}
              label="Contact"
              value={request.contactNo}
            />
            <InfoRow
              icon={<Coins className="h-3.5 w-3.5" />}
              label="Points"
              value={Number(request.pointsAmount).toLocaleString("en-IN")}
            />
            {request.upiId && (
              <InfoRow
                icon={<span className="text-xs font-bold">₹</span>}
                label="UPI ID"
                value={request.upiId}
              />
            )}
          </div>

          {/* QR Codes */}
          {(upiQrUrl || uploadedQrUrl) && (
            <div className="flex gap-4 flex-wrap mb-4">
              {upiQrUrl && (
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">
                    UPI QR (auto)
                  </p>
                  <div className="bg-white p-1.5 rounded-md inline-block">
                    <img src={upiQrUrl} alt="UPI QR" className="w-24 h-24" />
                  </div>
                </div>
              )}
              {uploadedQrUrl && (
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">
                    Uploaded QR
                  </p>
                  <div className="bg-white p-1.5 rounded-md inline-block">
                    <img
                      src={uploadedQrUrl}
                      alt="Uploaded QR"
                      className="w-24 h-24 object-contain"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          {request.status === RequestStatus.pending && (
            <div className="flex gap-2">
              <Button
                size="sm"
                className="flex-1 bg-accent/20 text-accent hover:bg-accent hover:text-accent-foreground border border-accent/30"
                onClick={onMarkPaid}
                disabled={isUpdating}
                data-ocid="admin.confirm_button"
              >
                <CheckCircle className="h-3.5 w-3.5 mr-1" /> Mark Paid
              </Button>
              <Button
                size="sm"
                className="flex-1 bg-destructive/20 text-destructive hover:bg-destructive hover:text-destructive-foreground border border-destructive/30"
                onClick={onMarkRejected}
                disabled={isUpdating}
                data-ocid="admin.cancel_button"
              >
                <XCircle className="h-3.5 w-3.5 mr-1" /> Mark Rejected
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-1.5">
      <span className="text-gold mt-0.5 flex-shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium truncate">{value}</p>
      </div>
    </div>
  );
}

import { useEffect } from "react";
import { toast } from "sonner";
import type { OtpRecord } from "@/lib/types";

/** Shows the demo OTP in a toast (since there's no real email/SMS in demo mode). */
export function useShowOtp(otp: OtpRecord | null) {
  useEffect(() => {
    if (!otp) return;
    toast.info(`Demo OTP for ${otp.email}`, {
      description: `Code: ${otp.code} (valid 5 minutes)`,
      duration: 12000,
    });
  }, [otp]);
}
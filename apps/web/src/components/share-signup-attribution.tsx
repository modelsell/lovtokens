"use client";

import { useEffect } from "react";
import { completeShareSignupAttribution, markShareRegistrationStarted } from "@/lib/share-analytics";

export function ShareSignupAttribution({ stage }: { stage: "register" | "complete" }) {
  useEffect(() => {
    if (stage === "register") markShareRegistrationStarted();
    else void completeShareSignupAttribution();
  }, [stage]);
  return null;
}

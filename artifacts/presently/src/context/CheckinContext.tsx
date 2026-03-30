import { createContext, useContext, useState, ReactNode } from "react";
import type { CheckinWithReflection } from "@workspace/api-client-react";

interface CheckinContextType {
  latestCheckin: CheckinWithReflection | null;
  setLatestCheckin: (checkin: CheckinWithReflection | null) => void;
}

const CheckinContext = createContext<CheckinContextType | undefined>(undefined);

export function CheckinProvider({ children }: { children: ReactNode }) {
  const [latestCheckin, setLatestCheckin] = useState<CheckinWithReflection | null>(null);

  return (
    <CheckinContext.Provider value={{ latestCheckin, setLatestCheckin }}>
      {children}
    </CheckinContext.Provider>
  );
}

export function useCheckinFlow() {
  const context = useContext(CheckinContext);
  if (context === undefined) {
    throw new Error("useCheckinFlow must be used within a CheckinProvider");
  }
  return context;
}

// Shared frontend state for the demo session (active role + toast).
// Kept in memory on purpose: every launch starts fresh at the splash screen.
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";

import { ROLES, type RoleConfig } from "@/src/config/roles";
import { PEOPLE } from "@/src/data/mock";
import type { Person, RoleId } from "@/src/types";

interface DemoState {
  role: RoleId | null;
  config: RoleConfig;
  user: Person;
  setRole: (r: RoleId) => void;
  exitDemo: () => void;
  toast: string | null;
  showToast: (msg: string) => void;
}

const Ctx = createContext<DemoState | null>(null);

export function DemoProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<RoleId | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    if (timer.current) clearTimeout(timer.current);
    setToast(msg);
    timer.current = setTimeout(() => setToast(null), 2400);
  }, []);

  const setRole = useCallback((r: RoleId) => setRoleState(r), []);
  const exitDemo = useCallback(() => setRoleState(null), []);

  const value = useMemo<DemoState>(() => {
    const config = ROLES[role ?? "super_admin"];
    return { role, config, user: PEOPLE[config.personId], setRole, exitDemo, toast, showToast };
  }, [role, setRole, exitDemo, toast, showToast]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useDemo() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useDemo must be used inside DemoProvider");
  return v;
}

/** For screens inside the signed-in area, where a role is guaranteed. */
export function useActiveRole(): RoleId {
  return useDemo().role ?? "super_admin";
}

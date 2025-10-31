import { createContext, useContext } from "react";

export const AuthContext = createContext({
  isAuthenticated: false,
  userId: null,
  userInitials: null,
  newNotificationCount: 0,
  promptAuth: () => {},
  signOut: () => {},
  refreshAuth: () => Promise.resolve(),
});

export function useAuth() {
  return useContext(AuthContext);
}

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface UserState {
  name: string;
  email: string;
  roomId: string;
  roomKey: string;
  setUser: (name: string, email: string, roomId: string, roomKey: string) => void;
  clearUser: () => void;
}

export const userStore = create<UserState>()(
  persist(
    (set) => ({
      name: "",
      email: "",
      roomId: "",
      roomKey: "",
      setUser: (name: string, email: string, roomId: string, roomKey: string) =>
        set({ name, email, roomId, roomKey }),
      clearUser: () => set({ name: "", email: "", roomId: "", roomKey: "" }),
    }),
    {
      name: "user-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

import { createContext, useContext, useState, type ReactNode } from "react";
import {
  initialPastStreams,
  type PastStream,
  type StreamVisibility,
} from "./contentData";

type Toast = { id: number; text: string };
type Ctx = {
  followed: Set<string>;
  toggleFollow: (id: string) => void;
  sidebar: boolean;
  setSidebar: (v: boolean) => void;
  toast: (text: string) => void;
  appearance: string;
  setAppearance: (v: string) => void;
  lowData: boolean;
  setLowData: (v: boolean) => void;
  pastStreams: PastStream[];
  addPastStream: (s: PastStream) => void;
  updatePastStream: (id: string, patch: Partial<PastStream>) => void;
  deletePastStream: (id: string) => void;
  bulkVisibility: (ids: string[], visibility: StreamVisibility) => void;
};
const AppContext = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [followed, setFollowed] = useState(
    new Set(["gamer-wa-mtaa", "code-njeri", "mombasa-vibes"]),
  );
  const [sidebar, setSidebar] = useState(true),
    [toasts, setToasts] = useState<Toast[]>([]);
  const [appearance, setAppearance] = useState("dark"),
    [lowData, setLowData] = useState(false);
  const [pastStreams, setPastStreams] = useState(initialPastStreams);
  const toast = (text: string) => {
    const id = Date.now();
    setToasts((x) => [...x, { id, text }]);
    setTimeout(() => setToasts((x) => x.filter((t) => t.id !== id)), 2600);
  };
  const toggleFollow = (id: string) =>
    setFollowed((old) => {
      const next = new Set(old);
      next.has(id) ? next.delete(id) : next.add(id);
      toast(next.has(id) ? "Creator followed" : "Creator unfollowed");
      return next;
    });
  const addPastStream = (stream: PastStream) =>
    setPastStreams((x) => [stream, ...x]);
  const updatePastStream = (id: string, patch: Partial<PastStream>) =>
    setPastStreams((x) =>
      x.map((stream) => (stream.id === id ? { ...stream, ...patch } : stream)),
    );
  const deletePastStream = (id: string) =>
    setPastStreams((x) => x.filter((stream) => stream.id !== id));
  const bulkVisibility = (ids: string[], visibility: StreamVisibility) =>
    setPastStreams((x) =>
      x.map((stream) =>
        ids.includes(stream.id) ? { ...stream, visibility } : stream,
      ),
    );
  return (
    <AppContext.Provider
      value={{
        followed,
        toggleFollow,
        sidebar,
        setSidebar,
        toast,
        appearance,
        setAppearance,
        lowData,
        setLowData,
        pastStreams,
        addPastStream,
        updatePastStream,
        deletePastStream,
        bulkVisibility,
      }}
    >
      <div className={`theme-${appearance}`}>{children}</div>
      <div className="toasts" aria-live="polite">
        {toasts.map((item) => (
          <div className="toast" key={item.id}>
            {item.text}
          </div>
        ))}
      </div>
    </AppContext.Provider>
  );
}
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("AppProvider missing");
  return context;
};

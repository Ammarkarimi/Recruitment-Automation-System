import React, { createContext, useContext, useEffect, useState } from "react";
import api from "./api";

const MetaContext = createContext(null);

/** Server capabilities: round defaults, available languages, AI and email mode. */
export function MetaProvider({ children }) {
  const [meta, setMeta] = useState(null);
  useEffect(() => {
    api.get("/meta").then((res) => setMeta(res.data)).catch(() => setMeta(null));
  }, []);
  return <MetaContext.Provider value={meta}>{children}</MetaContext.Provider>;
}

export function useMeta() {
  return useContext(MetaContext);
}

export function defaultsFor(meta, type) {
  return JSON.parse(JSON.stringify(meta?.round_types?.find((r) => r.type === type)?.defaults || {}));
}

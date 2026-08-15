import { useEffect, useState } from "react";

export function useGlobalAppInit() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      // load global stuff:
      // - user session
      // - permissions
      // - menu config
      // - table metadata cache

      await new Promise((r) => setTimeout(r, 300)); // contoh

      setReady(true);
    };

    init();
  }, []);

  return { ready };
}
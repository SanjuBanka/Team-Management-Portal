import { useEffect, useState } from "react";
import { subscribe } from "./store";

export function useStore<T>(selector: () => T): T {
  const [value, setValue] = useState<T>(selector);
  useEffect(() => {
    setValue(selector());
    return subscribe(() => setValue(selector()));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return value;
}

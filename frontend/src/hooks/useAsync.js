import { useEffect, useRef, useState } from "react";

/**
 * Generic async-resource hook with graceful loading / error / empty states.
 * `task` must return a promise. `deps` mirrors useEffect semantics.
 */
export function useAsync(task, deps = []) {
  const [state, setState] = useState({
    status: "loading",
    data: undefined,
    error: undefined,
  });
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    setState((prev) =>
      prev.status === "loading" ? prev : { status: "loading", data: prev.data, error: undefined }
    );

    Promise.resolve()
      .then(task)
      .then((data) => {
        if (alive.current) setState({ status: "success", data, error: undefined });
      })
      .catch((error) => {
        if (alive.current) setState({ status: "error", data: undefined, error });
      });

    return () => {
      alive.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const retry = () => {
    setState({ status: "loading", data: undefined, error: undefined });
    Promise.resolve()
      .then(task)
      .then((data) => setState({ status: "success", data, error: undefined }))
      .catch((error) => setState({ status: "error", data: undefined, error }));
  };

  return { ...state, retry };
}

export default useAsync;

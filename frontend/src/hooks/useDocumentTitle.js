import { useEffect } from "react";

/**
 * Sets the document title for the current screen. The app has no document
 * metadata framework, so each screen owns its own one-line effect.
 */
export function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title;
  }, [title]);
}

export default useDocumentTitle;

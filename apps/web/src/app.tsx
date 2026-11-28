import { lazy, Suspense } from "react";

// Dev-only component gallery (T06). `import.meta.env.DEV` is false in production builds,
// so the branch and the gallery chunk are removed from the bundle.
const Gallery = import.meta.env.DEV ? lazy(() => import("./dev/gallery")) : null;

export function App() {
  if (Gallery && location.hash === "#ui-gallery") {
    return (
      <Suspense fallback={null}>
        <Gallery />
      </Suspense>
    );
  }
  return (
    <main>
      <h1>Studiom</h1>
      <p>Yapım aşamasında. · Under construction.</p>
    </main>
  );
}

"use client";
export default function ErrorView({ reset }: { reset: () => void }) {
  return (
    <main>
      <h1>We couldn’t open this view.</h1>
      <p>
        Your saved records have not been deleted. Retry, or check the setup
        guide if this continues.
      </p>
      <button className="primary" onClick={reset}>
        Try again
      </button>
    </main>
  );
}

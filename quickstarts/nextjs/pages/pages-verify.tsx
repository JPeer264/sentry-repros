export default function Home() {
  return (
    <button
      type="button"
      onClick={() => {
        throw new Error("Sentry Test Error");
      }}
    >
      Throw Test Error
    </button>
  );
}

export function Loader({ label = "Loading matches..." }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="text-5xl animate-ball">⚽</div>
      <div className="text-chalk-dim text-sm">{label}</div>
    </div>
  );
}
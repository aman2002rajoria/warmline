/** Skeletons in the final shape while a page loads (§15). */
export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <div className="skeleton mb-8 h-10 w-72" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-[132px] rounded-m" />
        ))}
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-12">
        <div className="skeleton h-72 rounded-l md:col-span-4" />
        <div className="skeleton h-72 rounded-l md:col-span-8" />
      </div>
    </div>
  );
}

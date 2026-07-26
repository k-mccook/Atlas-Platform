export default function SearchBar() {
  return (
    <div className="rounded-xl bg-white p-6 shadow">
      <label className="mb-3 block font-semibold">
        Ask Atlas
      </label>

      <input
        className="w-full rounded-lg border p-4"
        placeholder="Ask FNMA, FHA, Freddie Mac or USPAP..."
      />
    </div>
  );
}

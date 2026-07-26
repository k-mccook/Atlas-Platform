export default function Header() {
  return (
    <header className="border-b bg-white px-10 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">
            Dashboard
          </h2>

          <p className="text-gray-500 mt-1">
            Welcome back to Atlas.
          </p>
        </div>

        <button className="rounded-lg bg-blue-600 px-5 py-3 text-white hover:bg-blue-700">
          New Assignment
        </button>
      </div>
    </header>
  );
}

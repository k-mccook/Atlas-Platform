export default function DashboardStats() {
  const stats = [
    {
      title: 'Assignments',
      value: '1',
      color: 'bg-blue-50 text-blue-700',
    },
    {
      title: 'Due Today',
      value: '0',
      color: 'bg-amber-50 text-amber-700',
    },
    {
      title: 'Completed',
      value: '0',
      color: 'bg-green-50 text-green-700',
    },
    {
      title: 'Saved Research',
      value: '0',
      color: 'bg-purple-50 text-purple-700',
    },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.title}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <p className="text-sm text-slate-500">
            {stat.title}
          </p>

          <div
            className={`mt-4 inline-flex rounded-xl px-4 py-2 text-3xl font-bold ${stat.color}`}
          >
            {stat.value}
          </div>
        </div>
      ))}
    </div>
  );
}
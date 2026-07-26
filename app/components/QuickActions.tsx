const cards = [
  '📚 Guideline Search',
  '📂 Assignments',
  '📝 Narrative Assistant',
  '⭐ Saved Research',
  '📷 Photo Review',
  '📄 Report Review',
];

export default function QuickActions() {
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => (
        <div
          key={card}
          className="cursor-pointer rounded-xl bg-white p-6 shadow transition hover:shadow-lg"
        >
          <h3 className="text-lg font-semibold">{card}</h3>
        </div>
      ))}
    </div>
  );
}

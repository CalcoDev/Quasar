import React from "react";

export default function DueTab({
  dueCards,
  inAModal,
  sidebarOpen,
  setSelectedCardId,
  setSelectedCard,
  setShowCardModal,
  setInAModal,
}) {
  return (
    <div className="grid grid-cols-1 gap-3 pt-4 break-all">
      {dueCards.map((card) => (
        <div
          key={card.id}
          onClick={() => {
            if (!inAModal && !sidebarOpen) {
              setSelectedCardId(card.id);
              setSelectedCard(card);
              setShowCardModal(true);
              setInAModal(true);
            }
          }}
          className="w-full h-full max-h-32 bg-zinc-700 rounded-md min-h-[100px] p-3 break-all"
        >
          {card.front}
        </div>
      ))}
    </div>
  );
}

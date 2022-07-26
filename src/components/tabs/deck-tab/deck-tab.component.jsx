import React from "react";

export default function DeckTab({
  cards,
  inAModal,
  setSelectedCardId,
  setSelectedCard,
  setShowCardModal,
  setInAModal,
}) {
  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 grid grid-cols-1 gap-3 pt-4 overflow-y-scroll">
        {cards.map((card) => (
          <div
            key={card.id}
            onClick={() => {
              if (!inAModal) {
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
    </div>
  );
}

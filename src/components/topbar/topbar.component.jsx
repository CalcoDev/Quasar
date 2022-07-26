import React from "react";
import MenuIcon from "../../assets/menu-icon.svg";

export default function Topbar({
  sidebarOpen,
  activeTab,
  dueCards,
  newCards,
  selectedDeckIndex,
  setSidebarOpen,
  decks,
}) {
  return (
    <div className="w-100 min-h-[4rem] flex items-center justify-between px-4 border-b-4 border-b-zinc-600">
      <div className="flex-1">
        <img
          onClick={() => setSidebarOpen(!sidebarOpen)}
          src={MenuIcon}
          className="max-h-[2rem] scale-75"
        />
      </div>
      <div className="flex-1 text-center">
        {activeTab == "due" && <div>{dueCards.length} cards due</div>}
        {activeTab == "new" && <div>{newCards.length} new cards</div>}
        {activeTab == "dashboard" && <div>Dashboard</div>}
        {activeTab == "deck" &&
          selectedDeckIndex !== -1 &&
          decks.length > 0 && <div>{decks[selectedDeckIndex].name}</div>}
      </div>
      <div className="flex-1"></div>
    </div>
  );
}

import React, { useState } from "react";

import CustomButton from "../custom-button/custom-button.component";

import {
  deleteDoc,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";

import { db } from "../../utils/firebase/firebase.utils";

export default function Sidebar({
  sidebarRef,
  sidebarOpen,
  activeTab,
  setActiveTab,
  decks,
  selectedDeckId,
  setSelectedDeckId,
  signOutUser,
  inAModal,
  setInAModal,
  setShowDeckModal,
  setSidebarOpen,
  user,
  setUser
}) {
  return (
    <div
      ref={sidebarRef}
      className={`${
        sidebarOpen ? "w-[85%]" : "w-0"
      } bg-gradient-to-r from-zinc-800 to-zinc-900 h-screen absolute z-10 top-0 left-0 overflow-x-hidden transition-all duration-300 flex flex-col`}
    >
      <div className="text-zinc-200">
        {/* User */}
        <div className="flex items-center justify-between border-b-[1px] border-b-zinc-700 p-4">
          <h1 className="">{user.currentUser.name}</h1>
          <CustomButton
            highlighted={false}
            colour="red"
            onClick={() => signOutUser(setUser)}
          >
            Sign Out
          </CustomButton>
        </div>

        {/* Options */}
        <div className="pt-4">
          <h1 className="px-4 text-xs font-medium text-zinc-400 pb-2">PAGES</h1>
          <div
            className={`px-8 py-2 w-full transition-all duration-[125ms] ${
              activeTab == "dashboard" ? "bg-zinc-700" : ""
            }`}
            onClick={() => setActiveTab("dashboard")}
          >
            <img className="" />
            <h1 className="text-sm">Dashboard</h1>
          </div>

          <div
            className={`px-8 py-2 w-full transition-all duration-[125ms] ${
              activeTab == "due" ? "bg-zinc-700" : ""
            }`}
            onClick={() => setActiveTab("due")}
          >
            <img className="" />
            <h1 className="text-sm">Due today</h1>
          </div>

          <div
            className={`px-8 py-2 w-full transition-all duration-[125ms] ${
              activeTab == "new" ? "bg-zinc-700" : ""
            }`}
            onClick={() => setActiveTab("new")}
          >
            <img className="" />
            <h1 className="text-sm">New cards</h1>
          </div>
        </div>

        {/* Decks */}
        <div className="mt-8">
          <h1 className="px-4 text-xs font-medium text-zinc-400">DECKS</h1>
          {decks.map((deck) => (
            <div
              key={deck.id}
              className={`px-8 py-2 w-full flex justify-between transition-all duration-[125ms] ${
                selectedDeckId == deck.id ? "bg-zinc-700" : ""
              }`}
            >
              <span onClick={() => setSelectedDeckId(deck.id)}>
                {deck.name}
              </span>
              <span
                className="text-red-500 pl-4"
                onClick={async () => {
                  const currentUserRef = doc(db, "users", user.currentUser.id);
                  const currentUserRefData = await getDoc(currentUserRef);

                  await updateDoc(currentUserRef, {
                    decks: currentUserRefData
                      .data()
                      .decks.filter((deckRef) => deckRef.id !== deck.id),
                  });

                  await deleteDoc(doc(db, "decks", deck.id));

                  setActiveTab(null)
                }}
              >
                X
              </span>
            </div>
          ))}
          <div
            className="px-8 py-2 w-full transition-all duration-[125ms]"
            onClick={() => {
              if (!inAModal) {
                setInAModal(true);
                setShowDeckModal(true);
                setSidebarOpen(false);
              }
            }}
          >
            + Add deck
          </div>
        </div>
      </div>
    </div>
  );
}

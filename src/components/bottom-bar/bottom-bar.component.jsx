import {
  addDoc,
  collection,
  doc,
  Firestore,
  setDoc,
  Timestamp,
} from "firebase/firestore";
import React, { useRef, useState } from "react";
import { db } from "../../utils/firebase/firebase.utils";
import useOutsideAlerter from "../../utils/hooks/click-outside.hook";

export default function BottomBar({
  setActive,
  selectedDeckRef,
  setInAModal,
  inAModal,
}) {
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");

  const [showModal, setShowModal] = useState(false);

  const modalRef = useRef();
  useOutsideAlerter(modalRef, () => {
    setShowModal(false);
    setInAModal(false);
  });

  return (
    <div className="w-100 min-h-[4rem] bg-zinc-700 flex border-t-[2px] border-zinc-600 text-zinc-300">
      <div
        className="flex-1 flex justify-center items-center"
        onClick={() => setActive("due")}
      >
        Due today
      </div>

      <div
        ref={modalRef}
        id="defaultModal"
        aria-hidden="true"
        className={`${
          showModal ? "scale-100" : "scale-0"
        } transition-all duration-300 overflow-x-hidden absolute top-[50%] left-[50%] z-50 w-3/4 h-1/2 translate-x-[-50%] translate-y-[-50%] max-w-lg max-h-[24rem] bg-zinc-700 rounded-lg shadow-2xl`}
        onClick={() => setInAModal(true)}
      >
        <div className="relative p-4 w-full max-w-2xl h-full flex flex-col">
          <div className="relative w-full text-center border-b-2 pb-2 border-b-zinc-500">
            Add a new card
          </div>

          <div className="relative flex flex-col flex-1">
            <textarea
              value={front}
              onChange={(e) => setFront(e.target.value)}
              placeholder="Front side"
              className="resize-none flex-1 my-2 p-2 rounded-sm bg-zinc-800 focus:outline-none text-sm"
            />
            <textarea
              value={back}
              onChange={(e) => setBack(e.target.value)}
              placeholder="Back side"
              className="resize-none flex-1 my-2 p-2 rounded-sm bg-zinc-800 focus:outline-none text-sm"
            />
          </div>

          <div className="flex justify-center items-center">
            <button
              onClick={async () => {
                // Add card
                if (selectedDeckRef != null) {
                  const newCardRef = doc(collection(selectedDeckRef, "cards"));
                  await setDoc(newCardRef, {
                    level: 0,
                    front: front,
                    back: back,
                    dueOn: Timestamp.fromDate(new Date(Date.now())),
                    id: newCardRef.id,
                    deck: selectedDeckRef,
                  });
                }

                setFront("");
                setBack("");

                setShowModal(false);
                setInAModal(false);
              }}
              className="relative inline-flex items-center justify-center p-0.5 overflow-hidden text-sm font-medium text-gray-900 rounded-lg group bg-gradient-to-br from-pink-500 to-orange-400 group-hover:from-pink-500 group-hover:to-orange-400 hover:text-white dark:text-white focus:ring-4 focus:outline-none focus:ring-pink-200 dark:focus:ring-pink-800"
            >
              <span className="relative px-5 py-2.5 transition-all ease-in duration-75 bg-zinc-700 rounded-md group-hover:bg-opacity-0">
                Add card
              </span>
            </button>
          </div>
        </div>
      </div>

      <div
        className="flex-1 flex justify-center items-center"
        type="button"
        onClick={() => {
          if (selectedDeckRef !== null && !inAModal) {
            setShowModal(true);
            setInAModal(true);
          }

          console.log(selectedDeckRef);
        }}
      >
        +
      </div>

      <div
        className="flex-1 flex justify-center items-center"
        onClick={() => setActive("new")}
      >
        New cards
      </div>
    </div>
  );
}

import React, { useEffect, useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useRecoilState } from "recoil";
import BottomBar from "../../components/bottom-bar/bottom-bar.component";
import userContext from "../../contexts/user.context";

import MenuIcon from "../../assets/menu-icon.svg";
import Dots from "../../assets/dots.svg";
import useOutsideAlerter from "../../utils/hooks/click-outside.hook";
import { db, signOutUser } from "../../utils/firebase/firebase.utils";

import {
  collection,
  deleteDoc,
  doc,
  Firestore,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";

export default function Home() {
  const [user, setUser] = useRecoilState(userContext);

  const [activeTab, setActiveTab] = useState("due");

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sidebarRef = useRef(null);
  useOutsideAlerter(sidebarRef, () => {
    if (!inAModal) {
      setSidebarOpen(false);
    }
  });

  const [decks, setDecks] = useState([]);
  const [deckRefs, setDeckRefs] = useState([]);
  const [selectedDeckId, setSelectedDeckId] = useState(null);
  const [selectedDeckIndex, setSelectedDeckIndex] = useState(-1);
  const [selectedDeckRef, setSelectedDeckRef] = useState(null);

  const [cards, setCards] = useState([]);
  const [cardRefs, setCardRefs] = useState([]);
  const [selectedCardId, setSelectedCardId] = useState(null);

  const [selectedCard, setSelectedCard] = useState(null);
  const [selectedCardWithDeckData, setSelectedCardWithDeckData] =
    useState(null);

  useEffect(() => {
    const a = async () => {
      if (selectedCard != null) {
        const deckData = (await getDoc(selectedCard.deck)).data();

        const data = {
          ...selectedCard,
          deckData,
        };

        setSelectedCardWithDeckData(data);
      }
    };

    a();
  }, [selectedCard]);

  const [showCardModal, setShowCardModal] = useState(false);
  const cardModalRef = useRef();
  useOutsideAlerter(cardModalRef, () => {
    setShowCardModal(false);
    setInAModal(false);
  });

  const [inAModal, setInAModal] = useState(false);

  const [cardFront, setCardFront] = useState("");
  const [cardBack, setCardBack] = useState("");

  const [showDeckModal, setShowDeckModal] = useState(false);
  const deckModalRef = useRef();
  useOutsideAlerter(deckModalRef, () => {
    setShowDeckModal(false);
    setInAModal(false);
  });

  const [newDeckName, setNewDeckName] = useState("");

  useEffect(() => {
    const a = async () => {
      if (showCardModal) {
        setCardFront(selectedCard.front);
        setCardBack(selectedCard.back);
      } else {
        if (activeTab !== "due" && activeTab !== "new") {
          let index = -1;
          for (let i = 0; i < cards.length; i++) {
            if (cards[i].id === selectedCardId) {
              index = i;
              break;
            }
          }

          if (index !== -1) {
            const currentCardRef = doc(
              db,
              "decks",
              selectedDeckId,
              "cards",
              selectedCardId
            );

            await updateDoc(currentCardRef, {
              front: cardFront,
              back: cardBack,
            });
          }
        }
      }
    };

    a();
  }, [showCardModal]);

  const navigate = useNavigate();

  useEffect(() => {
    if (!user.loggedIn) {
      navigate("/auth");
      return () => {};
    }

    const unsubscribeFromDecks = onSnapshot(
      doc(db, "users", user.currentUser.id),
      async (doc) => {
        const data = doc.data();

        const deckRefs = data.decks;
        const deckDatae = [];

        for (let i = 0; i < deckRefs.length; i++) {
          const d = await getDoc(deckRefs[i]);
          deckDatae.push(d.data());
        }

        setDeckRefs(deckRefs);
        setDecks(deckDatae);
      }
    );

    return () => {
      if (unsubscribeFromDecks != null) unsubscribeFromDecks();
    };
  }, []);

  let cancelPreviousCardSubscription = () => "";

  useEffect(() => {
    const func = async () => {
      if (selectedDeckId != null) {
        let index = -1;
        for (let i = 0; i < decks.length; i++) {
          if (decks[i].id === selectedDeckId) {
            index = i;
            break;
          }
        }

        cancelPreviousCardSubscription();
        cancelPreviousCardSubscription = onSnapshot(
          collection(deckRefs[index], "cards"),
          async (snapshot) => {
            if (snapshot != null) {
              const cards = [];
              const cardRefs = [];

              snapshot.forEach((doc) => {
                cardRefs.push(doc);
                cards.push(doc.data());
              });

              setCards(cards);
              setCardRefs(cardRefs);
            }
          }
        );

        setActiveTab("deck");
        setSelectedDeckIndex(index);
        setSelectedDeckRef(deckRefs[index]);
        setSidebarOpen(false);
      }
    };

    func();
  }, [selectedDeckId]);

  useEffect(() => {
    const a = async () => {
      if (activeTab != null && activeTab != "deck") {
        setSelectedDeckId(null);
        setSelectedDeckRef(null);

        setSidebarOpen(false);

        if (activeTab == "new") {
          await fetchNewCards();
        } else if (activeTab == "due") {
          await fetchDueCards();
        }
      }
    };

    a();
  }, [activeTab]);

  const [newCards, setNewCards] = useState([]);
  const fetchNewCards = async () => {
    console.log("Fetched new cards.");
    const nCards = [];

    const userRef = doc(db, "users", user.currentUser.id);
    const userData = (await getDoc(userRef)).data();

    const userDeckRefs = userData.decks;

    for (const deckRef of userDeckRefs) {
      const cardsRef = collection(deckRef, "cards");

      const q = query(cardsRef, where("level", "==", 0));
      const filteredCardsRef = (await getDocs(q)).docs;

      for (const cardRef of filteredCardsRef) {
        const cardData = cardRef.data();

        const deckRef = await getDoc(cardData.deck);
        const deckData = deckRef.data();

        if (filterCardsByDeck == null || deckData.id === filterCardsByDeck.id) {
          nCards.push(cardData);
        }
      }
    }

    setNewCards(nCards);
  };

  const [dueCards, setDueCards] = useState([]);
  const fetchDueCards = async () => {
    console.log("Fetched due cards.");
    const dCards = [];

    const userRef = doc(db, "users", user.currentUser.id);
    const userData = (await getDoc(userRef)).data();

    const userDeckRefs = userData.decks;

    for (const deckRef of userDeckRefs) {
      const cardsRef = collection(deckRef, "cards");

      const q = query(cardsRef, where("dueOn", "<", new Date(Date.now())));
      const filteredCardsRef = (await getDocs(q)).docs;

      for (const cardRef of filteredCardsRef) {
        const data = cardRef.data();

        const deckRef = await getDoc(data.deck);
        const deckData = deckRef.data();

        if (
          data.level > 0 &&
          (filterCardsByDeck == null || deckData.id === filterCardsByDeck.id)
        ) {
          dCards.push(data);
        }
      }
    }

    console.log(dCards);

    setDueCards(dCards);
  };

  const [filterCardsByDeck, setFilterCardsByDeck] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const a = async () => {
      if (activeTab == "new") await fetchNewCards();
      else if (activeTab == "due") await fetchDueCards();
    };

    a();
  }, [filterCardsByDeck]);

  return (
    <div className="bg-zinc-800 h-screen w-100 text-zinc-200 flex flex-col">
      {!user.loggedIn && <Navigate to="/auth" />}

      {/* ADD DECK MODAL */}
      <div
        ref={deckModalRef}
        id="defaultModal"
        aria-hidden="true"
        className={`${
          showDeckModal ? "scale-100" : "scale-0"
        } transition-all duration-300 overflow-x-hidden absolute top-[50%] left-[50%] z-50 w-3/4 h-1/2 translate-x-[-50%] translate-y-[-50%] max-w-lg max-h-[24rem] bg-zinc-700 rounded-lg shadow-2xl`}
        onClick={() => setInAModal(true)}
      >
        <div className="relative p-4 w-full max-w-2xl h-full flex flex-col">
          <div className="relative w-full border-b-2 pb-2 border-b-zinc-500 flex justify-between items-center">
            <h1 className="text-md font-medium">Create a new deck</h1>
          </div>

          <div className="flex justify-center items-center flex-col flex-1">
            <span className="mb-2">Deck name: </span>
            <input
              type="text"
              className="resize-none p-2 rounded-sm bg-zinc-800 focus:outline-none text-sm"
              value={newDeckName}
              onChange={(e) => setNewDeckName(e.target.value)}
            />
            <button
              className="mt-2 relative inline-flex items-center justify-center p-0.5 overflow-hidden text-sm font-medium text-gray-900 rounded-lg group bg-gradient-to-br from-pink-500 to-orange-400 group-hover:from-pink-500 group-hover:to-orange-400 hover:text-white dark:text-white focus:ring-4 focus:outline-none focus:ring-pink-200 dark:focus:ring-pink-800"
              onClick={async () => {
                if (newDeckName.length > 0) {
                  const newDeckRef = doc(collection(db, "decks"));
                  const currentUserRef = doc(db, "users", user.currentUser.id);
                  const currentUserRefData = await getDoc(currentUserRef);

                  await setDoc(newDeckRef, {
                    id: newDeckRef.id,
                    name: newDeckName,
                    owners: [currentUserRef],
                    public: true,
                    link: "",
                  });

                  await updateDoc(currentUserRef, {
                    decks: [...currentUserRefData.data().decks, newDeckRef],
                  });

                  setNewDeckName("");
                  setShowDeckModal(false);
                  setInAModal(false);
                }
              }}
            >
              <span className="relative px-5 py-2.5 transition-all ease-in duration-75 bg-zinc-800 rounded-md group-hover:bg-opacity-0">
                Create deck
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Sidenav */}
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
            <button
              type="button"
              className="scale-[90%] text-red-700 hover:text-white border border-red-700 hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:border-red-500 dark:text-red-500 dark:hover:text-white dark:hover:bg-red-600 dark:focus:ring-red-900"
              onClick={() => signOutUser(setUser)}
            >
              Sign Out
            </button>
          </div>

          {/* Options */}
          <div className="pt-4">
            <h1 className="px-4 text-xs font-medium text-zinc-400 pb-2">
              PAGES
            </h1>
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
                    const currentUserRef = doc(
                      db,
                      "users",
                      user.currentUser.id
                    );
                    const currentUserRefData = await getDoc(currentUserRef);

                    await updateDoc(currentUserRef, {
                      decks: currentUserRefData
                        .data()
                        .decks.filter((deckRef) => deckRef.id !== deck.id),
                    });

                    await deleteDoc(doc(db, "decks", deck.id));
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

      {/* Topbar */}
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

      <div
        className={`bg-black absolute top-0 left-0 h-screen w-screen ${
          inAModal ? "opacity-50 z-10" : "opacity-0 -z-10"
        } transition-all duration-300`}
      ></div>

      {/* Card modal */}
      <div
        ref={cardModalRef}
        id="cardModal"
        aria-hidden="true"
        className={`${
          showCardModal ? "scale-100" : "scale-0"
        } transition-all duration-300 overflow-x-hidden absolute top-[50%] left-[50%] z-50 w-3/4 h-1/2 translate-x-[-50%] translate-y-[-50%] max-w-lg max-h-[24rem] bg-zinc-700 rounded-lg shadow-2xl`}
        onClick={() => setInAModal(true)}
      >
        {selectedCardWithDeckData != null && (
          <div className="relative p-4 w-full max-w-2xl h-full flex flex-col">
            <div className="relative w-full border-b-2 pb-2 border-b-zinc-500 flex justify-between items-center">
              <h1>{selectedCardWithDeckData.deckData.name}</h1>
              {activeTab !== "due" && activeTab !== "new" && (
                <button
                  type="button"
                  className="text-red-700 hover:text-white border border-red-700 hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm px-3 py-1.5 text-center dark:border-red-500 dark:text-red-500 dark:hover:text-white dark:hover:bg-red-600 dark:focus:ring-red-900"
                  onClick={async () => {
                    let index = -1;
                    for (let i = 0; i < cards.length; i++) {
                      if (cards[i].id === selectedCardId) {
                        index = i;
                        break;
                      }
                    }

                    if (index != -1) {
                      await deleteDoc(
                        doc(
                          db,
                          "decks",
                          selectedDeckId,
                          "cards",
                          selectedCardId
                        )
                      );
                    }

                    setShowCardModal(false);
                    setInAModal(false);
                  }}
                >
                  Delete
                </button>
              )}
            </div>

            {selectedCard != null && (
              <div className="flex-1 flex flex-col">
                <textarea
                  value={cardFront}
                  onChange={(e) =>
                    activeTab !== "due" &&
                    activeTab !== "new" &&
                    setCardFront(e.target.value)
                  }
                  className="resize-none bg-zinc-800 rounded-md flex-1 mt-4 mb-2 p-2 text-xs text-zinc-400 focus:outline-none"
                ></textarea>
                <textarea
                  value={cardBack}
                  onChange={(e) =>
                    activeTab !== "due" &&
                    activeTab !== "new" &&
                    setCardBack(e.target.value)
                  }
                  className="resize-none bg-zinc-800 rounded-md flex-1 mt-2 p-2 text-xs text-zinc-400 focus:outline-none"
                ></textarea>

                {(activeTab === "due" || activeTab === "new") && (
                  <div className="w-[80%] mx-auto flex justify-between pt-4">
                    <button
                      className="relative inline-flex items-center justify-center p-0.5 mb-2 mr-2 overflow-hidden text-sm font-medium text-gray-900 rounded-lg group bg-gradient-to-br from-cyan-500 to-blue-500 group-hover:from-cyan-500 group-hover:to-blue-500 hover:text-white dark:text-white focus:ring-4 focus:outline-none focus:ring-cyan-200 dark:focus:ring-cyan-800"
                      onClick={async () => {
                        const cardRef = doc(
                          db,
                          "decks",
                          selectedCardWithDeckData.deckData.id,
                          "cards",
                          selectedCard.id
                        );

                        if (activeTab === "new") {
                          await updateDoc(cardRef, {
                            level: 1,
                          });

                          fetchNewCards();
                        } else if (activeTab === "due") {
                          let offset = 1;
                          switch (selectedCard.level) {
                            case 1:
                              offset = 1;
                              break;
                            case 2:
                              offset = 3;
                              break;
                            case 3:
                              offset = 7;
                              break;
                            case 4:
                              offset = 15;
                              break;
                            case 5:
                              offset = 30;
                              break;
                            case 6:
                              offset = 90;
                              break;
                            case 7:
                              offset = 180;
                              break;
                            default:
                              offset = 200;
                          }

                          await updateDoc(cardRef, {
                            dueOn: Timestamp.fromDate(
                              new Date(
                                Date.now() + offset * 24 * 60 * 60 * 1000
                              )
                            ),
                          });

                          fetchDueCards();
                        }

                        setShowCardModal(false);
                        setInAModal(false);
                      }}
                    >
                      <span className="relative px-5 py-2.5 transition-all ease-in duration-75 bg-zinc-800 rounded-md group-hover:bg-opacity-0">
                        Right
                      </span>
                    </button>

                    <button
                      type="button"
                      className="text-red-700 border-2 bg-zinc-800 hover:text-white border-red-700 hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center mr-2 mb-2 dark:border-red-500 dark:text-red-500 dark:hover:text-white dark:hover:bg-red-600 dark:focus:ring-red-900"
                      onClick={async () => {
                        if (activeTab === "due") {
                          const cardRef = doc(
                            db,
                            "decks",
                            selectedCardWithDeckData.deckData.id,
                            "cards",
                            selectedCard.id
                          );

                          await updateDoc(cardRef, {
                            level: 1,
                            dueOn: Timestamp.fromDate(
                              new Date(Date.now() + 24 * 60 * 60 * 1000)
                            ),
                          });
                        }

                        setShowCardModal(false);
                        setInAModal(false);
                      }}
                    >
                      Wrong
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main section */}
      <div className="flex-1 p-4 overflow-y-hidden">
        {activeTab == "deck" && (
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
        )}

        <div className="h-full overflow-y-scroll text-center">
          <button
            className="mt-1 relative inline-flex items-center justify-center p-0.5 mb-2 mr-2 overflow-hidden text-sm font-medium text-gray-900 rounded-lg group bg-gradient-to-br from-cyan-500 to-blue-500 group-hover:from-cyan-500 group-hover:to-blue-500 hover:text-white dark:text-white focus:ring-4 focus:outline-none focus:ring-cyan-200 dark:focus:ring-cyan-800"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <span className="relative px-5 py-2.5 transition-all ease-in duration-75 bg-zinc-800 rounded-md group-hover:bg-opacity-0">
              {filterCardsByDeck !== null
                ? filterCardsByDeck.name
                : "Don't filter"}
            </span>
          </button>

          {/* TODO(calco): Dropdown */}
          <div
            className={`${
              showDropdown ? "scale-100" : "scale-0 hidden"
            } mt-2 z-50 bg-white divide-y divide-gray-100 rounded shadow w-44 dark:bg-gray-700 transition-all duration-200 mx-auto`}
          >
            <ul
              className="py-1 text-sm text-gray-700 dark:text-gray-200"
              aria-labelledby="dropdownDefault"
            >
              {decks.map((deck) => (
                <li
                  className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
                  key={deck.id}
                  onClick={() => {
                    setFilterCardsByDeck(deck);
                    setShowDropdown(false);
                  }}
                >
                  {deck.name}
                </li>
              ))}
              <li
                className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
                key="Don't filter"
                onClick={() => {
                  setFilterCardsByDeck(null);
                  setShowDropdown(false);
                }}
              >
                Don't filter
              </li>
            </ul>
          </div>

          {activeTab == "new" && (
            <div className="grid grid-cols-1 gap-3 pt-4 break-all">
              {
                // TODO(calco): new cards
                newCards.map((card) => (
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
                ))
              }
            </div>
          )}

          {activeTab == "due" && (
            <div className="grid grid-cols-1 gap-3 pt-4 break-all">
              {
                // TODO(calco): due cards
                dueCards.map((card) => (
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
                ))
              }
            </div>
          )}
        </div>
      </div>

      {/* Bottom bar / navbar */}
      <BottomBar
        setActive={setActiveTab}
        selectedDeckRef={selectedDeckRef}
        setInAModal={setInAModal}
        inAModal={inAModal}
      />
    </div>
  );
}

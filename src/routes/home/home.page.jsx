import React, { useEffect, useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useRecoilState } from "recoil";
import BottomBar from "../../components/bottom-bar/bottom-bar.component";
import userContext from "../../contexts/user.context";

import useOutsideAlerter from "../../utils/hooks/click-outside.hook";
import { db, signOutUser } from "../../utils/firebase/firebase.utils";

import CustomButton from "../../components/custom-button/custom-button.component";
import Sidebar from "../../components/sidebar/sidebar.component";
import Topbar from "../../components/topbar/topbar.component";

import DeckTab from "../../components/tabs/deck-tab/deck-tab.component";
import NewTab from "../../components/tabs/new-tab/new-tab.component";
import DueTab from "../../components/tabs/due-tab/due-tab.component";

import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
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
  // const [cardRefs, setCardRefs] = useState([]);
  const [selectedCardId, setSelectedCardId] = useState(null);

  const [selectedCard, setSelectedCard] = useState(null);
  const [selectedCardWithDeckData, setSelectedCardWithDeckData] = useState(null);

  const [inAModal, setInAModal] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  const cardModalRef = useRef();

  const [showDeckModal, setShowDeckModal] = useState(false);
  const deckModalRef = useRef();

  const [cardFront, setCardFront] = useState("");
  const [cardBack, setCardBack] = useState("");

  const [newDeckName, setNewDeckName] = useState("");

  const navigate = useNavigate();

  let cancelPreviousCardSubscription = () => "";

  const deleteSelectedCard = async () => {
    let index = -1;
    for (let i = 0; i < cards.length; i++) {
      if (cards[i].id === selectedCardId) {
        index = i;
        break;
      }
    }

    if (index != -1) {
      await deleteDoc(
        doc(db, "decks", selectedDeckId, "cards", selectedCardId)
      );
    }

    setShowCardModal(false);
    setInAModal(false);
  };

  const [newCards, setNewCards] = useState([]);
  const fetchNewCards = async () => {
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

    setDueCards(dCards);
  };

  const [filterCardsByDeck, setFilterCardsByDeck] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);

  const cardRight = async () => {
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
          new Date(Date.now() + offset * 24 * 60 * 60 * 1000)
        ),
      });

      fetchDueCards();
    }

    setShowCardModal(false);
    setInAModal(false);
  };
  const cardWrong = async () => {
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
        dueOn: Timestamp.fromDate(new Date(Date.now() + 24 * 60 * 60 * 1000)),
      });
    }

    setShowCardModal(false);
    setInAModal(false);
  };

  useOutsideAlerter(cardModalRef, () => {
    setShowCardModal(false);
    setInAModal(false);
  });

  useOutsideAlerter(deckModalRef, () => {
    setShowDeckModal(false);
    setInAModal(false);
  });

  // Redirect user to Auth if not logged in otherwise, fetch data ; unsubscribe from all Firestore snapshots when leaving
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

  // Fetch all decks from the new selected deck
  useEffect(() => {
    const fetchCardsFromDeck = async () => {
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
              // setCardRefs(cardRefs);
            }
          }
        );

        setActiveTab("deck");
        setSelectedDeckIndex(index);
        setSelectedDeckRef(deckRefs[index]);
        setSidebarOpen(false);
      }
    };

    fetchCardsFromDeck();
  }, [selectedDeckId]);

  // Fetch new or due cards on changed tab
  useEffect(() => {
    const fetchCards = async () => {
      if (activeTab != null && activeTab != "deck") {
        setSelectedDeckId(null);
        setSelectedDeckRef(null);

        setSidebarOpen(false);

        if (activeTab == "new") await fetchNewCards();
        else if (activeTab == "due") await fetchDueCards();
      }
    };

    fetchCards();
  }, [activeTab]);

  // Update selected card
  useEffect(() => {
    const updateSelectedCard = async () => {
      if (selectedCard != null) {
        const deckData = (await getDoc(selectedCard.deck)).data();

        const data = {
          ...selectedCard,
          deckData,
        };

        setSelectedCardWithDeckData(data);
      }
    };

    updateSelectedCard();
  }, [selectedCard]);

  // Fetch new or due cards on updated filtering preferences.
  useEffect(() => {
    const fetchCards = async () => {
      if (activeTab == "new") await fetchNewCards();
      else if (activeTab == "due") await fetchDueCards();
    };

    fetchCards();
  }, [filterCardsByDeck]);

  // Check and update the selected card.
  useEffect(() => {
    const checkAndUpdateCard = async () => {
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

    checkAndUpdateCard();
  }, [showCardModal]);

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

      <Sidebar
        sidebarRef={sidebarRef}
        sidebarOpen={sidebarOpen}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        decks={decks}
        selectedDeckId={selectedDeckId}
        setSelectedDeckId={setSelectedDeckId}
        signOutUser={signOutUser}
        inAModal={inAModal}
        setInAModal={setInAModal}
        setShowDeckModal={setShowDeckModal}
        setSidebarOpen={setSidebarOpen}
        user={user}
        setUser={setUser}
      />

      <Topbar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        activeTab={activeTab}
        dueCards={dueCards}
        newCards={newCards}
        selectedDeckIndex={selectedDeckIndex}
        decks={decks}
      />

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
                <CustomButton
                  highlighted={false}
                  colour="red"
                  onClick={deleteSelectedCard}
                >
                  Delete
                </CustomButton>
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
                    <CustomButton
                      highlighted={false}
                      colour="green"
                      onClick={cardRight}
                    >
                      Right
                    </CustomButton>

                    <CustomButton
                      highlighted={false}
                      colour="red"
                      onClick={cardWrong}
                    >
                      Wrong
                    </CustomButton>
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
          <DeckTab
            cards={cards}
            inAModal={inAModal}
            setSelectedCardId={setSelectedCardId}
            setSelectedCard={setSelectedCard}
            setShowCardModal={setShowCardModal}
            setInAModal={setInAModal}
          />
        )}

        {/* Filter Cards */}
        {
          activeTab != "deck" && activeTab != null && (
          <div className="h-full overflow-y-scroll text-center">
            <CustomButton
              highlighted={false}
              colour="blue"
              onClick={() => setShowDropdown(!showDropdown)}
            >
              {filterCardsByDeck !== null
                ? filterCardsByDeck.name
                : "Don't filter"}
            </CustomButton>

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
              <NewTab
                newCards={newCards}
                inAModal={inAModal}
                sidebarOpen={sidebarOpen}
                setSelectedCardId={setSelectedCardId}
                setSelectedCard={setSelectedCard}
                setShowCardModal={setShowCardModal}
                setInAModal={setInAModal}
              />
            )}

            {activeTab == "due" && (
              <DueTab
                dueCards={dueCards}
                inAModal={inAModal}
                sidebarOpen={sidebarOpen}
                setSelectedCardId={setSelectedCardId}
                setSelectedCard={setSelectedCard}
                setShowCardModal={setShowCardModal}
                setInAModal={setInAModal}
              />
            )}
          </div>
          )
        }
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

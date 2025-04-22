import "./assets/styles/index.scss";
import HSK from "./data/hsk_characters.json";
import { useLocalStorageContext } from "./providers/localStorageProvider";
import { useEffect, useState } from "react";
import { STATES } from "./contants";
import { filterUsedCharacters, getRandomItems } from "./helpers";
import PlaySound, { usePlaySound } from "./components/playSound";

const App = () => {
  const { storage, setStorage } = useLocalStorageContext();
  const currentLevels = storage?.levels;
  const state = storage?.state || "reset";
  const correctAnswers = storage?.correctAnswers || 0;
  const processedCharacters = storage?.processedCharacters || 0;
  const usedCharacters = storage?.usedCharacters || [];
  const known = storage?.known || [];
  const counter = storage?.counter || 0;
  const masteryCount = 100;
  const charStats = storage?.charStats || {};
  const [character, setCharacter] = useState(null);
  const [characters, setCharacters] = useState([]);
  const [totalCharacters, setTotalCharacters] = useState([]);
  const [view, setView] = useState("game");
  const [options, setOptions] = useState([]);
  const playSound = usePlaySound(character?.pinyin);
  const playSoundError = usePlaySound("error");

  const mc = Object.fromEntries(
    Object.entries(charStats).filter(([_, v]) => v >= masteryCount)
  );

  const masteredChars = Object.keys(mc);

  const loadCharacters = () => {
    const orderedLevel = HSK.sort((a, b) => parseInt(a.hsk) - parseInt(b.hsk));

    setTotalCharacters(orderedLevel);

    setCharacters(orderedLevel);
  };

  const calculateRating = () => {
    const maxMultiplier = 10000 / totalCharacters.length;

    return known.reduce((total, item) => {
      const contribution = Math.min(
        (item.correctCount / 1.5) * maxMultiplier,
        maxMultiplier
      );
      return total + contribution;
    }, 0);
  };

  const finalRating = calculateRating();

  useEffect(() => {
    loadCharacters();
  }, []);

  useEffect(() => {
    const reuseFrequency = 5;

    if (counter >= reuseFrequency) {
      setStorage({
        counter: 0,
      });
      reuseChars(1);
    }
  }, [counter]);

  const handleStates = () => {
    if (state === STATES.ONGOING) {
      if (!character) {
        const randomItem = getRandomItems(characters, known);

        if (randomItem.length === 6) {
          setCharacter(randomItem[0]);
          setOptions(randomItem.sort(() => Math.random() - 0.5));
        }
      }
    }
    if (state === STATES.REVEAL) {
      if (!character) {
        setStorage({
          selectedCharacter: null,
          state: STATES.ONGOING,
        });
      }
    }
  };

  const getUserCharactersLen = () =>
    filterUsedCharacters(characters, known).length;

  const getRankAndStars = (rating) => {
    if (typeof rating !== "number" || rating < 0) {
      return { rank: "Invalid", stars: 0, starIcons: "" };
    }

    // Cap rating to a maximum of 10,000
    rating = Math.min(rating, 10000);

    // Define ranks with adjusted names
    const ranks = [
      { name: "Novice", min: 0, max: 99 },
      { name: "Beginner", min: 100, max: 224 },
      { name: "Aspiring", min: 225, max: 349 },
      { name: "Learner", min: 350, max: 474 },
      { name: "Elementary", min: 475, max: 599 },
      { name: "Explorer", min: 600, max: 724 },
      { name: "Intermediate", min: 725, max: 849 },
      { name: "Adventurer", min: 850, max: 974 },
      { name: "Achiever", min: 975, max: 1099 },
      { name: "Advanced", min: 1100, max: 1224 },
      { name: "Expert", min: 1225, max: 1349 },
      { name: "Master", min: 1350, max: 1474 },
      { name: "Virtuoso", min: 1475, max: 1599 },
      { name: "Adept", min: 1600, max: 1724 },
      { name: "Savant", min: 1725, max: 1849 },
      { name: "Legend", min: 1850, max: 2249 },
      { name: "Champion", min: 2250, max: 3249 },
      { name: "Hero", min: 3250, max: 4500 },
      { name: "Conqueror", min: 4501, max: 5750 },
      { name: "Invincible", min: 5751, max: 7000 },
      { name: "Titan", min: 7001, max: 8000 },
      { name: "Overlord", min: 8001, max: 8500 },
      { name: "Supreme", min: 8501, max: 9000 },
      { name: "Master", min: 9001, max: 9500 },
      { name: "Deity", min: 9501, max: 10000 },
    ];

    for (let rank of ranks) {
      if (rating >= rank.min && rating <= rank.max) {
        const range = rank.max - rank.min + 1;
        let stars;

        if (rank.name === "Deity") {
          stars = 5; // Maximum stars for Deity
        } else {
          stars = Math.max(1, Math.floor((rating - rank.min) / (range / 5)));
        }

        const starIcons = "★".repeat(stars);
        return {
          rank: rank.name,
          stars: stars,
          starIcons: starIcons,
        };
      }
    }

    return { rank: "Unknown", stars: 0, starIcons: "" }; // Fallback case
  };

  const reuseChars = (chars = 1) => {
    // Mastered words shouldn't be part of reuse words anymore
    const finalChars = usedCharacters.filter((e) => {
      const stats = charStats?.[e.character] || 0;

      return stats < masteryCount;
    });

    const removed = [];
    const removedUsedChar = [...finalChars]; // so the original array isn't mutated

    const countToRemove = Math.min(chars, removedUsedChar.length);

    for (let i = 0; i < countToRemove; i++) {
      const randomIndex = Math.floor(Math.random() * removedUsedChar.length);
      const [removedItem] = removedUsedChar.splice(randomIndex, 1);
      removed.push(removedItem.character);
    }

    const newKnown = known.filter((e) => !removed.includes(e.character));

    setTimeout(() => {
      setStorage({
        usedCharacters: removedUsedChar,
        known: newKnown,
      });
    }, 100);
  };

  const revealAnswer = (selected) => {
    if (state !== STATES.ONGOING) {
      return false;
    }

    const char = character.character;

    // Play sound
    playSound();

    const isCorrect = selected.character === char;

    const newCorrectAnswers = isCorrect ? correctAnswers + 1 : correctAnswers;

    let newUsedChar = usedCharacters;
    let newKnown = known;

    if (!charStats[char]) {
      charStats[char] = 0;
    }

    if (isCorrect) {
      const knownItem = known.find((item) => item.character === char);

      if (!knownItem) {
        newKnown.push({ character: char, correctCount: 1 });
      } else {
        knownItem.correctCount += 1; // Increment correctCount for the known character
      }

      newUsedChar = [...usedCharacters, character];

      charStats[char] += 1;
    } else {
      const knownItem = known.find((item) => item.character === char);
      if (knownItem) {
        const deductor =
          knownItem.correctCount >= 10 ? knownItem.correctCount : 1;
        knownItem.correctCount -= deductor;

        if (knownItem.correctCount <= 0) {
          newKnown = known.filter((item) => item.character !== char);
        } else {
          newKnown = [...known];
        }
      } else {
        newKnown = [...known];
      }

      charStats[char] -= 1;

      if (charStats[char] < 0) {
        charStats[char] = 0;
      }

      reuseChars(7);

      // Play error sound
      playSoundError("error");
    }

    let newStoreItem = {
      state: STATES.REVEAL,
      selectedCharacter: selected.character,
      usedCharacters: newUsedChar,
      correctAnswers: newCorrectAnswers,
      processedCharacters: processedCharacters + 1,
      known: newKnown,
      counter: counter + 1,
      charStats,
    };

    setStorage(newStoreItem);
  };

  const reset = () => {
    setCharacter(null);
    setStorage({
      selectedCharacter: null,
      usedCharacters: [],
      correctAnswers: 0,
      processedCharacters: 0,
      state: STATES.RESET,
      rating: 0,
      known: [],
      counter: 0,
      charStats: {},
    });
  };

  const getScorePercentage = () => {
    const total = processedCharacters;
    const point = (correctAnswers / total) * 100;

    return isNaN(point) ? "0.00" : parseFloat(point).toFixed(2);
  };

  useEffect(() => {
    loadCharacters();
  }, [currentLevels]);

  useEffect(() => {
    handleStates();

    if (getUserCharactersLen() <= 0) {
      loadCharacters();
    }
  }, [state, characters]);

  const ContinueBtn = ({ label, action }) => (
    <button
      onClick={() => {
        setStorage({
          state: STATES.ONGOING,
        });
        action?.();
      }}
    >
      {label}
    </button>
  );

  const addMasterChar = (char, add = true) => {
    charStats[char] = !add ? 0 : masteryCount;

    setStorage({
      charStats,
    });
  };

  return (
    <div className="app-container">
      <div className="level-selector"></div>
      <div className="info-container">
        <div className="game-info-container">
          <div className="info-item">
            <span className="title" title="Queued Characters">
              Characters:
            </span>
            <span className="value">
              {known.length}/{totalCharacters.length}
            </span>
          </div>
          <div className="info-item">
            <span className="title">Accuracy:</span>
            <span className="value">
              {correctAnswers}/{processedCharacters} ({getScorePercentage()}%)
            </span>
          </div>
          <div className="info-item pointer" onClick={reset}>
            <span className="value">↻ Reset Progress</span>
          </div>
          <div className="info-item pointer" onClick={() => setView("master")}>
            <span className="title">Mastered Characters:</span>
            <span className="value">({masteredChars?.length})</span>
          </div>
        </div>

        <div className="level-info-container">
          <div className="rank-box">
            <span className="stars">
              {getRankAndStars(finalRating).starIcons}
            </span>
            <span className="rank">{getRankAndStars(finalRating).rank}</span>
            <span className="rating">({Math.floor(finalRating)})</span>
          </div>
        </div>
      </div>
      {view === "game" && (
        <div className="game-container">
          {state === STATES.RESET && <ContinueBtn label="Start" />}
          {(state === STATES.ONGOING || state === STATES.REVEAL) && (
            <>
              {character ? (
                <>
                  <div className="character-container">
                    {character.character}
                    <div className="sub-item">
                      {charStats?.[character.character] >= masteryCount ? (
                        <span className="master-item">★</span>
                      ) : (
                        <span
                          onClick={() => addMasterChar(character.character)}
                        >
                          + Add to mastered list{" "}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="options-container">
                    {options.map((option, ok) => (
                      <div
                        key={`option-btn-${option.pinyin}-${ok}`}
                        className={`btn-container ${
                          state === STATES.REVEAL &&
                          (character.character === option.character
                            ? "correct"
                            : "")
                        }
                   ${
                     state === STATES.REVEAL &&
                     storage.selectedCharacter === option.character
                       ? character.character === option.character
                         ? "correct"
                         : "wrong"
                       : ""
                   }`}
                      >
                        <PlaySound filename={option.pinyin} />
                        <button
                          className="option-btn"
                          onClick={() => revealAnswer(option)}
                        >
                          {option.pinyin}
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  {!currentLevels ? (
                    <p>Select a level to continue</p>
                  ) : (
                    <ContinueBtn
                      label="Reset"
                      action={() => {
                        reset();
                      }}
                    />
                  )}
                </>
              )}
            </>
          )}
          {state === STATES.REVEAL && (
            <div className="answer-container">
              <span className="info">{character?.definition}</span>
              <div className="action-box">
                <ContinueBtn
                  label="Next"
                  action={() => {
                    setCharacter(null);
                    setStorage({
                      selectedCharacter: null,
                    });
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}
      {view === "master" && (
        <div className="table-container">
          <span className="table-title">Mastered Characters</span>
          <span className="pointer" onClick={() => setView("game")}>
            ← Back to game
          </span>
          <div className="table-box">
            <span className="title">Press to remove</span>
            <div className="box-container">
              {masteredChars.map((e) => (
                <span
                  className="box-item pointer"
                  key={e}
                  onClick={() => addMasterChar(e, false)}
                >
                  {e}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;

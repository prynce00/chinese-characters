import "./assets/styles/index.scss";
import HSK from "./data/hsk_characters.json";
import { useLocalStorageContext } from "./providers/localStorageProvider";
import { useEffect, useState } from "react";
import { STATES } from "./contants";
import {
  filteredUsedChars,
  filterUsedCharacters,
  getRandomItems,
} from "./helpers";
import PlaySound, { usePlaySound } from "./components/playSound";
import useKeyPress from "./hooks/useKeyPress";

const App = () => {
  const { storage, setStorage } = useLocalStorageContext();
  const currentLevels = storage?.levels;
  const state = storage?.state || "reset";
  const correctAnswers = storage?.correctAnswers || 0;
  const processedCharacters = storage?.processedCharacters || 0;
  const usedCharacters = storage?.usedCharacters || [];
  const mistakes = storage?.mistakes || 0;
  const nextReviewCharacter = storage?.nextReviewCharacter || 10;
  const totalAllowedMistakes = 10;
  const known = storage?.known || [];
  const [character, setCharacter] = useState(null);
  const [characters, setCharacters] = useState([]);
  const [totalCharacters, setTotalCharacters] = useState([]);
  const [options, setOptions] = useState([]);
  const [isReview, setReview] = useState(false);
  const playSound = usePlaySound(character?.pinyin);
  const { isSpacePressed, characterPressed } = useKeyPress();

  const characterCount = known.length + 10;

  const loadCharacters = () => {
    const orderedLevel = HSK.sort((a, b) => parseInt(a.hsk) - parseInt(b.hsk));

    setTotalCharacters(orderedLevel);

    const characterSet = orderedLevel
      .slice(0, characterCount)
      .sort(() => 0.5 - Math.random());

    setCharacters(characterSet);
  };

  const pickLeastKnownCharacterData = () => {
    if (!known.length) return false;

    const minCorrectCount = Math.min(...known.map((item) => item.correctCount));

    if (minCorrectCount > 10) return false;

    const leastKnownCharacters = known.filter(
      (item) => item.correctCount === minCorrectCount
    );

    const reviewChar =
      leastKnownCharacters[
        Math.floor(Math.random() * leastKnownCharacters.length)
      ];

    return (
      totalCharacters.find(
        (entry) => entry.character === reviewChar.character
      ) || false
    );
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

  const getKnownCharacter = (char) => {
    return known.find((e) => e.character === char) || null;
  };

  const finalRating = calculateRating();

  useEffect(() => {
    loadCharacters();
  }, []);

  useEffect(() => {
    if (isSpacePressed && state === STATES.REVEAL) {
      setCharacter(null);
      setStorage({
        selectedCharacter: null,
        state: STATES.ONGOING,
      });
    }
  }, [isSpacePressed]);

  useEffect(() => {
    const shortcuts = {
      E: 0,
      I: 1,
      D: 2,
      J: 3,
      C: 4,
      N: 5,
    };

    const optionkey = shortcuts[characterPressed];

    if (state === STATES.ONGOING && optionkey !== undefined) {
      document.querySelectorAll(".option-btn")[optionkey].click();
    }
  }, [characterPressed]);

  const handleStates = () => {
    if (state === STATES.ONGOING) {
      if (!character) {
        const randomItem = getRandomItems(characters, usedCharacters);

        if (isReview) {
          const reviewChar = pickLeastKnownCharacterData();

          if (reviewChar) {
            randomItem[0] = reviewChar;

            const pinyinSet = new Set(randomItem.map((item) => item.pinyin));

            if (pinyinSet.size < randomItem.length) {
              const filteredCharacters = characters.filter(
                (char) =>
                  !usedCharacters.includes(char.character) &&
                  !pinyinSet.has(char.pinyin)
              );

              for (let i = 0; i < randomItem.length; i++) {
                if (
                  randomItem
                    .slice(i + 1)
                    .some((item) => item.pinyin === randomItem[i].pinyin)
                ) {
                  randomItem[i] = filteredCharacters.pop() || randomItem[i];
                }
              }
            }
          }
        }

        setReview(false);

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
    filterUsedCharacters(characters, usedCharacters).length;

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
    let newMistakes = mistakes;
    let newNextRevChar = nextReviewCharacter;

    if (isCorrect) {
      const knownItem = known.find((item) => item.character === char);

      if (!knownItem) {
        newKnown.push({ character: char, correctCount: 1 });
      } else {
        knownItem.correctCount += 1; // Increment correctCount for the known character
      }

      newUsedChar = [...usedCharacters, character];
    } else {
      const knownItem = known.find((item) => item.character === char);
      if (knownItem) {
        knownItem.correctCount -= 1;
        if (knownItem.correctCount <= 0) {
          newKnown = known.filter((item) => item.character !== char);
        } else {
          newKnown = [...known];
        }
      } else {
        newKnown = [...known];
      }

      newMistakes = mistakes + 1;
    }

    newNextRevChar = nextReviewCharacter - 1;

    if (newNextRevChar <= 0) {
      setReview(true);
    }

    let newStoreItem = {
      state: STATES.REVEAL,
      selectedCharacter: selected.character,
      usedCharacters: newUsedChar,
      correctAnswers: newCorrectAnswers,
      processedCharacters: processedCharacters + 1,
      known: newKnown,
      mistakes: newMistakes,
      nextReviewCharacter: newNextRevChar,
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
      unknown: [],
      mistakes: 0,
      nextReviewCharacter: 0,
    });
  };

  const resetChallenge = () => {
    setCharacter(null);
    setStorage({
      selectedCharacter: null,
      usedCharacters: [],
      state: STATES.RESET,
      mistakes: 0,
      nextReviewCharacter: 0,
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

    if (mistakes >= totalAllowedMistakes) {
      setStorage({
        usedCharacters: [],
        mistakes: 0,
      });
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

  const ProgressBar = ({ character }) => {
    const correctCount = getKnownCharacter(character)?.correctCount || 0; // Default to 0 if undefined
    const maxSpans = 10;

    return (
      <div className="progress-container">
        {correctCount >= maxSpans ? (
          <span className="check-badge" aria-label="Completed">
            &#x2714;
          </span>
        ) : (
          Array.from({ length: maxSpans }, (_, index) => (
            <span
              key={index}
              className={`bar ${index < correctCount ? "active" : ""}`}
            ></span>
          ))
        )}
      </div>
    );
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
            <span className="title" title="Queued Characters">
              Character Challenge:
            </span>
            <span className="value">
              {filteredUsedChars(usedCharacters).length}/{characters.length}
            </span>
          </div>
          <div className="info-item">
            <span className="title" title="Estimated Known Characters">
              Mistakes:
            </span>
            <span className="value">
              {mistakes}/{totalAllowedMistakes}
            </span>
          </div>
          <div className="info-item">
            <span className="title" title="Estimated Known Characters">
              Next Review Character:
            </span>
            <span className="value">
              {nextReviewCharacter}({pickLeastKnownCharacterData()?.character})
            </span>
          </div>
          <div className="info-item">
            <span className="title">Accuracy:</span>
            <span className="value">
              {correctAnswers}/{processedCharacters} ({getScorePercentage()}%)
            </span>
          </div>
          <div className="info-item" onClick={reset}>
            <span className="value">↻ Reset Progress</span>
          </div>
          <div className="info-item" onClick={resetChallenge}>
            <span className="value">↻ Reset Challenge</span>
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
      <div className="game-container">
        {state === STATES.RESET && <ContinueBtn label="Start" />}
        {(state === STATES.ONGOING || state === STATES.REVEAL) && (
          <>
            {character ? (
              <>
                <div className="character-container">
                  {character.character}
                  <ProgressBar character={character.character} />
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
    </div>
  );
};

export default App;

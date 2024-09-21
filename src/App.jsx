import './assets/styles/index.scss'
import HSK from './data/hsk_characters.json'
import Select from 'react-select'
import { useLocalStorageContext } from './providers/localStorageProvider'
import { useEffect, useState } from 'react'
import { STATES } from './contants'
import { filterUsedCharacters, getRandomItems } from './helpers'
import PlaySound from './components/playSound'

const App = () => {
  const { storage, setStorage } = useLocalStorageContext()
  const currentLevels = storage?.levels
  const state = storage?.state || 'reset'
  const correctAnswers = storage?.correctAnswers || 0
  const processedCharacters = storage?.processedCharacters || 0
  const usedCharacters = storage?.usedCharacters || []
  const [character, setCharacter] = useState(null)
  const [characters, setCharacters] = useState([])
  const [options, setOptions] = useState([])

  const levels = [
    {
      level: 1,
      value: 'HSK-1'
    },
    {
      level: 2,
      value: 'HSK-2'
    },
    {
      level: 3,
      value: 'HSK-3'
    },
    {
      level: 4,
      value: 'HSK-4'
    },
    {
      level: 5,
      value: 'HSK-5'
    },
    {
      level: 6,
      value: 'HSK-6'
    },
    {
      level: "",
      value: 'Advance'
    }
  ]

  const loadCharacters = () => {
    let allData = []
    currentLevels?.forEach(({ label }) => {
      const level = levels.find(e => label === e.value).level

      const data = HSK.filter(item => item.hsk === String(level));

      allData = [...data, ...allData].sort(() => Math.random() - 0.5)
      allData = allData.filter((item, index, self) => 
        index === self.findIndex(obj => obj.character === item.character)
      );
    })

    setCharacters(allData)
  }

  const handleStates = () => {
    if (state === STATES.ONGOING) {
      if (!character) {
        const randomItem = getRandomItems(characters, usedCharacters)

        if (randomItem.length === 4) {
          setCharacter(randomItem[0])
          setOptions(randomItem.sort(() => Math.random() - 0.5))
        }
      }
    }
    if (state === STATES.REVEAL) {
      if (!character) {
        setStorage({
          selectedCharacter: null,
          state: STATES.ONGOING
        })
      }
    }
  }

  const getUserCharactersLen = () =>
    filterUsedCharacters(characters, usedCharacters).length

  const revealAnswer = selected => {
    if (state !== STATES.ONGOING) {
      return false
    }

    const newCorrectAnswers =
      selected.character === character.character
        ? correctAnswers + 1
        : correctAnswers

    setStorage({
      state: STATES.REVEAL,
      selectedCharacter: selected.character,
      usedCharacters: [...usedCharacters, character],
      correctAnswers: newCorrectAnswers,
      processedCharacters: processedCharacters + 1
    })
  }

  const reset = () => {
    setCharacter(null)
    setStorage({
      selectedCharacter: null,
      usedCharacters: [],
      correctAnswers: 0,
      processedCharacters: 0,
      state: STATES.RESET
    })
  }

  const getScorePercentage = () => {
    const total = processedCharacters
    const point = (correctAnswers / total) * 100

    return isNaN(point) ? '0.00' : parseFloat(point).toFixed(2)
  }

  useEffect(() => {
    loadCharacters()
  }, [currentLevels])

  useEffect(() => {
    handleStates()
  }, [state, characters])

  const ContinueBtn = ({ label, action }) => (
    <button
      onClick={() => {
        setStorage({
          state: STATES.ONGOING
        })
        action?.()
      }}
    >
      {label}
    </button>
  )

  return (
    <div className='app-container'>
      <div className='level-selector'>
        <Select
          options={levels.map(e => {
            return {
              value: e.level,
              label: e.value
            }
          })}
          isMulti
          placeholder='Select Level'
          onChange={e => {
            setStorage({
              levels: e
            })
          }}
          value={currentLevels}
        />
      </div>
      <div className='game-info-container'>
        <div className='info-item'>
          <span className='title'>Remaining Characters:</span>
          <span className='value'>
            {getUserCharactersLen()}/{characters.length}
          </span>
        </div>
        <div className='info-item'>
          <span className='title'>Accuracy:</span>
          <span className='value'>
            {correctAnswers}/{processedCharacters} ({getScorePercentage()}%)
          </span>
        </div>
      </div>
      <div className='game-container'>
        {state === STATES.RESET && <ContinueBtn label='Start' />}
        {(state === STATES.ONGOING || state === STATES.REVEAL) && (
          <>
            {character ? (
              <>
                <div className='character-container'>{character.character}</div>
                <div className='options-container'>
                  {options.map((option, ok) => (
                    <div
                      key={`option-btn-${option.pinyin}-${ok}`}
                      className={`btn-container ${state === STATES.REVEAL &&
                        (character.character === option.character
                          ? 'correct'
                          : '')
                        }
                   ${state === STATES.REVEAL &&
                          storage.selectedCharacter === option.character
                          ? character.character === option.character
                            ? 'correct'
                            : 'wrong'
                          : ''
                        }`}
                    >
                      <PlaySound filename={option.character} />
                      <button
                        className='option-btn'
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
                    label='Reset'
                    action={() => {
                      reset()
                    }}
                  />
                )}
              </>
            )}
          </>
        )}
        {state === STATES.REVEAL && (
          <div className='answer-container'>
            <span className='info'>{character?.definition}</span>
            <div className='action-box'>
              <ContinueBtn
                label='Next'
                action={() => {
                  setCharacter(null)
                  setStorage({
                    selectedCharacter: null
                  })
                }}
              />
              <ContinueBtn
                label='Reset'
                action={() => {
                  reset()
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App

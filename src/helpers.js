export const getRandomItems = (items, usedCharacters, maxItems = 6) => {
  const getRandomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

  const usedCharacterSet = new Set(
    usedCharacters.map((item) => item.character)
  );

  const availableItems = items.filter(
    (item) => !usedCharacterSet.has(item.character)
  );

  const getUniqueItems = (arr, count, firstItemPinyin) => {
    if (arr.length < count) return arr;

    let result = [];

    while (result.length < count) {
      const randomItem = getRandomItem(arr);
      if (
        randomItem &&
        randomItem.pinyin !== firstItemPinyin &&
        !result.find((item) => item.pinyin === randomItem.pinyin)
      ) {
        result.push(randomItem);
      }
      arr = arr.filter((item) => item !== randomItem);
    }

    return result;
  };

  const firstItem = getRandomItem(availableItems);
  if (!firstItem) return [];

  const remainingPool = items.filter((item) => item !== firstItem);

  const uniqueItems = getUniqueItems(
    remainingPool,
    maxItems - 1,
    firstItem.pinyin
  );

  const result = [firstItem, ...uniqueItems];

  return result.slice(0, maxItems);
};

export const filterUsedCharacters = (mainArray, usedCharacters) => {
  const usedCharacterSet = new Set(
    usedCharacters.map((item) => item.character)
  );
  return mainArray.filter((item) => !usedCharacterSet.has(item.character));
};

export const filteredUsedChars = (usedCharacters) => {
  return usedCharacters.filter(
    (item, index, self) =>
      index === self.findIndex((t) => t.character === item.character)
  );
};

const convertStrToArr = (str) => {
  const wordsArr = str.toLowerCase().split(" ");
  return wordsArr.map((word) => {
    return word
      .replace(".", "")
      .replace("/", "")
      .replace(";", "")
      .replace(":", "")
      .replace(",", "")
      .replace('"', "")
      .replace("'", "");
  });
};

// Функция сравнения названия книги (Для определения подходящий ли товар)
export const filterOffers = (offersArr, itemTitle) => {
  const itemTitleWordsAr = convertStrToArr(itemTitle);
  const titleWordsLength = itemTitleWordsAr.length;

  const filteredArr = offersArr.filter((offer) => {
    if (!offer.price) {
      return false;
    }
    let matchCounter = 0;
    const offerTitleWordsArr = convertStrToArr(offer.title);
    for (let word of offerTitleWordsArr) {
      if (itemTitleWordsAr.includes(word)) {
        matchCounter++;
      }
    }
    if (titleWordsLength <= 2) {
      if (matchCounter >= 1) {
        return true;
      }
    } else if (titleWordsLength > 2) {
      if (matchCounter > 1) {
        return true;
      }
    } else {
      return false;
    }
  });
  const filteredSortedArr = filteredArr.sort(
    (a, b) => Number(a.price) - Number(b.price)
  );
  return filteredSortedArr;
};

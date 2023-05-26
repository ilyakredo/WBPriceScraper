const regExp = /[\s]{1,}[,]{1,}[\s]{1,}|[,]{1,}|[\s]{1,}/gm;

// Функция преобразует входную строку в массив

export function splitStrInput(str) {
  const resultArr = str.trim().split(regExp);
  for (let i = 0; i < resultArr.length; i++) {
    if (resultArr[i] === "") {
      resultArr.splice(i, 1);
      i--;
    }
  }
  return resultArr;
}

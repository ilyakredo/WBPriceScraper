// функция приобразует входную инфо в массив готовых url
export function createSearchUrl(data, eanData) {
  const resArr = [];
  data.forEach((searchElem, ind) => {
    resArr.push({
      wb: `https://www.wildberries.ru/catalog/${searchElem}/detail.aspx?targetUrl=SP",`,
      lab: `https://www.labirint.ru/search/${eanData[ind]}/`,
      oz: `https://www.ozon.ru/search/?text=${eanData[ind]}&from_global=true`,
    });
  });
  return resArr;
}

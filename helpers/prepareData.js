// Функция приобразования информации перед скачиванием файла
export function prepareData(inputData) {
  const data = [];
  inputData.forEach((dataElement) => {
    const convertedObj = {
      Код: dataElement.ourItem.ourWBCode,
      Название: dataElement.ourItem.title,
      Наша_цена: dataElement.ourItem.price,
      Акция: dataElement.ourItem.sale,
      Цена_Озон: dataElement.ozon.price,
      Цена_Лаб: dataElement.lab.price,
    };
    const offersPricesArr = [];
    for (let offer of dataElement.matchedSellersOffers) {
      offersPricesArr.push({
        price: offer.price,
        desc: `Продавец: ${offer.sellerName}`,
      });
    }
    for (let offer of dataElement.otherSellersOffers) {
      offersPricesArr.push({
        price: offer.price,
        desc: offer.offerSale ? `Акция: ${offer.offerSale}` : "",
      });
    }
    offersPricesArr.sort((offer, nextOffer) => offer.price - nextOffer.price);
    if (dataElement.ourItem.price !== "Товар продан" && offersPricesArr[0]) {
      const percentPriceDiff = Math.round(
        (dataElement.ourItem.price / offersPricesArr[0].price) * 100 - 100,
        -1
      );
      convertedObj["Разн_цены_%"] = percentPriceDiff;
    } else {
      convertedObj["Разн_цены_%"] = "";
    }
    offersPricesArr.forEach((offerObj, ind) => {
      convertedObj[`_${ind + ind + 1}`] = offerObj.price;
      convertedObj[`_${ind + ind + 2}`] = offerObj.desc;
    });
    data.push(convertedObj);
  });
  return data;
}

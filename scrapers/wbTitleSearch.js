import { v4 as uuidv4 } from "uuid";

// Функция поиска цен по названию полученного из нашей карточки.
export const searchByTitle = async (itemPriceObj, page) => {
  const searchByTitleUrl = `https://www.wildberries.ru/catalog/0/search.aspx?search=${itemPriceObj.ourItem.searchQuery}`;
  try {
    await page.goto(searchByTitleUrl, { timeout: 10000 });
  } catch (err) {
    console.log("Can't load Wildberries page");
  }
  try {
    await page.waitForSelector("h1.not-found-search__title", {
      timeout: 1500,
    });
  } catch (err) {}
  const notFoundSearchItems = await page.$("h1.not-found-search__title");
  if (notFoundSearchItems) {
    return [];
  }
  //  Делаем одну прокрутку в самый конец страницы чтобы подгрузились дополнительные товары
  const pervHeight = await page.evaluate(() => {
    return document.body.scrollHeight;
  });
  await page.evaluate((pageHeight) => {
    window.scrollTo(0, pageHeight);
  }, pervHeight);
  await new Promise((resolve) => setTimeout(resolve, 2000)); // Задаём ожидагние для загрузки всех элементов
  /////////
  try {
    await page.waitForSelector("div.catalog-page__content", {
      timeout: 5000,
    });
  } catch (err) {
    console.log("Error search content");
  }
  const searchItemsWrapper = await page.$("div.catalog-page__content");
  // Скраппинг наших данных с нашой карточки товара
  let otherOffersArr = await page.evaluate(async (dataBlock) => {
    const offersArr = [];
    const offersNodes = dataBlock.querySelectorAll("article.product-card");
    offersNodes.forEach((offerNode) => {
      const bookObj = {};
      const productLink = offerNode
        .querySelector("div.product-card__wrapper > a")
        .getAttribute("href");
      bookObj.offerLink = productLink;
      if (offerNode.querySelector(".product-card__tip--action")) {
        bookObj.offerSale = offerNode.querySelector(
          ".product-card__tip--action"
        ).textContent;
      } else {
        bookObj.offerSale = "";
      }
      const offerTitle = offerNode.querySelector(
        "span.product-card__name"
      ).textContent;
      bookObj.title = offerTitle.replace("/", "").trim();
      const price = offerNode.querySelector(".price__lower-price").textContent;
      bookObj.price = Number(price.replace("₽", "").replace(/\s+/g, "").trim());
      bookObj.image = offerNode
        .querySelector("div.product-card__img-wrap > img")
        .getAttribute("src");
      offersArr.push(bookObj);
    });
    return offersArr;
  }, searchItemsWrapper);
  //////////////
  otherOffersArr.forEach((offer) => {
    offer.id = uuidv4();
  });
  // Удаляем повтор. эл-ты из предложений в карточке товара и наш товар
  otherOffersArr = otherOffersArr.filter((offer) => {
    let isRepeat = false;
    for (let matchOffer of itemPriceObj.matchedSellersOffers) {
      if (offer.image.includes(matchOffer.wbCode)) {
        isRepeat = true;
      }
    }
    if (offer.image.includes(itemPriceObj.ourItem.ourWBCode)) {
      isRepeat = true;
    }
    return !isRepeat;
  });
  return otherOffersArr;
};

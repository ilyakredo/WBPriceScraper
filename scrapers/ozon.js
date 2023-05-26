//  Функция получения информации с Ozon

import { filterOffers } from "../helpers/filterOffers.js";

export const handleOzon = async (searchUrl, page, itemTitle) => {
  try {
    await page.goto(searchUrl.oz, { timeout: 10000 });
    await page.solveRecaptchas();
  } catch (err) {
    console.log("Can't load Ozon page: ", err);
    return "";
  }
  const searchResults =
    (await page.$("div.widget-search-result-container")) || "";
  if (!searchResults) {
    return "";
  }
  try {
    //  Делаем одну прокрутку в самый конец страницы чтобы подгрузились дополнительные товары
    const pervHeight = await page.evaluate(() => {
      return document.body.scrollHeight;
    });
    await page.evaluate((pageHeight) => {
      window.scrollTo(0, pageHeight);
    }, pervHeight);
    await new Promise((resolve) => setTimeout(resolve, 2000)); // Задаём ожидагние для загрузки всех элементов
    /////////
    let itemsArr = await page.evaluate((searchBlock) => {
      const offersArr = [];
      const itemsNodes = document.querySelectorAll(
        "#paginatorContent > div > div"
      )[0].children;
      const nodes = [...itemsNodes];
      for (let node of nodes) {
        const link =
          "https://www.ozon.ru" + node.querySelector("a").getAttribute("href");
        let price = node.querySelector(
          "div > div:first-child > span > span:first-child"
        ).textContent;
        price = Number(price.replace("₽", "").replace(/\s+/g, "").trim());
        const title = node.querySelector("div > a > span > span").textContent;
        offersArr.push({ link, price, title });
      }
      return offersArr;
    }, searchResults);
    itemsArr = filterOffers(itemsArr, itemTitle);
    if (itemsArr[0]) {
      return itemsArr[0];
    } else {
      return "";
    }
  } catch (err) {
    console.log("Can't scrap Ozon page:", err);
    return "";
  }
};

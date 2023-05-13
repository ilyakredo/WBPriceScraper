import express from "express";
import puppeteer from "puppeteer-extra";
import { executablePath } from "puppeteer";
import path, { resolve } from "path";
import * as fs from "fs";
import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";

import UserAgent from "user-agents";
import * as fsExtra from "fs-extra";
import bodyParser from "body-parser";

import RecaptchaPlugin from "puppeteer-extra-plugin-recaptcha";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import json2xls from "json2xls";
import os from "os";
import { v4 as uuidv4 } from "uuid";

puppeteer.use(StealthPlugin());
puppeteer.use(
  RecaptchaPlugin({
    provider: {
      id: "2captcha",
      token: "5a58946bf1ab2539a2525991dd3483b1", // REPLACE THIS WITH YOUR OWN 2CAPTCHA API KEY ⚡
    },
    visualFeedback: true, // colorize reCAPTCHAs (violet = detected, green = solved)
  })
);

/////////
const regExp = /[\s]{1,}[,]{1,}[\s]{1,}|[,]{1,}|[\s]{1,}/gm;
let inputData;

/////////////////////////////////  Сервер express

const __dirname = path.resolve();

const app = express();
app.use(express.static("public"));
app.use(express.urlencoded({ extended: false, limit: "50mb" }));
app.use(express.json({ limit: "50mb" }));
// app.use(express.urlencoded({limit: '50mb'}));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

app.get("/delete_data", (req, res) => {
  fs.writeFileSync("./public/booksParse.json", "");
  res.send(JSON.stringify({ message: "ДАННЫЕ УСПЕШНО УДАЛЕНЫ" }));
});

app.get("/data-load-finish", (req, res) => {
  res.sendFile(__dirname + "/public/data-load-finish.html").sen;
});

const jsonParser = express.json();

app.post("/download_results", jsonParser, (req, res) => {
  const infoArr = req.body;
  const excel = json2xls(handleData(infoArr));
  const date = new Date();
  let fileName = `wbPrices-${date.toLocaleString().slice(0, -3)}`;
  fileName = fileName.replace(", ", " ").replaceAll(":", "-");
  // Поиск папки dowloads в windows
  const homeDir = os.homedir();
  const downloadDir = `${homeDir}/Downloads`;
  fs.writeFileSync(`${downloadDir}/${fileName}.xlsx`, excel, "binary");
  res.send(JSON.stringify({ message: "ФАЙЛ УСПЕШНО СОХРАНЁН В ЗАГРУЗКИ" }));
});

app.post("/delete_item", jsonParser, (req, res) => {
  const delBookInfo = req.body;
  writeJsonFile("booksParse", "", delBookInfo.delId);
  res.send(JSON.stringify({ message: "ОБЪЕКТ УСПЕШНО УДАЛЁН" }));
});

app.post("/", (req, res) => {
  if (req.body === "") {
    res.redirect("/");
  } else {
    inputData = req.body.inputData;
    const handleOptions = {
      isProcessOutOfStock: req.body.processOutOfStock,
      isProcessOnlyCardData: req.body.processOnlyCardData,
    };
    const parseRes = start(inputData, handleOptions);
    parseRes
      .then((resolve, reject) => {
        if (resolve) {
          res.sendFile(__dirname + "/public/data-load-finish.html");
        }
      })
      .catch((err) => {
        console.log("post error: ", err);
        res.redirect("/");
      });
  }
});

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log("Server started on port: 8000 ...");
});
////////////////////////////////////////////////////  Конец сервера

// Функция приобразования информации перед скачиванием файла
function handleData(arr) {
  const data = [];
  arr.forEach((elem) => {
    const itemObj = {};
    itemObj["Код"] = elem.ourItem.ourWBCode;
    itemObj["Название"] = elem.ourItem.title;
    itemObj["Наша_цена"] = elem.ourItem.price;
    itemObj["Акция"] = elem.ourItem.sale;

    const offersPricesArr = [];
    for (let offer of elem.matchedSellersOffers) {
      offersPricesArr.push({
        price: offer.price,
        desc: `Продавец: ${offer.sellerName}`,
      });
    }
    for (let offer of elem.otherSellersOffers) {
      if (offer.offerSale) {
        offersPricesArr.push({
          price: offer.price,
          desc: `Акция: ${offer.offerSale}`,
        });
      } else {
        offersPricesArr.push({ price: offer.price, desc: "" });
      }
    }
    offersPricesArr.sort((offer, nextOffer) => offer.price - nextOffer.price);
    if (elem.ourItem.price !== "Товар продан" && offersPricesArr[0]) {
      const percentPriceDiff = Math.round(
        (elem.ourItem.price / offersPricesArr[0].price) * 100 - 100,
        -1
      );
      itemObj["Разн_цены_%"] = percentPriceDiff;
    } else {
      itemObj["Разн_цены_%"] = "";
    }

    offersPricesArr.forEach((offerObj, ind) => {
      itemObj[`_${ind + ind + 1}`] = offerObj.price;
      itemObj[`_${ind + ind + 2}`] = offerObj.desc;
    });
    data.push(itemObj);
  });
  // Проверяем и добавляем поля первому элементу чтобы корректно работал json2xls
  let maxValuesQtt = 0;
  data.forEach((elem) => {
    if (Object.keys(elem).length > maxValuesQtt) {
      maxValuesQtt = Object.keys(elem).length;
    }
  });
  const firstElemKeysLength = Object.keys(data[0]).length;
  for (let i = firstElemKeysLength - 3; i <= maxValuesQtt - 4; i++) {
    data[0][`_${i}`] = "";
  }
  return data;
}

// Функция преобразует входную строку в массив
function splitStrInput(str) {
  const resultArr = str.trim().split(regExp);
  for (let i = 0; i < resultArr.length; i++) {
    if (resultArr[i] === "") {
      resultArr.splice(i, 1);
      i--;
    }
  }
  return resultArr;
}

// функция приобразует входную инфо в массив готовых url
function makeSearchUrl(data) {
  const resArr = [];
  data.forEach((searchElem) => {
    resArr.push(
      `https://www.wildberries.ru/catalog/${searchElem}/detail.aspx?targetUrl=SP",`
    );
  });
  return resArr;
}

async function writeJsonFile(fileName, data, delItemInfo) {
  const prevData = fs.readFileSync(`public/${fileName}.json`, "utf8");
  let resultData;
  if (prevData.length > 0) {
    if (delItemInfo) {
      const tmpData = JSON.parse(prevData);
      tmpData.some((item, ind) => {
        // let deleteInd = item.findIndex((item) => item.id === delItemInfo);
        if (item.id === delItemInfo) {
          tmpData.splice(ind, 1);
          return true;
        } else {
          let deleteInd = item.matchedSellersOffers.findIndex(
            (item) => item.id === delItemInfo
          );
          if (deleteInd >= 0) {
            item.matchedSellersOffers.splice(deleteInd, 1);
          } else {
            deleteInd = item.otherSellersOffers.findIndex(
              (item) => item.id === delItemInfo
            );
            if (deleteInd >= 0) {
              item.otherSellersOffers.splice(deleteInd, 1);
            }
          }
        }
      });
      resultData = tmpData;
    } else {
      const tmpData = JSON.parse(prevData);
      resultData = tmpData.concat(data[data.length - 1]);
    }
    fs.writeFileSync(`public/${fileName}.json`, JSON.stringify(resultData));
  } else {
    fs.writeFileSync(`public/${fileName}.json`, JSON.stringify(data));
  }
}

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
const filterOffers = (offersArr, itemTitle, itemCode) => {
  const itemTitleWordsAr = convertStrToArr(itemTitle);
  const titleWordsLength = itemTitleWordsAr.length;

  const filteredArr = offersArr.filter((offer) => {
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

// Функция поиска цен по названию полученного из нашей карточки.
const searchByTitle = async (itemPriceObj, page) => {
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

// ОСНОВНАЯ ФУНКЦИЯ

async function start(inputUrl, handleOptions) {
  const inputDataArr = splitStrInput(inputUrl);
  if (inputDataArr.length === 0) {
    return new Promise((reject) => {
      reject("Ошибка обработки!");
    });
  }
  let totalInputDataAmount = inputDataArr.length;
  const searchUrls = makeSearchUrl(inputDataArr);
  const resultArr = [];
  const userAgent = new UserAgent();
  try {
    const browser = await puppeteer.launch({
      headless: false,
      args: ["--disable-dev-shm-usage"],
      executablePath: executablePath(),
    });
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(40000);
    page.setDefaultTimeout(40000);
    await page.setViewport({
      width: 1920,
      height: 1080,
    });
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36"
    );
    let searchCounter = 0;
    const startTime = new Date();
    console.log("---------PARSING START---------");
    console.log(`Parsing start time - ${startTime.toLocaleTimeString()}`);
    for (let searchUrl of searchUrls) {
      console.log("-------------------------------------");
      console.log("Items left - ", totalInputDataAmount--);
      console.log("Searching code - ", inputDataArr[searchCounter]);
      try {
        const itemPriceObj = {
          id: uuidv4(),
          priceAlert: false,
          ourItem: {
            title: "",
            id: "",
            searchQuery: "",
            ourWBCode: "",
            price: "",
            image: "",
            sale: "",
          },
          matchedSellersOffers: [],
          otherSellersOffers: [],
        };
        searchCounter++;
        await page.setUserAgent(userAgent.random().toString());
        try {
          await page.goto(searchUrl, { timeout: 20000 });
        } catch (err) {
          resultArr.push(itemPriceObj);
          console.log("Can't load Wildberries page");
          continue;
        }
        await page.solveRecaptchas();
        const isBookNotFound =
          (await page.$("h1.not-found-search__title")) || "";
        if (isBookNotFound) {
          resultArr.push(itemPriceObj);
          console.log("-Item not found-");
          await writeJsonFile("booksParse", resultArr);
        } else {
          try {
            await page.waitForSelector(".product-page__grid", {
              timeout: 5000,
            });
            const bookDataWrapper = await page.$(".product-page__grid");
            // Скраппинг наших данных с нашой карточки товара
            const ourBookData = await page.evaluate(async (dataBlock) => {
              const bookObj = {};
              const bookPublisher = dataBlock.querySelector(
                ".product-page__header > span"
              ).textContent;
              const bookTitle = dataBlock.querySelector(
                ".product-page__header > h1"
              ).textContent;
              bookTitle
                ? (bookObj.title = bookTitle.trim())
                : (bookObj.title = "");
              bookTitle && bookPublisher
                ? (bookObj.searchQuery = `${bookPublisher.trim()} / ${bookTitle.trim()}`)
                : (bookObj.searchQuery = "");
              bookObj.ourWBCode =
                dataBlock.querySelector("#productNmId").textContent;
              const soldOut = dataBlock.querySelector("p.sold-out-product");
              if (soldOut) {
                bookObj.price = "Товар продан";
              } else {
                const price = dataBlock.querySelector(
                  "ins.price-block__final-price"
                ).textContent;
                const resultPrice = Number(
                  price.replace("₽", "").replace(/\s+/g, "").trim()
                );
                bookObj.price = resultPrice;
              }
              const sale = dataBlock.querySelector(
                "div.product-page__spec-action"
              ).textContent;
              sale ? (bookObj.sale = sale.trim()) : (bookObj.sale = "");
              const imgUrl = dataBlock
                .querySelector(".zoom-image-container > img")
                .getAttribute("src");
              imgUrl ? (bookObj.image = imgUrl) : (bookObj.image = "");
              return bookObj;
            }, bookDataWrapper);
            //////////////
            if (
              handleOptions.isProcessOutOfStock &&
              ourBookData.price === "Товар продан"
            ) {
              continue;
            }
            itemPriceObj.ourItem = { ...ourBookData };
            // Скраппинг цен и информации других продовцов в нашей карточке товара(если есть)
            try {
              await page.waitForSelector("div.other-offers__container", {
                timeout: 4000,
              });
            } catch (err) {}
            const otherSellersPricesBlock = await page.$(
              "div.other-offers__container"
            );
            if (otherSellersPricesBlock) {
              const otherSellersInfo = await page.evaluate(
                async (priceBlock) => {
                  const sellersArr = [];
                  const otherSellersItemsNodes = priceBlock.querySelectorAll(
                    "li.other-offers__item"
                  );
                  if (otherSellersItemsNodes) {
                    otherSellersItemsNodes.forEach((sellerNode) => {
                      const sellerObj = {};
                      sellerObj.sellerName = sellerNode.querySelector(
                        "a.seller-info__name"
                      ).textContent;
                      const price = sellerNode.querySelector(
                        "b.other-offers__price-now"
                      ).textContent;
                      sellerObj.price = Number(
                        price.replace("₽", "").replace(/\s+/g, "").trim()
                      );
                      sellerObj.image = sellerNode
                        .querySelector(".other-offers__img")
                        .getAttribute("src");
                      sellerObj.wbCode = sellerNode
                        .getAttribute("id")
                        .replace("s", "");
                      sellersArr.push(sellerObj);
                    });
                  }
                  return sellersArr;
                },
                otherSellersPricesBlock
              );
              otherSellersInfo.forEach((offer) => {
                offer.id = uuidv4();
              });
              itemPriceObj.matchedSellersOffers = [...otherSellersInfo];
            }
            //////
          } catch (err) {
            console.log("Error WB parsing - 1 :", err);
          }
          if (!handleOptions.isProcessOnlyCardData) {
            try {
              if (itemPriceObj.ourItem.searchQuery) {
                const otherSellersOffersArr = await searchByTitle(
                  itemPriceObj,
                  page
                );
                itemPriceObj.otherSellersOffers = filterOffers(
                  otherSellersOffersArr,
                  itemPriceObj.ourItem.title,
                  itemPriceObj.ourItem.ourWBCode
                );
              }
            } catch (err) {
              console.log("Error WB parsing - 2 :", err);
            }
          }
          let lowerPriceFlag = false;
          itemPriceObj.matchedSellersOffers.some((item) => {
            if (item.price < itemPriceObj.ourItem.price) {
              lowerPriceFlag = true;
              itemPriceObj.priceAlert = true;
              return true;
            }
          });
          if (!lowerPriceFlag) {
            itemPriceObj.otherSellersOffers.some((item) => {
              if (item.price < itemPriceObj.ourItem.price) {
                itemPriceObj.priceAlert = true;
                return true;
              }
            });
          }
          ////////////////////////////////////////

          resultArr.push(itemPriceObj);
          console.log("Item found:  ", itemPriceObj.ourItem.title);
          console.log("Our price:  ", itemPriceObj.ourItem.price);
          console.log(
            "Matched sellers quantity found:  ",
            itemPriceObj.matchedSellersOffers.length
          );
          console.log(
            "Other sellers quantity found:  ",
            itemPriceObj.otherSellersOffers.length
          );
          await writeJsonFile("booksParse", resultArr);
        }
      } catch (err) {
        console.log("Error WB parsing - 3 :", err);
      }
    }
    await browser.close();
    const endTime = new Date();
    const parsTime = endTime - startTime;
    console.log("---------PARSING FINISHED---------");
    console.log(`Parsing finish time - ${endTime.toLocaleTimeString()}`);
    console.log(`Parsing total time - ${Math.ceil(parsTime / 60000)} min.`);
    return new Promise((resolve, reject) => {
      if (resultArr.length !== 0) {
        resolve(resultArr);
      } else {
        reject("Ошибка обработки!");
      }
    });
  } catch (err) {
    console.log("Error WB parsing - 5 :", err);
  }
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

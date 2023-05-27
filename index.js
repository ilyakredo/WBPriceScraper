import express from "express";
import puppeteer from "puppeteer-extra";
import { executablePath } from "puppeteer";
import path from "path";
import * as fs from "fs";
import UserAgent from "user-agents";
import RecaptchaPlugin from "puppeteer-extra-plugin-recaptcha";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import XLSX from "xlsx";
import os from "os";
import { v4 as uuidv4 } from "uuid";

import { searchByTitle } from "./scrapers/wbTitleSearch.js";
import { handleOzon } from "./scrapers/ozon.js";
import { handleLab } from "./scrapers/labirint.js";
import { filterOffers } from "./helpers/filterOffers.js";
import { splitStrInput } from "./helpers/splitInputString.js";
import { prepareData } from "./helpers/prepareData.js";
import { createSearchUrl } from "./helpers/createSearchUrl.js";

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
let inputData;
let inputDataEan;

/////////////////////////////////  Сервер express

const __dirname = path.resolve();

const app = express();
app.use(express.static("public"));
app.use(express.urlencoded({ extended: false, limit: "50mb" }));
app.use(express.json({ limit: "50mb" }));

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
  const downloadData = req.body;
  const workSheet = XLSX.utils.json_to_sheet(prepareData(downloadData));
  const workBook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workBook, workSheet, "Sheet1");
  const excelBuffer = XLSX.write(workBook, {
    bookType: "xlsx",
    type: "buffer",
  });
  const date = new Date();
  let fileName = `wbPrices-${date.toLocaleString().slice(0, -3)}`;
  fileName = fileName.replace(", ", " ").replaceAll(":", "-");
  // Поиск папки dowloads в windows
  const homeDir = os.homedir();
  const downloadDir = `${homeDir}/Downloads`;
  fs.writeFileSync(`${downloadDir}/${fileName}.xlsx`, excelBuffer);
  res.send(JSON.stringify({ message: "ФАЙЛ УСПЕШНО СОХРАНЁН В ЗАГРУЗКИ" }));
});

app.post("/delete_item", jsonParser, (req, res) => {
  const delBookInfo = req.body;
  const dataArr = delBookInfo.dataArr;
  const delId = delBookInfo.delId;
  const updatedData = dataArr.filter((item) => item.id !== delId);
  fs.writeFileSync(`public/booksParse.json`, JSON.stringify(updatedData));
  res.send(JSON.stringify({ status: "ok", updatedData: updatedData }));
});

app.post("/", (req, res) => {
  if (req.body === "") {
    res.redirect("/");
  } else {
    inputData = req.body.inputData;
    inputDataEan = req.body.inputDataSec;
    const handleOptions = {
      isProcessOutOfStock: req.body.processOutOfStock,
      isProcessOnlyCardData: req.body.processOnlyCardData,
    };
    const parseRes = start(inputData, inputDataEan, handleOptions);
    parseRes
      .then((resolve) => {
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

async function writeJsonFile(fileName, data, delItemInfo) {
  const prevData = fs.readFileSync(`public/${fileName}.json`, "utf8");
  let resultData;
  if (prevData.length > 0) {
    if (delItemInfo) {
      const tmpData = JSON.parse(prevData);
      tmpData.some((item, ind) => {
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

// ОСНОВНАЯ ФУНКЦИЯ

async function start(inputData, inputDataEan, handleOptions) {
  const inputDataArr = splitStrInput(inputData);
  const inputDataEanArr = splitStrInput(inputDataEan);
  if (inputDataArr.length === 0) {
    return new Promise((reject) => {
      reject("Ошибка обработки!");
    });
  }
  let totalInputDataAmount = inputDataArr.length;
  const searchUrls = createSearchUrl(inputDataArr, inputDataEanArr);
  const resultArr = [];
  const userAgent = new UserAgent();
  try {
    const browser = await puppeteer.launch({
      headless: false,
      args: ["--disable-dev-shm-usage", "--window-size=1920,1080"],
      executablePath: executablePath(),
      defaultViewport: {
        width: 1920,
        height: 1080,
      },
    });
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(15000);
    page.setDefaultTimeout(15000);
    // await page.setViewport({
    //   width: 1920,
    //   height: 1080,
    // });
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
          lab: "",
          ozon: "",
        };
        searchCounter++;
        await page.setUserAgent(userAgent.random().toString());
        try {
          await page.goto(searchUrl.wb, { timeout: 15000 });
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
              timeout: 3000,
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

              // Добавление нашего кода товара
              bookObj.ourWBCode =
                dataBlock.querySelector("#productNmId").textContent;
              if (bookObj.ourWBCode) {
                bookObj.link = `https://www.wildberries.ru/catalog/${bookObj.ourWBCode}/detail.aspx`;
              } else {
                bookObj.link = "";
              }
              // Добавление цены
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

              // Добавление акции
              const sale = dataBlock.querySelector(
                "div.product-page__spec-action"
              ).textContent;
              sale ? (bookObj.sale = sale.trim()) : (bookObj.sale = "");
              const imgUrl = dataBlock
                .querySelector(".zoom-image-container > img")
                .getAttribute("src");
              imgUrl ? (bookObj.image = imgUrl) : (bookObj.image = "");

              // Поиск параметров книги (вес, переплет, кол-во страниц)
              const detailsSection = document.querySelector(
                ".details-section__details--about"
              );
              const detailsArr = detailsSection.querySelectorAll(
                ".product-params__row"
              );
              detailsArr.forEach((detail) => {
                if (
                  detail.querySelector("th").textContent.trim() ===
                  "Количество страниц"
                ) {
                  bookObj.pages = detail.querySelector("td").textContent;
                }
                if (
                  detail.querySelector("th").textContent.trim() === "Обложка"
                ) {
                  bookObj.cover = detail.querySelector("td").textContent;
                }
                if (
                  detail.querySelector("th").textContent.trim() ===
                  "Вес товара с упаковкой (г)"
                ) {
                  bookObj.weight = detail.querySelector("td").textContent;
                }
              });
              //
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
                timeout: 3000,
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
          try {
            itemPriceObj.lab = await handleLab(searchUrl, page);
          } catch (err) {
            console.log("Error scraping Labirint page");
          }
          try {
            itemPriceObj.ozon = await handleOzon(
              searchUrl,
              page,
              itemPriceObj.ourItem.title
            );
          } catch (err) {
            console.log("Error scraping Ozon page");
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

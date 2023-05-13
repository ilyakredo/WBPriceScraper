const URL_START_LAB = "https://www.labirint.ru/search/";
const URL_END_LAB = "/?stype=0";
const URL_START_OZ = "https://www.ozon.ru/search/?text=";
const URL_END_OZ = "&from_global=true";
const URL_START_WB =
  "https://www.wildberries.ru/catalog/0/search.aspx?sort=popular&search=";
const URL_END_WB = "";

const regExp = /[\s]{1,}[,]{1,}[\s]{1,}|[,]{1,}|[\s]{1,}/gm;
const regExp2 = /[a-zA-Zа-яёА-ЯЁ]{1,}/gm;

const inputData = document.querySelector(".input-ean");
const loadBtn = document.querySelector(".load-ean-btn");
const inpQtt = document.querySelector("#inpQtt");
const checkBoxes = document.querySelectorAll(".check_store");
const countInput = document.querySelector("#open-count");
const tabsOpenBtn = document.querySelector(".open-tabs-btn");
const currentItemsSpan = document.querySelector("#current-items");

let arrData = [];
let linkCounter = 0;
let resultUrl = "";
let count = 0;

function splitStrEan(str) {
  const resultArr = str.trim().split(regExp);
  for (let i = 0; i < resultArr.length; i++) {
    if (resultArr[i] === "") {
      resultArr.splice(i, 1);
      i--;
    }
  }
  return resultArr;
}

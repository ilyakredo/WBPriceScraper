// import { activeButtons, dataArr, filteredDataArr } from "./app";

const loadDatabtn = document.querySelector("#loadData");
const resultDiv = document.querySelector(".parser-result");
const downloadBtn = document.querySelector(".download");
const downloadLink = document.querySelector(".dowload-link");
const body = document.querySelector("body");

export let dataObj = { dataList: [] };
export let filteredDataArr = [];
export let activeButtons = [];
export let newPriceList = [];

export function addItem(itemCounter, itemObject, activeButtons) {
  const itemWrapper = document.createElement("div");
  itemWrapper.classList.add("resultItemWrapper");
  itemWrapper.id = itemObject.id + "-1";
  const headingDiv = document.createElement("div");
  headingDiv.classList.add("resultHeading");
  const itemNumDiv = document.createElement("div");
  const titleDiv = document.createElement("div");
  const deleteItemDiv = document.createElement("div");
  itemNumDiv.classList.add("resultHeadingNum");
  titleDiv.classList.add("resultHeadingTitle");
  deleteItemDiv.classList.add("resultHeadingDeleteItem");
  itemNumDiv.innerHTML = `<p>${itemCounter}</p>`;
  titleDiv.innerHTML = `<p><a target="blank" href="${itemObject.ourItem.link}">
  ${itemObject.ourItem.title}</a></p>`;
  deleteItemDiv.innerHTML = `<button class="offerDeleteBtn" 
  id=${itemObject.id}>УДАЛИТЬ КАРТОЧКУ</button>`;
  headingDiv.appendChild(itemNumDiv);
  headingDiv.appendChild(titleDiv);
  headingDiv.appendChild(deleteItemDiv);
  const bodyDiv = document.createElement("div");
  bodyDiv.classList.add("resultBody");
  const ourItemDiv = document.createElement("div");
  ourItemDiv.classList.add("ourItemDiv");
  const offersDiv = document.createElement("div");
  offersDiv.classList.add("offersDiv");
  const ourImgWrapper = document.createElement("div");
  ourImgWrapper.classList.add("ourItemImg");
  if (itemObject.ourItem.image) {
    ourImgWrapper.innerHTML = `<img src="${itemObject.ourItem.image}" alt="Item image">`;
  } else {
    ourImgWrapper.innerHTML = "";
  }
  const ourCodePar = document.createElement("p");
  const ourPricePar = document.createElement("p");
  const ourSalePar = document.createElement("p");
  const ourPagesPar = document.createElement("p");
  const ourCoverPar = document.createElement("p");
  const ourWeightPar = document.createElement("p");
  ourCodePar.innerHTML = `<span class="tableItemDesc">Наш код WB: 
  </span>${itemObject.ourItem.ourWBCode}`;
  ourPricePar.innerHTML = `<span class="tableItemDesc">Наша цена: 
  </span><span class="resultItemPrice">${itemObject.ourItem.price}</span>`;
  ourSalePar.innerHTML = `<span class="tableItemDesc">Акция: 
  </span>${itemObject.ourItem.sale}`;
  ourPagesPar.innerHTML = `<span class="tableItemDesc">Кол-во страниц: 
  </span>${itemObject.ourItem.pages}`;
  ourCoverPar.innerHTML = `<span class="tableItemDesc">Обложка: 
  </span>${itemObject.ourItem.cover}`;
  ourWeightPar.innerHTML = `<span class="tableItemDesc">Вес: 
  </span>${itemObject.ourItem.weight}`;
  ourItemDiv.appendChild(ourImgWrapper);
  ourItemDiv.appendChild(ourCodePar);
  ourItemDiv.appendChild(ourPricePar);
  ourItemDiv.appendChild(ourSalePar);
  ourItemDiv.appendChild(ourPagesPar);
  ourItemDiv.appendChild(ourCoverPar);
  ourItemDiv.appendChild(ourWeightPar);
  if (itemObject.lab.price) {
    const labPrice = document.createElement("p");
    labPrice.innerHTML = `<span class="tableItemDesc">Цена Лаб: </span><a target="blank" 
    href="${itemObject.lab.link}">${itemObject.lab.price}</a>`;
    ourItemDiv.appendChild(labPrice);
  }
  if (itemObject.ozon.price) {
    const ozPrice = document.createElement("p");
    ozPrice.innerHTML = `<span class="tableItemDesc">Цена Озон: </span><a target="blank" 
    href="${itemObject.ozon.link}">${itemObject.ozon.price}</a>`;
    ourItemDiv.appendChild(ozPrice);
  }
  const priceInput = document.createElement("input");
  const label = document.createElement("label");
  label.textContent = "ЦЕНА: ";
  label.classList.add("priceLabel");
  priceInput.setAttribute("type", "number");
  priceInput.setAttribute("id", `price-${itemObject.id}`);
  priceInput.classList.add("priceInput");
  newPriceList.forEach((priceObj) => {
    if (priceObj.newPriceId === itemObject.id) {
      priceInput.value = priceObj.price;
    }
  });
  label.appendChild(priceInput);
  ourItemDiv.appendChild(label);

  const matchedOffersDiv = document.createElement("div");
  matchedOffersDiv.classList.add("matchedOffersWrapper");
  const matchedOffersHeading = document.createElement("h4");
  matchedOffersHeading.classList.add("matchedOffersHead");
  matchedOffersHeading.textContent =
    "Предложения продавцов в нашей карточки товара";
  matchedOffersDiv.appendChild(matchedOffersHeading);
  const matchOfferInnerWrapper = document.createElement("div");
  matchOfferInnerWrapper.classList.add("matchOfferInnerWrapper");
  itemObject.matchedSellersOffers.forEach((offerItem) => {
    const matchedOfferItemWrapper = document.createElement("div");
    matchedOfferItemWrapper.classList.add("matchedOfferItemWrapper");
    const matchedOfferItemImgWrapper = document.createElement("div");
    matchedOfferItemImgWrapper.classList.add("matchedOfferItemImgWrapper");
    matchedOfferItemImgWrapper.innerHTML = `<img class="previewImg" 
    src="${offerItem.image}" alt="Item image">`;
    matchedOfferItemImgWrapper.innerHTML = `<img class="previewImg" 
    src="${offerItem.image}" alt="Item image">`;
    const matchedOffersInfoWrapper = document.createElement("div");
    matchedOffersInfoWrapper.classList.add("matchedOffersInfoWrapper");
    const matchedOfferSeller = document.createElement("P");
    matchedOfferSeller.innerHTML = `<span class="tableItemDesc">Продавец: 
    </span>${offerItem.sellerName}`;
    const matchedOfferPrice = document.createElement("p");
    matchedOfferPrice.innerHTML = `<span class="tableItemDesc">Цена: 
    </span><span class="resultItemPrice">${offerItem.price}</span>`;
    const matchedOfferBtn = document.createElement("button");
    matchedOfferItemWrapper.appendChild(matchedOfferItemImgWrapper);
    matchedOffersInfoWrapper.appendChild(matchedOfferSeller);
    matchedOffersInfoWrapper.appendChild(matchedOfferPrice);
    matchedOfferItemWrapper.appendChild(matchedOffersInfoWrapper);
    matchOfferInnerWrapper.appendChild(matchedOfferItemWrapper);
  });
  matchedOffersDiv.appendChild(matchOfferInnerWrapper);
  offersDiv.appendChild(matchedOffersDiv);

  const otherOffersDiv = document.createElement("div");
  otherOffersDiv.classList.add("otherOffersWrapper");
  const headingWrapper = document.createElement("div");
  headingWrapper.classList.add("innerHeadingWrapper");
  const otherOffersHeading = document.createElement("h4");
  otherOffersHeading.textContent = "Предложения других продавцов";
  headingWrapper.appendChild(otherOffersHeading);
  if (itemObject.otherSellersOffers.length > 0) {
    const addAllBtn = document.createElement("button");
    addAllBtn.innerHTML = "ДОБАВИТЬ ВСЕ";
    addAllBtn.classList.add(`al-${itemObject.id}`);
    addAllBtn.classList.add("addAllBtn");
    const noItemsBtn = document.createElement("button");
    noItemsBtn.innerHTML = "НЕТ ПОДХОДЯЩИХ";
    noItemsBtn.classList.add(`nm-${itemObject.id}`);
    noItemsBtn.classList.add("noMatchedItems");
    if (activeButtons && activeButtons.includes(`nm-${itemObject.id}`)) {
      noItemsBtn.classList.add("set");
    }
    headingWrapper.appendChild(noItemsBtn);
    headingWrapper.appendChild(addAllBtn);
  }
  otherOffersDiv.appendChild(headingWrapper);
  const otherOfferInnerWrapper = document.createElement("div");
  otherOfferInnerWrapper.classList.add("otherOfferInnerWrapper");
  itemObject.otherSellersOffers.forEach((offerItem) => {
    const otherOfferItemWrapper = document.createElement("div");
    otherOfferItemWrapper.classList.add("otherOfferItemWrapper");
    const otherOfferItemImgWrapper = document.createElement("div");
    otherOfferItemImgWrapper.classList.add("otherOfferItemImgWrapper");
    otherOfferItemImgWrapper.innerHTML = `<img class="previewImg" 
    src="${offerItem.image}" alt="Item image">`;
    const otherOffersInfoWrapper = document.createElement("div");
    otherOffersInfoWrapper.classList.add("otherOffersInfoWrapper");
    const otherOfferTitle = document.createElement("div");
    otherOfferTitle.classList.add("resultTitleDiv");
    if (offerItem.title.length > 50) {
      const shortTitle = offerItem.title.slice(0, 45);
      otherOfferTitle.innerHTML = `<a href=${
        offerItem.offerLink
      } target="blank"><p><span class="tableItemDesc">Название: </span>${shortTitle.concat(
        "..."
      )}</p></a>`;
    } else {
      otherOfferTitle.innerHTML = `<a href=${offerItem.offerLink} 
      target="blank"><p><span class="tableItemDesc">Название: 
      </span>${offerItem.title}</p></a>`;
    }
    const otherOfferPrice = document.createElement("p");
    otherOfferPrice.innerHTML = `<span class="tableItemDesc">Цена: 
    </span><span class="resultItemPrice">${offerItem.price}</span>`;
    const otherOfferSale = document.createElement("p");
    otherOfferSale.innerHTML = `<span class="tableItemDesc">Акция: 
    </span>${offerItem.offerSale}`;
    const otherOfferBtn = document.createElement("button");
    otherOfferBtn.setAttribute("id", `${offerItem.id}`);
    otherOfferBtn.classList.add(`b-${itemObject.id}`);
    otherOfferBtn.classList.add("offerAddBtn");
    if (activeButtons && activeButtons.includes(offerItem.id)) {
      otherOfferBtn.classList.add("selectedBtn");
    }
    if (activeButtons && activeButtons.includes(`nm-${itemObject.id}`)) {
      otherOfferBtn.classList.remove("selectedBtn");
      otherOfferBtn.setAttribute("disabled", true);
      otherOfferBtn.style.background = "#f24e4a";
    }
    otherOfferBtn.textContent = "ДОБАВИТЬ";
    otherOfferItemWrapper.appendChild(otherOfferItemImgWrapper);
    otherOffersInfoWrapper.appendChild(otherOfferTitle);
    otherOffersInfoWrapper.appendChild(otherOfferPrice);
    otherOffersInfoWrapper.appendChild(otherOfferSale);
    otherOffersInfoWrapper.appendChild(otherOfferBtn);
    otherOfferItemWrapper.appendChild(otherOffersInfoWrapper);
    otherOfferInnerWrapper.appendChild(otherOfferItemWrapper);
  });
  otherOffersDiv.appendChild(otherOfferInnerWrapper);
  offersDiv.appendChild(otherOffersDiv);
  bodyDiv.appendChild(ourItemDiv);
  bodyDiv.appendChild(offersDiv);
  itemWrapper.appendChild(headingDiv);
  itemWrapper.appendChild(bodyDiv);
  resultDiv.appendChild(itemWrapper);
}

export function removeResultInfo() {
  resultDiv.innerHTML = "";
}

loadDatabtn.addEventListener("click", () => {
  const dataLoadDiv = document.createElement("div");
  dataLoadDiv.setAttribute("class", "data-load");
  dataLoadDiv.innerHTML =
    '<h1>ЗАГРУЗКА ДАННЫХ ...</h1><div class="loader">loading</div>';
  body.appendChild(dataLoadDiv);
  fetch("./booksParse.json")
    .then(async (response) => {
      return response.json().catch((err) => {
        removeResultInfo();
        const resultPar = document.createElement("p");
        resultPar.classList.add("no-data-par");
        resultPar.innerHTML = `НЕТ ДАННЫХ ДЛЯ ЗАГРУЗКИ`;
        resultDiv.appendChild(resultPar);
        setTimeout(() => {
          resultPar.remove();
        }, 2000);
      });
    })
    .then((data) => {
      if (data === undefined || data.length === 0) {
        dataLoadDiv.remove();
      }
      if (data) {
        filteredDataArr = [];
        dataObj.dataList = [...data];
        dataObj.dataList.forEach((elem) => {
          filteredDataArr.push({
            id: elem.id,
            ourItem: elem.ourItem,
            matchedSellersOffers: elem.matchedSellersOffers,
            otherSellersOffers: [],
            lab: elem.lab,
            ozon: elem.ozon,
          });
        });
        removeResultInfo();
        let itemCounter = 0;
        for (let priceData of data) {
          itemCounter++;
          addItem(itemCounter, priceData);
          downloadBtn.classList.add("show-btn");
          downloadLink.classList.add("dowload-link-show");
        }
      }
    })
    .then(() => {
      dataLoadDiv.remove();
    });
});

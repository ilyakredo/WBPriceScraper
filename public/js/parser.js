const regExpEan = /[,:;]{1,1}/gm;

const loadDatabtn = document.querySelector("#loadData");
const resultDiv = document.querySelector(".parser-result");
const appBlock = document.querySelector(".app-block");
const downloadBtn = document.querySelector(".download");
const downloadLink = document.querySelector(".dowload-link");
const body = document.querySelector("body");

export let dataArr = [];
let notFoundCount;

export function addItem(itemCounter, itemObject) {
  const itemWrapper = document.createElement("div");
  itemWrapper.classList.add("resultItemWrapper");
  const headingDiv = document.createElement("div");
  headingDiv.classList.add("resultHeading");
  const itemNumDiv = document.createElement("div");
  const titleDiv = document.createElement("div");
  const deleteItemDiv = document.createElement("div");
  itemNumDiv.classList.add("resultHeadingNum");
  titleDiv.classList.add("resultHeadingTitle");
  deleteItemDiv.classList.add("resultHeadingDeleteItem");
  itemNumDiv.innerHTML = `<p>${itemCounter}</p>`;
  titleDiv.innerHTML = `<p>${itemObject.ourItem.title}</p>`;
  deleteItemDiv.innerHTML = `<button class="offerDeleteBtn" id=${itemObject.id}>Удалить карточку</button>`;
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
  ourCodePar.innerHTML = `<span class="tableItemDesc">Наш код WB: </span>${itemObject.ourItem.ourWBCode}`;
  ourPricePar.innerHTML = `<span class="tableItemDesc">Наша цена: </span><span class="resultItemPrice">${itemObject.ourItem.price}</span>`;
  ourSalePar.innerHTML = `<span class="tableItemDesc">Акция: </span>${itemObject.ourItem.sale}`;
  if (itemObject.priceAlert) {
    const lowerPriceAlert = document.createElement("div");
    lowerPriceAlert.classList.add("lowerPriceAlert");
    lowerPriceAlert.innerHTML = "<p>Существует цена ниже!</p>";
    ourItemDiv.appendChild(lowerPriceAlert);
  }
  ourItemDiv.appendChild(ourImgWrapper);
  ourItemDiv.appendChild(ourCodePar);
  ourItemDiv.appendChild(ourPricePar);
  ourItemDiv.appendChild(ourSalePar);
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
    matchedOfferItemImgWrapper.innerHTML = `<img class="previewImg" src="${offerItem.image}" alt="Item image">`;
    matchedOfferItemImgWrapper.innerHTML = `<img class="previewImg" src="${offerItem.image}" alt="Item image">`;
    const matchedOffersInfoWrapper = document.createElement("div");
    matchedOffersInfoWrapper.classList.add("matchedOffersInfoWrapper");
    const matchedOfferSeller = document.createElement("P");
    matchedOfferSeller.innerHTML = `<span class="tableItemDesc">Продавец: </span>${offerItem.sellerName}`;
    const matchedOfferPrice = document.createElement("p");
    matchedOfferPrice.innerHTML = `<span class="tableItemDesc">Цена: </span><span class="resultItemPrice">${offerItem.price}</span>`;
    const matchedOfferBtn = document.createElement("button");
    matchedOfferBtn.classList.add("offerDeleteBtn");
    matchedOfferBtn.setAttribute("id", `${offerItem.id}`);
    matchedOfferBtn.textContent = "УДАЛИТЬ";
    matchedOfferItemWrapper.appendChild(matchedOfferItemImgWrapper);
    matchedOffersInfoWrapper.appendChild(matchedOfferSeller);
    matchedOffersInfoWrapper.appendChild(matchedOfferPrice);
    matchedOffersInfoWrapper.appendChild(matchedOfferBtn);
    matchedOfferItemWrapper.appendChild(matchedOffersInfoWrapper);
    matchOfferInnerWrapper.appendChild(matchedOfferItemWrapper);
  });
  matchedOffersDiv.appendChild(matchOfferInnerWrapper);
  offersDiv.appendChild(matchedOffersDiv);

  const otherOffersDiv = document.createElement("div");
  otherOffersDiv.classList.add("otherOffersWrapper");
  const otherOffersHeading = document.createElement("h4");
  otherOffersHeading.classList.add("matchedOffersHead");
  otherOffersHeading.textContent = "Предложения других продавцов";
  otherOffersDiv.appendChild(otherOffersHeading);
  const otherOfferInnerWrapper = document.createElement("div");
  otherOfferInnerWrapper.classList.add("otherOfferInnerWrapper");
  itemObject.otherSellersOffers.forEach((offerItem) => {
    const otherOfferItemWrapper = document.createElement("div");
    otherOfferItemWrapper.classList.add("otherOfferItemWrapper");
    const otherOfferItemImgWrapper = document.createElement("div");
    otherOfferItemImgWrapper.classList.add("otherOfferItemImgWrapper");
    otherOfferItemImgWrapper.innerHTML = `<img class="previewImg" src="${offerItem.image}" alt="Item image">`;
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
      otherOfferTitle.innerHTML = `<a href=${offerItem.offerLink} target="blank"><p><span class="tableItemDesc">Название: </span>${offerItem.title}</p></a>`;
    }
    const otherOfferPrice = document.createElement("p");
    otherOfferPrice.innerHTML = `<span class="tableItemDesc">Цена: </span><span class="resultItemPrice">${offerItem.price}</span>`;
    const otherOfferSale = document.createElement("p");
    otherOfferSale.innerHTML = `<span class="tableItemDesc">Акция: </span>${offerItem.offerSale}`;
    const otherOfferBtn = document.createElement("button");
    otherOfferBtn.setAttribute("id", `${offerItem.id}`);
    otherOfferBtn.classList.add("offerDeleteBtn");
    otherOfferBtn.textContent = "УДАЛИТЬ";
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

loadDatabtn.addEventListener("click", (event) => {
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
        dataArr = [...data];
        removeResultInfo();
        // createTableHeading();

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

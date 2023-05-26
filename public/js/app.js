import { dataArr, filteredDataArr, removeResultInfo } from "./parser.js";
const loadDataBtn = document.querySelector("#loadDataBtn");
const body = document.querySelector("body");
const inputForm = document.querySelector(".input-form");
const downloadFile = document.querySelector("#download-file");
const inputData = document.querySelector("#dataInput");
const inputQttSpan = document.querySelector("#qttInWork");
const deleteBtn = document.querySelector("#deleteData");
const resBlock = document.querySelector(".parser-result-block");
const createDataBtn = document.querySelector("#loadBook");
const downloadBtn = document.querySelector(".download");

const regExp = /[a-zA-Zа-яёА-ЯЁ]{1,}/gm;
const regExp2 = /[\s]{1,}[,]{1,}[\s]{1,}|[,]{1,}|[\s]{1,}/gm;

function splitStrInput(str) {
  const resultArr = str.trim().split(regExp2);
  return resultArr.length;
}

inputData.addEventListener("change", (event) => {
  if (regExp.test(event.target.value)) {
    loadDataBtn.setAttribute("disabled", "disabled");
    loadDataBtn.classList.add("red-btn");
    inputData.classList.add("red-border");
    inputQttSpan.textContent = 0;
  } else {
    loadDataBtn.removeAttribute("disabled");
    loadDataBtn.classList.remove("red-btn");
    inputData.classList.remove("red-border");
    const inputQtt = splitStrInput(event.target.value);
    inputQttSpan.textContent = inputQtt;
  }
});

inputForm.addEventListener("submit", () => {
  loadDataBtn.setAttribute("disabled", "disabled");
  loadDataBtn.classList.toggle("red-btn");
});

loadDataBtn.addEventListener("click", () => {
  removeResultInfo();
  const dataLoadDiv = document.createElement("div");
  dataLoadDiv.setAttribute("class", "data-load");
  dataLoadDiv.innerHTML =
    '<h1>ИДЕТ ПАРСИНГ ДАННЫХ ...</h1><div class="loader">loading</div>';
  body.appendChild(dataLoadDiv);
  deleteBtn.setAttribute("disabled", "disabled");
  deleteBtn.classList.add("red-btn");
  downloadFile.setAttribute("disabled", "disabled");
  downloadFile.classList.add("red-btn");
  createDataBtn.setAttribute("disabled", "disabled");
  createDataBtn.classList.add("red-btn");
});

deleteBtn.addEventListener("click", (event) => {
  if (confirm("ВСЕ ДАННЫЕ БУДУТ УДАЛЕНЫ, ПРОДОЛЖИТЬ?")) {
    fetch("/delete_data")
      .then((res) => {
        return res.json();
      })
      .then((obj) => {
        const messagePar = document.createElement("p");
        messagePar.classList.add("file-delete");
        messagePar.textContent = obj.message;
        resBlock.innerHTML = "";
        resBlock.appendChild(messagePar);
        downloadBtn.classList.remove("show-btn");
        downloadFile.classList.remove("dowload-link-show");
        if (document.querySelector(".result-par")) {
          const notFoundBooksSpan = document
            .querySelector(".result-par")
            .querySelector("span");
          notFoundBooksSpan.textContent = 0;
        }
        setTimeout(() => {
          messagePar.remove();
        }, 2000);
      });
  }
});

downloadFile.addEventListener("click", () => {
  if (dataArr.length === 0) {
    console.log("Nothing to download");
  } else {
    const notSelectedItemsArr = [];
    const allItems = document.querySelectorAll(".resultItemWrapper");
    allItems.forEach((item) => {
      const noItemsMatched = item.querySelector(".set");
      if (!noItemsMatched) {
        const buttons = item.querySelectorAll(".offerAddBtn");
        if (buttons.length > 0) {
          let selectedFlag = false;
          for (let btn of buttons) {
            if (btn.classList.contains("selectedBtn")) {
              selectedFlag = true;
            }
          }
          if (!selectedFlag) {
            const id = buttons[0].classList[0].slice(2);
            notSelectedItemsArr.push(id);
          }
        }
      }
    });
    if (notSelectedItemsArr.length > 0) {
      let msgStr = "";
      notSelectedItemsArr.forEach((elem) => {
        const item = dataArr.find((item) => item.id === elem);
        msgStr += `<a href="#${item.id}-1">${item.ourItem.ourWBCode}</a> `;
      });

      const resultArea = document.querySelector(".parser-result");
      const messageWrapper = document.createElement("div");
      messageWrapper.classList.add("downloadMsgWrapper");
      const messageDiv = document.createElement("div");
      messageDiv.classList.add("downloadMsg");
      const headingDiv = document.createElement("div");
      headingDiv.classList.add("msgHeadingWrapper");
      const msgHeading = document.createElement("h3");
      msgHeading.textContent = "В СЛЕДУЮЩИХ ОБЪЕКТАХ НЕ БЫЛА ВЫБРАНА ЦЕНА";
      const closeBtn = document.createElement("button");
      closeBtn.classList.add("closeMsgBtn");
      closeBtn.textContent = "ЗАКРЫТЬ";
      const contentWrapper = document.createElement("div");
      contentWrapper.innerHTML = msgStr;
      const downloadBtn = document.createElement("button");
      downloadBtn.classList.add("msgDownloadBtn");
      downloadBtn.textContent = "ВСЁ РОВНО СКАЧАТЬ";
      headingDiv.appendChild(msgHeading);
      headingDiv.appendChild(closeBtn);
      messageDiv.appendChild(headingDiv);
      messageDiv.appendChild(contentWrapper);
      messageDiv.appendChild(downloadBtn);
      messageWrapper.appendChild(messageDiv);
      resultArea.appendChild(messageWrapper);

      downloadBtn.addEventListener("click", () => {
        fetch("/download_results", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(filteredDataArr),
        })
          .then((res) => {
            return res.json();
          })
          .then((obj) => {
            const contentWrap = document.querySelector(".content-wrapper");
            const messPar = document.createElement("p");
            const saveResDiv = document.createElement("div");
            saveResDiv.classList.add("save-results");
            messPar.textContent = obj.message;
            messPar.classList.add("save-file-par");
            saveResDiv.appendChild(messPar);
            contentWrap.appendChild(saveResDiv);
            setTimeout(() => {
              saveResDiv.remove();
            }, 2000);
          });
      });
      messageDiv.addEventListener("click", (event) => {
        if (event.target.tagName === "A" || event.target.tagName === "BUTTON")
          resultArea.removeChild(messageWrapper);
      });
    } else {
      fetch("/download_results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(filteredDataArr),
      })
        .then((res) => {
          return res.json();
        })
        .then((obj) => {
          const contentWrap = document.querySelector(".content-wrapper");
          const messPar = document.createElement("p");
          const saveResDiv = document.createElement("div");
          saveResDiv.classList.add("save-results");
          messPar.textContent = obj.message;
          messPar.classList.add("save-file-par");
          saveResDiv.appendChild(messPar);
          contentWrap.appendChild(saveResDiv);
          setTimeout(() => {
            saveResDiv.remove();
          }, 2000);
        });
    }
  }
});

resBlock.addEventListener("click", (event) => {
  if (
    event.target.classList[1] === "noMatchedItems" &&
    !event.target.classList[2]
  ) {
    const id = event.target.classList[0].slice(3);
    const buttons = document.querySelectorAll(`.b-${id}`);
    const addAllBtn = document.querySelector(`.al-${id}.addAllBtn`);
    addAllBtn.setAttribute("disabled", true);
    buttons.forEach((btn) => {
      btn.classList.remove("selectedBtn");
      btn.textContent = "ДОБАВИТЬ";
      btn.setAttribute("disabled", true);
      btn.style.background = "#f24e4a";
    });
    event.target.classList.add("set");
    event.target.style.background = "#ffaa00";
  } else if (
    event.target.classList[1] === "noMatchedItems" &&
    event.target.classList[2] === "set"
  ) {
    const id = event.target.classList[0].slice(3);
    const addAllBtn = document.querySelector(`.al-${id}.addAllBtn`);
    addAllBtn.removeAttribute("disabled");
    const buttons = document.querySelectorAll(`.b-${id}`);
    buttons.forEach((btn) => {
      btn.removeAttribute("disabled");
      btn.removeAttribute("style");
    });
    event.target.classList.remove("set");
    event.target.removeAttribute("style");
  }
  if (
    event.target.classList[1] === "offerAddBtn" &&
    !event.target.classList[2]
  ) {
    dataArr.forEach((elem, ind) => {
      if (elem.id === event.target.classList[0]) {
        const offer = elem.otherSellersOffers.find(
          (offer) => offer.id === event.target.id
        );
        filteredDataArr[ind].otherSellersOffers.push(offer);
      }
    });
    event.target.innerHTML = "ВЫБРАН";
    event.target.classList.add("selectedBtn");
  } else if (event.target.classList[2] === "selectedBtn") {
    filteredDataArr.forEach((elem) => {
      if (elem.id === event.target.classList[0]) {
        elem.otherSellersOffers = elem.otherSellersOffers.filter(
          (offer) => offer.id !== event.target.id
        );
      }
    });
    event.target.innerHTML = "ДОБАВИТЬ";
    event.target.classList.remove("selectedBtn");
  }
  if (event.target.classList[1] === "addAllBtn") {
    const id = event.target.classList[0].slice(3);
    console.log(id);
    dataArr.forEach((elem, ind) => {
      if (elem.id === id) {
        filteredDataArr[ind].otherSellersOffers = elem.otherSellersOffers;
      }
    });
    const buttons = document.querySelectorAll(`.b-${id}`);
    buttons.forEach((button) => {
      if (button.classList.contains("offerAddBtn")) {
        button.classList.add("selectedBtn");
        button.innerHTML = "ВЫБРАН";
      }
    });
  }
});

const inputs = document.querySelectorAll(".inputFormUploadImg input");
inputs.forEach((input) => {
  input.addEventListener("change", () => {
    input.classList.remove("red-border");
  });
});

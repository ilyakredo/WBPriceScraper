import { dataArr, addItem, removeResultInfo } from "./parser.js";
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
    fetch("/download_results", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dataArr),
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
});

resBlock.addEventListener("click", (event) => {
  if (event.target.className === "offerDeleteBtn") {
    fetch("/delete_item", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ delId: event.target.id }),
    }).then((res) => {
      fetch("./booksParse.json")
        .then((response) => {
          return response.json();
        })
        .then((data) => {
          let itemCounter = 0;
          removeResultInfo();
          for (let priceData of data) {
            itemCounter++;
            addItem(itemCounter, priceData);
          }
        });
      return res.json();
    });
  }
});

const inputs = document.querySelectorAll(".inputFormUploadImg input");
inputs.forEach((input) => {
  input.addEventListener("change", () => {
    input.classList.remove("red-border");
  });
});

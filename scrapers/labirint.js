//  Функция получения информации с Labirint

export const handleLab = async (searchUrl, page) => {
  try {
    await page.goto(searchUrl.lab, { timeout: 10000 });
  } catch (err) {
    console.log("Can't load Labirint page");
    return "";
  }
  const isBookNotFoundLab = (await page.$("div.search-error")) || "";
  if (isBookNotFoundLab) {
    return "";
  }
  try {
    await page.waitForSelector(".product-cover__cover-wrapper", {
      timeout: 3000,
    });
    const linkDataWrapper = await page.$(".product-cover__cover-wrapper");
    const itemLink = await page.evaluate((linkWrapper) => {
      const link = linkWrapper.querySelector("a").getAttribute("href");
      return `https://www.labirint.ru${link}`;
    }, linkDataWrapper);
    await page.waitForSelector("span.price-val", {
      timeout: 3000,
    });
    const priceDataWrapper = await page.$("span.price-val");
    let labPrice = await page.evaluate((priceWrapper) => {
      return priceWrapper.querySelector("span").textContent;
    }, priceDataWrapper);
    console.log("--->", labPrice);
    if (labPrice.trim() === "Нет в продаже") {
      labPrice = "";
    }
    return { price: labPrice, link: itemLink };
  } catch (err) {
    console.log("Can't get Labirint price:", err);
    return "";
  }
};

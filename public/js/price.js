const  priceTable = document.querySelector('.get-price-table');

export function createPriceTable (data){
    const priceHeadingRow = document.createElement('tr');
    priceHeadingRow.classList.add('head-row');
    const priceHeading = document.createElement('td');
    priceHeading.setAttribute('colspan','2');
    priceHeading.classList.add('book-row-heading');
    priceHeading.textContent = `${data.ean}`;
    priceHeadingRow.appendChild(priceHeading);
    priceTable.appendChild(priceHeadingRow);
    for(let key in data){
        if(key === 'ean') {
            continue;
        }
        const priceRow = document.createElement('tr');
        const priceCell = document.createElement('td');
        const priceCellInfo = document.createElement('td');
        priceCell.textContent = key;
        priceCellInfo.textContent = data[key];
        priceRow.appendChild(priceCell);
        priceRow.appendChild(priceCellInfo);
        priceTable.appendChild(priceRow);
    }
}


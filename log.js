import fsExtra from "fs-extra";


export function log (logMessage) {
    const time = new Date();
    let tmpData = fsExtra.readFileSync('./public/logError.txt','utf-8');
    const logCount = tmpData.split('**|**').length;
    if(logCount > 10000){
        const delIndex = tmpData.indexOf('**|**');
        tmpData = tmpData.slice(delIndex+5);
    }
    const readyData = tmpData + `\r\n${time.toLocaleString()} : ${logMessage} **|**`;
    fsExtra.outputFileSync('./public/logError.txt', `${readyData}`);
}
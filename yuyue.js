const $ = new Env("广州大学羽毛球场地预约");
let xh_args = {
    barkId: process.env.BARK_PUSH,
    // 是否立即执行，默认立即执行
    run_immediately: process.env.RESERVE_RUN_IMMEDIATELY === 'true' || false,
    // 等待间隔，当立即执行为false时生效，单位毫秒，默认为300，即 1000毫秒/等待间隔 = 每秒判断是否与设定时间相等或小于等于
    interval: +process.env.RESERVE_INTERVAL || 300,
    // 当立即执行为false时，青龙面板或Linux执行任务或对比run_time，当前时间大于等于默认时间都会执行，默认为12:30:00
    run_time: process.env.RESERVE_RUN_TIME || "12:30:00",
    // 指定时间，精确判断
    time: process.env.RESERVE_TIME || "19:30",
    location: process.env.RESERVE_LOCATION || "风雨跑廊羽毛球场",
    // 指定场地号数，精确判断
    area: +process.env.RESERVE_AREA || 4,
    // 备用场地号数，当指定场地号数大于系统放出的号数时启用，例如指定场地为10，系统放出最大号数为7，则启用备用场地号数，默认为3
    spare_area: +process.env.RESERVE_SPARE_AREA || 4,
    // 重试次数
    retry_count: +process.env.RESERVE_RETRY_COUNT || 5,
    cookie: process.env.RESERVE_COOKIE || "",
    headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
        'Content-Type': "application/x-www-form-urlencoded; charset=UTF-8"
    }
};
let csrfToken, workflowId, formData, cookieExpired = false, gender,
    formStepId, instanceId, entryId, codeName, codeId, field, reserved,
    cDXXList, orderArray = [], reservedIndex, startTime, specifyCount = 0, specifyComplete = false,
    message, reservedSuccess = false, notNow = false;
!(async () => {
    $.loadAuthor();
    if (xh_args.cookie === "") {
        console.log(`[${$.getTime()}] 请先填写Cookie，登录地址: https://usc.gzhu.edu.cn/infoplus/form/TYCDYY/start`);
    } else {
        xh_args.headers.Cookie = xh_args.cookie;
        message = '';
        if (xh_args.run_immediately) {
            await run_main();
        } else {
            console.log(`[${$.getTime()}] 本次任务不会立即执行，将在 ${xh_args.run_time} 后执行...`);
            do {
                console.log(`[${$.getTime()}] 等待运行中...`);
                await $.wait(xh_args.interval);
            } while ($.getNow() < xh_args.run_time);
            await run_main();
        }
        message += `预约执行完毕，预约耗时 ${((new Date).getTime() - startTime) / 1e3} 秒\n`;
        console.log(`[${$.getTime()}] 预约执行完毕，预约耗时 ${((new Date).getTime() - startTime) / 1e3} 秒`);
        if (xh_args.barkId) {
            console.log(`\n[${$.getTime()}] 正在推送结果...`);
            message += `\n执行时间: ${$.getTime()}\n版本代码: 20230303`;
            await sendBark("广州大学羽毛球场地预约情况");
        }
    }
})().catch((e) => {
    $.log("", `❌ ${$.name}, 失败! 原因: ${e}!`, "");
}).finally(() => {
    $.done();
});

async function run_main() {
    console.log(`[${$.getTime()}] 开始获取预约链接`);
    await initData();
    startTime = (new Date).getTime();
    await runTYCDYYStart();
    if (!cookieExpired) {
        reserved = false;
        await runInterfaceStart();
        if (!reserved) {
            await runInterfaceRender();
            if (!notNow) {
                await runInterfaceSuggest("TYCDYYM_YYXM", "", true);
                await runInterfaceSuggest("TYCDYYM_YYDD", "羽毛球", false);
                await runInterfaceSuggest("TYCDYY_YYRQ", "", true);
                specifyCount = 0;
                await runInterfaceFieldChanging();
                for (let i = 0; i < xh_args.retry_count; i++) {
                    if (!reserved) {
                        reservedSuccess = false;
                        await runInterfaceListNextStepsUsers(i);
                        if (reservedSuccess) {
                            await doAction();
                        }
                    } else break;
                }
            }
        }
    }
}

function initData() {
    csrfToken = "";
    workflowId = "";
    formData = "";
    cookieExpired = false;
    gender = "";
    formStepId = "";
    instanceId = "";
    entryId = "";
    codeName = "";
    codeId = "";
    field = "";
    reserved = "";
    cDXXList = "";
    orderArray = [];
    reservedIndex = "";
    specifyCount = 0;
    if ((xh_args.area === 0 || xh_args.area === "0") && xh_args.time === "all") {
        specifyComplete = true;
    }
}

function runTYCDYYStart() {
    return new Promise((resolve) => {
        const options = {
            url: 'https://usc.gzhu.edu.cn/infoplus/form/TYCDYY/start',
            headers: xh_args.headers
        };
        $.get(options, (err, resp, data) => {
            try {
                if (data.indexOf("你好呀") !== -1) {
                    cookieExpired = true;
                    message += "Cookie失效，请重新登录\n";
                    console.log(`[${$.getTime()}] Cookie失效，请重新登录`);
                } else {
                    csrfToken = data.match(new RegExp(/csrfToken" content="(.*?)"/));
                    csrfToken = csrfToken[1];
                    message += `csrfToken:${csrfToken}\n`;
                    workflowId = data.match(new RegExp(/workflowId = "(.*?)"/));
                    workflowId = workflowId[1];
                    message += `workflowId:${workflowId}\n`;
                }
            } catch (e) {
                console.log(e);
            } finally {
                resolve();
            }
        });
    });
}

function handleData(obj) {
    const arr = [];
    for (let key in obj) arr.push(`${encodeURIComponent(key)}=${encodeURIComponent(obj[key])}`);
    return arr.join('&');
}

function runInterfaceStart() {
    return new Promise((resolve) => {
        const options = {
            url: 'https://usc.gzhu.edu.cn/infoplus/interface/start',
            body: handleData({
                idc: 'TYCDYY',
                release: '',
                csrfToken: csrfToken,
                formData: formData,
                lang: 'zh'
            }),
            headers: xh_args.headers
        };
        $.post(options, (err, resp, data) => {
            try {
                if (safeGet(data)) {
                    let { entities, errno, error } = JSON.parse(data);
                    if (errno === 14004) {
                        console.log(`[${$.getTime()}] 预约链接获取失败: ${error}`);
                        reserved = true;
                    } else {
                        gender = entities[0];
                        message += `预约链接为: ${entities[0]}\n\n`;
                        console.log(`[${$.getTime()}] 预约链接获取成功`);
                    }
                }
            } catch (e) {
                console.log(e);
            } finally {
                resolve();
            }
        });
    });
}

function runInterfaceRender() {
    return new Promise((resolve) => {
        formStepId = gender.match(new RegExp(/form\/(\d+)\/render/));
        formStepId = formStepId[1];
        xh_args.headers.referer = gender;
        const options = {
            url: 'https://usc.gzhu.edu.cn/infoplus/interface/render',
            body: handleData({
                stepId: formStepId,
                instanceId: '',
                admin: false,
                rand: Math.random() * 999,
                width: 917,
                lang: 'zh',
                csrfToken: csrfToken
            }),
            headers: xh_args.headers
        };
        $.post(options, (err, resp, data) => {
            try {
                if (safeGet(data)) {
                    let { entities, errno, error } = JSON.parse(data);
                    if (errno === 22001) {
                        console.log(`[${$.getTime()}] ${error}`);
                        console.log(`[${$.getTime()}] ${JSON.stringify(data)}`);
                        notNow = error.indexOf("中午12点半后") !== -1;
                    } else if (errno === 0) {
                        notNow = false;
                        let info = entities[0].data;
                        instanceId = entities[0].step.instanceId;
                        entryId = entities[0].step.entryId;
                        let {
                            fieldSF,
                            fieldLSH,
                            fieldSQSJ,
                            fieldXM,
                            fieldXM_Name,
                            fieldXH,
                            fieldXY,
                            fieldXY_Name
                        } = info;
                        fieldChanging({
                            fieldSF,
                            fieldLSH,
                            fieldSQSJ,
                            fieldXM,
                            fieldXM_Name,
                            fieldXH,
                            fieldXY,
                            fieldXY_Name
                        });
                    }
                }
            } catch (e) {
                console.log(e);
            } finally {
                resolve();
            }
        });
    });
}

function fieldChanging(obj) {
    field = {
        "fieldSF": obj.fieldSF,
        "fieldYZYMFQ": (Math.cos(parseInt(obj.fieldLSH)) + 10000) * 1000,
        "fieldLSH": obj.fieldLSH,
        "fieldSQSJ": obj.fieldSQSJ,
        "fieldXM": obj.fieldXM,
        "fieldXM_Name": obj.fieldXM_Name,
        "fieldXH": obj.fieldXH,
        "fieldXY": obj.fieldXY,
        "fieldXY_Name": obj.fieldXY_Name,
        "fieldLXFS": "13900000000",
        "fieldYYXM": "羽毛球",
        "fieldYYXM_Name": "羽毛球",
        "fieldXZDD": xh_args.location,
        "fieldXZDD_Name": xh_args.location,
        "fieldXZDD_Attr": "{\"_parent\":\"羽毛球\"}",
        "fieldYYRQ": codeId,
        "fieldYYRQ_Name": codeName,
        "fieldZJ": codeId
    };
    return field;
}

function runInterfaceSuggest(code, parent, isTopLevel) {
    return new Promise((resolve) => {
        formStepId = gender.match(new RegExp(/form\/(\d+)\/render/));
        formStepId = formStepId[1];
        xh_args.headers.referer = gender;
        const options = {
            url: 'https://usc.gzhu.edu.cn/infoplus/interface/suggest',
            body: handleData({
                prefix: "",
                type: "Code",
                code,
                parent,
                isTopLevel,
                pageNo: 0,
                rand: Math.random() * 999,
                settings: JSON.stringify({}),
                csrfToken: csrfToken,
                lang: 'zh',
                instanceId: instanceId,
                stepId: formStepId,
                entryId: entryId,
                workflowId: null
            }),
            headers: xh_args.headers
        };
        $.post(options, (err, resp, data) => {
            try {
                if (safeGet(data)) {
                    let { items } = JSON.parse(data);
                    if (code === "TYCDYY_YYRQ") {
                        if (items[items.length - 1].enabled) {
                            codeId = items[items.length - 1].codeId;        //周几
                            codeName = items[items.length - 1].codeName;    //日期
                            field.fieldYYRQ = codeId;
                            field.fieldZJ = codeId;
                            field.fieldYYRQ_Name = codeName;
                        }
                    }
                }
            } catch (e) {
                console.log(e);
            } finally {
                resolve();
            }
        });
    });
}

function runInterfaceFieldChanging() {
    return new Promise((resolve) => {
        formStepId = gender.match(new RegExp(/form\/(\d+)\/render/));
        formStepId = formStepId[1];
        xh_args.headers.referer = gender;
        const options = {
            url: 'https://usc.gzhu.edu.cn/infoplus/interface/fieldChanging',
            body: handleData({
                formData: JSON.stringify(field),
                fieldName: 'fieldYYRQ',
                fieldValue: codeId,
                path: '',
                boundFields: 'fieldXH,fieldZJ,fieldFZPD,fieldYYXM,fieldXM,fieldLSH,fieldSF,fieldSQSJ,fieldYYCD,fieldXY,fieldYYDD,fieldYYRQ,fieldYZYMFQ,fieldSJD,fieldLXFS,fieldXZDD,fieldXZ,fieldTYXM,fieldYYZT',
                csrfToken: csrfToken,
                lang: 'zh',
                instanceId: instanceId,
                stepId: formStepId,
                entryId,
                workflowId: null
            }),
            headers: xh_args.headers
        };
        $.post(options, (err, resp, data) => {
            try {
                if (safeGet(data)) {
                    let { errno, ecode, error, entities } = JSON.parse(data);
                    if (errno === 0) {
                        let entitiesObj = JSON.parse(entities[0]);
                        field.fieldLXFS = entitiesObj.lXFS;
                        field.fieldSF = entitiesObj.sF;
                        field.fieldSQSJ = entitiesObj.sQSJ;
                        field.fieldXH = entitiesObj.xH;
                        field.fieldXM = entitiesObj.xM.codeId;
                        field.fieldXM_Name = entitiesObj.xM.codeName;
                        field.fieldXY = entitiesObj.xY.codeName;
                        field.fieldXY_Name = entitiesObj.xY.codeName;
                        field.fieldXZDD = entitiesObj.xZDD.codeId;
                        field.fieldXZDD_Name = entitiesObj.xZDD.codeName;
                        field.fieldYYRQ = entitiesObj.yYRQ.codeId;
                        field.fieldYYRQ_Name = entitiesObj.yYRQ.codeName;
                        field.fieldZJ = entitiesObj.zJ;
                        field.fieldLSH = entitiesObj.lSH;
                        field.fieldYZYMFQ = entitiesObj.yZYMFQ;
                        cDXXList = entitiesObj.cDXXList;
                        for (let j = 0; j < cDXXList.length; j++) orderArray.push(j);
                        field.groupCDXXList = [];
                        field.fieldSJD = [];
                        field.fieldTYXM = [];
                        field.fieldYYDD = [];
                        field.fieldYYCD = [];
                        field.fieldYYZT = [];
                        field.fieldXZ = [];
                        field.fieldFZPD = [];
                        if (+xh_args.area > cDXXList.length / 2) {
                            console.log(`[${$.getTime()}] 指定号数超过系统放出号数，已启用备用号数 ${+xh_args.spare_area}`);
                            xh_args.area = +xh_args.spare_area;
                            console.log(`[${$.getTime()}] 当前指定场地号数为 ${+xh_args.area}`);
                        }
                        for (let i = 0; i < cDXXList.length; i++) {
                            field.groupCDXXList.push(cDXXList[i].entityIndex);
                            field.fieldSJD.push(cDXXList[i].sJD);
                            field.fieldTYXM.push(cDXXList[i].tYXM);
                            field.fieldYYDD.push(cDXXList[i].yYDD);
                            field.fieldYYCD.push(cDXXList[i].yYCD);
                            field.fieldYYZT.push(cDXXList[i].yYZT);
                            field.fieldXZ.push(false);
                            field.fieldFZPD.push(cDXXList[i].fZPD);
                            if (+xh_args.area !== 0) {
                                if (cDXXList[i].yYCD === `${xh_args.area}号场`) {
                                    if (xh_args.time !== "all") {
                                        let time = field.fieldSJD[i].substring(0, field.fieldSJD[i].indexOf("-"));
                                        if (xh_args.time === time) {
                                            specifyCount++;
                                        }
                                    } else {
                                        specifyCount++;
                                    }
                                } else {
                                    if (xh_args.time !== "all") {
                                        let time = field.fieldSJD[i].substring(0, field.fieldSJD[i].indexOf("-"));
                                        if (xh_args.time === time) {
                                            specifyCount++;
                                        }
                                    }
                                }
                            } else {
                                if (xh_args.time !== "all") {
                                    let time = field.fieldSJD[i].substring(0, field.fieldSJD[i].indexOf("-"));
                                    if (xh_args.time === time) {
                                        specifyCount++;
                                    }
                                }
                            }
                        }
                    }
                }
            } catch (e) {
                console.log(e);
            } finally {
                resolve();
            }
        });
    });
}

function runInterfaceListNextStepsUsers(index) {
    return new Promise((resolve) => {
        formStepId = gender.match(new RegExp(/form\/(\d+)\/render/));
        formStepId = formStepId[1];
        xh_args.headers.referer = gender;
        if (!specifyComplete) {
            for (let i = 0; i < orderArray.length; i++) {
                /* 先判断场地再判断时间会更快 */
                if (+xh_args.area !== 0) {   // 如果指定了场地的号数，例如3号场地
                    if (field.fieldYYCD[orderArray[i]] === `${xh_args.area}号场`) {   // 如果遍历到的场地是指定场地
                        if (xh_args.time !== "all") {   // 判断是否指定时间
                            let time = field.fieldSJD[orderArray[i]].substring(0, field.fieldSJD[orderArray[i]].indexOf("-"));
                            if (xh_args.time === time) {    // 判断对应场地的对应时间是否与指定时间相等
                                reservedIndex = orderArray[i];
                                break;
                            } else continue;
                        }
                        reservedIndex = orderArray[i];
                        break;
                    }
                } else {    // 不指定场地
                    if (xh_args.time !== "all") {   // 判断是否指定时间
                        let time = field.fieldSJD[orderArray[i]].substring(0, field.fieldSJD[orderArray[i]].indexOf("-"));
                        if (xh_args.time === time) {    // 判断对应场地的对应时间是否与指定时间相等
                            reservedIndex = orderArray[i];
                            break;
                        } else {
                            let random = Math.floor((Math.random() * orderArray.length));
                            reservedIndex = orderArray[random];
                            break;
                        }
                    }
                }
            }
        } else {
            let random = Math.floor((Math.random() * orderArray.length));
            reservedIndex = orderArray[random];
        }
        console.log(`[${$.getTime()}] 第 ${index + 1} 次预约 ${field.fieldSJD[reservedIndex]} ${field.fieldYYCD[reservedIndex]}`);
        message += `第 ${index + 1} 次预约 ${field.fieldSJD[reservedIndex]} ${field.fieldYYCD[reservedIndex]}\n`;
        field.fieldXZ[reservedIndex] = true;
        const options = {
            url: 'https://usc.gzhu.edu.cn/infoplus/interface/listNextStepsUsers',
            body: handleData({
                formData: JSON.stringify(field),
                stepId: formStepId,
                actionId: 1,
                timestamp: Math.round(new Date() / 1000),
                rand: Math.random() * 999,
                boundFields: 'fieldXH,fieldZJ,fieldFZPD,fieldYYXM,fieldXM,fieldLSH,fieldSF,fieldSQSJ,fieldYYCD,fieldXY,fieldYYDD,fieldYYRQ,fieldYZYMFQ,fieldSJD,fieldLXFS,fieldXZDD,fieldXZ,fieldTYXM,fieldYYZT',
                csrfToken: csrfToken,
                lang: 'zh'
            }),
            headers: xh_args.headers
        };
        $.post(options, (err, resp, data) => {
            try {
                if (safeGet(data)) {
                    let result = JSON.parse(data);
                    if (result.errno === 22001) {
                        console.log(`[${$.getTime()}] ${result.error}`);
                        message += `${result.error}\n`;
                        reserved = false;
                        reservedSuccess = false;
                        field.fieldXZ[reservedIndex] = false;
                    } else if (result.errno === 0) {
                        console.log(`[${$.getTime()}] 预约成功: ${result.ecode}`);
                        reservedSuccess = true;
                        message += `${JSON.stringify(result)}\n`;
                    }
                    orderArray.splice(orderArray.findIndex(i => i === reservedIndex), 1);
                    specifyCount -= 1;
                    if (specifyCount <= 0) specifyComplete = true;
                }
            } catch (e) {
                console.log(e);
            } finally {
                resolve();
            }
        });
    });
}

function doAction() {
    return new Promise((resolve) => {
        formStepId = gender.match(new RegExp(/form\/(\d+)\/render/));
        formStepId = formStepId[1];
        xh_args.headers.referer = gender;
        console.log(`[${$.getTime()}] 正在确认预约`);
        message += `正在确认预约\n`;
        const options = {
            url: 'https://usc.gzhu.edu.cn/infoplus/interface/doAction',
            body: handleData({
                formData: JSON.stringify(field),
                actionId: 1,
                rand: Math.random() * 999,
                stepId: formStepId,
                timestamp: Math.round(new Date() / 1000),
                boundFields: 'fieldXH,fieldZJ,fieldFZPD,fieldYYXM,fieldXM,fieldLSH,fieldSF,fieldSQSJ,fieldYYCD,fieldXY,fieldYYDD,fieldYYRQ,fieldYZYMFQ,fieldSJD,fieldLXFS,fieldXZDD,fieldXZ,fieldTYXM,fieldYYZT',
                csrfToken: csrfToken,
                lang: 'zh',
                nextUsers: JSON.stringify({}),
                remark: ""
            }),
            headers: xh_args.headers
        };
        $.post(options, (err, resp, data) => {
            try {
                if (safeGet(data)) {
                    let result = JSON.parse(data);
                    if (result.errno === 22001) {
                        console.log(`[${$.getTime()}] 预约确认失败: ${result.error}`);
                        console.log(`[${$.getTime()}] ${JSON.stringify(result)}`);
                        message += `预约确认失败: ${result.error}\n`;
                        reserved = false;
                    } else if (result.errno === 0) {
                        console.log(`[${$.getTime()}] 预约确认成功: ${result.ecode}`);
                        message += `预约确认成功: ${result.ecode}\n`;
                        reserved = true;
                    } else {
                        console.log(`[${$.getTime()}] 预约确认状态未知: ${JSON.stringify(result)}`);
                    }
                    field.fieldXZ[reservedIndex] = false;
                }
            } catch (e) {
                console.log(e);
                console.log(data);
            } finally {
                resolve();
            }
        });
    });
}

function sendBark(title) {
    return new Promise((resolve) => {
        const options = {
            url: `https://api.day.app/${xh_args.barkId}/${title}/${encodeURIComponent(message)}`
        };
        $.get(options, (err, resp, data) => {
            try {
                if (safeGet(data)) {
                    let { code, message } = JSON.parse(data);
                    console.log(`[${$.getTime()}] Bark通知发送${(code === 200 || message === "success") ? '成功' : '失败'}`);
                }
            } catch (e) {
                console.log(e);
            } finally {
                resolve();
            }
        });
    });
}

function safeGet(data) {
    try {
        if (typeof JSON.parse(data) == "object") {
            return true;
        }
    } catch (e) {
        console.log(e);
        console.log(`数据转换失败，请检查数据是否有误`);
        return false;
    }
}

// prettier-ignore
function Env(t, e) {
    return new class {
        constructor(t, e) {
            this.name = t;
            this.logs = [];
            this.logSeparator = "\n";
            this.startTime = (new Date).getTime();
            Object.assign(this, e);
            this.log(`🔔${this.name}任务开始!`);
        }

        initGotEnv() {
            this.got = this.got ? this.got : require("got");
        }

        post(t, e = (() => {})) {
            this.initGotEnv();
            const { url: s, ...i } = t;
            this.got.post(s, i).then(t => {
                const { statusCode: s, headers: r, body: o } = t;
                e(null, { status: s, statusCode: s, headers: r, body: o }, o);
            }, t => {
                const { message: s, response: i } = t;
                e(s, i, i && i.body);
            });
        }

        get(t, e = (() => {})) {
            this.initGotEnv();
            this.got(t).on("redirect", () => {
            }).then(t => {
                const { statusCode: s, headers: r, body: o } = t;
                e(null, { status: s, statusCode: s, headers: r, body: o }, o);
            }, t => {
                const { message: s, response: i } = t;
                e(s, i, i && i.body);
            });
        }

        log(...t) {
            t.length > 0 && (this.logs = [...this.logs, ...t]);
            console.log(t.join(this.logSeparator));
        }

        wait(t) {
            return new Promise(e => setTimeout(e, t));
        }

        done() {
            const e = (new Date).getTime(), s = (e - this.startTime) / 1e3;
            this.log("", `🔔${this.name}任务结束! 总耗时 🕛 ${s} 秒`);
        }

        getTime() {
            let date = new Date(),
                year = date.getFullYear(),
                month = (date.getMonth() + 1) < 10 ? `0${date.getMonth() + 1}` : date.getMonth() + 1,
                day = date.getDate() < 10 ? `0${date.getDate()}` : date.getDate(),
                hours = date.getHours() < 10 ? `0${date.getHours()}` : date.getHours(),
                minutes = date.getMinutes() < 10 ? `0${date.getMinutes()}` : date.getMinutes(),
                seconds = date.getSeconds() < 10 ? `0${date.getSeconds()}` : date.getSeconds();
            return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
        }

        getNow() {
            let date = new Date(),
                hours = date.getHours() < 10 ? `0${date.getHours()}` : date.getHours(),
                minutes = date.getMinutes() < 10 ? `0${date.getMinutes()}` : date.getMinutes(),
                seconds = date.getSeconds() < 10 ? `0${date.getSeconds()}` : date.getSeconds();
            return `${hours}:${minutes}:${seconds}`;
        }

        loadAuthor() {
            console.log(`__  __ _          ___   _   _
\\ \\/ // |  __ _  / _ \\ | | | |  ___
 \\  / | | / _\` || | | || |_| | / _ \\
 /  \\ | || (_| || |_| ||  _  ||  __/
/_/\\_\\|_| \\__,_| \\___/ |_| |_| \\___|
`);
        }
    }(t, e);
}

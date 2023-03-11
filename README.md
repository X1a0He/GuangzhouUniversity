# 免责声明

本项目仅用于交流与学习，任何本项目的衍生品或导致的后果，与作者无关

在你克隆本仓库或下载本仓库任一文件或代码时，默认遵守免责声明

运行之前请确保你看了脚本注释

# License

<a href="LICENSE"><img src="https://img.shields.io/github/license/fstudio/clangbuilder.svg"></a>

本项目遵循`MIT license`，方便交流与学习，包括但不限于本项目的衍生品都禁止在损害广州大学官方利益情况下进行盈利。如果您发现本项目有侵犯您的知识产权，请与我取得联系或提出 issue，我会及时修改或删除。

# Log

- 2023-03-11 14:00 Update [yuyue.js](https://github.com/X1a0He/GuangzhouUniversity/blob/main/yuyue.js)

1. 合并了 Env 的 get 和 post 代码逻辑
2. 移除了用正则表达式匹配的方式来处理 `csrfToken`、`workflowId`、`formStepId`，取而代之的是 `getTextBetween` 方法
3. 当获取预约链接失败时，不再执行脚本
4. 优化了主方法的运行逻辑和对Cookie的判断逻辑
5. 优化了预约执行时间 `duration` 的计算位置，尽量精确计算
6. 优化了 `run_main` 方法的所有子方法判断逻辑
7. 移除了冗余的 `TYCDYYM_YYXM` 和 `TYCDYYM_YYDD` 请求，进一步加快了预约的时间
8. 优化了 `handleData` 方法对数据的处理
9. 优化了预约链接的获取，避免出现获取失败的情况
10. 修复了当指定场地号数大于系统放出的号数时，无法对其判断造成后续预约失败的问题
11. 优化精简了对指定时间指定场地号数的判断和提交逻辑，用简短的代码实现同样的目的
12. 简单优化了 `safeGet` 方法
13. 重写 `Env` 中的 `getCurrentTime` 和 `getTime` 方法，更加高效可控

- 2023-03-03 13:30 Upload [yuyue.js](https://github.com/X1a0He/GuangzhouUniversity/blob/main/yuyue.js)

```
__  __ _          ___   _   _
\ \/ // |  __ _  / _ \ | | | |  ___
 \  / | | / _` || | | || |_| | / _ \
 /  \ | || (_| || |_| ||  _  ||  __/
/_/\_\|_| \__,_| \___/ |_| |_| \___|

广州大学羽毛球场地预约脚本，支持青龙面板和本地运行(需要安装Node.js和依赖)，更多特性如下

1. 支持是否立即执行，通过环境变量 RESERVE_RUN_IMMEDIATELY 控制，默认为false
   若false时，则会进入等待，直至到达预设时间 RESERVE_RUN_TIME 才会立即执行
   预设时间默认为12:30:00，模糊判断，当时间大于等于预设时间时执行
2. 支持自定义等待间隔，通过环境变量 RESERVE_INTERVAL 控制，默认为 300 ，详情看脚本第10行注释
3. 支持预约指定时间的场地，通过环境变量 RESERVE_TIME 控制，默认为 all 即不指定时间，精确判断
4. 支持预约指定号数的场地，通过环境变量 RESERVE_AREA 控制，默认为 0 即不指定场地号数，精确判断
5. 支持备用场地号数，通过环境变量 RESERVE_SPARE_AREA 控制，默认为 3 ，当指定场地号数大于系统放出的号数时启用
6. 支持预约指定场馆，通过环境变量 RESERVE_LOCATION 控制，默认为风雨跑廊羽毛球场，精确判断
7. 支持预约失败后重试，通过环境变量 RESERVE_RETRY_COUNT 控制，默认为 5 
   若首次失败后，将继续重试4次，即 首次 + 重试4次 = 5次
8. 仅支持单Cookie执行，不支持多Cookie执行，通过环境变量 RESERVE_COOKIE 控制，默认为空
9. 支持执行完毕后的 Bark 通知

注: 时间与场地的优先级为 场地(X号场) > 时间，详细分为4种情况
1. 不指定场地不指定时间，则脚本会随机预约随机场地随机时间
2. 指定场地不指定时间，则脚本会优先预约同一个场地(X号场)的所有时间，若不成功，则进入随机预约
3. 指定场地指定时间，则脚本会优先判断场地(X号场)的时间是否与预设时间符合后预约，若不符合，则继续预约指定时间，若不成功，则随机
4. 不指定场地但指定时间，则脚本会按顺序预约指定时间的所有场地，若不成功，则进入随机预约
```

# 用法

**注意：支持Windows、Mac、Linux，青龙面板以及本地运行，提前下载好Node.js即可**

**注意：支持Windows、Mac、Linux，青龙面板以及本地运行，提前下载好Node.js即可**

**注意：支持Windows、Mac、Linux，青龙面板以及本地运行，提前下载好Node.js即可**

**注意：支持Windows、Mac、Linux，青龙面板以及本地运行，提前下载好Node.js即可**

**注意：支持Windows、Mac、Linux，青龙面板以及本地运行，提前下载好Node.js即可**

1. 克隆仓库到本地，文件夹名为 GuangzhouUniversity

```
git clone https://github.com/X1a0He/GuangzhouUniversity.git
```

2. 安装依赖（提前装好Node.js，自己百度）

```
Windows用cmd
cd 把GuangzhouUniversity文件夹拖进cmd，例如在C盘下就是
cd C:\GuangzhouUniversity
npm i
或者
yarn

Mac用终端或者iTerm
cd 把GuangzhouUniversity文件夹拖进终端，例如
cd /Users/X1a0He/github/GuangzhouUniversity
npm i
或者
yarn

Linux同理

青龙面板直接拉库就好了

```

3. 确保电脑上有代码编辑器，如VSCode，WebStorm，IDEA或其他
4. 用代码编辑器打开GuangzhouUniversity下的yuyue.js
5. 浏览器到广州大学羽毛球场地预约登录取Cookie

```
https://usc.gzhu.edu.cn/infoplus/form/TYCDYY/start
```

6. F12打开开发者工具，点 网络，刷新，找到start的记录
7. 在请求标头下找到 Cookie 字段，例如

```
cookie: INGRESSCOOKIE=xxxxxxx
```

8. 把 Cookie INGRESSCOOKIE开头到所有Cookie的最后复制下来
9. 在代码编辑器找到 xh_args - cookie，修改 RESERVE_COOKIE || "" 中的双引号内容

```js
cookie: process.env.RESERVE_COOKIE || "把一整串Cookie粘贴进来"
```

10. 如果有指定场地，修改对应参数即可，脚本已用中文明文标注，看不懂的话，学一下中文再来

如果上述步骤做完，那么你每天的操作就是在12:25:00的时候登录一下官网，获取Cookie填入即可

## 每日步骤

1. 做上述步骤的 5 ~ 10
2. 打开你电脑上的cmd或终端，输入

```
cd 把文件夹拖进来
node yuyue
```

3. 等待即可

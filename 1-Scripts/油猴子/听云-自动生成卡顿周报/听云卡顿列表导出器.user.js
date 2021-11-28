// ==UserScript==
// @name         听云&Bugly卡顿列表导出器
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://report.tingyun.com/*
// @match        https://bugly.qq.com/v2/crash-reporting/blocks/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// ==/UserScript==



//获取指定的日期  七天前日期：getDay(-7)，今天日期：getDay(0), 后天日期：getDay(2)
function getDay(day){
　　var today = new Date();
　　var targetday_milliseconds=today.getTime() + 1000*60*60*24*day;
　　today.setTime(targetday_milliseconds); //注意，这行是关键代码
　　var tYear = today.getFullYear();
　　var tMonth = today.getMonth();
　　var tDate = today.getDate();
　　tMonth = doHandleMonth(tMonth + 1);
　　tDate = doHandleMonth(tDate);
　　return tYear+""+tMonth+""+tDate;
}

function doHandleMonth(month){
　　var m = month;
　　if(month.toString().length == 1){
　　　　m = "0" + month;
　　}
　　return m;
}


(function() {
    'use strict';
    ///----------------------听云卡顿周报导出------------------------------
    let base_block_url = 'https://report.tingyun.com/mobile-web/';

    let element_to_model = function(elements) {
        var blocks = [];
        for(var i = 0; i < elements.length; i++) {
            let tds = elements[i].children;
            //1.获取id
            let id = tds[0].innerHTML;
            //2.获取卡顿链接，获取卡顿title,卡顿标签
            let block_info = tds[1].children[0];
            // 卡顿链接
            let block_href = base_block_url + block_info.getAttribute("href");
            // 卡顿堆栈摘要
            let block_content = block_info.textContent;
            // 卡顿tag信息
            var tgs = "";
            var tags = tds[1].children[1].children;
            for(var j = 0; j < tags.length - 1; j++) {
                tgs += tags[j].textContent + ",";
            }
            //3.获取卡顿发生时间段
            let duration = tds[2].innerHTML;
            //4.发生次数
            let count = tds[3].innerHTML;
            //5.影响用户数
            let user_count = tds[4].innerHTML;
            //6.卡顿占比
            let percent = tds[5].innerHTML;
            //7.获取卡顿状态
            let status = "--";
            if (tds[6].children[0].classList.contains('custom_status_container')) {
                status = "--";
            }else{
                status = tds[6].children[0].children[0].children[0].textContent;
            }
            blocks.push({
                id: id,
                href: block_href,
                bref: block_content,
                tags: tgs,
                duration: duration,
                count: count,
                ucount: user_count,
                percent: percent,
                status: status
            })
        }
        return blocks;
    }

    let ext_block_infos = function() {
        let percent = document.getElementsByClassName('num')[0].textContent;
        let user_count = document.getElementsByClassName('li_user')[0].textContent;
        let block_count = document.getElementsByClassName('li_anrIos_icon')[0].textContent;
        let versions = document.getElementsByClassName('multiselect-ellip')[0].textContent;
        return {
            percent: percent,
            user_count: user_count,
            block_count: block_count,
            versions: versions,
        };
    }

    //根据数组内容，创建table
    let create_alert_table = function(list) {
        let table = document.createElement('table');
        table.setAttribute('style', 'background-color:white;');
        //创建头部
        let theadContent = "<tr><th>序号</th><th>卡顿出处</th><th>卡顿问题</th><th>卡顿占比</th><th>状态</th><th>备注</th></tr>";
        let thead = document.createElement('thead');
        thead.innerHTML = theadContent;
        let tbody = document.createElement('tbody');
        table.appendChild(thead);
        table.appendChild(tbody);
        //循环创建每一行
        for (var i = 0; i < list.length; i++) {
            let model = list[i]
            //创建行tr
            var tr = document.createElement('tr');
            tbody.appendChild(tr);
            //创建每一个td元素
            //1.创建序号列
            let td1 = document.createElement('td');
            td1.innerHTML = i + 1;
            //2.创建卡顿标签列
            let td2 = document.createElement('td');
            td2.innerHTML = model.tags;
            //3.创建卡顿问题描述
            let td3 = document.createElement('td');
            td3.innerHTML = "<a href='" + model.href + "'>" + model.bref + "</ a>";
            //4.创建卡顿占比数据
            let td4 = document.createElement('td');
            td4.innerHTML = model.percent;
            //5.创建卡顿状态
            let td5 = document.createElement('td');
            td5.innerHTML = model.status;
            //6.创建卡顿备注信息
            let td6 = document.createElement('td');
            //列表中添加子元素
            tr.appendChild(td1);
            tr.appendChild(td2);
            tr.appendChild(td3);
            tr.appendChild(td4);
            tr.appendChild(td5);
            tr.appendChild(td6);
        }

        //追加卡顿基本信息
        let block_ext_infos = ext_block_infos();
        let ext_div = document.createElement('div');
        //日期
        let p_date = document.createElement('h4');
        p_date.innerHTML = "日期：" + getDay(-6) + " - " + getDay(0);
        ext_div.appendChild(p_date);
        //统计版本号
        let p_version = document.createElement('h4');
        p_version.innerHTML = "统计版本：" + block_ext_infos.versions;
        ext_div.appendChild(p_version);
        //统计卡顿总数
        let p_block_count = document.createElement('h4');
        p_block_count.innerHTML = block_ext_infos.block_count;
        ext_div.appendChild(p_block_count);
        //统计影响用户数
        let p_user_count = document.createElement('h4');
        p_user_count.innerHTML = block_ext_infos.user_count;
        ext_div.appendChild(p_user_count);
        //卡顿平均值
        let p_percent = document.createElement('h4');
        p_percent.innerHTML = "卡顿平均值: " + block_ext_infos.percent;
        ext_div.appendChild(p_percent);

        let div_table = document.createElement('div');
//        div_table.setAttribute('style', "padding: 100px;");
        div_table.appendChild(ext_div);
        div_table.appendChild(table);
        return div_table;
    }

    //导出按钮
    let click_event = function () {
        let eles = document.getElementsByClassName('defaultSelectedElem')[0].children;
        let models = element_to_model(eles);
        let alertView = create_alert_table(models);
        document.body.appendChild(alertView);
        window.scrollTo(0, document.documentElement.clientHeight);
    }


    //界面上添加元素
    let tingyunAddExportEntrance = function () {//迭代调用
        var parent_element = document.getElementsByClassName('anr-click')[0].parentNode;

        // 创建按钮 START
        let btn = document.createElement('a');
        btn.innerHTML ='导出卡顿周报';
        btn.style.cssText = 'margin-left:20px;';
        btn.className = 'anr-click';
        btn.addEventListener('click', click_event);
        parent_element.appendChild(btn);
    }

    ///----------------------Bugly卡顿周报导出------------------------------
    let buglyAddExportEntrance = function() {
        var targetNode = document.getElementsByClassName('_25krQc1-B84hrPrRte9rn6')[0].children;
        let ulNode = targetNode[targetNode.length-1];

        // 创建按钮 START
        //   <a class="btn btn_white" style="margin-left: 20px; margin-right: 20px;">导出卡顿周报</a>
        let btn = document.createElement('a');
        btn.innerHTML ='导出卡顿周报';
        btn.style.cssText = 'margin-left: 20px; margin-right: 20px;';
        btn.className = 'btn btn_white';
        btn.addEventListener('click', buglyBlockReporter);
        ulNode.appendChild(btn);
    }

    //导出卡顿日志流程
    let buglyBlockReporter = function(){
        let eles = document.getElementsByClassName('_36jSi1cUZ4-TTFyFWdzuwr')[0].children;
        let models = transformBuglyElementsToModel(eles);
        let alertView = transformModelsToTargetElements(models);
        document.body.appendChild(alertView);
//        var targetNode = document.getElementsByClassName("_18O7rqyc7SChvLoVfXRWKO _2kUrhZpFDL-5aCFCD_QIoB")[0];
//        targetNode.appendChild(alertView);
    }

    //将bugly数据模型转换成html标签片段
    let transformModelsToTargetElements = function(models) {
        let table = document.createElement('table');
        table.setAttribute('style', 'width:70%;margin:700px auto 100px auto;');
        //创建头部
        let theadContent = "<tr><th>序号</th><th>卡顿出处</th><th>卡顿问题</th><th>发生次数</th><th>影响用户数</th><th>状态</th><th>备注</th></tr>";
        let thead = document.createElement('thead');
        thead.innerHTML = theadContent;
        let tbody = document.createElement('tbody');
        table.appendChild(thead);
        table.appendChild(tbody);
        //循环创建每一行
        for (var i = 0; i < models.length; i++) {
            let model = models[i]
            //创建行tr
            var tr = document.createElement('tr');
            tbody.appendChild(tr);
            //创建每一个td元素
            //1.创建序号列
            let td1 = document.createElement('td');
            td1.innerHTML = i + 1;
            //2.创建卡顿标签列-卡顿出处
            let td2 = document.createElement('td');
            td2.innerHTML = model.tags;
            //3.创建卡顿问题描述
            let td3 = document.createElement('td');
            td3.innerHTML = model.descHTML;
            //4.影响用户数
            let td4 = document.createElement('td');
            td4.innerHTML = model.ucount;
            //5.发生次数
            let td5 = document.createElement('td');
            td5.innerHTML = model.blockCount;
            //5.创建卡顿状态
            let td6 = document.createElement('td');
            td6.innerHTML = "未修复";
            //6.创建卡顿备注信息
            let td7 = document.createElement('td');
            //列表中添加子元素
            tr.appendChild(td1);
            tr.appendChild(td2);
            tr.appendChild(td3);
            tr.appendChild(td4);
            tr.appendChild(td5);
            tr.appendChild(td6);
            tr.appendChild(td7);
        }
        let div_table = document.createElement('div');
        div_table.setAttribute('style', "padding: 100px;");
        div_table.appendChild(table);
        return div_table;
    }

    //将bugly列表元素转换成Model数据
    let transformBuglyElementsToModel = function(elements) {
        var blocks = [];
        for(var i = 0; i < elements.length; i++) {
            let uls = elements[i].children;
            //1.影响用户数量
            let devices = uls[1].innerHTML;
            //2.发生次数
            let times = uls[2].innerHTML;
            //3.最近上报时间
            let recentHappenTime = uls[3].textContent;

            let blockInfos = uls[4].children;
            //4.卡顿描述信息
            var tmpNode = document.createElement("div");
            var descANode = blockInfos[0].cloneNode(true);
            descANode.style.color = "#42A5F5";
            descANode.innerHTML = descANode.textContent;
            tmpNode.appendChild(descANode);
            tmpNode.appendChild(blockInfos[1].cloneNode(true));
            let blockDescs = tmpNode.innerHTML;
            //5.卡顿的id
            let blockId = blockInfos[0].children[0].children[1];
            console.log(blockInfos[0].children[0].children[0]);
            //6.卡顿标签信息
            let blockLabels = blockInfos[2].children;
            var tags = blockLabels[0].textContent;
            if(blockLabels.length >= 3) {
                tags += "<br />";
            }
            for(var j = 1; j <= blockLabels.length - 2; j++) {
                tags += blockLabels[j].textContent + ",";
            }

            blocks.push({
                id: blockId,
                descHTML: blockDescs,
                tags: tags,
                lastHappen: recentHappenTime,
                blockCount: times,
                ucount: devices,
            });
        }
        return blocks;
    }

    ///----------------------日志导出管理器入口------------------------------
    // 延迟执行，否则找不到对应的按钮
    let sleep = function (time) {
        return new Promise((resolve) => setTimeout(resolve, time));
    };

    //延迟执行代码
    sleep(500).then(() => {
        let host = window.location.host;
        if(host == "bugly.qq.com") {
            buglyAddExportEntrance();
        }else if(host == "report.tingyun.com"){
            tingyunAddExportEntrance();
        }
    })
})();





define([
    '/js/api.js'
], function(api) {
    return {
        install: function(Vue, options) {
            Vue.prototype.$util = function() {
                // 定义当前请求cancel token，定义当前正在请求序列
                var cancel, promiseArr = {} 
                var CancelToken = axios.CancelToken
                // 是否正在post
                var posting = false;

                // 请求队列
                var requestQueue = [];

                // 并发post token
                var requestParams;
    
                // 请求拦截
                axios.interceptors.request.use(function(config) {
                    // 发起请求之前，取消正在进行的相同请求
                    if(promiseArr[config.url]&&promiseArr[config.url].count&&promiseArr[config.url].cancel) {
                        promiseArr[config.url]['cancel']('操作取消')
                        promiseArr[config.url]['count'] = +promiseArr[config.url]['count'] + 1
                    } else {
                        if (promiseArr[config.url] != undefined) {
                            promiseArr[config.url]['count'] = +promiseArr[config.url]['count'] + 1
                        }
                    }
                    return config
                }, function(error) {
                    return Promise.reject(error)
                })
    
                // 响应异常处理
                axios.interceptors.response.use(function(response) {
                    return new Promise(function(resolve) {
                        resolve(response.data)
                    })
                }, function(error) {
                    if(error && error.response) {
                        var errorInfo = {
                            400: '错误请求',
                            401: '未授权，请重新登录',
                            403: '拒绝访问',
                            404: '请求错误，未找到资源',
                            405: '请求方法未允许',
                            408: '请求超时',
                            500: '服务器端出错',
                            501: '网络未实现',
                            502: '网络错误',
                            503: '服务不可用',
                            504: '网络超时',
                            505: 'http版本不支持该请求'
                        }
                        error.message = errorInfo[error.response.status] || '其他错误'+error.response.status
                    } else {
                        error.message = '连接到服务器失败'
                    }
                    var errorData = {
                        ERRORSTATUS: error&&error.response ? error.response.status : 'failed',
                        message: error.message
                    }
                    return Promise.resolve(errorData)
                })
    
                //设置默认请求头
                axios.defaults.headers['X-Requested-With'] = 'XMLHttpRequest'
                axios.defaults.headers['Accept'] = 'application/json, text/javascript, */*; q=0.01'
                axios.defaults.headers['Content-Type'] = 'application/json; charset=utf-8'
    
                // 设置默认超时时间
                axios.defaults.timeout = 90000

                function getApi(url) {
                    var str = api[url];
                    return str ? (/^\//.test(str) ? str : '/api/'+str) : url
                }

                // 处理请求队列
                function handlerQueue() {
                    if(requestQueue && requestQueue.length > 0) {
                        var queueItem = requestQueue.shift();
                        queueItem.handler().then(function(res) {
                            queueItem.resolve(res);
                        })
                    }
                }

                // get请求
                var $get = function(url, message, param, stateName, timeout) {
                    if(posting) {
                        return new Promise(function(resolve) {
                            requestQueue.push({
                                type: 'get',
                                handler: function() {
                                    return $get(url, message, param, stateName, timeout);
                                },
                                resolve: resolve
                            });
                        })
                    }
                    if(message) {
                        Vue.$loading.show(message)
                    }
                    // 根据是否为调试环境确认请求url
                    var getUrl = api.DEBUG ? '/mock/'+(stateName||url)+'.json' : getApi(url)
                    return new Promise(function(resolve, reject) {
                        axios({
                            method: 'get',
                            async: false, // 同步
                            url: getUrl,
                            params: param,
                            timeout: timeout || 90000,
                            headers: {
                                _ResponseFormat: 'JSON'
                            },
                            cancelToken: new CancelToken(function(_) {
                                if(promiseArr[getUrl]) {
                                    promiseArr[getUrl]['cancel'] = _
                                } else {
                                    promiseArr[getUrl] = {cancel: _}
                                }
                            })
                        }).then(function(res) {
                            if(message) {
                                Vue.$loading.hide()
                            }
                            resolve(res);
                            handlerQueue();
                        })
                    })
                }
    
                // post请求
                var $post = function(url, data, loadingInfo, contentType, timeout, refreshToken) {
                    if(posting) {
                        return new Promise(function(resolve) {
                            requestQueue.push({
                                type: 'post',
                                handler: function() {
                                    return $post(url, data, loadingInfo, contentType, timeout, true)
                                },
                                resolve: resolve
                            });
                        })
                    }
                    posting = true;
                    if(loadingInfo.text) {
                        Vue.$loading.show(loadingInfo)
                    }
                    if(api.DEBUG) {
                        // 如果是本地调试环境，直接返回用户提交数据
                        return new Promise(function(resolve) {
                            if(loadingInfo.text) {
                                setTimeout(function() {
                                    Vue.$loading.hide()
                                    posting = false;
                                    resolve(data.data)
                                }, 1000)
                            }else{
                                posting = false;
                                resolve(data.data)
                            }
                        })
                    }
                    var postUrl = getApi(url)
                    return new Promise(function(resolve, reject) {
                        var postData = data;
                        if (refreshToken) {
                            postData.csrf = requestParams;
                        }
                        axios({
                            method: 'post',
                            async: false,
                            url: postUrl,
                            data: data,
                            timeout: timeout || 90000,
                            headers: {
                                '_ResponseFormat': 'JSON',
                                'Content-Type': contentType || 'application/json; charset=utf-8'
                            },
                            cancelToken: new CancelToken(function(_) {
                                if(promiseArr[postUrl]) {
                                    promiseArr[postUrl]['cancel'] = _
                                } else {
                                    promiseArr[postUrl] = {cancel: _}
                                }
                            })
                        }).then(function(res) {
                            posting = false;
                            if(loadingInfo.text) {
                                setTimeout(function(){
                                Vue.$loading.hide()
                                },1000)
                            }
                            if (res) {
                                requestParams = {csrf_param: res.csrf_param, csrf_token: res.csrf_token}
                            }
                            resolve(res);
                            handlerQueue();
                        })
                    })
                }

                // 多并发请求
                var $all = function(urlArr, message) {
                    if(message) {
                        Vue.$loading.show(message)
                    }
                    var getArr = []
                    urlArr.forEach(function(name) {
                        getArr.push(
                           $get(name)
                        )
                    });
                    return axios.all(getArr).then(
                        axios.spread(function() {
                            var allObj = {}
                            var allArgs = arguments
                            urlArr.forEach(function(ele, index) {
                                allObj[ele] = allArgs[index]
                            })
                            return allObj
                        })
                    )
                }

                // 上传文件
                var $upload = function(url, data, message, debugData) {
                    if(posting) return Promise.resolve();
                    if(message) {
                        Vue.$loading.show(message)
                    }
                    posting = true;
                    if(debugData) {
                        // 如果是本地调试环境，直接返回用户提交数据
                        return new Promise(function(resolve) {
                            if(message) {
                                setTimeout(function() {
                                    Vue.$loading.hide()
                                    posting = false;
                                    resolve(debugData)
                                }, 1000)
                            }else{
                                posting = false;
                                resolve(debugData)
                            }
                        })
                    }
                    var postUrl = getApi(url)
                    return new Promise(function(resolve, reject) {
                        axios({
                            method: 'post',
                            async: false,
                            url: postUrl,
                            timeout: 600000,
                            headers: {
                                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
                                'Content-Type': 'multipart/form-data'
                            },
                            data: data,
                            cancelToken: new CancelToken(function(_) {
                                if(promiseArr[postUrl]) {
                                    promiseArr[postUrl]['cancel'] = _
                                } else {
                                    promiseArr[postUrl] = {cancel: _}
                                }
                            })
                        }).then(function(res) {
                            posting = false;
                            if(message) {
                                Vue.$loading.hide()
                            }
                            resolve(res)
                        })
                    })
                }

                // 数据验证函数 Begin
                // 复制对象
                function cloneObj(obj) {
                    return JSON.parse(JSON.stringify(obj))
                }
                // 剔除所有空格
                function trimAll(str) {
                    return str.replace(/\s/g, '')
                }
                // 剔除前后空格
                function trim(str) {
                    return str.replace(/^\s+|\s+$/g, '')
                }
                // 最小边界
                function minLength(str, length) {
                    return length <= (str + '').length ? true : false
                }
                // 最大边界
                function maxLength(str, length) {
                    return str.length <= length ? true : false
                }
                // 长度范围判断
                function lengthArea(str, area) {
                    return minLength(str, area[0]) && maxLength(str, area[1])
                }
                // 数字范围
                function numArea(num, area) {
                    var val = Number(num);
                    if(isNaN(val)) {
                        return false
                    }
                    return val >= area[0] && val <= area[1]
                }
                // 带宽验证
                function inputWidth(num, area){
                    var val = Number(num);
                    if(isNaN(val)) {
                        return false
                    }
                    return (val >= area[0] && val <= area[1]) || val == 0 || val == ''
                }
                // 密码字符串验证
                function validatorPsw(str) {
                    return /^[a-zA-Z0-9!@#$%^&*()_+-={}\[\]\|\\:;"'?\/.,<>~`·\s]+$/.test(str)
                }
                // mac地址验证
                function isMac(str) {
                    if(str == '00-00-00-00-00-00' || str == '00:00:00:00:00:00' || str == '000000000000') {
                        return false
                    }
                    if(/[^0-9a-fA-F\-:]/.test(str)) {
                        return false
                    }else if(/[02468aceACE]/.test(str[1])&&/^(\w{12}|\w{2}:\w{2}:\w{2}:\w{2}:\w{2}:\w{2}|\w{2}-\w{2}-\w{2}-\w{2}-\w{2}-\w{2})$/.test(str)) {
                        return true
                    }else{
                        return false
                    }  
                }
                //mac地址转换 2255446655 -> 22:55:44:66:55
                function maccutStr(str){
                    return str && (str.toString().replace(/(\S)(?=(\S{2})+\b)/g, function($0, $1) {
                        return $1 + ":";
                    }));
                }
                //DNS格式校验
                function isValidDnsAddress(value){
                    if ( value == '0.0.0.0' || value == '255.255.255.255' || value == '' )
                    {
                        return false;
                    }
                    var dnsParts = value.split('.');
                    if ( dnsParts.length != 4 )
                    {
                        return false;
                    }
                    for (var i = 0; i < 4; i++) {
                        if(isNaN(dnsParts[i])){
                            return false;
                        }
                        if (dnsParts[i] == "" || (dnsParts[i].charAt(0) == '0' && dnsParts[i].length > 1))
                        {
                            return false;
                        }
                        if(dnsParts[i].length < 0 || dnsParts[i].length > 3 || dnsParts[i].charAt(0) == ' ' || dnsParts[i].charAt(1) == ' ' || dnsParts[i].charAt(2) == ' ')
                        {
                            return false;
                        }
                        var num = parseInt(dnsParts[i],10);
                        if (num < 0 || num > 255)
                        {
                            return false;
                        }
                    }
                    return true;
                }
                //IP地址校验
                function isValidIpAddress(addr) {
                    if ( addr == '0.0.0.0' || addr == '127.0.0.1'|| addr == '255.255.255.255' || addr == '' )
                    {
                        return false;
                    }
                    for(var i=0;i<addr.length;i++){
                        if(addr.charAt(i) == " ")
                        {
                            return false;
                        }
                    }
                    var addrParts = addr.split('.');
                    if ( addrParts.length != 4 )
                    {
                        return false;
                    }
                    for (var i = 0; i < 4; i++) {
                        if(isNaN(addrParts[i])){
                            return false;
                        }
                        if (addrParts[i] == "" || (addrParts[i].charAt(0) == '0' && addrParts[i].length > 1))
                        {
                            return false;
                        }
                        var num = parseInt(addrParts[i],10);
                        if ((i == 0 && num == 0) || ((i == 0) && (num > 254)) || ((i == 1 || i == 2 || i == 3) && (num > 255)) )
                        {
                            return false;
                        }
                    }
                    return true;
                }
                //判断是否是整型
                function isInteger(value){
                    if (/^(\+|-)?\d+$/.test(value)){
                        return true;
                    }
                    return false;
                }
                function getLeftMostZeroBitPos(num){
                    var leftArr = [128, 64, 32, 16, 8, 4, 2, 1];
                    for (var i = 0; i < leftArr.length; i++){
                        if ((num & leftArr[i]) == 0){
                            return i;
                        }
                    }
                    return leftArr.length;
                }
                function getRightMostOneBitPos(num) {
                    var rightArr = [1, 2, 4, 8, 16, 32, 64, 128];
                    for (var i = 0; i < rightArr.length; i++){
                        if (((num & rightArr[i]) >> i) == 1){
                            return (rightArr.length - i - 1);
                        }
                    }
                    return -1;
                }
                //子网掩码校验
                function isValidSubnetMask(mask) {
                    var zeroExisted = false;
                    if (mask == "" || mask == '0.0.0.0' || mask == '255.255.255.255')
                        return false;
                    var maskArray = mask.split('.');
                    if (maskArray.length != 4){
                        return false;
                    }
                    for(var i = 0; i < 4; i++) {
                        if( isNaN(maskArray[i]) == true || maskArray[i] == ""
                            || maskArray[i].charAt(0) == '+' ||  maskArray[i].charAt(0) == '-'
                            || (maskArray[i].charAt(0) == '0' && maskArray[i].length > 1)){
                                return false;
                            }
                        if(!isInteger(maskArray[i]) || maskArray[i] < 0){
                            return false;
                        }
                        var numpart = parseInt(maskArray[i],10);
                        if(numpart < 0 || numpart > 255){
                            return false;
                        }
                        if(zeroExisted == true && numpart != 0){
                            return false;
                        }
                        var zeroPos = getLeftMostZeroBitPos(numpart);
                        var onePos = getRightMostOneBitPos(numpart);
                        if (zeroPos < onePos){
                            return false;
                        }
                        if (zeroPos < 8){
                            zeroExisted = true;
                        }
                    }
                    return true;
                }
                function IpAddress2DecNum(addr){
                    var addrArray = addr.split('.');
                    var num = 0;
                    for (i = 0; i < 4; i++)
                    {
                        num += parseInt(addrArray[i],10) * Math.pow(256, 3 - i);
                    }
                    return num;
                }
                //默认网关校验
                function isGatewayAbcIpAddress(ipaddr, netmask, addr) {
                    if (!isValidIpAddress(addr)){
                        return false;
                    }
                    var addrArray = addr.split('.');
                    var num = parseInt(addrArray[0],10);
                    if (num < 1 || num >= 224 || num == 127)
                    {
                        return false;
                    }

                    var mask = IpAddress2DecNum(netmask);
                    var addr = IpAddress2DecNum(addr);
                    var ipaddr = IpAddress2DecNum(ipaddr);
                    if ((ipaddr&mask) == (addr&mask))
                    {
                        var maskArray = netmask.split('.');
                        maskArray[0] = 255 - maskArray[0];
                        maskArray[1] = 255 - maskArray[1];
                        maskArray[2] = 255 - maskArray[2];
                        maskArray[3] = 255 - maskArray[3];
                        var maskR = IpAddress2DecNum(maskArray.join('.'));
                        var ipCheck = maskR & addr;
                        if (ipCheck == 0 || ipCheck == maskR)
                        {
                            return false;
                        }
                    }
                    return true;
                }
                function isBroadcastIp(ipAddr, subMask){
                    var maskLen = 0;
                    var IpTemp = ipAddr.split('.');
                    var MaskTemp = subMask.split('.');
                    if((parseInt(IpTemp[0],10) > 223) || ( 127 == parseInt(IpTemp[0],10)))
                    {
                        return true;
                    }
                    for(maskLen = 0; maskLen < 4; maskLen++)
                    {
                        if(parseInt(MaskTemp[maskLen],10) < 255){
                            break;
                        }
                    }
                    var Num0Temp = parseInt(IpTemp[maskLen],10);
                    var Num1Temp = 255 - parseInt(MaskTemp[maskLen],10);
                    var Num2Temp = Num0Temp & Num1Temp;
                    if((Num2Temp != 0) && (Num2Temp != Num1Temp))
                    {
                        return false;
                    }
                    if(maskLen == 3)/* subnet mask last not is 255: 255.255.255.xxx */
                    {
                        return true;
                    }
                    else if(maskLen == 2)/* 255.255.xxx.xxx */
                    {
                        if(((IpTemp[3] == 0)&&(Num2Temp == 0))||
                            ((IpTemp[3] == 255)&&(Num2Temp == Num1Temp)))
                        {
                            return true;
                        }
                    }
                    else if(maskLen == 1)/* 255.xxx.xxx.xxx */
                    {
                        if(((Num2Temp == 0)&&(IpTemp[3] == 0)&&(IpTemp[2] == 0)) ||
                            ((Num2Temp == Num1Temp)&&(IpTemp[3] == 255)&&(IpTemp[2] == 255)))
                        {
                            return true;
                        }
                    }
                    else if(maskLen == 0)/* xxx.xxx.xxx.xxx */
                    {
                        if(((Num2Temp == 0)&&(IpTemp[3] == 0)&&(IpTemp[2] == 0)&&(IpTemp[1] == 0)) ||
                            ((Num2Temp == Num1Temp)&&(IpTemp[3] == 255)&&(IpTemp[2] == 255) &&(IpTemp[1] == 255)))
                        {
                            return true;
                        }
                    }
                    return false;
                }
                function isNotBroadcastIp(addr,subnet){
                    return !isBroadcastIp(addr,subnet)
                }
                //ip地址和子网掩码比较校验
                function isHostIpWithSubnetMask(addr, subnet){
                    if ( !isValidIpAddress(addr) || !isValidSubnetMask(subnet) || isBroadcastIp(addr,subnet) )
                    {
                        return false;
                    }
                    var addr = IpAddress2DecNum(addr);
                    var mask = IpAddress2DecNum(subnet);
                    if (0 == (addr & (~mask)))
                    {
                        return false;
                    }
                    return true;
                }
                //wanip 掩码和lan ip地址比较校验
                function checkWanipconflictLan(wanip, wanmask, lanipinterfaces){
                    var wanip_num = IpAddress2DecNum(wanip);
                    var wanmask_num = IpAddress2DecNum(wanmask);

                    for(var i=0; i < lanipinterfaces.length; i++){
                        var lanipinterfaceitem = lanipinterfaces[i];

                        var lanipaddress = lanipinterfaceitem["IPInterfaceIPAddress"];
                        var lanipmask = lanipinterfaceitem["IPInterfaceSubnetMask"];

                        if(("" != lanipaddress) && ("" != lanipmask)){
                            var lanipaddress_num = IpAddress2DecNum(lanipaddress);
                            var lanipmask_num = IpAddress2DecNum(lanipmask);

                            if ((0 != lanipaddress) && (0 != lanipmask)){
                                if ((wanip_num & wanmask_num & lanipmask_num) == (lanipaddress_num & wanmask_num & lanipmask_num)){
                                    return false;
                                }
                            }
                        }
                    }
                    return true;
                }
                function checkWanipconflictLanList(wanip,datalist){
                    if(datalist[0] == "" || !isValidSubnetMask(datalist[0])){
                        return true
                    }else{
                        return checkWanipconflictLan(wanip,datalist[0],datalist[1])
                    }
                }
                function checkPppPwdValue(ppp_password){
                    var max_ppp_password_length = 64;
                    if(ppp_password.length > max_ppp_password_length){
                        return true;
                    }
                    return false;
                }
                // 数据验证函数 End

                // 时间转换
                var utilGetTimeArray = function (timeVal) {
                    var timeArray = [];
                    var tmpVal;
                    tmpVal = parseInt(timeVal / (60*60*24),10);
                    timeArray.push(parseInt(tmpVal,10));
                    timeVal %= 60*60*24;
                    tmpVal =parseInt(timeVal / (60*60),10);
                    timeArray.push(parseInt(tmpVal,10));
                    timeVal %= 60*60;
                    tmpVal = parseInt(timeVal / (60),10);
                    timeArray.push(parseInt(tmpVal,10));
                    return timeArray;
                }
                // 日期转化
                function dateFormat(date, fmt) {
                    var o = {
                        "M+": date.getMonth() + 1, 
                        "d+": date.getDate(), 
                        "h+": date.getHours(), 
                        "m+": date.getMinutes(), 
                        "s+": date.getSeconds(), 
                        "q+": Math.floor((date.getMonth() + 3) / 3), 
                        "S": date.getMilliseconds() 
                    };
                    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));
                    for (var k in o)
                        if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
                    return fmt;
                }
                // 获取当前时间 CurrentLocalTime
                function getCurrentTime(CurrentLocalTime) {
                    var strs = CurrentLocalTime.split("T");
                    var date_strs = strs[0].split('-');
                    var time_strs = strs[1].split(':');
                    return new Date(date_strs[0], date_strs[1]-1, date_strs[2], time_strs[0], time_strs[1], time_strs[2])
                }

                // 检验字符长度或者UTF8字符长度
                var strLength = function(str, length){
                    if(str.length > length || utf8_strlen(str) > length){
                        return false
                    }
                    return true
                }
                // 检验字符串格式
                function strType (str){
                    var w=/^[\x20-\x7e]*$/;
                    var u=/.*[\x20-\x7e]$/;
                    if(!(w.test(str) && u.test(str))){
                        return false
                    }
                    return true
                }

                // 校验wifi密码是否符合
                function wifiPwdMeet(password){
                    if( /.*[^\x20-\x7e]+.*$/.exec(password)){
                        return false
                    }
                    return true
                }

                //校验第二次输入密码是否正确
                function comparePwd(newpwd,conpwd){
                    if(newpwd != conpwd){
                        return false
                    }
                    return true
                }

                // 计算UTF8字符串占用字节数(传入的字符串必须是UTF8编码)
                var utf8_strlen = function (str) {
                    var iLength = 0;
                    for (var j = 0; j < str.length; j = j + i) {
                        for (var i = 1; i < 4; i++) {
                            try {
                                var value = encodeURIComponent(str.substr(j, i));
                                var num = value.match(/%/g);
                                iLength = iLength + (num ? num.length : value.length);
                                break;
                            } catch (err) {
                                console.log("encodeURIComponent err", err);
                            }
                        }
                    }
                    return iLength;
                }
                var utf8_strsub = function (str, length){
                    var iLength = 0;
                    var strLength = 0;
                    for (var j = 0; j < str.length; j = j + i) {
                        for (var i = 1; i < 4; i++) {
                            try {
                                var value = encodeURIComponent(str.substr(j, i));
                                var num = value.match(/%/g);
                                iLength = iLength + (num ? num.length : value.length);
                                break;
                            } catch (err) {
                                console.log("encodeURIComponent err", err);
                            }
                        }
                        if (iLength > length) {
                            break;
                        } else {
                            strLength += i;
                        }
                    }
                    return str.substr(0, strLength);
                }

                    //TODO: 重复函数
                    function isValidDNS(value){
                    if ( value == '0.0.0.0' || value == '255.255.255.255' || value == '' )
                    {
                        return false;
                    }
                    var dnsParts = value.split('.');
                    if ( dnsParts.length != 4 )
                    {
                        return false;
                    }
                    for (var i = 0; i < 4; i++) {
                        if(isNaN(dnsParts[i])){
                            return false;
                        }
                        if (dnsParts[i] == "" || (dnsParts[i].charAt(0) == '0' && dnsParts[i].length > 1))
                        {
                            return false;
                        }
                        if(dnsParts[i].length < 0 || dnsParts[i].length > 3 || dnsParts[i].charAt(0) == ' ' || dnsParts[i].charAt(1) == ' ' || dnsParts[i].charAt(2) == ' ')
                        {
                            return false;
                        }
                        var num = parseInt(dnsParts[i],10);
                        if (num < 0 || num > 255)
                        {
                            return false;
                        }
                    }
                    return true;
                }
                //IP地址校验
                function isValidBaseIP(addr, baseIp) {
                    var index = baseIp.lastIndexOf('.') + 1;
                    var str = baseIp.substring(0, index);
                    return Boolean(addr.indexOf(str))
                }
                function isValidIP(addr) {
                    if ( addr == '0.0.0.0' || addr == '127.0.0.1'|| addr == '255.255.255.255' || addr == '' )
                    {
                        return false;
                    }
                    for(var i=0;i<addr.length;i++){
                        if(addr.charAt(i) == " ")
                        {
                            return false;
                        }
                    }
                    var addrParts = addr.split('.');
                    if ( addrParts.length != 4 )
                    {
                        return false;
                    }
                    for (var i = 0; i < 4; i++) {
                        if(isNaN(addrParts[i])){
                            return false;
                        }
                        if (addrParts[i] == "" || (addrParts[i].charAt(0) == '0' && addrParts[i].length > 1))
                        {
                            return false;
                        }
                        var num = parseInt(addrParts[i],10);
                        if ((i == 0 && num == 0) || ((i == 0) && (num > 254)) || ((i == 1 || i == 2 || i == 3) && (num > 255)) )
                        {
                            return false;
                        }
                    }
                    return true;
                }
		//子网掩码校验
                function checkMask(mask){ 
                    obj=mask; 
                    var exp=/^(254|252|248|240|224|192|128|0)\.0\.0\.0|255\.(254|252|248|240|224|192|128|0)\.0\.0|255\.255\.(254|252|248|240|224|192|128|0)\.0|255\.255\.255\.(254|252|248|240|224|192|128|0)$/; 
                    var reg = obj.match(exp); 
                    if(reg==null){ 
                        return false; //"非法"
                    }else { 
                        return true; //"合法"
                    } 
                }
                //网关校验
                function checkGateWay (gateway){
                    var reg = /^192.\.168(\.(\d|([1-9]\d)|(1\d{2})|(2[0-4]\d)|(25[0-5]))){2}&#36;/;
                    return reg.test(gateway)
                }
                // 数据验证函数 End
                //TODO 重复函数 End
                // 产品适配
                function getDeviceMessage (data, flag) {
                    if(isSupportMultiBoard) {
                        if (flag) {
                            var targetDeviceName = data['CustInfo'].CustDeviceName;
                        } else {
                            var targetDeviceName = data['custinfo'].CustDeviceName;
                        }
                        var deviceinfoShow = null ;
                        if(typeof targetDeviceName != 'undefined'){
                            if(data.SmartDevInfo.prodId == 'K100'||data.SmartDevInfo.prodId == 'K102'||data.SmartDevInfo.prodId == 'K11B'){
                                deviceinfoShow = MultiVerBoard['WS7100-20-white']
                            }else if(data.SmartDevInfo.prodId == 'K101'||data.SmartDevInfo.prodId == 'K103'){
                                deviceinfoShow = MultiVerBoard['WS7100-20-dark']
                            }else if(data.SmartDevInfo.prodId == 'K104'||data.SmartDevInfo.prodId == 'K11A'){
                                deviceinfoShow = MultiVerBoard['WS7200-20-white']
                            }else if(data.SmartDevInfo.prodId == 'K105'){
                                deviceinfoShow = MultiVerBoard['WS7200-20-dark']
                            }else if(data.SmartDevInfo.prodId == 'K10G'){
                                deviceinfoShow = MultiVerBoard['WS7200-10-white']
                            }else if(data.SmartDevInfo.prodId == 'K10H' || data.SmartDevInfo.prodId == 'K10Z'){
                                deviceinfoShow = MultiVerBoard['WS7200-10-dark']
                            }else{
                                deviceinfoShow = MultiVerBoard[targetDeviceName]
                            }
                        }
                        deviceinfoShow = deviceinfoShow || MultiVerBoard["default"];
                        return deviceinfoShow
                    } else {
                        return {
                            product_title_guide:'欢迎使用'+"华为路由AX3",
                            productTitle:"华为路由AX3",
                            productName: "华为路由AX3",
                            logoClass: 'ic-logo',
                            icUncableClass:"ic_uncable_router",
                            icHttpstatusfailedClass:"ic_router_httpfailed",
                            icGuideLearningClass:"learn_router",
                            icGuide2LearningClass:"ic_learn_router",
                            Learnoldethdownsecond:"learn_success_ethup",
                            icRouterHiClass:"ic_router_hi",
                            icShowdoublewanClass:"show_doublewan",
                            icShowsinglewanClass:"show_singlewan",
                            contentDeviceClass:"ic_content_router",
                            IcTopoSelfClass:'ic_ws835_small_normal_topo',
                            iptvnetportPath:'../res/iptv_netport.png',
                            icPortRateClass:"port_rate01",
                            leadLogoClass:"ic_lead_logo"
                        }
                    }
                }
                function setTitle(data) {
                    var msg = getDeviceMessage(data);
                    document.getElementsByTagName('title')[0].innerHTML = msg.productTitle
                }
                // 产品图片适配 End
                function getDAesString(encrypted,key,iv){
                    var key  = CryptoJS.enc.Hex.parse(key);
                    var iv   = CryptoJS.enc.Hex.parse(iv);
                    var decrypted = CryptoJS.AES.decrypt(encrypted,key, {
                        iv:iv,
                        mode:CryptoJS.mode.CBC,
                        padding:CryptoJS.pad.Pkcs7
                    });
                    return decrypted.toString(CryptoJS.enc.Latin1);
                }

                function  _utf8_encode(string) {
                    string = string.replace(/\r\n/g,"\n");
                    var utftext = "";
                    for (var n = 0; n < string.length; n++) {
                        var c = string.charCodeAt(n);
                        if (c < 128) {
                            utftext += String.fromCharCode(c);
                        }
                        else if((c > 127) && (c < 2048)) {
                            utftext += String.fromCharCode((c >> 6) | 192);
                            utftext += String.fromCharCode((c & 63) | 128);
                        }
                        else {
                            utftext += String.fromCharCode((c >> 12) | 224);
                            utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                            utftext += String.fromCharCode((c & 63) | 128);
                        }
                    }
                    return utftext;
                }

                function base64_encode (input) {
                    _keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
                    var output = "";
                    var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
                    var i = 0;
                    input = _utf8_encode(input);
                    while (i < input.length) {
                        chr1 = input.charCodeAt(i++);
                        chr2 = input.charCodeAt(i++);
                        chr3 = input.charCodeAt(i++);
                        enc1 = chr1 >> 2;
                        enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
                        enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
                        enc4 = chr3 & 63;
                        if (isNaN(chr2)) {
                            enc3 = enc4 = 64;
                        } else if (isNaN(chr3)) {
                            enc4 = 64;
                        }
                        output = output +
                        this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) +
                        this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);
                    }
                    return output;
                }

                // 用户名、密码加密
                var enc = function(encstring, rsakey) {
                    var rsan = rsakey[0] + "" ;
                    var rsae = rsakey[1] + "";
                    var rsa = new RSAKey();
                    rsa.setPublic(rsan, rsae);
                    var arr = base64_encode(encstring);
                    var num = arr.length / 214;
                    var restotal = '';
                    for (i = 0; i < num; i++)
                    {
                    var encdata = arr.substr(i * 214, 214);
                    var res = rsa.encryptOAEP(encdata);
                    if(res.length != rsan.length)
                    {
                        i--;
                        continue;
                    }
                    restotal += res;
                    }
                    return restotal;
                }
                /*获取时区 start*/
                function DisplayDstDates()
                {
                    var year = new Date().getYear();
                    var firstSwitch = 0;
                    var secondSwitch = 0;
                    var lastOffset = 99; 
                    if (year < 1000){
                        year += 1900; 
                    }
                    for (i = 0; i < 12; i++)
                    {        
                        var newDate = new Date(Date.UTC(year, i, 0, 0, 0, 0, 0));
                        var tz = -1 * newDate.getTimezoneOffset() / 60; 
                        if (tz > lastOffset){           
                            firstSwitch = i-1;
                        }        
                        else if (tz < lastOffset){            
                            secondSwitch = i-1; 
                        }
                        lastOffset = tz;       
                    }  
                    var DstDate = [FindDstDate(year, firstSwitch),FindDstDate(year, secondSwitch)]; 
                    return DstDate;
                } 
                function FindDstDate(year, month)
                {
                    var baseDate = new Date(Date.UTC(year, month, 0, 0, 0, 0, 0));
                    var changeDay = 0;
                    var changeMinute = -1;
                    var baseOffset = -1 * baseDate.getTimezoneOffset() / 60;

                    for (day = 0; day < 50; day++)
                    {
                        var tmpDate = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
                        var tmpOffset = -1 * tmpDate.getTimezoneOffset() / 60; 

                        if (tmpOffset != baseOffset)
                        {
                            var minutes = 0;
                            changeDay = day; 
                            tmpDate = new Date(Date.UTC(year, month, day-1, 0, 0, 0, 0));
                            tmpOffset = -1 * tmpDate.getTimezoneOffset() / 60; 
                            while (changeMinute == -1)
                            {
                                tmpDate = new Date(Date.UTC(year, month, day-1, 0, minutes, 0, 0));
                                tmpOffset = -1 * tmpDate.getTimezoneOffset() / 60; 

                                if (tmpOffset != baseOffset)
                                {
                                    tmpOffset = new Date(Date.UTC(year, month,
                                    day-1, 0, minutes-1, 0, 0));
                                    changeMinute = minutes;
                                    break;
                                }else{
                                    minutes++;
                                }
                            } 
                            var dstYear = year;
                            var dstMonth = tmpOffset.getMonth() + 1 ; 
                            var dstDay = tmpOffset.getDate();   

                            tmpDate = new Date(Date.UTC(year, month,day-1, 0, minutes-1, 0, 0));

                            var dstTime = tmpDate.toTimeString().split(' ')[0];
                            var dstHour = parseInt(dstTime.split(':')[0]);
                            var dstMin = dstTime.split(':')[1];

                            return parseInt(Date.UTC(dstYear,dstMonth,dstDay,dstHour,dstMin));
                        }
                    }
                    return 0;
                }
                function SysTimeZoneOffset(){
                    var offset;
                    var index;
                    var timezone;
                    var minute;
                    var today = new Date();
                    var localYear = today.getFullYear();
                    var localMonth = today.getMonth() + 1;
                    var localDay = today.getDate();
                    var localHour = today.getHours();
                    var localMin = today.getMinutes(); 
                    var sysDst = DisplayDstDates();
                    var sysDstStart = sysDst[0];
                    var sysDstEnd = sysDst[1];
                    var localTime = parseInt(Date.UTC(localYear,localMonth,localDay,localHour,localMin));
                    var minute_str = "00";
                    
                    offset = today.getTimezoneOffset();
                    minute = offset % 60;  
                    if(minute != 0){
                        minute_str =  Math.abs(minute);
                    }
                    offset /= 60;
                    if(offset >= 0){
                        offset = parseInt(offset);
                        if(sysDstStart != 0){
                            if(sysDstStart > sysDstEnd){
                                if(localTime > sysDstStart || localTime < sysDstEnd){
                                    var offset_time = offset + 1;
                                    if(offset_time >= 10){
                                        timezone = '-' + offset_time + ":" + minute_str;
                                    }else{
                                        timezone = '-0' + offset_time + ":" + minute_str;
                                    }
                                }else{
                                    if(offset >= 10){
                                        timezone = '-' + offset + ":" + minute_str;
                                    }else{
                                        timezone = '-0' + offset + ":" + minute_str;
                                    }
                                }
                            }else if(sysDstStart < sysDstEnd){
                                if(localTime > sysDstStart && localTime < sysDstEnd){
                                    var offset_time = offset + 1;
                                    if(offset_time >= 10){
                                        timezone = '-' + offset_time + ":" + minute_str;
                                    }else{
                                        timezone = '-0' + offset_time + ":" + minute_str;
                                    } 
                                }else{
                                    if(offset >= 10){
                                        timezone = '-' + offset + ":" + minute_str;
                                    }else{
                                        timezone = '-0' + offset + ":" + minute_str;
                                    }
                                }
                            }
                        }else{
                            if(offset >= 10){
                                timezone = '-' + offset + ":" + minute_str;
                            }else{
                                timezone = '-0' + offset + ":" + minute_str;
                            }
                        }
                    }else{
                        offset = parseInt(offset);
                        offset = Math.abs(offset);
                        if(sysDstStart != 0){
                            if(sysDstStart > sysDstEnd){
                                if(localTime > sysDstStart || localTime < sysDstEnd){
                                    var offset_time = offset - 1;
                                    if(offset_time >= 10){
                                        timezone = '+' + offset_time + ":" + minute_str;
                                    }else{
                                        timezone = '+0' + offset_time + ":" + minute_str;
                                    }
                                }else{
                                    if(offset >= 10){
                                        timezone = '+' + offset + ":" + minute_str;
                                    }else{
                                        timezone = '+0' + offset + ":" + minute_str;
                                    }
                                }
                            }else if(sysDstStart < sysDstEnd){
                                if(localTime > sysDstStart && localTime < sysDstEnd){
                                    var offset_time = offset - 1;
                                    if(offset_time >= 10){
                                        timezone = '+' + offset_time + ":" + minute_str;
                                    }else{
                                        timezone = '+0' + offset_time + ":" + minute_str;
                                    } 
                                }else{
                                    if(offset >= 10){
                                        timezone = '+' + offset + ":" + minute_str;
                                    }else{
                                        timezone = '+0' + offset + ":" + minute_str;
                                    }
                                }
                            }
                        }else{
                            if(offset >= 10){
                                timezone = '+' + offset + ":" + minute_str;
                            }else{
                                timezone = '+0' + offset + ":" + minute_str;
                            }
                        }
                    } 
                    return timezone;
                }
                /*获取时区 end*/

                // 全局页面心跳
                function heartbeat (){
                    clearInterval(window.heartTimer)
                    window.heartTimer = setInterval(function(){
                        $get('heartbeat').then(function(res){
                            if(posting) return;
                            if(res && res.ERRORSTATUS == 404){
                                window.location.href = "/";
                            }
                        })
                    },5000)
                }

                // 向导页面心跳
                function guideheartbeat (){
                    var self = this
                    window.guideheartTimer = setInterval(function(){
                        $get('guideheartbeat').then(function(res){
                            if(posting) return;
                            if(res == undefined || res.interval != 5000){
                                window.location.href = "/";
                            }
                        })
                    },5000)
                }
		
		        function utf8_hasComplexChar(str){
                    var iLength = 0;
                    var i = 0;
                    var hasComplexChar = false;
                    for (i = 0; i < str.length; i++) {
                        var value = str.charCodeAt(i);
                        if (value >= 0x080) {
                            hasComplexChar = true;
                            break;
                        }
                    }
                    return hasComplexChar;
                }

                //判断输入IP是否在网关维护地址段
                function checkIPinLanRange(lanip,inputip){
                    var laniparray = lanip.split(".");
                    var inputiparray = inputip.split(".");
                    if(lanip == inputip){
                        return false;
                    }
                    else if(inputiparray.length < 4){
                        return false;
                    }
                    else if((laniparray[0] != inputiparray[0]) || (laniparray[1] != inputiparray[1]) || (laniparray[2] != inputiparray[2])){
                        return false;
                    }
                    else if(inputiparray[3] == "0" || inputiparray[3] == "255"){
                        return false;
                    }
                    return true;
                }

                //判断地址是否在符合规范的ip地址段
                function ipaddr2num(ipaddr){
                    var d = ipaddr.split('.');
                    return ((((((+d[0])*256)+(+d[1]))*256)+(+d[2]))*256)+(+d[3]);
                }

                //判断是否是有效的局域网IP地址
                function isAbcIpAddress(addr){
                    if (!isValidIpAddress(addr)){
                        return false;
                    }
                    var addrArray = addr.split('.');
                    var num = parseInt(addrArray[0],10);
                    if (num < 1 || num >= 224 || num == 127)
                    {
                        return false;
                    }
                    num = parseInt(addrArray[3],10);
                    if (num == 255 || num == 0)
                    {
                        return false;
                    }
                    return true;
                }

                //获取设备名称、mac地址、IP地址
                function friendlyName(item){
                    var hwtype = false
                    var result = item.ActualName;
                    var identify = item["DevBrands"].toUpperCase();
                    if (item['hwtypeoptionnew'] == true && identify == "HUAWEI")
                    {
                        hwtype = true
                    }
                    if ('' === result) {
                        result = item['HostName'] === "" ? item["MACAddress"].replace(/:/g, "-") : (hwtype ? item['HostName']+' '+item['VendorClassID'] : item['HostName']);
                    }
                    return result.toString();
                }

                function FriendlyNameForShort(item){
                    var result = friendlyName(item);
                    if(result.length > 25) {
                        result = '‭' + result.substr(0,20)+'...‭';
                    }
                    return result;
                }

                function ReSetValues(HostInfo, moreitems, newValue){
                    var idx = 0;
                    var macList = [];
                    if(HostInfo && typeof HostInfo != "undefined"){
                        if(moreitems == "lan"){
                            var content = {};
                            content.name = newValue;
                            content.value = "";
                            content.ip = "";
                            macList[idx++] = content;
                        }
                        for(var i=0; i<HostInfo.length; i++){
                            if((HostInfo[i].VendorClassID.indexOf("PLCAP") == -1 && HostInfo[i].VendorClassID.indexOf("router") == -1 && moreitems != 'lan') || (moreitems == 'lan' && HostInfo[i].IsGuest != true)){
                                var content = {};
                                content.name = friendlyName(HostInfo[i]);
                                content.value = HostInfo[i]["MACAddress"];;
                                content.ip = HostInfo[i]["IPAddress"];
                                macList[idx] = content;
                                idx = idx + 1;
                            }
                        }
                    }
                    if(moreitems == 'lan'){
                        return macList;
                    }
                    var isinhost = false;
                    if(typeof moreitems != "undefined"){
                        for(var i=0;i<moreitems.length;i++){
                            for(var j=0;j<HostInfo.length;j++){
                                if(moreitems[i]["MACAddress"] == HostInfo[j]["MACAddress"]){
                                    isinhost = true;
                                }
                            }
                            if(!isinhost){
                                var content = {};
                                content.name = moreitems[i]['HostName'];
                                content.value = moreitems[i]["MACAddress"];;
                                content.ip = moreitems[i]["IPAddress"];
                                macList[idx] = content;
                                idx = idx + 1;
                            }
                            isinhost = false;
                        }
                    }
                    return macList;
                }
                function isMobile() {
                    var useragent = navigator.userAgent||navigator.vendor|| window.opera;
                    return /mobile|android|ucbrowser|ucweb|tiantian|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od|ad)|iris|kindle|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(useragent)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(useragent.substr(0,4));
                }
                return {
                    $get: $get,
                    $post: $post,
                    $all: $all,
                    $upload: $upload,
                    DEBUG: api.DEBUG,
                    cloneObj: cloneObj,
                    trimAll: trimAll,
                    trim: trim,
                    minLength: minLength,
                    maxLength: maxLength,
                    lengthArea: lengthArea,
                    numArea: numArea,
                    inputWidth:inputWidth,
                    validatorPsw: validatorPsw,
                    isMac: isMac,
                    maccutStr:maccutStr,
                    isValidSubnetMask:isValidSubnetMask,
                    isGatewayAbcIpAddress:isGatewayAbcIpAddress,
                    isHostIpWithSubnetMask:isHostIpWithSubnetMask,
                    checkWanipconflictLan:checkWanipconflictLan,
                    checkWanipconflictLanList:checkWanipconflictLanList,
                    isValidDnsAddress:isValidDnsAddress,
                    isValidIpAddress:isValidIpAddress,
                    isInteger:isInteger,
                    utilGetTimeArray:utilGetTimeArray,
                    checkPppPwdValue:checkPppPwdValue,
                    dateFormat:dateFormat,
                    getCurrentTime:getCurrentTime,
                    getDAesString: getDAesString,
                    enc:enc,
                    utf8_strlen:utf8_strlen,
                    utf8_strsub:utf8_strsub,
                    strLength:strLength,
                    strType:strType,
                    wifiPwdMeet:wifiPwdMeet,
                    comparePwd:comparePwd,
                    isValidDNS:isValidDNS,
                    isValidIP:isValidIP,
                    isValidBaseIP:isValidBaseIP,
                    checkMask:checkMask,
                    checkGateWay:checkGateWay,
                    getDeviceMessage:getDeviceMessage,
                    setTitle:setTitle,
                    SysTimeZoneOffset:SysTimeZoneOffset,
                    heartbeat:heartbeat,
                    guideheartbeat:guideheartbeat,
                    utf8_hasComplexChar:utf8_hasComplexChar,
                    checkIPinLanRange:checkIPinLanRange,
                    ipaddr2num:ipaddr2num,
                    isAbcIpAddress:isAbcIpAddress,
                    friendlyName:friendlyName,
                    FriendlyNameForShort:FriendlyNameForShort,
                    ReSetValues:ReSetValues,
                    isNotBroadcastIp:isNotBroadcastIp,
                    isMobile:isMobile,
                }
            }()
    
            Vue.mixin({
                created: function() {
                    this.$util = Vue.prototype.$util
                    this.$get = this.$util.$get
                    this.$post = this.$util.$post
                    this.$all = this.$util.$all
                }
            })
        }
    }
});

define('login/lang',[
        '/lang/'+g_userLang+'/login_res.js'
	], function(lang) {
	    var message = {messages:{}}
	    message.messages[g_userLang]=lang
		return message
	}),define('login/loginleadapp',[
    'login/lang',
    '/components/input/input.js',
    '/components/selectbox/selectbox.js',
    '/components/leadPage/leadPage.js'
    ], function(i18n,input,selectbox,leadPage) {
    return {
        name: 'loginleadapp',
        components:{
            pswInput:input,
            selectbox:selectbox,
            leadPage:leadPage
        },
        template: '\
	    <div id="loginleadapp">\
	        <div id="loginlead_top" class="clearboth">\
	            <img src="/res/leadApp.png" height="660px" class="lead_App" onclick="return false"/>\
	            <div class="loginlead_title">\
	                <div :class="deviceMessage.leadLogoClass" class="fl appLogo"></div>\
	                <div class="lead_productname fl paddingleft_15 marginleft_130 border_1px_left">{{deviceMessage.productTitle}}</div>\
	                <div class="mobileOrPc fr marginright_20" v-if="$util.isMobile() && !isRepeater" @click="toMobile">{{$t(\'footer.touchUI\')}}</div>\
	            </div>\
	            <div align="center">\
	                <div class="lead_title text_center" v-html="productTitle"></div>\
	                <div class="lead_tip text_center">{{$t("lead.app.tip")}}</div>\
	                <div class="login_lead_QR" style=""></div>\
	                <div class="download">{{$t("lead.app.download")}}</div>\
		                <psw-input :textAlign="\'left\'" :id="\'userpassword\'" @keyup.native.enter="loginpost" :placeHolder="$t(\'index.leadapp.placeholder\')" \
	                :width="330" :height="40" :type="1" :initValue.sync="routerPassword" class="login_leadapp" style="margin-top:30px;"></psw-input>\
	                <div id="loginbtn" class="enter marginleft_290 login_leader_border" @click="loginpost()"></div>\
	                <div class="login_info">\
	                    <div class="fl" v-if="elinkorXlinkLogin&&useraccount[0].LoginWifiSsidSame">{{$t("index.login.samewithwifissid")}}</div>\
	                    <div style="text-decoration:underline;cursor: pointer;" id="forgetpwd_page_link" class="fr" @click="lead_showForgetps(true)">{{$t("index.forgetps")}}</div>\
	                </div>\
	                <div class="leadPwd_err" v-if="isPswFault">\
	                    <div class="ic_sign"></div>\
	                    <div class="err_word text_left_right paddingleft_5 left_27">{{ misMessage }}</div>\
	                </div>\
	                <div class="forgetps_box" v-if="isLeadForgetpsShow">\
	                    <div class="forgetps_content">\
	                        <div :class="[\'forgetps_img\', Lead_QrcodeRenew]"></div>\
	                        <div class="message_1 text_left_right">{{ $t("index.forgetps.guide") }}</div>\
	                        <div class="message_2 text_left_right">{{ $t("index.forgetps.warning") }}</div>\
	                        <div class="knowbtn common_button_long" @click="lead_showForgetps(false)">{{ $t("index.forgetps.known") }}</div>\
	                    </div>\
	                </div>\
	            </div>\
	        </div>\
	        <lead-page></lead-page>\
	        <div align="center" style="margin: 40px auto;">\
	            <div class="login_lead_QR"></div>\
	            <div style="font-size:18px;color:#333333;margin-top:10px;">{{$t("lead.app.download")}}</div>\
	        </div>\
	    </div>\
		',
        props:{
            isPswFault:false,
            routerPassword:'',
            misMessage:'',
        },
        data: function(){
            return {
                isLeadForgetpsShow:false,
                isArLang: g_reserveLang,
            }
        },
        i18n: i18n,
        computed:{
            deviceinfoData:function() {
                return this.$store.state.Api.deviceinfo
            },
            deviceMessage:function(){
                return this.deviceinfoData ? (this.$util.getDeviceMessage(this.deviceinfoData)||'') : ''
            },
            productTitle:function(){
                return this.$t("lead.title",[this.deviceMessage.productTitle])
            },
            useraccount:function(){
                return this.$store.state.Api.useraccount
            },
            elinkorXlinkLogin:function() {
                return this.$store.state.Api.deviceinfo.modcap.support_elink == 1 || this.$store.state.Api.deviceinfo.modcap.support_xlink_sn == 1
            },
            Lead_QrcodeRenew: function() {
                if(this.deviceMessage && isSupportMultiBoard){
                    return this.deviceMessage.qrcodeRenew;
                }else {
                    return 'qrcode_ic'
                }
            },
            isRepeater:function(){
                return this.$store.getters.isRepeater
            }
        },
        methods: {
            // 展示 忘记密码 内容
            lead_showForgetps:function(flag){
                this.isLeadForgetpsShow = flag
            },
            loginpost:function(){
                    this.$emit('postPsw',this.routerPassword);
            },
            toMobile: function() {
                window.location.href = "/small/html/index.html";
            }
        }
    }
})
,define(['login/lang',
        '/components/input/input.js',
        '/components/selectbox/selectbox.js',
        'login/loginleadapp'], function(i18n, input, selectbox, loginleadapp) {
    return {
        name: 'login',
        template: '\
	<div>\
	    <div class="login" v-if="!isShowLeadAppPage">\
	        <div class="userlogin" v-if="isLoadingFinish">\
	            <div class="login_container">\
	                <div class="login_box">\
	                    <div class="login_opre pull-left">\
                            <div id="logininfo" class="loginTip paddingleft_5">{{ loginTip }}</div>\
	                        <psw-input :textAlign="\'left\'" :id="\'userpassword\'" @keyup.native.enter="postPsw()" :width="316" :type="1" :initValue.sync="routerPassword" style="background:transparent"></psw-input>\
	                        <div class="forgetps text_right" id="forgetpwd_page_link">\
	                            <span @click="showForgetps(true)">{{ $t("index.forgetps") }}</span>\
	                        </div>\
	                        <div class="psw_mis" v-if="isPswFault">\
	                            <div class="ic_sign mis_word">{{ misMessage }}</div>\
	                        </div>\
	                        <div id="loginbtn" class="loginbtn common_button_long" @click="postPsw()">{{ $t("index.login") }}</div>\
	                    </div>\
	                    <div class="hismart_box pull-left paddingleft_10">\
                                <div v-if="show_andlinkv2">\
                                    <div class="hilink_img_custom" >\
                                        <img :src="getCustomImg(\'QR\')"/></div>\
                                    <div class="hilink_scan_custom" v-html="getLangStr(\'index.magic\')"></div>\
                                </div>\
                                <div v-else>\
                                    <div class="hilink_img"  @click="gohilink"></div>\
                                    <div class="hilink_scan"  @click="gohilink">{{ $t("index.magic") }}</div>\
                                </div>\
	                    </div>\
	                    <div class="forgetps_box" v-if="isForgetpsShow">\
	                        <div class="forgetps_content">\
	                            <div :class="[\'forgetps_img\', QrcodeRenew]"></div>\
	                            <div class="message_1 text_left_right">{{ $t("index.forgetps.guide") }}</div>\
	                            <div class="message_2 text_left_right">{{ $t("index.forgetps.warning") }}</div>\
	                            <div class="knowbtn common_button_long" @click="showForgetps(false)">{{ $t("index.forgetps.known") }}</div>\
	                        </div>\
	                    </div>\
	                </div>\
	            </div>\
	        </div>\
	    </div>\
	    <div v-else>\
	        <div v-if="isLoadingFinish">\
	            <login-lead-app @postPsw="postPsw" :isPswFault="isPswFault" :misMessage="misMessage" :routerPassword="routerPassword" ></login-lead-app>\
	        </div>\
	    </div>\
	</div>\
		',
        components:{
            pswInput:input,
            selectbox:selectbox,
            loginLeadApp:loginleadapp
        },
        data: function(){
            return {
                isLoadingFinish:false,
                isForgetpsShow:false,
                isPswFault:false,
                routerPassword:'',
                activeUser:'',
                isLoginClick:false,
                loginSuccess:false,
                misMessage:'',
                popWinlist:{},
                isArLang: g_reserveLang
            }
        },
        i18n: i18n,
        created: function(){
            if(window.heartTimer){
                clearInterval(window.heartTimer)
            }
            this.$store.state.Data.login.isLogin = false
            var getUrlList = ['deviceinfo', 'wlanmode', 'useraccount', 'guide']
            var self = this;
            this.$store
                .dispatch("multiGets", getUrlList)
                .then(function(res) {
                    self.isLoadingFinish = true
                    setTimeout(function(){
                        document.getElementById('userpassword_ctrl').focus()
                    },100)
            });
        },
        computed:{
            isCustom: function() {
                return this.$store.getters.isCustom
            },
            show_andlinkv2:function() {
                return this.$store.state.Api.deviceinfo.modcap.support_andlink_v2 == 0 ? false : true;
            },
            elinkorXlinkLogin:function() {
                return this.$store.state.Api.deviceinfo.modcap.support_elink == 1 || this.$store.state.Api.deviceinfo.modcap.support_xlink_sn == 1
            },
            deviceinfo:function(){
                return this.$store.state.Api.deviceinfo
            },
            wlanmode:function(){
                return this.$store.state.Api.wlanmode
            },
            useraccount:function(){
                return this.$store.state.Api.useraccount
            },
            guide:function(){
                return this.$store.state.Api.guide
            },
            loginTip:function(){
                if(this.elinkorXlinkLogin && this.useraccount[0].LoginWifiSsidSame){
                    return this.$t('index.login.info')+" "+this.$t('index.login.samewithwifissid')
                }else{
                    return this.$t('index.login.info')
                }
            },
            deviceMessage:function(){
                return this.deviceinfo ? (this.$util.getDeviceMessage(this.deviceinfo)||'') : ''
            },
            QrcodeRenew: function() {
                if(this.deviceMessage && isSupportMultiBoard){
                    return this.deviceMessage.qrcodeRenew;
                }else {
                    return 'qrcode_ic'
                }
            },
            // 登录用户名
            LoginUserName:function(){
                return this.activeUser
            }
        },
        methods: {
            getLangStr: function(id) {
                return this.isCustom ? this.$t(id + '_custom') : this.$t(id)
            },
            getCustomImg: function(id) {
                return '/res/' + (this.isCustom ? (id + '_custom') : id) +'.png'
            },
            // 展示 忘记密码 内容
            showForgetps:function(flag){
                this.isForgetpsShow = flag
            },
            // 点击下载智慧生活app
            gohilink:function(){
                window.open(this.$store.state.Data.Domain.smarthome);
            },
            // 点击登录按钮
            postPsw:function(data){
                var pwd = data
                this.activeUser = 'admin'
                if(typeof pwd != "undefined" && pwd != ''){
                    this.routerPassword = pwd;
                }
                if(this.routerPassword == '' || this.isLoginClick || this.loginSuccess){
                    return
                }
                var self = this
                this.isLoginClick = true
                setTimeout(function(){
                   self.isLoginClick = false
                }, 10000);
                self.$store.dispatch('login', {
                    username: self.LoginUserName,
                    password: self.routerPassword
                }).then(self.successCallback, self.loginFail);
            },
            loginFail: function(res) {
                var self = this;
                var fail_wait_time = res.waitTime;
                var fail_time = 3
                var fail_lock_time = 3 - res.count;
                self.routerPassword = ''
                self.isLoginClick = false
                self.loginSuccess = false
                if(res.ishilink){
                    if(res.errorCategory == 'user_pass_err'){
                        self.misMessage = self.$t('index.' + res.errorCategory,[fail_lock_time]) + ' ' + self.$t('index.login.samewithrepeater')
                    }else if(res.errorCategory){
                        self.misMessage = self.$t('index.' + res.errorCategory,[fail_time,fail_wait_time]) + ' ' + self.$t('index.login.samewithrepeater')
                    }else if(res.errcode == 1){
                        self.misMessage = self.$t('login.notice')
                    }else{
                        self.misMessage = self.$t('index.unknow_err')
                    }
                }else{
                    if(res.errorCategory == 'user_pass_err'){
                        self.misMessage = self.$t('index.' + res.errorCategory,[fail_lock_time])
                    }else if(res.errorCategory){
                        self.misMessage = self.$t('index.' + res.errorCategory,[fail_time,fail_wait_time])
                    }else if(res.errcode == 1){
                        self.misMessage = self.$t('login.notice')
                    }else{
                        self.misMessage = self.$t('index.unknow_err')
                    }
                }
                self.isPswFault = true
            },
            successCallback: function(result) {
                var self = this;
                self.loginSuccess = true;
                self.isLoginClick = false
                self.$store.dispatch('commonGet',{name:'privacypolicy',upgrade:true}).then(function(pravicy){
                    self.$store.state.Data.login.isLogin = true;
                    if(pravicy && (pravicy.IsPrivacyPolicyUpdate == 1 || pravicy.IsEULAUpdate == 1)){
                        self.$router.push({path:'/privacy'})
                        self.$util.heartbeat()
                    }else{
                        self.$router.push({path:'/home'})
                        self.$util.heartbeat()
                    }
                })
            }
        }
    }
})

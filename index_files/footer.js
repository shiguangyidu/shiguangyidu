define([''], function(i18n) {
    return {
          name: 'v-footer',
          template: '\
	    <div id="footer">\
	        <div id="productAbout">\
	            <ul id="introduceField" class="paddingleft_170" style="height:130px;">\
	                <li class="fl text_left_right">\
	                    <h3>{{$t("Download_Apps")}}</h3>\
	                    <p>\
	                        <span>\
                                    <div v-if="show_andlinkv2"><a @click="showApp_custom(\'appRumat\')" v-html="getLangStr(\'Huawei_SmartHome\')"></a></div>\
                                    <div v-else ><a @click="showApp(\'appRumat\')"> {{$t("Huawei_SmartHome")}}</a></div>\
	                        </span>\
	                    </p>\
	                </li>\
	                <li class="fl text_left_right">\
	                    <h3>{{$t("footer_about")}}</h3>\
	                    <p>\
	                        <span>\
	                        <a :href="Domain ? Domain.huaweivmall : \'\'" rel="noopener noreferrer" target="_blank"> {{$t("footer_shop")}}</a>\
	                        </span>\
	                    </p>\
	                    <p>\
	                        <span>\
	                        <a :href="Domain ? Domain.huaweiclub : \'\'" rel="noopener noreferrer" target="_blank"> {{$t("footer_forum")}}</a>\
	                        </span>\
	                    </p>\
	                </li>\
	                <li class="fl text_left_right">\
	                    <h3>{{$t("footer_contact")}}</h3>\
	                    <p>\
	                        <span>\
	                        <a @click="showApp(\'wechat\')"> {{$t("footer_wechat")}}</a>\
	                        </span>\
	                    </p>\
	                </li>\
	                <li class="fl text_left_right">\
	                    <h3>{{$t("Legal_Notices")}}</h3>\
	                    <p>\
	                        <span>\
	                        <a :href=\'privacypath\' rel="noopener noreferrer" target="_blank"> {{$t("Huawei_Privacy_Policy")}}</a>\
	                        </span>\
	                    </p>\
	                    <p>\
	                        <span>\
	                        <a href="/html/copyright.html" rel="noopener noreferrer" target="_blank"> {{$t("Open_Source_Statement")}}</a>\
	                        </span>\
	                    </p>\
	                    <p>\
	                        <span>\
	                        <a :href="protocalpath" rel="noopener noreferrer" target="_blank"> {{$t("End_User_License_Agreement")}}</a>\
	                        </span>\
	                    </p>\
	                    <p>\
	                        <span>\
	                        <a :href="safeinformationpath" rel="noopener noreferrer" target="_blank"> {{$t("footer.safeinformation")}}</a>\
	                        </span>\
	                    </p>\
	                </li>\
	            </ul>\
	            <div id="copyrightHuawei" v-if="deviceinfo">\
	                <p v-if="g_userLevel != 0">{{$t(\'footer.softversion\')}}</p><p id="CRVersionNum" v-if="g_userLevel != 0">{{deviceinfo.SoftwareVersion}} |&nbsp;</p>\
	                <p>{{$t(\'footer.copyright\')}}</p>\
	            </div>\
	        </div>\
	        <div class="footerCover" v-if="footerCoverHide" @click="hideCover">\
	            <div class="whiteBox">\
	                <div class="rumatTitle">\
                        {{$t(poptitle)}}\
	                </div>\
	                <div class="rumatPic">\
                        <a v-if="!iswechat && !iscustomapp" :href="skipAdress" :class="rumatSrc" target="_blank"></a>\
                        <a v-else :class="rumatSrc"></a>\
	                </div>\
	                <div class="slogan">\
                        {{$t(slogan)}}\
	                </div>\
	                <div class="detail">\
	                    {{$t(detail)}}\
	                </div>\
	            </div>\
	        </div>\
	        <div v-if="showLeadAPP && isWelcomOrLogin" style="border-top: 1px solid #ffffff; opacity:0.2; position:relative;top:-17px;">&nbsp;</div>\
	    </div>\
		',
          data: function(){
              return {
                    footerCoverHide:false,
                    poptitle:'',
                    rumatSrc:'',
                    slogan:'',
                    detail:'',
                    skipAdress:'#',
                    iswechat:false,
                    iscustomapp:false,
                    Domain:this.$store.state.Data.Domain
              }
          },
          created:function(){
              var self = this;
              if(!this.$store.state.Data.Domain){
                  this.$get('/js/domain.json').then(function(res) {
                     self.Domain = res;
                     self.$store.state.Data.Domain = res;
                  });
              }
          },
          i18n: i18n,
          mounted: function(){

          },
          computed:{
                guide:function() {
                    return this.$store.state.Api.guide && this.$store.state.Api.guide.guide;
                },
                isCustom: function() {
                    return this.$store.getters.isCustom
                },
                show_andlinkv2:function() {
                    return !this.$store.state.Api.deviceinfo || this.$store.state.Api.deviceinfo.modcap.support_andlink_v2 == 0 ? false : true;
                },
                deviceinfo:function() {
                    if (this.guide) {
                        return this.$store.state.Api.deviceinfo;
                    } else {
                        return this.$store.state.Api.deviceinfo_wizard;
                    }
                },
                showLeadAPP:function(){
                    return this.$store.state.Data.showLeadAPP;
                },
                isWelcomOrLogin:function(){
                    return this.$route && this.$route.name === 'login';
                },
                privacypath:function(){
                    var lang = "en";
                    var curhref = window.location.href;
                    switch(g_userLang){
                        case "ar":
                            lang = "sa";
                            break;
                        case "zh":
                            lang = "cn";
                            break;
                        case "en":
                            lang = "us";
                            break;
                        case "ms":
                            lang = "my";
                            break;
                        default:
                            lang = g_userLang;
                            break;
                    }
                    return "/html/privacypolicy-"+g_userLang.toLowerCase()+"_"+lang.toLowerCase()+".html";
                },
                // 最终用户许可协议链接
                protocalpath:function() {
                    var lang = "en";
                    switch(g_userLang){
                        case "ar":
                            lang = "sa";
                            break;
                        case "zh":
                            lang = "cn";
                            break;
                        case "en":
                            lang = "us";
                            break;
                        case "ms":
                            lang = "my";
                            break;
                        default:
                            lang = g_userLang;
                            break;
                    }
                    return "/html/protocal-"+g_userLang.toLowerCase()+"_"+lang.toLowerCase()+".html";
                },
                safeinformationpath:function(){
                    return this.Domain ? (this.Domain.safeinformation+g_userLang+"/safeinformation.html"):"";
                },
          },
          methods: {
                getLangStr: function(id) {
                    return this.isCustom ? this.$t(id + '_custom') : this.$t(id)
                },
                showCover:function(){
                    this.footerCoverHide = true ;
                },
                hideCover:function(){
                    this.footerCoverHide=false
                },
                showApp_custom:function(name){
                    if(name =='appRumat'){
                        if(this.show_andlinkv2){
                            this.poptitle = 'Huawei_SmartHome_custom';
                            this.rumatSrc = 'smart_qrcode_custom';
                            this.slogan ='index.magic_custom';
                            this.detail = '';
                            this.iscustomapp=true;
                        }
                    }
                    this.showCover();
                },
                showApp:function(name){
                    if(name =='wechat' ){
                        this.poptitle = 'footer.wechat.poptitle';
                        this.skipAdress ='#'
                        this.slogan ='footer.wechat.slogan';
                        this.detail = 'footer.wechat.detail';
                        this.rumatSrc = 'qrcode_wechat';
                        this.iswechat=true;
                    }else if(name =='appRumat'){
                        this.poptitle = 'Huawei_SmartHome';
                        this.skipAdress = this.Domain ? this.Domain.smarthome : '';
                        this.rumatSrc = 'smart_qrcode'
                        this.slogan ='index.magic';
                        this.detail = '';
                    }
                    this.showCover();
                }
          }
    }
});

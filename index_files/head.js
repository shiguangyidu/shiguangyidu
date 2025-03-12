define([
    "/components/selectbox/selectbox.js",
], function(selectBox) {
    return {
        name: 'v-header',
        template: '\
	  <div class="header fluid clearboth" v-if="isLoadFinish">\
		    <div class="container_box clearboth">\
                        <div v-if="show_doublelogo" class="fl doubleLogo marginleft_15">\
                            <div v-if="getRouterTypeName"><img :src="getCustomImg(\'honorlogo\')"/></div>\
                            <div v-else><img :src="getCustomImg(\'huaweilogo\')"/></div>\
                        </div>\
                        <div v-else :class="deviceMessage.logoClass" class="fl commonLogo marginleft_15"></div>\
		      <div class="productname fl paddingleft_15 marginleft_15 border_1px_left text_left_right">{{deviceMessage.productTitle}}</div>\
	        <div class="btn_box fr">\
	          <div id="logout_btn" class="logout fl marginright_20" @click="logout" v-if="!hiddenLogout" >{{ $t("logout") }}</div>\
	          <div :class="[{\'Super_mobileOrPc\':isLvOrSk,\'mobileOrPc\':!isLvOrSk},\'marginright_20\',\'fl\']" v-if="$util.isMobile() && !isRepeater" @click="toMobile">{{$t(\'footer.touchUI\')}}</div>\
	        </div>\
		    </div>\
		  </div>\
		',
        props: {
            hiddenLogout: {
              default: false
            }
        },
        components:{
          selectBox:selectBox,
        },
        data: function(){
            return {
              isLoadFinish:false,
              chooseLangActive:this.$t('index.lang.zh'),
            }
        },
        created: function() {
          var self = this ;
          if (window.location.href.indexOf("welcome") > 0) {
            this.$store.dispatch('multiGets',['deviceinfo_wizard'] ).then(function() {
              self.isLoadFinish = true;
            })
          }else{
            this.$store.dispatch('multiGets',['deviceinfo'] ).then(function() {
              self.isLoadFinish = true;
            })
          }
        },
        mounted: function(){
        },
        computed:{
          deviceinfoData:function() {
            return this.$store.state.Api.deviceinfo
          },
          deviceinfoData_wizard:function() {
            return this.$store.state.Api.deviceinfo_wizard;
          },
          isLvOrSk:function(){
                 return g_userLang == 'lv' || g_userLang == 'sl' || g_userLang ==  'hr' || g_userLang == 'th';
          },
          guide:function() {
            return this.$store.state.Api.guide && this.$store.state.Api.guide.guide
          },
          show_doublelogo:function(){
            if (window.location.href.indexOf("welcome") > 0) {
              return this.$store.state.Api.deviceinfo_wizard.ModCap.support_andlink_v2 == 1 ? true : false
            } else {
              return this.$store.state.Api.deviceinfo.modcap.support_andlink_v2 == 1 ? true : false
            }
          },
          isCustom: function() {
              return this.$store.getters.isCustom
          },
          getRouterTypeName: function() {
            if (window.location.href.indexOf("welcome") > 0) {
              if(this.deviceinfoData_wizard.RouterType.indexOf("honor") >= 0 || this.deviceinfoData_wizard.RouterType.indexOf("prism") >= 0) {
                return true;
              } else if(this.deviceinfoData_wizard.CustInfo && this.deviceinfoData_wizard.CustInfo.CustDeviceBand == 2) {
                return true;
              } else {
                return false;
              }
            } else {
              if (this.deviceinfoData.RouterType.indexOf("honor") >= 0 || this.deviceinfoData.RouterType.indexOf("prism") >= 0) {
                return true;
              } else if (this.deviceinfoData.custinfo && this.deviceinfoData.custinfo.CustDeviceBand == 2) {
                return true;
              } else {
                return false;
              }
            }
          },
          deviceMessage:function(){
          if (window.location.href.indexOf("welcome") > 0){
            return this.deviceinfoData_wizard ? (this.$util.getDeviceMessage(this.deviceinfoData_wizard, true) || '') : '';
          }else{
            return this.deviceinfoData ? (this.$util.getDeviceMessage(this.deviceinfoData) || '') : '';
          }
          },
          isRepeater:function(){
            return this.$store.getters.isRepeater
          }
        },
        methods: {
          getCustomImg: function(id) {
              return '/res/' + (this.isCustom ? (id + '_custom') : id) +'.png'
          },
          logout: function() {
            this.$store.dispatch('commonPost', { name: 'user_logout',writeOnly: true}).then(function(){
                window.location.href = "/";
            })
          },
          toMobile:function(){
              var Logined = this.$store.state.Data.login.isLogin ;
              if(this.guide===false){
                  window.location.href = "/small/html/guide.html";
              }else{
                if(Logined){
                    window.location.href = "/small/html/home.html";
                }else{
                    window.location.href = "/small/html/index.html";
                }
              }
          }
        }
    }
});

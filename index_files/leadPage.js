define([''], function(i18n) {
    return {
        name: 'leadPage',
        template: '\
	    <div id="leadPage" style="width:100%;height:100%;">\
	        <div style="width:1200px;margin:0 auto;">\
	            <div class="leadList">\
	                <div class="fl paddingright_40">\
	                    <div class="PC_network"></div>\
	                </div>\
	                <div class="fl text_left_right">\
	                    <div class="leadPage_title">{{$t("lead.network")}}</div>\
	                    <div class="leadPage_tip">{{$t("lead.network.tip")}}</div>\
	                </div>\
	            </div>\
	            <div class="leadList">\
	                <div class="fl text_left_right paddingright_40">\
	                    <div class="leadPage_title">{{$t("lead.remote")}}</div>\
	                    <div class="leadPage_tip">{{$t("lead.remote.tip")}}</div>\
	                </div>\
	                <div class="fl PC_remote"></div>\
	            </div>\
	            <div class="leadList">\
	                <div class="fl paddingright_40">\
	                    <div class="PC_security"></div>\
	                </div>\
	                <div class="fl text_left_right">\
	                    <div class="leadPage_title">{{$t("lead.security")}}</div>\
	                    <div class="leadPage_tip">{{$t("lead.security.tip")}}</div>\
	                </div>\
	            </div>\
	            <div class="leadList">\
	                <div class="fl text_left_right paddingright_40">\
	                    <div class="leadPage_title">{{$t("lead.service")}}</div>\
	                    <div class="leadPage_tip">{{$t("lead.service.tip")}}</div>\
	                </div>\
	                <div class="fl PC_service"></div>\
	            </div>\
	        </div>\
	    </div>\
		',
        i18n: i18n,
    }
});

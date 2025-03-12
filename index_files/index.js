define([
    '/components/head/head.js',
    '/components/nav/nav.js',
    '/components/footer/footer.js'
], function(head, nav,footer) {
    return {
        name: 'index',
        template: '\
	<div id="index">\
	    <Header v-if="!showLeadAPP || !isloginPage" :hiddenLogout="hiddenLogout"></Header>\
	    <Nav v-if="!$route.meta.isNotShowNav"></Nav>\
	    <router-view></router-view>\
	    <Footer v-if="showLeadAPP && isloginPage" class="loginleadfooter" :class="{isNotLogin:$route.meta.isNotShowNav}"></Footer>\
	    <Footer v-else :class="{isNotLogin:$route.meta.isNotShowNav}"></Footer>\
	</div>\
		',
        components: {
            Header: head,
            Nav: nav,
            Footer: footer
        },
        data: function(){
            return {
                aria2Timer:undefined,
            }
        },
        beforeCreate: function() {
            var localHostInfo = window.localStorage.getItem('HostInfo');
            if(localHostInfo) {
                var hostData = JSON.parse(localHostInfo);
                this.$store.dispatch('changeApi', {'HostInfo': [hostData, true]})
            }
        },
        created:function() {
            var self = this;
            var urls = g_userLevel ? ['deviceinfo','hilink_status'] : ['deviceinfo']
            this.$store.dispatch('multiGets', urls).then(function(res) {
                self.$store.commit('changeMenus');
                clearInterval(window.deviceinfoTimer);
                window.deviceinfoTimer = setInterval(function(){
                    self.$store.dispatch('changeApi', {deviceinfo:{UpTime: self.$store.state.Api.deviceinfo.UpTime+1}})
                }, 1000)
            })
        },
        mounted: function(){
            if(((this.$route.name != 'login' && this.$route.name != 'redirect' && this.$route.name != 'forceupg' &&
                this.$route.name != 'upgredirect') || (this.$route.name == 'redirect' && window.g_userLevel != 0)) &&
                window.heartTimer == undefined){
                this.$util.heartbeat()
            }
        },
        computed: {
            showLeadAPP:function(){
                return this.$store.state.Data.showLeadAPP;
            },
            isloginPage:function(){
                return this.$route.name === 'login'
            },
            hiddenLogout:function(){
                var logout = (this.$route.name == 'forceupg' && window.g_userLevel != 0) ? false : this.$route.meta.hiddenLogout
                return  logout;
            },
            HostInfo: function() {
                return this.$store.state.Api.HostInfo
            }
        },
        watch: {
            HostInfo: {
                handler: function(newVal,oldVal) {
                    if(newVal) {
                        var str = JSON.stringify(newVal);
                        if(!oldVal || str !== JSON.stringify(oldVal)) {
                            window.localStorage.setItem('HostInfo', str)
                        }
                    }
                },
                immediate: true
            }
        }
    }
});

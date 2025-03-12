require.config({
    // TODO: 后面浏览器缓存可以加上urlArgs
    urlArgs: "v="+Math.random(),
    baseUrl: '/lib',
    paths: {
        _router: "/router/router",
        util: '/js/util',   
        store: '/vuex/store',
    }
})
require([
    '_router',
    'util',
    'store',
    '/components/loading/loading.js'
], function(_router, util, store, Loading) {
    Vue.use(VueRouter)
    Vue.use(Loading)
    Vue.use(util)
    //控制台不打印
    if (!window.console || !console.firebug){
        var names = ["log", "debug", "info", "warn", "error", "assert", "dir", "dirxml", "group", "groupEnd", "time", "timeEnd", "count", "trace", "profile", "profileEnd"];
        window.console = {};
        for (var i = 0; i < names.length; ++i)
        window.console[names[i]] = function() {}
    }
    if(!window.Atp) window.Atp = {}
    // TODO: 后续全局函数优化
    window.hextorstr = function(sHex) {
        var s = "";
        for (var i = 0; i < sHex.length - 1; i += 2) {
            s += String.fromCharCode(parseInt(sHex.substr(i, 2), 16));
        }
        return s;
    }
    window.rstrtohex = function(s) {
        var result = "";
        for (var i = 0; i < s.length; i++) {
            result += ("0" + s.charCodeAt(i).toString(16)).slice(-2);
        }
        return result;
    }
    function redirect(to, from, next) {
        // 判断是否走完了向导
        if(to.name !== 'welcome' && (to.name !== 'guidesetup' || to.name === 'guidesetup' && !sessionStorage.getItem('privacyPolicy')) && (!store.state.Api.guide || store.state.Api.guide.guide===false)) {
            next({name: 'welcome'})
        }else if((to.name === 'redirect' || to.name === 'forceupg' || to.name === 'upgredirect') && store.state.Api.guide && store.state.Api.guide.guide!==false) {
            // 如果已经走完了向导 跳转进入重定向
            next()
        }else if((to.name === 'welcome' || to.name === 'guidesetup') && store.state.Api.guide && store.state.Api.guide.guide!==false) {
            // 如果已经走完了向导
            next({name: 'login'})
        }else if(to.name !== 'login' && to.name !== 'redirect' && !store.state.Data.login.isLogin && store.state.Api.guide && store.state.Api.guide.guide!==false) {
            // 判断是否为登录状态
            next({name: 'login'})
        } else {
            if(!from.name&&to.name!='login'&& to.name !== 'welcome' && to.name !== 'guidesetup') {
                store.dispatch('multiGets',  ['wan', 'wlanmode', 'hilink_status', 'location']).then(function(res) {
                    toWhiteRoute(to, from, next)
                })
            } else {
                toWhiteRoute(to, from, next)
            }
        }
    }
    // 白名单判断
    function toWhiteRoute(to, from, next) {
        var url = from.name || 'home'
        if(store.getters.isRepeater && to.meta.repeater || store.getters.isBridge && to.meta.bridge) {
            next({name: url})  
        } else if ((to.name == 'repeater' || to.name == 'wlanintelligent') && store.state.Api.hilink_status && store.state.Api.hilink_status.hilink_status==2) {
            next({name: url}) 
        } else {
            next()
        }
    }
    _router.beforeEach(function(to, from, next) {
        if(typeof store.state.Api.guide === 'undefined' || typeof store.state.Api.guide.guide === 'undefined' || typeof store.state.Data.login.isLogin === 'undefined') {
            //页面刷新
            var guide_url = to.name === 'welcome' ? ['heartbeat', 'guide', 'deviceinfo_wizard'] : ['heartbeat', 'guide', 'deviceinfo'];
            var url = to.name === 'login' ? ['guide'] : guide_url;
            store.dispatch('multiGets', {names: url, upgrade: true}).then(function(res) {
                if(res&&res.heartbeat&&res.heartbeat.interval) {
                    store.state.Data.login.isLogin = true;
                } else {
                    store.state.Data.login.isLogin = false;
                }
                redirect(to, from, next);
            })
        }else{
            redirect(to, from, next);
        }
    })
    var vm = new Vue({
        el: '#app',
        name: 'app',
        router: _router,
        i18n: store.state.i18n,
        store: store,
        mounted: function () {
            var self = this;
            var csrf_obj = this.utilGetCsrf()
            if (csrf_obj) {
                this.$store.commit('changeCsrf', csrf_obj)
            }
            // 兼容ie，a标签路由不刷新的问题
            function checkIE(){
                return '-ms-scroll-limit' in document.documentElement.style && '-ms-ime-align' in document.documentElement.style
            }
            if(checkIE()) {
                window.onhashchange = function() {
                    var currentPath = window.location.hash.slice(1);
                    if (self.$route.path !== currentPath) {
                        self.$router.push(currentPath);
                    }
                }
            }
            this.$get('/js/domain.json').then(function(res) {
                self.$store.state.Data.Domain = res;
            });
        },
        methods: {
            utilGetCsrf: function() {
              var csrf_obj = {};
              var metas = document.getElementsByTagName("meta");
              var m;
              for(m = 0 ; m < metas.length; m++) {
                if (metas[m].getAttribute('name') === 'csrf_param') {
                  csrf_obj.csrf_param = metas[m].getAttribute('content');
                  break;
                }
              }
              for(m = 0 ; m < metas.length; m++){
                if (metas[m].getAttribute('name') === 'csrf_token') {
                  csrf_obj.csrf_token = metas[m].getAttribute('content');
                  break;
                }
              }
              return csrf_obj;
            }
        },
        watch: {
            routePath: {
              handler: function(newVal) {
                this.$store.dispatch('routePathChange', newVal)
              },
              immediate: true
            },
            disableArr: function(newVal, oldVal) {
                if(newVal && newVal.toString() != (oldVal || '').toString()){
                    this.$store.dispatch('changeNavDisable', newVal)
                }
            },
            location:function(newVal, oldVal){
                if(oldVal){
                    this.$store.commit('changeMenus');
                }
            },
            hilinkStatus:function(newVal, oldVal){
                if(oldVal && newVal.hilink_status==2 || oldVal && newVal.hilink_status != oldVal.hilink_status){
                    this.$store.commit('changeMenus');
                }
            },
        },
        computed: {
            routePath: function() {
                return this.$route.path
            },
            disableArr: function() {
                return this.$store.getters.disableArr
            },
            hilinkStatus:function(){
                return this.$store.state.Api.hilink_status
            },
            location:function(){
                return this.$store.state.Api.location
            },
            //是否显示leadapp页面
            showLeadAPP:function(){
                return this.$store.state.Data.showLeadAPP;
            },
        }
    });
})
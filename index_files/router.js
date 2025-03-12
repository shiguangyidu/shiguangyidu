var getRoute = function(componentName) {
    return function(resolve) {
        require([componentName], resolve);
    };
}

define( function() {
    routes = [
        {
          path: '*',
          redirect: '/home'
        },
        {
          path: '/',
          name: 'guide',
          redirect: '/welcome',
          component: getRoute('/pages/guide/guide.js'),
          meta:{
            hiddenLogout: true
          },
          children: [
            {
              path: 'welcome',
              name: 'welcome',
              component: getRoute('/views/welcome/welcome.js'),
              meta:{
                hiddenLogout: true
              }
            },
            {
              path: 'guide',
              name: 'guidesetup',
              component: getRoute('/views/guidesetup/guidesetup.js'),
              meta:{
                hiddenLogout: true
              }
            }
          ]
        },
        {
          path: '/',
          name: 'index',
          redirect: '/home',
          component: getRoute('/pages/index/index.js'),
          children: [
            {
              path: 'devicecontrol',
              name: 'devicecontrol',
              component: getRoute('/views/devices/devices.js'),
              meta: {
                repeater: true,
                bridge: true
              }
            },
            {
              path: 'internet',
              name: 'internet',
              component: getRoute('/views/internet/internet.js'),
              meta: {
                repeater: true
              }
            },
            {
              path: 'wifi',
              name: 'wifi',
              component: getRoute('/views/wifi/wifi.js')
            },
            {
              path: 'login',
              name: 'login',
              component: getRoute('/views/login/login.js'),
              meta:{
                isNotShowNav:true,
                hiddenLogout: true
              }
            },
            {
              path: 'privacy',
              name: 'privacy',
              component: getRoute('/views/privacy/privacy.js'),
              meta: {
                isNotShowNav:true
              }
            },
            {
              path: 'forceupg',
              name: 'forceupg',
              component: getRoute('/views/forceupg/forceupg.js'),
              meta: {
                isNotShowNav:true,
                hiddenLogout: true
              }
            },
            {
              path: 'upgredirect',
              name: 'upgredirect',
              component: getRoute('/views/upgredirect/upgredirect.js'),
              meta: {
                isNotShowNav:true,
                hiddenLogout: true
              }
            },
            {
              path: 'redirect',
              name: 'redirect',
              component: getRoute('/views/redirect/redirect.js'),
              meta: {
                isNotShowNav:true,
                repeater: true,
                hiddenLogout: true
              }
            },
            {
              path: 'more',
              name: 'more',
              component: getRoute('/views/more/more.js'),
              redirect: '/more/deviceinfo',
              children: [
                {
                  path: 'deviceinfo',
                  name: 'deviceinfo',
                  component: getRoute('/views/deviceinfo/deviceinfo.js')
                },
                {
                    path: 'routestatus',
                    name: 'routestatus',
                    component: getRoute('/views/routestatus/routestatus.js')
                },
                {
                  path: 'upgrade',
                  name: 'upgrade',
                  component: getRoute('/views/upgrade/upgrade.js')
                },
                {
                  path: 'lan',
                  name: 'lan',
                  component: getRoute('/views/lan/lan.js'),
                  meta: {
                    repeater: true
                  }
                },
                {
                  path: 'vpn',
                  name: 'vpn',
                  component: getRoute('/views/vpn/vpn.js'),
                  meta: {
                    repeater: true
                  }
                },
                {
                  path: 'timeredial',
                  name: 'timeredial',
                  component: getRoute('/views/timeredial/timeredial.js')
                },
                {
                  path: 'iptv',
                  name: 'iptv',
                  component: getRoute('/views/iptv/iptv.js'),
                  meta: {
                    repeater: true
                  }
                },
                {
                  path: 'upnp',
                  name: 'upnp',
                  component: getRoute('/views/upnp/upnp.js')
                },
                {
                  path: 'wlanintelligent',
                  name: 'wlanintelligent',
                  component: getRoute('/views/wlanintelligent/wlanintelligent.js')
                },
                {
                  path: 'ipv6',
                  name: 'ipv6',
                  component: getRoute('/views/ipv6/ipv6.js'),
                  meta: {
                    repeater: true,
                    bridge: true
                  }
                },
                {
                  path: 'wlanadvance',
                  name: 'wlanadvance',
                  component: getRoute('/views/wlanadvance/wlanadvance.js'),
                  meta: {
                    repeater: true
                  }
                },
                {
                  path: 'wlanaccess',
                  name: 'wlanaccess',
                  component: getRoute('/views/wlanaccess/wlanaccess.js')
                },
                {
                  path: 'wlanguest',
                  name: 'wlanguest',
                  component: getRoute('/views/wlanguest/wlanguest.js'),
                  meta: {
                    repeater: true,
                    bridge: true
                  }
                },
                {
                  path: 'repeater',
                  name: 'repeater',
                  component: getRoute('/views/repeater/repeater.js'),
                },
                {
                  path: 'wlaneco',
                  name: 'wlaneco',
                  component: getRoute('/views/wlaneco/wlaneco.js')
                },
                {
                  path: 'wlantimeaccelerate',
                  name: 'wlantimeaccelerate',
                  component: getRoute('/views/wlantimeaccelerate/wlantimeaccelerate.js')
                },
                {
                  path: 'intelligence',
                  name: 'intelligence',
                  component: getRoute('/views/intelligence/intelligence.js')
                },
                {
                  path: 'ddns',
                  name: 'ddns',
                  component: getRoute('/views/ddns/ddns.js'),
                  meta: {
                    repeater: true
                  }
                },
                {
                  path: 'firewall',
                  name: 'firewall',
                  component: getRoute('/views/firewall/firewall.js'),
                  meta: {
                    repeater: true
                  }
                },
                {
                  path: 'nat',
                  name: 'nat',
                  component: getRoute('/views/nat/nat.js'),
                  meta: {
                    repeater: true
                  }
                },
                {
                  path: 'dmz',
                  name: 'dmz',
                  component: getRoute('/views/dmz/dmz.js'),
                  meta: {
                    repeater: true
                  }
                },
                {
                  path: 'macfilter',
                  name: 'macfilter',
                  component: getRoute('/views/macfilter/macfilter.js'),
                  meta: {
                    repeater: true
                  }
                },
                {
                  path: 'urlsec',
                  name: 'urlsec',
                  component: getRoute('/views/urlsec/urlsec.js'),
                  meta: {
                    repeater: true
                  }
                },
                {
                  path: 'account',
                  name: 'account',
                  component: getRoute('/views/account/account.js'),
                  meta: {
                    repeater: true
                  }
                },
                {
                  path: 'sntp',
                  name: 'sntp',
                  component: getRoute('/views/sntp/sntp.js') 
                },
                {
                  path: 'wansettings',
                  name: 'wansettings',
                  component: getRoute('/views/wansettings/wansettings.js'),
                  meta: {
                    repeater: true
                  }
                },
                {
                  path: 'ntwkportrate',
                  name: 'ntwkportrate',
                  component: getRoute('/views/ntwkportrate/ntwkportrate.js')
                },
                {
                  path: 'reset',
                  name: 'reset',
                  component: getRoute('/views/reset/reset.js')
                },
                {
                  path: 'provcode',
                  name: 'provcode',
                  component: getRoute('/views/provcode/provcode.js')
                },
                {
                  path: 'operatorfuc',
                  name: 'operatorfuc',
                  component: getRoute('/views/operatorfuc/operatorfuc.js')
                },
                {
                  path: 'reboot',
                  name: 'reboot',
                  component: getRoute('/views/reboot/reboot.js'),
                },
                {
                  path: 'diagnose',
                  name: 'diagnose',
                  component: getRoute('/views/diagnose/diagnose.js'),
                  meta: {
                    repeater: true
                  }
                },
                {
                  path: 'mirror',
                  name: 'mirror',
                  component: getRoute('/views/mirror/mirror.js')
                },
                {
                  path: 'smartpush',
                  name: 'smartpush',
                  component: getRoute('/views/smartpush/smartpush.js'),
                },
                {
                  path: 'userbehavior',
                  name: 'userbehavior',
                  component: getRoute('/views/userbehavior/userbehavior.js')
                },
              ]
            },
            {
              path: 'home',
              name: 'home',
              component: getRoute('/views/home/home.js')
            }
          ]
        }]

    var router = new VueRouter({
        // mode: 'history',
        routes: routes
    })

    return router
});


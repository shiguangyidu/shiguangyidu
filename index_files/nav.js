define('nav/navItem',function() {
    return {
        name: 'nav_item',
        props: {
            id: String,
            url: String,
            active: Boolean,
            disable: Boolean
        },
        template: '\
	    <li :id="id" :class="[\'nav_item\',\'fl\', {active:active,disable:disable,press:press}]" @mouseover="changePress(true)" @mouseleave="changePress(false)" @click="changeRoute">\
	        <p class="nav_title">{{ disable ? " " : $t(id) }}</p>\
	        <div :class="[{big_icon:active,small_icon:!active}, itemClass]"></div>\
	    </li>\
		',
        data: function(){
            return {
                press: false  
            }
        },
        computed: {
            backgroundImage: function() {
                var url = this.url
                url = this.active ? 'want'+url : ( this.disable ? url+'_disabled' : this.press ? url+'_press' : url)
                return url
            },
            itemClass: function() {
                var url = this.url;
                return 'want_' + (this.active ? (url + '_big') : (this.disable ? (url + '_disabled') : this.press ? url+'_press' : url))
            }
        },
        methods: {
            changePress: function(flag) {
                if(!this.disable&&!this.active) this.press = flag
            },
            changeRoute: function() {
                if(!this.disable&&!this.active) {
                    this.press = false
                    this.$emit('itemClick', this.id)
                    this.$router.push('/'+this.id)
                }
            }
        }
    }
})
,define(['nav/navItem'], function(navItem) {
    return {
        name: 'v-nav',
        template: '\
	    <div id="nav" class="fluid">\
	        <img class="bg" src="/res/basicbg.jpg">\
	        <div class="container left50 marginleft-380">\
	            <ul class="nav_list" style="min-width: 885px;">\
	                <navItem v-for="(item,index) in arr" :key="item.id" :class="[{marginright_30:index != arr.length-1}]" :id="item.id" :url="item.url" :active="item.active" :disable="item.disable" @itemClick="itemClick"></navItem>\
	            </ul>\
	        </div>\
	    </div>\
		',
        components: {
            navItem: navItem
        },
        computed: {
            arr: function() {
                return this.$store.state.Data.Nav
            },
            currentRouterName: function() {
                return this.$route.name
            }
        },
        methods: {
            itemClick: function(id) {
                this.arr.forEach( function(item) {
                    item.active = item.id == id ? true : false
                })
            }
        }
    }
})

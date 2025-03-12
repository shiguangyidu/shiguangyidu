define('loading/loadingView',function() {
    return {
        name: 'loading',
		template: '\
	<div class="loading" id="loading" v-show="show">\
	    <div class="loading_content absolute_center">\
	        <div class="loading_title paddingleft_15" v-if="title">{{title}}</div>\
	        <div :class="[\'loading_box\', type, \'clearboth\', {loading_cancel: type===\'cancel\'}]">\
	            <div :class="[\'loading_gif\',{marginright_20: type!==\'timer\', right_0:  type!==\'timer\'}]">\
	                <div v-if="type===\'timer\'" class="loading_time">{{time}}</div>\
	            </div>\
	            <div v-for="(item,index) in textArr" :key="index" class="loading_word" :style="{height: type==\'timer\'?\'auto\':\'61px\'}">\
	                <p v-html="item"></p>\
	            </div>\
	        </div>\
	        <div class="loading_button" v-if="buttonStr">\
	            <div class="button button_common_short" @click.stop="cancel">{{buttonStr}}</div>\
	        </div>\
	    </div>\
	</div>\
		',
        props: {
            text: [String, Array],
            type: {             // default、cancel、timer
                type: String,
                default: 'default'
            },
            title: String,
            buttonStr: String,
            cancelFn: Function,
            timeoutFn: Function
        },
        data: function() {
            return {
                show: false,
                time: 0,
                timer: null
            }
        },
        computed: {
            textArr: function(){
                return typeof this.text === 'string' ? [this.text] : this.text
            }
        },
        watch: {
            time: function(newVal, oldVal) {
                if(newVal) {
                    this.setTimer()
                }
            }
        },
        methods: {
            cancel: function() {
                this.show = false;
                this.cancelFn && this.cancelFn();
            },
            setTimer: function() {
                var self = this;
                clearInterval(self.timer)
                if(self.type === 'timer') {
                    self.timer = setInterval(function() {
                        if(self.time <= 0) {
                            clearInterval(self.timer)
                            self.type === 'timer' && (self.show = false);
                            self.timeoutFn && self.timeoutFn()
                        } else {
                            self.time--
                        }
                    }, 1500)
                }
            }
        }
    }
})
,define(['loading/loadingView'], function(loadingComponent) {
	var $vm;
	return {
	    install: function(Vue) {
	        if(!$vm) {
	            var loadingPlugin = Vue.extend(loadingComponent);
	            $vm = new loadingPlugin({
	                el: document.createElement('div')
	            });
	        }
	        $vm.show = false;
	        var loading = {
				show: function(text, type, title, buttonStr, cancelFn) {
					$vm.show = true;
					if(typeof text === 'object') {
						$vm.text = text.text;
						$vm.time = text.time;
						$vm.type = text.type ? text.type : 'default';
						$vm.title = text.title;
						$vm.buttonStr = text.buttonStr;
						$vm.cancelFn = text.cancelFn;
						$vm.timeoutFn = text.timeoutFn
					} else {
						$vm.text = text;
						$vm.type = type ? type : 'default';
						$vm.title = title;
						$vm.buttonStr = buttonStr;
						$vm.cancelFn = cancelFn;
					}
	                document.body.appendChild($vm.$el);
	            },
	            hide: function() {
						$vm.show = false;
						$vm.timeoutFn = undefined;
						$vm.time = 0;
	            }
	        }
	        if(!Vue.$loading) {
	            Vue.$loading = loading;
	        }
	        Vue.mixin({
	            created: function() {
					this.$loading = Vue.$loading;
	            }
	        })
	    }
	}
})
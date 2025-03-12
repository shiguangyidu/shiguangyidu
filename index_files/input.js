/**
 * input框组件
 */
define(function() {
    return {
        name: 'inputs',
        template: '\
	    <div :class="[\'InputComponent\', {\'customWidth\': width}]" :style="{width: width?width+\'px\':\'auto\'}">\
	        <div :class="[\'InputContent\', {\'row\': !width}]">\
	            <div :id="id+\'_labelinfo\'" v-if="!width"><slot></slot></div>\
	            <div class="inputBox" :id="id">\
	                <input :id="id?id+\'_ctrl\':\'\'" :type="inputType" autocomplete="off" @copy="isAllowcopy" @paste="isAllowcopy" @cut="isAllowcopy" class="inputArea paddingleft_14" :readonly="disabled" :unselectable="disabled?\'on\':\'\'" :maxlength="maxlength" :placeHolder="placeHolder" :style="inputStyle" v-model="value" @focus="changeShowEye" @input="judgePsw" @blur=\'judgeError\'>\
	                <div v-if="(type===2&&!(disabled&&!showEye)||type===3&&showEye)" :style="eyeStyle" class="eye left_230">\
	                    <div style="z-index:100" @mousedown.prevent="changeEye" @mouseup="hiddenPassword" @touchstart.prevent="changeEye" @touchend="hiddenPassword" @touchcancel="hiddenPassword"></div>\
	                    <div :class="[\'imgLayer\', {eyeHidden: !this.pwdShow, eyeShow: this.pwdShow}]" style="pointer-events: none;"></div>\
	                </div>\
	                <span class="unit marginleft_5" v-if="unit&&!width">{{unit}}</span>\
	            </div>\
	        </div>\
	        <div class="row InputDesc" v-if="showMaxLenErr">\
	            <div class="marginleft_215">{{$t("pwd.max_length_help",[this.maxlength])}}</div>\
	        </div>\
	        <div class="InputPswStrong" v-if="value!==\'********\'&&pswStrong&&value.length>=stronglength&&valueChange">\
	            <div class="marginleft_215 text_left_right">\
	                <ul class="pswStrongList">\
	                    <li v-for="i in 3" class="marginright_13" :key="i" :style="{backgroundColor: i-1 > score ? \'rgb(209,209,209)\' : \'rgb(\'+scoreColor[score]+\')\'}"></li>\
	                </ul>\
	                <p class="pswStrongDesc">{{$t("pwdstrength")}}{{$t(scoreStr[score])}}</p>\
	            </div>\
	        </div>\
	        <div class="row InputDesc" v-if="desc">\
	            <div class="marginleft_215" v-html="desc"></div>\
	        </div>\
	        <div class="row InputError" v-if="showError&&errorInfo&&errorList||error">\
	            <div :id="id+\'_input_error_info\'" class="ic_sign width_263 marginleft_215" style="white-space:pre-wrap;" v-html="error||errorList[errorInfo]"></div>\
	        </div>\
	    </div>\
		',
        props: {
            id: String,
            type: {          
                type: Number,
                default: 0,                 //0代表文本框，1代表不显示眼睛密码框，2代表始终显示眼睛密码框，3代表input聚焦之后显示眼睛密码框
            },
            unit: String,                   //input框后面的单位，缺省时为没有单位
            width: Number,                  //input框的宽度，缺省时宽度为263px, 只有输入框
            cusWidth: Number,               //自定义输入框宽度，缺省时宽度为263px，左边有标题
            initValue: {                    //初始的value值，缺省时为''
                type: [String, Number],
                default: ''
            },    
            validators: Object,             //是否有验证规则，目前支持的验证规则在lib/util下可以看到
            desc: String,                   //是否有描述语，默认没有
            errorList: Object,              //错误提示语列表，与validators对应
            showEye: {                      //密码框的眼镜是否显示出来
                type: Boolean,
                default: false
            },
            pwdShow: {                      //是否显示密码明文
                type: Boolean,
                default: false
            },
            ssids: Array,                   //ssid列表
            getPsw: Function,               //获取密码的回调函数,会传出两个回调函数getPsw(resolve, reject)
            pswStrong: 0,                   //密码强度，传入开始需要显示密码强度的字符串长度
            placeHolder: String,            //占位符提示语
            height: Number,                 //自定义input框高度
            textAlign: String,              //文字对齐方向
            disabled: {                     //input框禁用
                type: Boolean,
                default: false
            },
            postValidator: {                //直接点击post提交时校验(需要校验的input框数量)
                type: Number,
                default: 0
            },
            errCallback: Function,          //错误信息的回调函数
            error: String                   //用户手动提交错误信息      
        },
        data: function(){
            return {
                value: '',
                errorInfo: undefined,
                getPswStatus: 'open',
                showError: false,
                score: 0,                   //密码强度，0弱，1中，2高
                scoreStr: ['pwdstrength_weak', 'pwdstrength_medium', 'pwdstrength_strong'],
                scoreColor: ['236, 98, 23', '251, 152, 14', '136, 218, 51'],
                clicked:false,
                valueChange:false,
                showMaxLenErr:false,
                pressing: false
            }
        },
        created: function() {

        },
        mounted: function(){
        },
        computed: {
            validatorsArr: function() {
                if(this.validators) {
                    return Object.keys(this.validators)
                } else {
                    return []
                }
            },
            inputType: function() {
                return !this.type || this.pressing && this.pwdShow ? 'text' : 'password'
            },
            inputStyle: function() {
                // TODO: 后面需要根据语言适配
                var align = this.textAlign ? (g_reserveLang ? (this.textAlign=='left' ? 'right' : 'left') : this.textAlign) : (this.width ? 'center' :(g_reserveLang ? 'right' : 'left'));
                var borderStyle = this.disabled ? '1px solid rgba(201,201,201,0.3)' : '1px solid #c9c9c9';
                var paddingRight = this.showEye||this.type==2 ? '35px' : '14px';
                var styleObj = {width: this.width?this.width+'px':(this.cusWidth?this.cusWidth+'px':'263px'), height: this.height?this.height+'px':'37px', textAlign: align, border: borderStyle}
                if(g_reserveLang) {
                    styleObj.paddingLeft = paddingRight
                } else {
                    styleObj.paddingRight = paddingRight
                }
                return styleObj
            },
            eyeStyle: function() {
                if(!this.width) {
                    return false
                }
                var styleObj = {}
                var dir = g_reserveLang ? 'right' : 'left';
                styleObj[dir] = this.width - 33 + 'px';
                return styleObj
            },
            maxlength: function() {
                var length;
                if(this.validators) {
                    if(this.validators.maxLength) {
                        length = this.validators.maxLength
                    }else if(this.validators.lengthArea) {
                        length = this.validators.lengthArea[1]
                    }else if(this.validators.numArea) {
                        length =  (this.validators.numArea[1] + '').length
                    }else{
                        length = 2048
                    }
                } else {
                    length = 2048
                }
                return length
            },
            stronglength: function() {
                return typeof this.pswStrong === 'number' ? this.pswStrong : this.pswStrong[0]
            }
        },
        watch: {
            initValue: {
                handler: function(newVal){
                    this.value = newVal
                },
                immediate: true
            },
            value: function(newVal, oldVal) {
                // 用户暗文下输入，置空处理
                if(this.type!=0 && (oldVal === '********' || oldVal === '********************') && !this.clicked) {
                    this.value = newVal.indexOf("*") >=0 ? newVal.replace(/\*/g,'') : newVal;
                    this.getPswStatus = 'resolved'
                }else if(this.type!=0 && newVal === '********' && this.clicked){
                    this.clicked = false;
                }
                if(typeof this.validators !="undefined" && this.validators.isMac){
                    this.value = newVal.toUpperCase();
                }
                if(this.pswStrong && this.value.length >= this.stronglength) {
                    this.getPswStrong()
                }
                if (this.type !== 0) {
                    if (this.validators && (this.validators.maxLength || this.validators.lengthArea || this.validators.numArea) && (this.value.length === this.maxlength)) {
                        this.showMaxLenErr = true;
                    } else {
                        this.showMaxLenErr = false;
                    }
                }
                this.$emit('update:initValue', this.value)
            },
            postValidator: function(newVal, oldVal) {
                if(newVal&&!oldVal) {
                    this.validatorValue()
                }
            }
        },
        methods: {
            validatorValue: function() {
                this.errorInfo = undefined
                for(var i = 0; i < this.validatorsArr.length; i++) {
                    if(!this.$util[this.validatorsArr[i]](this.value, this.validators[this.validatorsArr[i]])) {
                        this.errorInfo = this.validatorsArr[i];
                        // FIXME: 方案变更，修改errCallback为prop，存在时即调用，方便用户手动调用input校验
                        this.errCallback && this.errCallback(this.errorInfo, this.postValidator);
                        if(this.postValidator) {
                            this.$emit('update:postValidator', 0);
                            this.showError = true
                        }
                        return false
                    }
                }
                if(this.postValidator) {
                    var index = this.postValidator > 0 ? this.postValidator - 1 : 0;
                    this.$emit('update:postValidator', index);
                    if(this.errCallback&&index===0) {
                        this.errCallback(true, index)
                    }
                } 
            },
            changeEye: function() {
                this.pressing = true;
                this.clicked = true;
                document.addEventListener('mouseup', this.hiddenPassword);
                // TODO: 目前采取传入回调函数getPsw的方式，后面可以根据情况优化成Promise方式
                if(this.getPsw&&(this.getPswStatus==='open'||this.value==='********')) {
                    this.getPswStatus = 'pending'
                    var self = this;
                    this.getPsw(function() {
                        self.getPswStatus = 'resolved'
                        if(self.pressing) {
                            self.$emit('update:pwdShow', true)
                        }
                    }, function() {
                        self.getPswStatus='open'
                    })
                    return
                }else if(this.getPswStatus==='pending') {
                    return
                }
                this.$emit('update:pwdShow', true)
            },
            hiddenPassword: function() {
                this.pressing = false;
                this.$emit('update:pwdShow', false);
                document.removeEventListener('mouseup', this.hiddenPassword)
            },
            changeShowEye: function() {
                if(this.disabled) return;
                this.showError = false;
                if(this.error) this.$emit('update:error', '');
                if(this.type !== 3 || this.showEye) return;
                this.value = '';
                this.$emit('update:showEye', true);
            },
            judgePsw: function() {
                this.valueChange = true;
                if(this.value === '********') {
                    this.value = ''
                }
            },
            judgeError: function() {
            },
            getPswStrong: function() {
                var score = 0;
                var len = 8;
                if(this.ssids && this.isWeakToSsids()) {
                    this.score = 0;
                    return
                }
                if(this.value.length < len || typeof this.pswStrong === 'object' && this.pswStrong.indexOf(this.value) !== -1){
                        score = 10;
                }else{
                    if (this.value.match(/[a-z]/)) {
                        score += 25;
                    }
                    if (this.value.match(/[A-Z]/)) {
                        score += 25;
                    }
                    if (this.value.match(/[0-9]/)){
                        score += 25;
                    }
                    if (this.value.match(/\W/)){
                        score += 25;
                    }
                }
                this.score = score <= 35 ? 0 : (score > 60 ? 2 : 1)
            },
            isWeakToSsids: function() {
                if(this.ssids.indexOf(this.value) >= 0) {
                    return true
                }else{
                    var reverseArray = this.ssids.map(function(item) {
                        return item ? (item+'').split('').reverse().join('') : ''
                    })
                    return reverseArray.indexOf(this.value) >= 0
                }
            },
            isAllowcopy:function(e){
                if(this.type !==0){
                    e.preventDefault()
                }
            }
        }
    }
})

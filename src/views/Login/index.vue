<template>
    <div id="login">
        <div class="login-wrap">
            <ul class="menu-tab">
                <li
                    v-for="item in menuTab"
                    :key="item.id"
                    :class="{'current':item.current}"
                    @click="toggleMenu(item)"
                >{{item.txt}}</li>
            </ul>
            <!-- form表单 -->
            <el-form
                :model="ruleForm"
                status-icon
                :rules="rules"
                ref="loginForm"
                class="login-from"
                size="medium"
            >
                <el-form-item prop="username" class="item-from">
                    <label for="username">邮箱</label>
                    <el-input
                        id="username"
                        type="text"
                        v-model="ruleForm.username"
                        autocomplete="off"
                    ></el-input>
                </el-form-item>

                <el-form-item prop="password" class="item-from">
                    <label for="password">密码</label>
                    <el-input
                        id="password"
                        type="password"
                        v-model="ruleForm.password"
                        autocomplete="off"
                        minlength="6"
                        maxlength="20"
                    ></el-input>
                </el-form-item>

                <el-form-item prop="passwords" class="item-from" v-show="model === 'register'">
                    <label for="passwords">重复密码</label>
                    <el-input
                        id="passwords"
                        type="password"
                        v-model="ruleForm.passwords"
                        autocomplete="off"
                        minlength="6"
                        maxlength="20"
                    ></el-input>
                </el-form-item>

                <el-form-item prop="code" class="item-from">
                    <label for="code">验证码</label>
                    <el-row :gutter="11">
                        <el-col :span="15">
                            <el-input id="code" v-model="ruleForm.code" maxlength="6" minlength="6"></el-input>
                        </el-col>
                        <el-col :span="9">
                            <el-button
                                type="success"
                                class="block"
                                @click="getSms()"
                                :disabled="codeBtn.status"
                            >{{codeBtn.txt}}</el-button>
                        </el-col>
                    </el-row>
                </el-form-item>

                <el-form-item>
                    <el-button
                        type="danger"
                        @click="submitForm('loginForm')"
                        class="login-btn block"
                        :disabled="loginBtn"
                    >{{model=='login'?'登录':'注册'}}</el-button>
                </el-form-item>
            </el-form>
        </div>
    </div>
</template>

<script>
import { GetSms, Register, Login } from "@/api/login";
import { stripscript, validateEmail, validatePass, validateVCode } from "@/utils/Validate";
import sha1 from "js-sha1";
export default {
    name: "login",
    /**
     * 页面销毁时
     */
    destroyed() {
        //销毁定时器
        clearInterval(this.timer);
    },
    data() {
        //验证邮箱
        let validateUsername = (rule, value, callback) => {
            if (value === "") {
                callback(new Error("请输入用户名"));
            } else if (validateEmail(value)) {
                callback(new Error("用户名格式有误"));
            } else {
                if (this.ruleForm.checkPass !== "") {
                    this.$refs.loginForm.validateField("checkPass");
                }
                callback(); //返回true
            }
        };
        //验证密码
        let validatePassword = (rule, value, callback) => {
            //过滤后的数值
            this.ruleForm.password = stripscript(value);
            value = this.ruleForm.password;
            if (value === "") {
                callback(new Error("请输入密码"));
            } else if (validatePass(value)) {
                callback(new Error("密码为6-20位的字母和数字"));
            } else {
                callback();
            }
        };
        //验证重复密码
        let validatePasswords = (rule, value, callback) => {
            //如果模块值为login 则直接通过
            if (this.model == "login") callback();
            //过滤后的数值
            this.ruleForm.passwords = stripscript(value);
            value = this.ruleForm.passwords;
            if (value === "") {
                callback(new Error("请再次输入密码"));
            } else if (value != this.ruleForm.password) {
                callback(new Error("重复密码不正确"));
            } else {
                callback();
            }
        };
        //验证验证码
        let validateCode = (rule, value, callback) => {
            if (value === "") {
                return callback(new Error("请输入验证码"));
            } else if (validateVCode(value)) {
                return callback(new Error("验证码格式有误"));
            } else {
                return callback();
            }
        };
        return {
            menuTab: [
                { txt: "登录", current: true, type: "login" },
                { txt: "注册", current: false, type: "register" }
            ],
            //模块值
            model: "login",
            //登录按钮禁用状态
            loginBtn: true,
            //验证码按钮状态
            codeBtn: {
                status: false,
                txt: '获取验证码'
            },
            //倒计时
            timer: null,
            // 表单数据
            ruleForm: {
                username: "",
                password: "",
                passwords: "",
                code: ""
            },
            //表单的验证
            rules: {
                username: [{ validator: validateUsername, trigger: "blur" }],
                password: [{ validator: validatePassword, trigger: "blur" }],
                passwords: [{ validator: validatePasswords, trigger: "blur" }],
                code: [{ validator: validateCode, trigger: "blur" }]
            },
        }
    },
    /**
     * 方法
     */
    methods: {
        //登录和注册按钮点击事件
        toggleMenu(e) {
            this.menuTab.forEach(item => {
                item.current = false;
            });
            e.current = true;
            //模块赋值
            this.model = e.type;
            //重置表单
            this.$refs['loginForm'].resetFields();
            //清除验证码按钮状态
            this.clearCountDown();
        },
        /**
         * 获取验证码
         */
        getSms() {
            //进行提示
            if (this.ruleForm.username == '') {
                this.$message.error('邮箱不能为空！！');
                return false;
            }
            if (validateEmail(this.ruleForm.username)) {
                this.$message.error('邮箱格式有误！！');
                return false;
            }
            //修改获取验证码按钮状态
            this.codeBtn.status = true;
            this.codeBtn.txt = '发送中';

            //请求接口
            let requestData = {
                username: this.ruleForm.username,
                module: this.model
            };
            GetSms(requestData).then(res => {
                //弹消息框
                this.$message({
                    message: res.data.message,
                    type: 'success'
                });
                //启用登录或者注册按钮
                this.loginBtn = false;
                //调定时器 倒计时60S
                this.countDown(60);
                console.log(res.data)
            }).catch(err => {
                //启用登录或者注册按钮
                this.loginBtn = false;
            });
        },
        /**
         * 提交表单
         */
        submitForm(loginForm) {
            this.$refs[loginForm].validate(valid => {
                if (valid) {
                    //表单验证通过时
                    this.model == 'login' ? this.login() : this.register();
                } else {
                    console.log("error submit!!");
                    return false;
                }
            });
        },
        /**
         * 登录
         */
        login() {
            let loginData = {
                username: this.ruleForm.username,
                password: sha1(this.ruleForm.password),
                code: this.ruleForm.code
            };
            //登录接口
            Login(loginData).then(res => {
                //保存token
                this.$store.dispatch('app/save_Info', res.data);
                //页面跳转
                this.$router.push({
                    name: 'Console',
                }, onComplete => { }, onAbort => { })
                console.log('登录成功')
            });
        },
        /**
         * 注册
         */
        register() {
            let requestData = {
                username: this.ruleForm.username,
                password: sha1(this.ruleForm.password),
                code: this.ruleForm.code
            };
            //注册接口
            Register(requestData).then(res => {
                let data = res.data;
                this.$message({
                    message: data.message,
                    type: 'success'
                })
                //模拟注册成功
                this.toggleMenu(menuTab[0]);
                this.clearCountDown();
            }).catch(err => {

            });
        },
        /**
        * 倒计时
        */
        countDown(num) {
            //判断定时器是否存在 存在则先清除
            if (this.timer) clearInterval(this.timer);
            //定时器
            this.timer = setInterval(() => {
                num--;
                if (num === 0) {
                    clearInterval(this.timer);
                    this.codeBtn.status = false;
                    this.codeBtn.txt = '重新发送';
                } else {
                    this.codeBtn.txt = `发送中${num}秒`;
                }
            }, 1000)
        },
        /**
         * 清除倒计时
         */
        clearCountDown() {
            //还原验证码按钮默认状态
            this.codeBtn.status = false;
            this.codeBtn.txt = "获取验证码";
            clearInterval(this.timer);//清除倒计时计时器
        },
    },
};
</script>

<style lang="scss" scoped>
#login {
    min-height: 100vh;
    background-color: #34465f;
}
.login-wrap {
    width: 330px;
    margin: auto;
}
.menu-tab {
    text-align: center;
    li {
        display: inline-block;
        width: 88px;
        line-height: 36px;
        font-size: 14px;
        color: #fff;
        border-radius: 2px;
        cursor: pointer;
    }
    .current {
        background-color: rgba(0, 0, 0, 0.1);
    }
}
.login-from {
    margin-top: 29px;
    label {
        margin-bottom: 3px;
        display: block;
        font-size: 14px;
        color: #fff;
    }
    .item-from {
        margin-bottom: 13px;
    }
    .block {
        display: block;
        width: 100%;
    }
    .login-btn {
        margin-top: 19px;
    }
}
</style>

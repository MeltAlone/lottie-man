# lottie-stand 简介
> 注意：该插件涉及到上传静态资源的功能，将上传至转转的服务器，非转转内网环境将上传失败不可使用！！！


`Lottie Stand`是一个帮助你压缩Lottie动画的替身

当你使用Lottie做动画时往往需要设计师进行动画设计，并通过 `BodyMovin` 插件导出为一个 `Json` 文件

呆毛，这个Json文件往往是比较大的。

我的替身能力就是对 `Json` 中的静态资源进行处理，以达到减小文件尺寸的目的


## 如何使用

1. 安装插件
2. 右键Json文件唤出菜单，执行 `Lottie Stand`
3. 在出现的输入弹层，键入阀值，默认20kb
4. 回车确认
5. 运行完毕，当前目录生成一个新的Json文件`lottie_anim.json`使用它即可

## 原理

BodyMovin 导出的格式大概用两种：
- 一个单独的Json文件，Json中 `Assets` 里的资源都是 `Base64`
- 一个文件夹包含了images文件夹和Json文件，Json中 `Assets` 里都是相对路径，引的images中的资源

处理过程：根据用户输入的阀值（单位kb）遍历Json中 `Assets` 里的静态资源，大于改阀值的资源将会被上传到服务器并将该资源替换为链接，小与该阀值的资源将会被转为 `Base64` 。

## Release Notes

### 0.0.1

add icon

### 0.0.1

everything is just beginning


**Enjoy!**

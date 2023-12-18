# FrameWork

## 培优交互游戏开发框架

CocosCreator: v2.4.11  
开发语言: TypeScript

---

# 工程创建

1. 下载创建脚本 https://git.100tal.com/peiyou_jiaohuyouxi_shuangshi/Tools/blob/master/createProject/createProject.js
   将该脚本放在存放游戏工程的目录下
2. 打开终端，进入脚本所在目录，执行脚本

    `node createProject.js`

3. 根据提示，依次输入工程名、中文游戏名、是否创建远程仓库
4. 去远程仓库填写项目说明：Settings -> General -> General project: Expand -> Project description (optional)

# frame 更新

打开终端，进入工程根目录，执行脚本

    `node updateFrame.js`      (覆盖逻辑，只会对本地frame进行添加和覆盖，不会删除本地frame中多余的文件)

或

    `node updateFrame.js -a`   (使本地frame与远程FrameWork完全一致，本地frame中多余的文件会被删除)

## frame 更新的目录包括

（1）assets/frame

（2）build-templates

（3）preview-templates

（4）updateFrame.js

（5）buildProject.js

（6）package.json

# 打包

1. Cocos Creator插件： https://git.100tal.com/peiyou_jiaohuyouxi_shuangshi/Tools/tree/master/2021%E5%B9%B4%E7%A7%8B%E5%AD%A3%E7%BB%9F%E4%B8%80%E6%A1%86%E6%9E%B6%E6%89%93%E5%8C%85%E5%B7%A5%E5%85%B7/packaging_tools
2. nodejs脚本：（首次使用先安装依赖库  npm install ） node buildProject.js  或  npm run build
3. Python脚本: https://git.100tal.com/peiyou_jiaohuyouxi_shuangshi/autobuild_cocoscreator/tree/master


---

# 项目推荐目录结构

```
.
├── README.md
├── assets
│   ├── components        // 组件库目录
│   │   └── README.md
│   ├── frame            // 框架内容，个人不要改动，会被frame更新
│   │   ├── README.md
│   │   ├── frameRes
│   │   │   ├── audios
│   │   │   ├── images
│   │   │   ├── prefab
│   │   │   │   ├── item
│   │   │   │   └── panel
│   │   │   └── spine
│   │   └── scripts
│   │       ├── Data
│   │       │   ├── MainConstValue.ts
│   │       │   └── MainMsgType.ts
│   │       ├── Http
│   │       │   └── NetWork.ts
│   │       ├── Manager
│   │       │   ├── ListenerManager.ts   // 事件管理
│   │       │   ├── ReportManager.ts     // 数据上报
│   │       │   ├── SoundManager.ts      // 声音管理
│   │       │   └── UIManager.ts         // 界面管理
│   │       ├── SDK
│   │       │   ├── GameMsg.ts
│   │       │   └── T2M.ts
│   │       ├── UI
│   │       │   ├── AdaptiveScreen.ts
│   │       │   ├── BaseFrameUI.ts  // frame下的panel继承此类
│   │       │   ├── BaseUI.ts       // game下的panel继承此类
│   │       │   ├── BindNode.ts     // 便捷获取node节点
│   │       │   ├── GameMain.ts
│   │       │   ├── Item
│   │       │   │   ├── Tip.ts
│   │       │   │   ├── TitleNode.ts
│   │       │   │   └── replayBtn.ts
│   │       │   └── Panel
│   │       │       ├── AffirmTips.ts
│   │       │       ├── BaseGamePanel_23_zcd4_01.ts      // GamePanel的父类
│   │       │       ├── BaseTeacherPanel_23_zcd4_01.ts   // TeacherPanel的父类
│   │       │       ├── ErrorPanel.ts
│   │       │       ├── LoadingUI.ts
│   │       │       ├── OverTips.ts
│   │       │       ├── StarCount_23_zcd4_01.ts
│   │       │       ├── SubmissionPanel.ts
│   │       │       ├── TipUI.ts
│   │       │       └── UploadAndReturnPanel_23_zcd4_01.ts
│   │       └── Utils
│   │           ├── AudioPlayExtension.ts
│   │           ├── BoundingBoxDemo.ts
│   │           ├── BoundingBoxHelp.ts
│   │           ├── HitTest.ts
│   │           ├── MathUtils.ts
│   │           ├── Tools.ts
│   │           └── UIHelp.ts
│   ├── game
│   │   ├── res            // 存放静态资源
│   │   │   ├── audios
│   │   │   ├── font
│   │   │   ├── images
│   │   │   ├── prefab
│   │   │   └── spine
│   │   ├── scene
│   │   │   ├── Student.fire
│   │   │   └── Teacher.fire
│   │   └── scripts
│   │       ├── Data
│   │       │   ├── ConstValue.ts        // 游戏常量数据
│   │       │   └── EventType.ts         // 事件类型定义
│   │       ├── Manager
│   │       │   ├── EditorManager.ts     // 编辑器数据
│   │       │   ├── GameManager.ts       // 游戏逻辑类
│   │       │   └── SyncDataManager.ts   // 同步数据
│   │       └── UI
│   │           ├── Item
│   │           └── panel
│   │               ├── GamePanel.ts      // 游戏主场景
│   │               └── TeacherPanel.ts   // 编辑器场景
│   └── resources     // 存放需要动态加载的资源
│       ├── audios
│       ├── images
│       └── prefab
│           └── ui
│               ├── Item
│               └── panel
│                   ├── GamePanel.prefab
│                   └── TeacherPanel.prefab
├── build-templates        //构建模板，个人无需修改，会被frame更新
│   └── web-mobile
│       ├── game-msg.min.js
│       ├── huawawa.ttf
│       └── index.html
├── creator.d.ts
├── debug.log
├── jsconfig.json
├── packages
├── preview-templates   //预览模板，个人无需修改，会被frame更新
│   ├── boot.js
│   ├── favicon.ico
│   ├── game-index.html
│   ├── game-msg.min.js
│   ├── iframe-index.html
│   ├── index.html
│   ├── splash.png
│   └── style.css
├── project.json
├── settings
│   ├── builder.json
│   ├── project.json
│   └── services.json
├── tsconfig.json
└── updateFrame.js

```

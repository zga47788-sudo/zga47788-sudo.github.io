// Content and stable media IDs stay separate from layout and interaction code.
window.PORTFOLIO = {
  careers: [
    { year: '2026', current: true, date: '2026.06 — 至今', company: '跨境美甲工作室', role: '联合创业实践', description: '为 TikTok Shop 东南亚穿戴甲项目制作商品视觉与短视频，围绕卖点进行脚本、分镜和场景表达，检查手部、商品结构与画面一致性。' },
    { year: '2025', date: '2025.09 — 2026.04', company: '浙江领航', role: '电商设计师', description: '面向海外假发业务完成主图、详情与推广视觉，并探索 AI 图像及视频辅助制作。' },
    { year: '2024', date: '2024.04 — 2025.07', company: '杭州全速（西安分部）', role: '创意设计师', description: '参与中国体育彩票、京东、泰国万客隆等商业视觉项目，完成 KV、海报与活动推广素材。' }
  ],
  abilities: [
    { id: 'A-ABILITY-01', label: 'WORKFLOWS', title: 'AI 工具与工作流', description: '按任务选择并串联图像、视频与 Agent 工具，整理可复用的制作方法。' },
    { id: 'A-ABILITY-02', label: 'PROTOTYPING', title: 'AI 应用落地', description: '把重复制作步骤拆成网页原型或自动化工具，加入审核与结果检查。' },
    { id: 'A-ABILITY-03', label: 'E-COMMERCE', title: '跨境电商视觉', description: '围绕商品卖点组织主图、详情、产品场景和短视频素材。' },
    { id: 'A-ABILITY-04', label: 'GRAPHIC DESIGN', title: '商业平面设计', description: '完成品牌 KV、运营海报与推广物料，兼顾创意、信息和视觉统一。' }
  ],
  posters: [
    { id: '05', src: 'assets/portfolio/poster-05.webp', alt: '7星彩紫蓝色中奖快报' },
    { id: '03', src: 'assets/portfolio/poster-03.webp', alt: '万客隆高露洁开业海报' },
    { id: '12', src: 'assets/portfolio/poster-12.webp', alt: '父亲节主题海报' },
    { id: '09', src: 'assets/portfolio/poster-09.webp', alt: 'realme V60 Pro 黑金新品图' },
    { id: '01', src: 'assets/portfolio/poster-01.webp', alt: '快手好戏连连戏曲海报' },
    { id: '04', src: 'assets/portfolio/poster-04.webp', alt: '万客隆紫色家电海报' },
    { id: '08', src: 'assets/portfolio/poster-08.webp', alt: '大乐透十八周年庆露营主题海报' },
    { id: '10', src: 'assets/portfolio/poster-10.webp', alt: '巅峰对决赛事海报' },
    { id: '07', src: 'assets/portfolio/poster-07.webp', alt: '大乐透橙色周年庆海报' },
    { id: '02', src: 'assets/portfolio/poster-02.webp', alt: '体彩公益乡村音乐活动画面' },
    { id: '06', src: 'assets/portfolio/poster-06.webp', alt: '7星彩蓝色运营海报' },
    { id: '11', src: 'assets/portfolio/poster-11.webp', alt: '绿色顶呱刮海报' }
  ],
  videos: {
    V01: { title: '批量制作展示', description: '从一个参考，展开适合自己产品的不同版本。', src: 'assets/videos/V01.mp4', mobileSrc: 'assets/videos/mobile/V01.mp4', poster: 'assets/videos/V01.webp', loop: true },
    V02: { title: '复刻成功案例', description: '看实际成片，以及画面如何围绕产品重新组织。', src: 'assets/videos/V02.mp4', mobileSrc: 'assets/videos/mobile/V02.mp4', poster: 'assets/videos/V02.webp' },
    V03: { title: '我的制作流程', description: '跟着一个真实任务，看需求怎样成为最终成片。', src: 'assets/videos/V03.mp4', mobileSrc: 'assets/videos/mobile/V03.mp4', poster: 'assets/videos/V03.webp' }
  },
  projects: [
    {
      id: '01', ratio: '16:9', mark: '快手新知', title: '云上庙会 · 好戏连连',
      logo: 'assets/portfolio/brand-kuaishou.png',
      label: '活动主视觉', labelEnglish: 'CAMPAIGN IDENTITY',
      description: '用戏曲头饰、人物剪影和书法主题字构成新春主视觉，延展到云上庙会页面、直播和推广物料。',
      artwork: [
        ['活动页面与主视觉构成', 1440, 1977],
        ['横竖主题字与戏曲人物', 1440, 1085],
        ['推广海报、横幅与直播视觉', 1440, 1098]
      ]
    },
    {
      id: '02', ratio: '16:9', mark: '中国体育彩票', title: '公益筑梦，体彩同行',
      logo: 'assets/portfolio/brand-sport-lottery.png',
      label: '公益活动视觉', labelEnglish: 'PUBLIC WELFARE',
      description: '用五片风车叶片串联健身、滑雪、助农、生态保护和乡村音乐，并把主视觉中的人物延展到移动端弹窗。',
      artwork: [
        ['五个公益场景与情绪板', 1440, 1188],
        ['视觉语言、人物延展与移动端弹窗', 1440, 1292]
      ]
    },
    {
      id: '03', ratio: '16:9', mark: 'makro PRO', title: '万客隆电商网页设计',
      logo: 'assets/portfolio/brand-makro.png',
      label: '电商专题设计', labelEnglish: 'E-COMMERCE DESIGN',
      description: '以高露洁促销专题为例，组织网页商品与促销信息，并将视觉延展到横幅和线上推广物料。',
      artwork: [
        ['高露洁专题页面、配色与字体', 1440, 772],
        ['高露洁促销视觉', 1440, 782],
        ['万客隆其他品类的线上物料', 1440, 979]
      ]
    },
    {
      id: '04', ratio: '16:9', mark: '中国体育彩票', title: '体彩运营视觉',
      logo: 'assets/portfolio/brand-sport-lottery.png',
      label: '系列运营物料', labelEnglish: 'CONTENT DESIGN',
      description: '围绕 7星彩中奖快报、日常开奖和大乐透十八周年庆，设计信息模板及系列海报。',
      artwork: [
        ['7星彩中奖快报模板', 1440, 1630],
        ['日常开奖系列海报', 1440, 1864],
        ['大乐透十八周年庆系列', 1440, 2690]
      ]
    },
    {
      id: '05', ratio: '16:9', mark: 'DANGDANG', title: '铛铛品牌 IP 设计',
      logo: 'assets/portfolio/brand-dangdang.png',
      label: '品牌角色设计', labelEnglish: 'CHARACTER IDENTITY',
      description: '用粉色双丸子头和橙色卫衣建立角色辨识度，再延展到表情动作、宣发海报和线下手提袋。',
      artwork: [
        ['IP 设计理念', 1440, 809],
        ['角色设定与造型元素', 1440, 812],
        ['线稿与渲染三视图', 1440, 449],
        ['IP 宣发海报', 1440, 812],
        ['角色表情与动作', 1440, 1163],
        ['IP 线下手提袋', 1440, 819]
      ]
    },
    {
      id: '06', ratio: '16:9', detailCoverRatio: '9:16', mark: '长图 / H5 / 海报', title: '其他设计',
      label: '长图与海报选辑', labelEnglish: 'DESIGN COLLECTION',
      description: '收录 realme 新品 H5、体彩反诈科普长图，以及体育赛事和节日主题海报。',
      artwork: [
        ['realme V60 Pro 新品 H5', 763, 5977],
        ['中国体育彩票反诈科普长图', 802, 5977],
        ['体育赛事与节日主题海报', 1440, 1629]
      ]
    }
  ],
  // No original reference images or unreleased project files are served.
  media: {
    'A-HERO-SCENE': { src: 'assets/hero-scene-v02.webp', ratio: '16:9', purpose: '手机、岩石、定向光静态概念场景' },
    'A-HERO-UI': { src: 'native-html', ratio: '360:780', purpose: '网页原生制作流程示意，四角透视映射到屏幕' },
    'A-PORTRAIT': { src: 'assets/portfolio/portrait-01.webp', ratio: '3:4', purpose: '赵世博证件照' },
    'A-RESUME': { src: 'assets/zhao-shibo-resume.pdf', purpose: '用户提供的原始简历' }
  }
};

/* GameDoc Auditor — MIT License. Pure deterministic browser-side rules; no AI or network calls. */
(function () {
  'use strict';

  function M(id,category,severity,title,trigger,required,detail,fix){return {id,category,severity,title,kind:'missing',trigger,required,detail,fix};}
  function S(id,category,severity,title,detail,fix){return {id,category,severity,title,kind:'special',detail,fix};}
  function C(id,category,severity,title,detail,fix){return {id,category,severity,title,kind:'cross',detail,fix};}
  const RULES=[
    M('D01','文档结构','medium','核心玩法循环不明确',/玩家|玩法|经营|战斗|关卡/,/核心循环|玩法循环|游戏循环|循环流程|核心闭环|重复游玩|反复进行/,'描述游戏玩法时应指出反复驱动玩家行动的循环。','补充玩家操作 → 系统反馈 → 资源变化 → 下一轮目标的循环说明。'),
    M('D02','文档结构','medium','玩家目标缺少定义',/玩家|玩法|游戏模式|关卡/,/目标|胜利条件|达成条件|通关条件|完成条件/,'定义玩家行动，却没有明确达成目标。','给出长期目标与单局目标，以及可验证的达成条件。'),
    M('D03','文档结构','low','核心操作描述不足',/玩法|玩家|游戏/,/操作|点击|拖动|滑动|按住|移动|释放|输入|选择/,'涉及玩法但缺少玩家如何操作的说明。','补充输入方式、操作步骤及系统反馈。'),
    M('D04','文档结构','medium','关卡胜利条件不明确',/关卡|战斗|挑战|副本/,/胜利|通关条件|成功条件|过关条件|目标达成|完成条件/,'存在关卡或挑战，但没有明确胜利判定。','列明胜利触发、判定时点及并发达成时的优先级。'),
    M('D05','文档结构','medium','失败或终止条件缺失',/通关|胜利|成功条件|过关条件/,/失败|判负|超时|终止条件|挑战结束|结束条件/,'已有成功判定，却没有失败或终止分支。','补充失败条件、反馈、资源扣除及重试入口。'),
    M('D06','文档结构','low','失败后的去向缺失',/失败|判负|挑战失败/,/重试|重新开始|返回|退出|复活|失败结算|再次挑战/,'描述失败但没有后续操作路径。','说明失败弹窗、重试成本、返回入口及进度处理。'),
    M('D07','文档结构','medium','解锁条件未明确',/解锁|开放新区域|开启新功能/,/解锁条件|解锁等级|达到.*等级|完成.*任务|前置条件|解锁规则|条件满足/,'提到了内容解锁，却未检测到判定条件。','定义前置条件、触发时机、重复触发及解锁提示。'),
    M('D08','文档结构','low','新手引导退出规则缺失',/新手引导|教程引导|首次引导/,/引导结束|退出引导|跳过引导|引导完成|引导终止|强制引导/,'说明了引导，却没有完成或退出条件。','明确引导触发、完成、跳过以及中途退出恢复方式。'),
    M('D09','文档结构','medium','关卡结算链路不完整',/通关|关卡胜利|关卡完成/,/结算|通关反馈|结果弹窗|结果界面|胜利界面|奖励发放/,'通关之后的结果展示或结算触发未描述。','补充结算触发、数据结算顺序、反馈、返回和继续行为。'),

    M('E01','资源经济','high','资源消耗缺少来源',/(?:消耗|扣除|支付|花费).{0,12}(?:金币|钻石|材料)|(?:金币|钻石|材料).{0,12}(?:消耗|扣除|支付)/,/(?:获得|获取|产出|奖励|掉落|领取|发放).{0,14}(?:金币|钻石|材料)|(?:金币|钻石|材料).{0,14}(?:来源|产出|获取|奖励|收入)/,'明确消耗资源，但没有说明其可持续来源。','按资源逐项列出初始数量、主要产出、周期、上限和消耗去向。'),
    M('E02','资源经济','low','资源来源缺少消耗去向',/(?:获得|产出|奖励|掉落|领取).{0,12}(?:金币|钻石|材料)/,/(?:消耗|花费|支付|购买|升级|兑换).{0,14}(?:金币|钻石|材料)|(?:金币|钻石|材料).{0,14}(?:用途|消耗|购买|升级)/,'定义资源产出，但缺少消耗或使用途径。','明确资源的主要用途，并检查长期积累与通胀风险。'),
    M('E03','资源经济','low','消耗型资源初始值未定义',/(?:消耗|扣除|支付).{0,12}(?:金币|钻石)/,/初始金币|金币初始|初始钻石|钻石初始|初始资源|初始货币/,'存在经济消耗，但没有配置初始货币。','列明首次进入游戏的货币数量和领取时机。'),
    M('E04','资源经济','high','行动资源缺少恢复机制',/(?:体力|行动点|行动力).{0,12}(?:消耗|扣除|减少)|(?:消耗|扣除).{0,12}(?:体力|行动点|行动力)/,/(?:体力|行动点|行动力).{0,15}(?:恢复|回复|补充|重置)|(?:恢复|回复|补充|重置).{0,15}(?:体力|行动点|行动力)/,'体力或行动点消耗后，未找到补充机制。','补充恢复速度、恢复条件、是否离线恢复和补满行为。'),
    M('E05','资源经济','medium','行动资源上限缺失',/(?:体力|行动点|行动力).{0,12}(?:消耗|扣除)/,/(?:体力|行动点|行动力).{0,12}(?:上限|最大值|不设上限)/,'体力使用规则缺少容量边界。','定义初始量、上限、溢出和活动加成时的处理。'),
    M('E06','资源经济','medium','资源耗尽时的操作缺失',/体力不足|金币不足|材料不足|资源不足/,/不足提示|无法操作|禁用|置灰|跳转获取|不足弹窗|购买引导/,'资源不足会阻止操作，但缺少用户反馈路径。','定义按钮状态、提示文本、获取途径和取消行为。'),
    M('E07','资源经济','low','背包容量边界未定义',/背包|物品栏|仓库/,/背包上限|背包容量|最大格数|无限背包|容量无限|格子数量/,'涉及物品存储，却没有容量规则。','明确格数、堆叠方式、满格和物品领取行为。'),
    M('E08','资源经济','medium','资源溢出处理缺失',/(?:体力|金币|材料|背包|仓库).{0,10}(?:上限|最大值|容量)/,/溢出|超过上限|达到上限|满额|满格|超额|无法领取|暂存|邮件补发/,'设置了资源上限，却没有处理超额的规则。','定义丢弃、暂存、拒收或转换，以及对应反馈。'),
    M('E09','资源经济','medium','奖励数量或配置引用缺失',/任务奖励|通关奖励|签到奖励|领取奖励/,/奖励数量|奖励内容|奖励配置|奖励表|奖励ID|奖励列表|金币\s*\d+|钻石\s*\d+|\d+\s*(?:金币|钻石|个材料)/,'奖励规则没有说明数量或明确配置来源。','写明奖励池、数量、发放时点、重复领取限制。'),
    M('E10','资源经济','medium','购买失败的返还规则缺失',/购买失败|支付失败|扣款失败|交易失败/,/返还|退款|回滚|不扣除|撤销|补单|重试交易/,'涉及失败购买，却未定义扣费或补偿行为。','明确交易原子性、资源回滚、超时处理和记录追踪。'),

    M('N01','数值规则','high','随机产出概率未配置',/抽卡|随机掉落|概率掉落|概率获得|随机出现|掉落概率|掉落素材/,/\d+(?:\.\d+)?\s*%|概率表|权重表|概率配置|权重配置|保底.*\d/,'随机机制没有提供可检查的概率或权重依据。','列出候选池、概率/权重、独立或互斥抽取及保底机制。'),
    M('N02','数值规则','medium','随机奖励池内容未定义',/抽卡|随机掉落|概率掉落|掉落素材/,/奖励池|掉落池|掉落列表|候选列表|奖励列表|奖励配置|物品池/,'描述随机掉落，却没有确定可获得的候选内容。','提供完整候选列表及筛选、排除和兜底规则。'),
    M('N03','数值规则','medium','冷却时长缺失',/冷却|CD时间|CD时长/,/\d+\s*(?:秒|分钟|分|小时|天)|冷却配置|冷却时长\s*[:：=]\s*\d+|CD\s*[:：=]\s*\d+/,'冷却规则缺少具体时长或配置表来源。','填写数值、单位和是否受加速效果影响。'),
    M('N04','数值规则','low','冷却计时起点未说明',/冷却|CD时间|CD时长/,/开始计时|计时起点|使用后计时|领取后计时|触发后计时|冷却起点/,'冷却时长存在，但未说明从何时计算。','明确触发、领取或使用时开始，并说明离线是否继续。'),
    M('N05','数值规则','medium','每日限制缺少重置时点',/每日.{0,8}(?:次数|上限|限制)|每天.{0,8}(?:次数|上限|限制)/,/每日重置|每天重置|重置时间|刷新时间|每日刷新|每天刷新|重置时点/,'每日次数限制需要明确刷新时刻。','说明刷新时点、使用时区和未用次数是否结转。'),
    M('N06','数值规则','medium','次数限制缺少明确数值',/每日次数|挑战上限|次数限制|每日上限/,/\d+\s*次|次数\s*[:：=]\s*\d+|次数配置|上限配置|配置表/,'描述限制，但没有明确次数或配置字段。','填写具体次数、次数扣除时机和补充途径。'),
    M('N07','数值规则','low','伤害计算公式缺失',/伤害|战斗力|攻击力/,/伤害公式|计算公式|伤害计算|最终伤害|公式配置|伤害倍率/,'出现战斗数值，却没有明确如何计算。','定义基础值、倍率、抗性、取整、上下限和计算顺序。'),
    M('N08','数值规则','low','等级或成长上限缺失',/升级|等级成长|经验值/,/等级上限|最大等级|满级|无等级上限|成长上限/,'有等级成长，但没有终止或封顶条件。','定义等级上限、经验曲线和满级后收益处理。'),
    M('N09','数值规则','medium','升级消耗缺少成长规则',/升级消耗|升级费用|升级成本/,/成长公式|等级表|消耗配置|升级配置|价格公式|固定消耗|逐级增加|每级.*消耗/,'升级成本未定义随等级变化的方式。','补充每级配置、固定值或成长公式。'),
    M('N10','数值规则','low','结算取整规则缺失',/收益计算|伤害计算|比例分配|结算公式/,/四舍五入|向下取整|向上取整|保留小数|取整规则|整数运算/,'计算存在小数可能性，却没有明确取整规则。','定义每步取整顺序及最终显示精度。'),

    M('U01','界面交互','medium','按钮状态设计不完整',/按钮|点击|操作入口/,/禁用|置灰|不可点击|点击态|按下态|加载中|按钮状态|交互状态/,'存在操作入口，但缺少非默认状态定义。','列出正常、按下、禁用、等待及异常状态。'),
    M('U02','界面交互','medium','操作结果反馈缺失',/点击|拖动|滑动|提交操作/,/反馈|提示|弹窗|动画|变化|跳转|结算|Toast|toast/,'玩家操作缺少明确的成功或失败反馈。','补充操作生效时机、动画/提示、失败原因及恢复行为。'),
    M('U03','界面交互','medium','不可逆操作缺少确认',/删除角色|删除存档|重置进度|清空背包|永久消耗/,/二次确认|确认弹窗|确认操作|不可撤销提示|撤销机制/,'涉及不可逆状态变更，未定义防误操作机制。','增加确认内容、取消入口以及操作成功反馈。'),
    M('U04','界面交互','low','列表空状态未定义',/列表|搜索结果|任务列表|背包列表/,/空状态|空列表|暂无数据|无结果|内容为空|缺省页/,'列表可能无数据，但缺少空状态设计。','说明空提示、引导文案和可执行操作。'),
    M('U05','界面交互','medium','异步操作失败状态未定义',/网络请求|服务器请求|加载数据|异步加载/,/加载失败|请求失败|重试按钮|超时提示|错误提示|异常状态/,'出现异步操作却缺少异常路径。','列出加载中、超时、失败、重试与取消规则。'),
    M('U06','界面交互','low','多分辨率适配规则缺失',/适配|横竖屏|分辨率|全面屏/,/安全区|刘海屏|长短屏|宽高比|缩放策略|锚点|边距规则/,'涉及设备适配，但缺少具体的布局策略。','补充安全区、最小宽高比、留白与内容截断策略。'),
    M('U07','界面交互','low','分页或加载更多规则缺失',/分页|加载更多|无限滚动/,/每页数量|页大小|分页大小|到底加载|结束标志|下一页条件/,'涉及分页，但缺少终止条件或加载规模。','列出单页数量、排序稳定性、重复请求和无更多数据状态。'),
    M('U08','界面交互','low','关闭弹窗的交互未定义',/弹窗|对话框|浮层/,/关闭按钮|点击遮罩|返回键|取消按钮|关闭方式|自动关闭/,'描述弹窗，却没有明确退出方式。','说明返回键、遮罩、关闭按钮、确认后的退出优先级。'),

    M('T01','研发配置','medium','配置表字段未给出',/配置表|表驱动|数据配置|配置化|Excel配置/,/字段|主键|数据类型|字段名|表结构|schema|配置ID|参数类型/i,'说明配置化实现，却没有字段级结构。','补充字段、数据类型、默认值、范围和示例行。'),
    M('T02','研发配置','medium','配置数据缺少唯一标识',/配置表|配置ID|关卡表|道具表/,/唯一ID|主键|配置ID|资源ID|道具ID|关卡ID|唯一标识/,'配置关系缺少稳定的唯一键。','增加主键及跨表引用策略，定义缺失引用的处理。'),
    M('T03','研发配置','medium','玩家进度持久化缺失',/玩家进度|关卡进度|背包|已解锁|离线收益/,/存档|持久化|自动保存|本地保存|服务器同步|数据保存/,'涉及跨局保留的状态，却没有持久化规则。','定义保存触发、覆盖策略、丢档恢复和重试。'),
    M('T04','研发配置','medium','联网异常恢复未定义',/联网|在线玩法|PVP|多人匹配|服务器同步/,/断线重连|网络中断|重连|断网|超时重试|同步失败/,'涉及网络交互，却未说明中断后的行为。','明确中断提示、重连方式、重复提交和一致性处理。'),
    M('T05','研发配置','medium','离线结算上限缺失',/离线收益|离线挂机|离线产出/,/离线时长上限|累计上限|最大离线|离线封顶|最长累计|离线收益上限/,'离线产出缺少最长累积时长边界。','定义结算时长、领取次数、封顶与跨天计算方式。'),
    M('T06','研发配置','low','输入合法性规则缺失',/玩家输入|自定义名称|昵称输入|输入框/,/字数限制|非法字符|敏感词|长度上限|输入校验|禁止字符/,'存在玩家自定义输入，但缺少合法性约束。','明确长度、字符类型、过滤和不通过时的提示。'),
    M('T07','研发配置','low','首次进入默认状态缺失',/创建角色|首次进入|新玩家|首次登录/,/默认值|初始状态|初始角色|新手默认|默认配置|初始数据/,'描述首次进入，但缺少初始状态。','列出初始货币、角色状态、系统解锁和引导进度。'),

    M('Q01','任务剧情','medium','任务完成条件不完整',/任务系统|任务列表|主线任务|每日任务/,/完成条件|任务条件|触发条件|达成条件|任务目标/,'存在任务，但缺少可判断完成与否的条件。','提供条件字段、判定事件、累计规则和前置依赖。'),
    M('Q02','任务剧情','medium','任务奖励缺少领取规则',/任务奖励|完成任务获得|任务完成后奖励/,/自动发放|手动领取|奖励领取|发奖时机|领取条件|领取按钮/,'任务奖励没有明确如何领取。','确定自动/手动领取、重复领取保护和背包满时处理。'),
    M('Q03','任务剧情','medium','分支剧情回收规则缺失',/剧情分支|分支选项|选项分支/,/分支合流|分支结局|分支收束|结局节点|合流节点|分支后续/,'存在剧情分支，却没有给出最终去向。','为每个选项列出条件、影响、状态写入和后继节点。'),
    M('Q04','任务剧情','low','剧情跳过后的状态未定义',/跳过剧情|剧情快进|跳过对话/,/跳过后|直接结算|写入状态|完成标记|跳过奖励|跳过处理/,'允许跳过演出，但未定义跳过之后的逻辑。','明确剧情标记、奖励、任务条件及后继节点是否正常执行。'),
    M('Q05','任务剧情','medium','任务失败或放弃缺少处理',/任务失败|任务放弃|放弃任务/,/重接|重新领取|不可恢复|任务重置|返还|失败惩罚|重新开始/,'任务失败之后的状态变化不明确。','定义任务是否重接、计数重置及物品返还。'),

    M('O01','商业活动','medium','激励广告失败兜底缺失',/激励广告|看广告领奖|广告复活|观看广告/,/广告加载失败|广告失败|无法播放|广告超时|兜底|补发|失败提示/,'奖励广告依赖外部播放，缺少失败路径。','定义无填充、关闭、加载超时与发奖幂等性。'),
    M('O02','商业活动','low','广告次数限制缺失',/激励广告|广告复活|看广告领奖/,/广告次数|每日广告|观看上限|广告冷却|次数上限|广告限制/,'激励广告缺少频控或明确不限次说明。','标明每日次数、单次冷却和上限刷新时点。'),
    M('O03','商业活动','medium','真实货币购买恢复规则缺失',/充值|内购|真实货币|现金购买/,/订单恢复|补单|退款|购买失败|支付校验|未到账|购买恢复/,'含真实货币交易，但没有支付异常恢复规则。','列出验单、补发、恢复购买和退款处理。'),
    M('O04','商业活动','medium','限时活动结束结算缺失',/限时活动|活动结束|排行榜活动/,/活动结算|活动排名结算|结束奖励|活动奖励发放|活动关闭|结算规则/,'限时活动缺少结束后的状态和发奖行为。','定义关停时点、结算顺序、发奖及未领取奖励处理。'),
    M('O05','商业活动','low','跨时区活动时间未定义',/活动开始时间|活动结束时间|每日刷新|跨服活动/,/UTC|时区|服务器时间|本地时间|统一时间|时间基准/,'活动依赖日期时刻，但没有统一时钟约定。','选择服务器时间或指定时区，定义夏令时与跨天行为。'),

    S('S01','文档结构','medium','存在待定或未完成描述','包含 TODO、待定、后续补充等尚未冻结的规则。','给出最终处理方式和版本冻结时间。'),
    S('S02','文档结构','low','文档内容信息不足','文本过短，可能不能完成需求实现与测试。','补充规则、边界、异常、数值与验收条件。'),
    S('S03','数值规则','high','概率值超出有效范围','明确的概率值不应小于 0% 或大于 100%。','修正概率字段；若是收益加成，请注明其并非概率。'),
    S('S04','数值规则','high','数值最小值大于最大值','同一个字段出现反向的取值上下界。','检查上下限的取值及命名，并提供边界测试。'),
    S('S05','逻辑一致性','high','同文档关键参数冲突','同一字段在一份文档内有两个不同值。','统一配置来源，或明确不同数值各自的阶段/条件。'),
    S('S06','数值规则','medium','概率池总和异常','同一组逐项概率若可完整识别，总和应为 100%。','检查各项概率、是否属于独立概率以及四舍五入误差。'),

    C('C01','跨文档一致性','high','跨文档数值定义冲突','两份或多份文档对同一字段定义了不同的可比较数值。','统一数值配置来源；如果按阶段变化，明确前置条件和版本。'),
    C('C02','跨文档一致性','high','跨文档开关定义冲突','同一功能在不同文档中同时出现开启/关闭或允许/禁止。','统一开关规则，补充适用角色、玩法模式及优先级。'),
    C('C03','跨文档一致性','medium','跨文档流程结果定义冲突','同一事件/处理字段在不同文档中对应不同结果。','统一流程终点；若属于不同分支，注明触发条件。'),
    C('C04','跨文档一致性','medium','跨文档数值单位不一致','同字段一处带单位、一处没有单位，不能直接确认是否一致。','补充单位或统一字段格式，再确认实际取值。')
  ];
  const severityRank={high:0,medium:1,low:2};
  const specialIds=new Set(['S01','S02','S03','S04','S05','S06']);
  const knownKeys=[
    [/^(?:体力上限|最大体力|体力最大值)$/,'体力上限'],[/^(?:金币初始值|初始金币|初始金币数量)$/,'初始金币'],
    [/^(?:钻石初始值|初始钻石)$/,'初始钻石'],[/^(?:单局时长|关卡时长|每局时长)$/,'关卡时长'],
    [/^(?:每日挑战次数|每日挑战上限|每天挑战次数)$/,'每日挑战次数'],[/^(?:背包上限|背包容量|最大背包容量)$/,'背包容量'],
    [/^(?:是否允许跳过引导|允许跳过引导|新手引导可跳过)$/,'引导跳过开关'],[/^(?:是否自动战斗|自动战斗开关|自动战斗)$/,'自动战斗'],
    [/^(?:失败后处理|挑战失败后处理)$/,'失败后处理']
  ];
  const enumKey=/(?:失败后处理|结算方式|返回方式|重试方式|默认操作模式|默认排序|存档方式|刷新方式|关卡失败行为|通关后行为)$/;
  const toLines=text=>String(text||'').replace(/\r\n?/g,'\n').split('\n');
  const test=(re,s)=>re.test(s);
  const lineOf=(lines,re)=>Math.max(1,lines.findIndex(x=>re.test(x))+1);
  const snippet=(lines,line)=>String(lines[line-1]||'').trim().slice(0,220);
  const CUSTOM_KINDS=['requiredWhen','forbidden','requiredField','numericRange'];
  const simpleText=(value,max)=>typeof value==='string'?value.trim().slice(0,max+1):'';
  const labelKey=value=>String(value||'').replace(/[*_`\s#]/g,'').toLowerCase();
  function validateCustomization(raw={}){
    const errors=[],config={version:1,rules:[],aliases:[]};
    if(!raw||typeof raw!=='object'||Array.isArray(raw))return {config,errors:['配置必须是 JSON 对象']};
    if(raw.rules!==undefined&&!Array.isArray(raw.rules))errors.push('rules 必须为数组');
    if(raw.aliases!==undefined&&!Array.isArray(raw.aliases))errors.push('aliases 必须为数组');
    const inputRules=Array.isArray(raw.rules)?raw.rules:[],inputAliases=Array.isArray(raw.aliases)?raw.aliases:[];
    if(inputRules.length>50)errors.push('自定义规则最多 50 条');
    if(inputAliases.length>100)errors.push('字段别名组最多 100 组');
    const ids=new Set(),terms=new Map();
    inputAliases.slice(0,100).forEach((entry,i)=>{
      const canonical=simpleText(entry?.canonical,40),list=Array.isArray(entry?.terms)?entry.terms:[];
      const aliases=[...new Set(list.map(x=>simpleText(x,40)).filter(Boolean))].filter(x=>labelKey(x)!==labelKey(canonical));
      if(!canonical||canonical.length>40||!aliases.length||aliases.some(x=>x.length>40)){errors.push(`别名第 ${i+1} 组：请填写标准字段和至少一个别名（最多 40 字）`);return;}
      for(const text of [canonical,...aliases]){const k=labelKey(text);if(terms.has(k)&&terms.get(k)!==canonical)errors.push(`字段「${text}」重复映射到不同的标准字段`);else terms.set(k,canonical);}
      config.aliases.push({canonical,terms:aliases});
    });
    inputRules.slice(0,50).forEach((entry,i)=>{
      const id=simpleText(entry?.id,48),title=simpleText(entry?.title,80),kind=entry?.kind,severity=entry?.severity||'medium',enabled=entry?.enabled!==false;
      const trigger=simpleText(entry?.trigger,100),required=simpleText(entry?.required,100),field=simpleText(entry?.field,40),fix=simpleText(entry?.fix,240);
      if(!/^X[A-Z0-9_-]{3,40}$/i.test(id)||ids.has(id)){errors.push(`自定义规则第 ${i+1} 条：ID 无效或重复`);return;}ids.add(id);
      if(!title||title.length>80||!CUSTOM_KINDS.includes(kind)||!['high','medium','low'].includes(severity)||trigger.length>100||required.length>100||field.length>40||fix.length>240){errors.push(`自定义规则第 ${i+1} 条：名称、类型、级别或长度无效`);return;}
      if(kind==='requiredWhen'&&(!trigger||!required)||kind==='forbidden'&&!trigger||['requiredField','numericRange'].includes(kind)&&!field){errors.push(`「${title}」：缺少必要的关键词或字段名`);return;}
      const min=entry?.min===''||entry?.min===null||entry?.min===undefined?null:Number(entry.min),max=entry?.max===''||entry?.max===null||entry?.max===undefined?null:Number(entry.max);
      if(kind==='numericRange'&&((min===null&&max===null)||(min!==null&&!Number.isFinite(min))||(max!==null&&!Number.isFinite(max))||(min!==null&&max!==null&&min>max))){errors.push(`「${title}」：请填写有效的数值范围，且最小值不能大于最大值`);return;}
      config.rules.push({id,title,kind,severity,enabled,trigger,required,field,min:kind==='numericRange'?min:null,max:kind==='numericRange'?max:null,fix});
    });
    return {config,errors};
  }
  function normKey(key,aliases=[]){let s=key.replace(/[*_`\s#]/g,'').replace(/^(?:参数|规则)[:：]/,'').trim();const normalized=labelKey(s);for(const group of aliases)if([group.canonical,...group.terms].some(x=>labelKey(x)===normalized))return group.canonical;for(const [re,alias] of knownKeys)if(re.test(s))return alias;return s;}
  function parseValue(value){let v=value.trim().replace(/[。；，].*$/,'');const boolOn=/^(?:开启|启用|是|允许|支持|可|true|on)$/i,boolOff=/^(?:关闭|禁用|否|禁止|不支持|不可|false|off)$/i;
    if(boolOn.test(v))return {kind:'boolean',canon:'true',display:v};if(boolOff.test(v))return {kind:'boolean',canon:'false',display:v};
    const numeric=v.match(/^(-?\d+(?:\.\d+)?)\s*(秒|分钟|小时|天|次|点|个|级|%|金币|钻石)?$/);
    if(numeric){const unit=numeric[2]||'',n=Number(numeric[1]);const scale={'秒':1,'分钟':60,'小时':3600,'天':86400};return {kind:'numeric',canon:unit in scale?String(n*scale[unit]):String(n),unitGroup:unit in scale?'time':unit||'none',unit,display:v};}
    if(v.length<75)return {kind:'enum',canon:v.replace(/\s/g,''),display:v};return null;
  }
  function extractClaims(doc,aliases=[]){const claims=[];toLines(doc.text).forEach((raw,index)=>{const s=raw.replace(/\*\*/g,'').replace(/^\s*[-*•]\s*/,'').trim();if(/^#{1,6}\s/.test(s))return;
      let match=s.match(/^([^：:=]{2,28})\s*[:：=]\s*(.{1,78})$/);
      if(!match){match=s.match(/^(体力上限|最大体力|初始金币|每日挑战次数|单局时长|关卡时长|背包容量)\s*(?:为|是)\s*(\d+(?:\.\d+)?\s*(?:秒|分钟|小时|天|次|点)?)/);}
      if(!match)return;const key=normKey(match[1],aliases),value=parseValue(match[2]);if(!value)return;
      if(value.kind==='enum'&&!enumKey.test(key))return;
      if(key.length>30||key.length<2)return;
      claims.push({key,...value,docId:doc.id,docName:doc.name,line:index+1,evidence:raw.trim()});
    });return claims;
  }
  function sameComparable(a,b){return a.kind===b.kind&&(a.kind!=='numeric'||a.unitGroup===b.unitGroup);}
  function makeIssue(issues,rule,doc,line,reason,extra={}){issues.push({id:rule.id+'-'+issues.length,ruleId:rule.id,title:rule.title,category:rule.category,severity:rule.severity,scope:rule.kind==='cross'?'cross':'single',docId:doc.id,docName:doc.name,line:line||1,evidence:snippet(toLines(doc.text),line||1),reason,fix:rule.fix,confidence:'规则候选 · 需人工确认',related:extra.related||null,dismissed:false});}
  function checkSpecial(doc,issues,applicable,aliases=[]){const lines=toLines(doc.text),text=doc.text;
    const byId=id=>RULES.find(x=>x.id===id),push=(id,line,reason)=>makeIssue(issues,byId(id),doc,line,reason);
    applicable.add('S01');let pending=0;lines.forEach((line,i)=>{if(/TODO|TBD|待定|待补充|后续补充|以后补充|暂未确定|未设计/i.test(line)&&pending++<5)push('S01',i+1,'第 '+(i+1)+' 行存在未冻结规则，可能使实现与验收标准产生分歧。');});
    applicable.add('S02');if(text.trim().length<180)push('S02',1,'文档少于 180 字；该阈值只用于提醒，不代表质量好坏。');
    const prob=/((?:概率|掉落率|命中率|触发率|中奖率)\s*[:：=]?\s*)(-?\d+(?:\.\d+)?)\s*%/g;let m;
    while((m=prob.exec(text))!==null){applicable.add('S03');const n=Number(m[2]);if(n<0||n>100)push('S03',text.slice(0,m.index).split('\n').length,'概率 '+n+'% 超出 [0%,100%] 范围。');}
    const ranges=new Map();lines.forEach((line,i)=>{const mm=line.match(/([^\s：:]{2,14})(?:最小值|下限)\s*[:：=]\s*(-?\d+(?:\.\d+)?)/);const mx=line.match(/([^\s：:]{2,14})(?:最大值|上限)\s*[:：=]\s*(-?\d+(?:\.\d+)?)/);if(mm){const k=normKey(mm[1]);ranges.set(k,{...(ranges.get(k)||{}),min:Number(mm[2]),minLine:i+1});}if(mx){const k=normKey(mx[1]);ranges.set(k,{...(ranges.get(k)||{}),max:Number(mx[2]),maxLine:i+1});}});
    if(ranges.size)applicable.add('S04');for(const [key,r] of ranges)if(Number.isFinite(r.min)&&Number.isFinite(r.max)&&r.min>r.max)push('S04',r.maxLine,`${key}的最小值 ${r.min} 大于最大值 ${r.max}。`);
    const claims=extractClaims(doc,aliases),grouped=new Map();for(const claim of claims){const arr=grouped.get(claim.key)||[];arr.push(claim);grouped.set(claim.key,arr);}
    if(claims.length>1)applicable.add('S05');for(const [key,arr] of grouped){const pair=arr.find((v,i)=>arr.slice(0,i).some(o=>sameComparable(o,v)&&o.canon!==v.canon));if(pair){const other=arr.find(o=>sameComparable(o,pair)&&o.canon!==pair.canon);push('S05',pair.line,`「${key}」在同一文档中出现 ${other.display} 和 ${pair.display} 两个值。`);}}
    const poolLines=lines.filter(l=>/概率|掉落率|抽取率/.test(l)&&/\d+(?:\.\d+)?\s*%/.test(l));
    if(poolLines.length>=2){applicable.add('S06');const all=poolLines.map(l=>l.match(/(-?\d+(?:\.\d+)?)\s*%/)).filter(Boolean).map(m=>Number(m[1]));const total=all.reduce((a,b)=>a+b,0);
      if(all.length>=3&&total>100.01)push('S06',lineOf(lines,/概率|掉落率|抽取率/),`识别到 ${all.length} 个概率项，数值合计 ${total.toFixed(2)}%。若它们属于同一互斥池，概率总和异常。`);
    }
    return claims;
  }
  function checkCross(docs,claimList,issues,applicable){if(docs.length<2)return;const rules={numeric:RULES.find(x=>x.id==='C01'),boolean:RULES.find(x=>x.id==='C02'),enum:RULES.find(x=>x.id==='C03'),unit:RULES.find(x=>x.id==='C04')};
    Object.values(rules).forEach(r=>applicable.add(r.id));const map=new Map();for(const item of claimList){const arr=map.get(item.key)||[];arr.push(item);map.set(item.key,arr);}
    for(const [key,arr] of map){const uniqueDocs=[...new Set(arr.map(x=>x.docId))];if(uniqueDocs.length<2)continue;
      const done=new Set();for(let i=0;i<arr.length;i++)for(let j=i+1;j<arr.length;j++){
        const a=arr[i],b=arr[j];if(a.docId===b.docId||a.kind!==b.kind)continue;
        let rule=null,reason='';
        if(a.kind==='numeric'){if(a.unitGroup===b.unitGroup&&a.canon!==b.canon){rule=rules.numeric;reason=`「${key}」在《${a.docName}》定义为 ${a.display}，在《${b.docName}》定义为 ${b.display}。`;}
          else if(a.unitGroup!==b.unitGroup&&(a.unitGroup==='none'||b.unitGroup==='none')){rule=rules.unit;reason=`「${key}」一处是 ${a.display}、另一处是 ${b.display}，单位不统一。`;}}
        if(a.kind==='boolean'&&a.canon!==b.canon){rule=rules.boolean;reason=`「${key}」在《${a.docName}》为「${a.display}」，在《${b.docName}》为「${b.display}」。`;}
        if(a.kind==='enum'&&a.canon!==b.canon){rule=rules.enum;reason=`「${key}」在《${a.docName}》为「${a.display}」，在《${b.docName}》为「${b.display}」。`;}
        if(!rule)continue;const signature=rule.id+':'+key+':'+[a.docId,b.docId].sort().join('/');if(done.has(signature))continue;done.add(signature);
        const doc=docs.find(d=>d.id===a.docId);makeIssue(issues,rule,doc,a.line,reason,{related:{docId:b.docId,docName:b.docName,line:b.line,evidence:b.evidence}});
        if(done.size>=12)break;
      }
    }
  }
  function checkCustom(doc,rules,aliases,issues,applicable){
    const lines=toLines(doc.text),full=doc.text.toLowerCase();
    const first=term=>lines.findIndex(line=>line.toLowerCase().includes(term.toLowerCase()));
    const targetKey=key=>normKey(key,aliases);
    const fieldRows=lines.map((raw,i)=>{const s=raw.replace(/\*\*/g,'').replace(/^\s*[-*•]\s*/,'').trim(),m=s.match(/^([^：:=]{2,40})\s*[:：=]\s*(.*)$/);return m?{key:targetKey(m[1]),value:m[2],line:i+1}:null;}).filter(Boolean);
    for(const rule of rules){if(!rule.enabled)continue;
      const issue=(line,reason)=>makeIssue(issues,{...rule,category:'自定义规则',kind:'special',fix:rule.fix||'请核对并补充该项目自定义规范。'},doc,line,reason);
      if(rule.kind==='requiredWhen'){
        const at=first(rule.trigger);if(at<0)continue;applicable.add(rule.id);
        if(!full.includes(rule.required.toLowerCase()))issue(at+1,`出现「${rule.trigger}」，但未发现要求补充的「${rule.required}」。`);
      }else if(rule.kind==='forbidden'){
        let count=0;lines.forEach((line,i)=>{if(line.toLowerCase().includes(rule.trigger.toLowerCase())&&count++<8){applicable.add(rule.id);issue(i+1,`发现被标记为禁止的表述「${rule.trigger}」。`);}});
      }else{
        const matches=fieldRows.filter(row=>row.key===targetKey(rule.field));
        if(rule.kind==='requiredField'){applicable.add(rule.id);if(!matches.length)issue(1,`缺少必填字段「${rule.field}」的明确赋值（如「${rule.field}：数值」）。`);}
        if(rule.kind==='numericRange'){
          if(matches.length)applicable.add(rule.id);
          for(const row of matches.slice(0,8)){
            const match=row.value.match(/^(-?\d+(?:\.\d+)?)(?!\d)/);
            if(!match){issue(row.line,`字段「${rule.field}」缺少可读取的数值。`);continue;}
            const n=Number(match[1]);if(rule.min!==null&&n<rule.min||rule.max!==null&&n>rule.max)issue(row.line,`字段「${rule.field}」为 ${n}，超出自定义范围 ${rule.min??'不限'} ～ ${rule.max??'不限'}（按原文数字比较）。`);
          }
        }
      }
    }
  }
  function auditDocuments(input,customization={}){const verified=validateCustomization(customization);if(verified.errors.length)throw new Error('自定义配置无效：'+verified.errors.join('；'));
    const custom=verified.config,docs=(Array.isArray(input)?input:[]).filter(d=>d&&String(d.text||'').trim()).map((d,i)=>({id:String(d.id||'doc-'+i),name:String(d.name||'文档 '+(i+1)),text:String(d.text).replace(/\r\n?/g,'\n')}));
    const issues=[],applicable=new Set(),claimList=[];
    for(const doc of docs){const lines=toLines(doc.text),body=lines.filter(s=>!/^\s*#{1,6}\s/.test(s)).join('\n');
      for(const r of RULES){if(r.kind!=='missing')continue;
        if(r.id==='E01'||r.id==='E02'){
          const span='[^。；\\r\\n]{0,12}';
          for(const currency of ['金币','钻石','材料']){
            const spend=new RegExp('(?:消耗|扣除|支付|花费|购买)'+span+currency+'|'+currency+span+'(?:消耗|扣除|支付|花费)');
            const gain=new RegExp('(?:获得|获取|产出|奖励|掉落|领取|发放)'+span+currency+'|'+currency+span+'(?:来源|产出|获取|奖励|收入)');
            const trigger=r.id==='E01'?spend:gain,required=r.id==='E01'?gain:spend;
            if(!test(trigger,body))continue;applicable.add(r.id);
            if(!test(required,body))makeIssue(issues,r,doc,lineOf(lines,trigger),`「${currency}」：${r.detail}`);
          }continue;
        }
        if(!test(r.trigger,body))continue;applicable.add(r.id);if(!test(r.required,body))makeIssue(issues,r,doc,lineOf(lines,r.trigger),r.detail);}
      claimList.push(...checkSpecial(doc,issues,applicable,custom.aliases));
      checkCustom(doc,custom.rules,custom.aliases,issues,applicable);
    }
    checkCross(docs,claimList,issues,applicable);
    issues.sort((a,b)=>severityRank[a.severity]-severityRank[b.severity]||(a.scope==='cross'?-1:1)||(a.docName.localeCompare(b.docName))||a.line-b.line);
    const counts={high:issues.filter(x=>x.severity==='high').length,medium:issues.filter(x=>x.severity==='medium').length,low:issues.filter(x=>x.severity==='low').length};
    const crossCount=issues.filter(x=>x.scope==='cross').length;
    const risk=Math.round(100*(1-Math.exp(-(counts.high*16+counts.medium*7+counts.low*2)/100)));
    return {issues,counts,crossCount,risk,documentCount:docs.length,documents:docs.map(d=>({id:d.id,name:d.name,lines:toLines(d.text).length,chars:d.text.length})),applicableCount:applicable.size,totalRules:RULES.length+custom.rules.filter(r=>r.enabled).length,customRuleCount:custom.rules.filter(r=>r.enabled).length,aliasGroupCount:custom.aliases.length,checkedAt:new Date().toISOString(),engineVersion:'0.4.0',method:'deterministic-multi-document-rules'};
  }
  window.GameDocEngine={RULES,auditDocuments,extractClaims,validateCustomization};
})();

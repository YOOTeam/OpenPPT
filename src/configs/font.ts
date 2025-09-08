import { storeToRefs } from 'pinia'

import { useMainStore } from '@/store'

export const SYS_FONTS = [
  { label: 'Arial', value: 'Arial' },
  { label: '微软雅黑', value: 'Microsoft Yahei' },
  { label: '黑体', value: 'SimHei' },
  { label: '楷体', value: 'KaiTi' },
  { label: '新宋体', value: 'NSimSun' },
  { label: '仿宋', value: 'FangSong' },
  { label: '苹方', value: 'PingFang SC' },
  { label: '华文黑体', value: 'STHeiti' },
  { label: '华文楷体', value: 'STKaiti' },
  { label: '华文宋体', value: 'STSong' },
  { label: '华文仿宋', value: 'STFangSong' },
  { label: '华文中宋', value: 'STZhongSong' },
  { label: '华文琥珀', value: 'STHupo' },
  { label: '华文新魏', value: 'STXinwei' },
  { label: '华文隶书', value: 'STLiti' },
  { label: '华文行楷', value: 'STXingkai' },
  { label: '兰亭黑', value: 'Lantinghei SC' },
  { label: '宋体', value: 'Songti SC' },
  { label: '娃娃体', value: 'Wawati SC' },
  { label: '行楷', value: 'Xingkai SC' },
  { label: '圆体', value: 'Yuanti SC' },
  { label: '华文细黑', value: 'STXihei' },
  { label: '幼圆', value: 'YouYuan' },
  { label: '隶书', value: 'LiSu' },
]

export function WEB_FONTS() {
  const { getPPTLanguage } = storeToRefs(useMainStore())
  const lang = localStorage.getItem('lang')
  let fonts = [
    { label: '阿里巴巴普惠体B', value: 'Alibaba-PuHuiTi-B' },
    { label: '阿里巴巴普惠体M', value: 'Alibaba-PuHuiTi-M' },
    { label: '问藏书房', value: 'AskAboutTheStudyRoom' },
    { label: '字由芳华体', value: 'CharacterFanghuaStyle' },
    { label: '汉字拼音体', value: 'ChinesePinyinSystem' },
    { label: '德拉黑体', value: 'DelaBlackBody' },
    { label: '瀞之故障黑体H2', value: 'FaultOfBlackBodyH2' },
    { label: '字体传奇特战体', value: 'FontSpecialStyle' },
    { label: 'HarmonyOS Sans SC Black', value: 'HarmonyOS-Sans-SC-Black' },
    { label: '黄令东齐伋复刻体', value: 'HuangLingdongQiJiReproduction' },
    { label: '江城律动黑', value: 'JiangchengRhythmBlack' },
    { label: '江西拙楷', value: 'JiangxiZhuokai' },
    { label: 'MiSans Bold', value: 'MiSans-Bold' },
    { label: 'MiSans Heavy', value: 'MiSans-Heavy' },
    { label: 'MiSans Light', value: 'MiSans-Light' },
    { label: 'MiSans Medium', value: 'MiSans-Medium' },
    { label: 'MiSans Regular', value: 'MiSans-Regular' },
    { label: 'OPPOSans Heavy', value: 'OPPOSans-Heavy' },
    { label: '优设标题圆', value: 'OptimalTitleCircle' },
    { label: '庞门正道细线体', value: 'PangmenZhengdaoFineLineBody' },
    { label: '庞门正道标题体', value: 'PangmenZhengdaoTitleStyle' },
    {
      label: 'ResourceHanRoundedCN Heavy',
      value: 'ResourceHanRoundedCN-Heavy',
    },
    { label: '小可奶酪体', value: 'SmallCheeseBody' },
    { label: '站酷快乐体', value: 'StandCoolHappyBody' },
    { label: '站酷仓耳渔阳体-W05', value: 'StationCoolCangYuyangTi-W05' },
    { label: '站酷庆科黄油体常规', value: 'StationCoolRegular' },
    { label: '霞鹜漫黑', value: 'XiaWuManHei' },
    { label: '优设字由棒棒体', value: 'YoushiBangBangBody' },
    { label: '智勇手书体中文简体', value: 'ZhiyongSimplifiedChinese' },
    { label: '卓健橄榄简体', value: 'ZhuojianOliveSimplified' },
    { label: '字制区喜脉体', value: 'ZiSystemXiMaiTi' },
    {
      label: 'ZiTiChuanQiNanAnTi MianFeiShangYong2',
      value: 'ZiTiChuanQiNanAnTi-MianFeiShangYong-2',
    },
    { label: '仓迹高德国妙黑', value: 'CangJiGaoGermanMiaoHei' },
    { label: '荆南缘默体', value: 'JingnanMarginSilentBody' },
    { label: '创客贴金刚体', value: 'MakerStickersDiamondBody' },
    { label: 'SourceHanSansCN Bold1', value: 'SourceHanSansCN-Bold1' },
  ]

  if (
    getPPTLanguage.value === 'en-US' ||
    (!getPPTLanguage.value && lang === 'en-US')
  ) {
    fonts = fonts.filter(
      (item: any) => item.value !== 'StationCoolCangYuyangTi-W05'
    )
  }
  return fonts
}

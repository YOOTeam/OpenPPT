import type { LinePoint } from '@/types/slides'
import { useI18n } from 'vue-i18n'

export interface LinePoolItem {
  path: string
  style: 'solid' | 'dashed'
  points: [LinePoint, LinePoint]
  isBroken?: boolean
  isBroken2?: boolean
  isCurve?: boolean
  isCubic?: boolean
}

interface PresetLine {
  type: string
  children: LinePoolItem[]
}

export function LINE_LIST() {
  const { t } = useI18n()
  return [
    {
      type: t('shapePool.title5'),
      children: [
        { path: 'M 0 0 L 16 16', style: 'solid', points: ['', ''] },
        { path: 'M 0 0 L 16 16', style: 'dashed', points: ['', ''] },
        { path: 'M 0 0 L 16 16', style: 'solid', points: ['', 'arrow'] },
        { path: 'M 0 0 L 16 16', style: 'dashed', points: ['', 'arrow'] },
        { path: 'M 0 0 L 16 16', style: 'solid', points: ['', 'dot'] },
        {
          path: 'M 0 0 L 0 16 L 16 16',
          style: 'solid',
          points: ['', 'arrow'],
          isBroken: true,
        },
        {
          path: 'M 0 0 L 8 0 L 8 16 L 16 16',
          style: 'solid',
          points: ['', 'arrow'],
          isBroken2: true,
        },
        {
          path: 'M 0 0 Q 0 16 16 16',
          style: 'solid',
          points: ['', 'arrow'],
          isCurve: true,
        },
        {
          path: 'M 0 0 C 16 0 0 16 16 16',
          style: 'solid',
          points: ['', 'arrow'],
          isCubic: true,
        },
      ],
    },
  ]
}

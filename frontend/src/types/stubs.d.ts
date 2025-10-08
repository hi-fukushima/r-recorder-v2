import type { FC } from 'react'

// AreaSelector
export type AreaSelectorProps = Partial<Record<string, any>> & {
  onAreaSelect: (areaId: string) => void | Promise<void>
}
declare module './components/AreaSelector' {
  const C: FC<import('./types/stubs').AreaSelectorProps>
  export default C
}

// StationList
export type StationListProps = Partial<Record<string, any>> & {
  areaId?: string
  onStationSelect: (stationId: string) => void | Promise<void>
}
declare module './components/StationList' {
  const C: FC<import('./types/stubs').StationListProps>
  export default C
}

// DateSelector
export type DateSelectorProps = Partial<Record<string, any>> & {
  areaId?: string
  stationId?: string
  onDateSelect: (dateStr: string) => void | Promise<void>
}
declare module './components/DateSelector' {
  const C: FC<import('./types/stubs').DateSelectorProps>
  export default C
}

// ProgramGuide
export type ProgramGuideProps = Partial<Record<string, any>> & {
  stationId?: string
  dateStr?: string
  areaId?: string
  onDownloadScheduled: () => void | Promise<void>
}
declare module './components/ProgramGuide' {
  const C: FC<import('./types/stubs').ProgramGuideProps>
  export default C
}

// StatusPage / SearchPage は props なし前提で仮宣言
declare module './components/StatusPage' {
  const C: FC
  export default C
}
declare module './components/SearchPage' {
  const C: FC
  export default C
}

// ./api ユーティリティ（トークン管理）
declare module './api' {
  export function getToken(): string | null
  export function setTokens(jwtToken: string, radikoToken: string): void
  export function removeTokens(): void
}

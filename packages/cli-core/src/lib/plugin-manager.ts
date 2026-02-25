/**
 * 플러그인 관리자
 * oclif 플러그인 시스템과 연동하여 유료/무료 플러그인 관리.
 * 미설치 플러그인 접근 시 자연스러운 업셀 안내.
 * 유료 플러그인은 LicenseManager를 통해 라이선스 검증.
 */
import {LicenseManager} from './license-manager.js'

/** 플러그인 레지스트리 — 알려진 플러그인과 기능 매핑 */
const PLUGIN_REGISTRY: Record<string, PluginInfo> = {
  '@qbique/plugin-quantum': {
    name: '@qbique/plugin-quantum',
    description: 'Quantum annealing optimization engine',
    features: ['quantum-engine', 'qaoa', 'vqe'],
    tier: 'premium',
  },
  '@qbique/plugin-risk-pro': {
    name: '@qbique/plugin-risk-pro',
    description: 'Advanced risk analytics (stress test, scenario analysis, VaR)',
    features: ['stress-test', 'scenario-analysis', 'var-model'],
    tier: 'premium',
  },
  '@qbique/plugin-report-pdf': {
    name: '@qbique/plugin-report-pdf',
    description: 'PDF report generation with charts',
    features: ['pdf-report', 'chart-export'],
    tier: 'free',
  },
  '@qbique/plugin-data-bloomberg': {
    name: '@qbique/plugin-data-bloomberg',
    description: 'Bloomberg data integration',
    features: ['bloomberg-feed', 'blp-query'],
    tier: 'enterprise',
  },
}

interface PluginInfo {
  name: string
  description: string
  features: string[]
  tier: 'free' | 'premium' | 'enterprise'
}

export class PluginManager {
  /**
   * 특정 기능이 플러그인을 필요로 하는지 확인.
   * 필요하지만 미설치라면 안내 메시지를 반환.
   */
  static checkFeature(feature: string): {available: boolean; message?: string} {
    for (const plugin of Object.values(PLUGIN_REGISTRY)) {
      if (plugin.features.includes(feature)) {
        // oclif 플러그인 설치 여부는 런타임에 확인 (여기서는 구조만)
        return {
          available: false,
          message: PluginManager.upsellMessage(plugin),
        }
      }
    }

    return {available: true}
  }

  /**
   * engine 플래그 값이 플러그인을 필요로 하는지 확인.
   */
  static checkEngine(engine: string): {available: boolean; message?: string} {
    if (engine === 'quantum') {
      return PluginManager.checkFeature('quantum-engine')
    }

    // classical은 내장
    return {available: true}
  }

  /**
   * 업셀 안내 메시지 생성.
   */
  static upsellMessage(plugin: PluginInfo): string {
    const tierLabel = plugin.tier === 'enterprise'
      ? '(Enterprise 라이선스 필요)'
      : plugin.tier === 'premium'
        ? '(Premium 플러그인)'
        : ''

    return (
      `이 기능은 ${plugin.name} 플러그인이 필요합니다. ${tierLabel}\n` +
      `  ${plugin.description}\n` +
      `  설치: qbique plugins install ${plugin.name}`
    )
  }

  /**
   * 플러그인 레지스트리 전체 조회.
   */
  static listAvailablePlugins(): PluginInfo[] {
    return Object.values(PLUGIN_REGISTRY)
  }

  /**
   * 특정 플러그인 정보 조회.
   */
  static getPluginInfo(name: string): PluginInfo | undefined {
    return PLUGIN_REGISTRY[name]
  }

  /**
   * 플러그인이 설치되어 있고 라이선스도 유효한지 종합 확인.
   * 설치 여부 + 라이선스 검증을 한 번에 처리.
   */
  static checkPluginAccess(pluginName: string): {allowed: boolean; message?: string} {
    const plugin = PLUGIN_REGISTRY[pluginName]
    if (!plugin) {
      return {allowed: false, message: `Unknown plugin: ${pluginName}`}
    }

    if (plugin.tier === 'free') {
      return {allowed: true}
    }

    const lm = new LicenseManager()
    const result = lm.check(pluginName, plugin.tier)

    if (result.status === 'valid' || result.status === 'free') {
      return {allowed: true}
    }

    return {allowed: false, message: result.message}
  }
}

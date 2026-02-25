/**
 * quantum 엔진 명령어 — 플러그인 설치 시 자동 등록됨.
 *
 * 사용법:
 *   qbique optimize quantum --problem-id 1
 *   qbique optimize quantum --problem-id 1 --solver qaoa --shots 1000
 *
 * 이 파일은 플러그인 구조 예시입니다.
 * 실제 구현은 optimization_engine의 quantum solver와 연동합니다.
 */
import {Command, Flags} from '@oclif/core'

export default class OptimizeQuantum extends Command {
  static override description = 'Run quantum optimization (requires @qbique/plugin-quantum)'

  static override examples = [
    '<%= config.bin %> optimize quantum --problem-id 1',
    '<%= config.bin %> optimize quantum --problem-id 1 --solver qaoa --shots 1000',
  ]

  static override flags = {
    'problem-id': Flags.integer({
      description: 'Optimization problem ID',
      required: true,
    }),
    solver: Flags.string({
      description: 'Quantum solver type',
      options: ['qaoa', 'vqe', 'annealing'],
      default: 'annealing',
    }),
    shots: Flags.integer({
      description: 'Number of shots for quantum circuit',
      default: 1000,
    }),
    backend: Flags.string({
      description: 'Quantum backend (simulator, ibm_brisbane, ...)',
      default: 'simulator',
    }),
  }

  async run(): Promise<void> {
    const {flags} = await this.parse(OptimizeQuantum)

    this.log(
      `Quantum optimization: problem #${flags['problem-id']}\n` +
      `  Solver: ${flags.solver}\n` +
      `  Shots: ${flags.shots}\n` +
      `  Backend: ${flags.backend}\n` +
      `\n  [Plugin scaffold — connect to optimization_engine quantum API]`,
    )
  }
}

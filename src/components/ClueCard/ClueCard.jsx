import styles from './ClueCard.module.css'

const phaseClass = {
  idle:            styles.idle,
  'exiting-up':    styles.exitingUp,
  'exiting-down':  styles.exitingDown,
  'entering-up':   styles.enteringUp,
  'entering-down': styles.enteringDown,
}

export function ClueCard({ clue, isRevealed, transitionPhase }) {
  return (
    <div className={`${styles.card} ${phaseClass[transitionPhase] ?? styles.idle}`}>
      <p className={styles.question}>{clue?.question}</p>

      <p className={`${styles.answerText} ${isRevealed ? styles.answerVisible : ''}`}>
        {clue?.answer}
      </p>
    </div>
  )
}

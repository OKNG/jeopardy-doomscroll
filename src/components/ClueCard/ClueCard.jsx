import styles from './ClueCard.module.css'

const phaseClass = {
  idle:            styles.idle,
  'exiting-up':    styles.exitingUp,
  'exiting-down':  styles.exitingDown,
  'entering-up':   styles.enteringUp,
  'entering-down': styles.enteringDown,
}

export function ClueCard({ clue, isRevealed, transitionPhase, onTap }) {
  return (
    <div
      className={`${styles.card} ${phaseClass[transitionPhase] ?? styles.idle}`}
      onClick={onTap}
    >
      <div className={`${styles.content} ${isRevealed ? styles.revealed : ''}`}>
        <p className={styles.question}>{clue?.question}</p>
        <p className={styles.answer}>{clue?.answer}</p>
      </div>
    </div>
  )
}

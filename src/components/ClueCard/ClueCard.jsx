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
      data-name="clue-card"
      className={`${styles.card} ${phaseClass[transitionPhase] ?? styles.idle}`}
      onClick={onTap}
    >
      <div data-name="clue-content" className={`${styles.content} ${isRevealed ? styles.revealed : ''}`}>
        <p data-name="clue-question" className={styles.question}>{clue?.question}</p>
        <p data-name="clue-answer" className={styles.answer}>{clue?.answer}</p>
      </div>
    </div>
  )
}

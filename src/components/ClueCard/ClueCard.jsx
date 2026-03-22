import styles from './ClueCard.module.css'

export function ClueCard({ clue, isRevealed, onTap }) {
  return (
    <div
      data-name="clue-card"
      className={styles.card}
      onClick={onTap}
    >
      <div data-name="clue-content" className={`${styles.content} ${isRevealed ? styles.revealed : ''}`}>
        <p data-name="clue-question" className={styles.question}>{clue?.question}</p>
        <p data-name="clue-answer" className={styles.answer}>{clue?.answer}</p>
      </div>
    </div>
  )
}

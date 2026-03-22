import styles from './ClueCard.module.css'

export function ClueCard({ clue, isRevealed, onTap, promptIcon }) {
  return (
    <div
      data-name="clue-card"
      className={styles.card}
      onClick={onTap}
    >
      <div data-name="clue-content" className={`${styles.content} ${isRevealed ? styles.revealed : ''}`}>
        <div data-name="clue-question-wrapper" style={{ position: 'relative' }}>
          <p data-name="clue-question" className={styles.question}>{clue?.question}</p>
          {promptIcon && !isRevealed && (
            <img src={promptIcon} alt="" style={{
              position: 'absolute',
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              marginTop: 'var(--space-6)',
              height: 72,
              pointerEvents: 'none',
              filter: 'brightness(0) invert(1)',
              animation: 'pulse 2s ease-in-out infinite',
            }} />
          )}
        </div>
        <p data-name="clue-answer" className={styles.answer}>{clue?.answer}</p>
      </div>
    </div>
  )
}

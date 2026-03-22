import styles from './LoadingCard.module.css'

export function LoadingCard() {
  return (
    <div data-name="loading-card" className={styles.card}>
      <span data-name="loading-ellipsis" className={styles.ellipsis}>
        <span>.</span><span>.</span><span>.</span>
      </span>
    </div>
  )
}

import styles from './LoadingCard.module.css'

export function LoadingCard() {
  return (
    <div className={styles.card}>
      <span className={styles.ellipsis}>
        <span>.</span><span>.</span><span>.</span>
      </span>
    </div>
  )
}

import styles from './MicIndicator.module.css'

export function MicIndicator() {
  return (
    <div className={styles.container}>
      <div className={styles.ring} />
      <svg
        className={styles.icon}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x="9" y="2" width="6" height="12" rx="3" fill="white" />
        <path
          d="M5 11a7 7 0 0 0 14 0"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line x1="12" y1="18" x2="12" y2="22" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <line x1="9" y1="22" x2="15" y2="22" stroke="white" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
  )
}

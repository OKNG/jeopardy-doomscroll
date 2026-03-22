import styles from './CategoryHeader.module.css'

export function CategoryHeader({ categoryName }) {
  return (
    <header className={styles.header}>
      <span className={styles.name}>
        {categoryName ? categoryName.toUpperCase() : '\u2014'}
      </span>
    </header>
  )
}

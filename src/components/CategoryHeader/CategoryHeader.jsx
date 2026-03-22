import styles from './CategoryHeader.module.css'

export function CategoryHeader({ categoryName }) {
  return (
    <header data-name="category-header" className={styles.header}>
      <span data-name="category-name" className={styles.name}>
        {categoryName ? categoryName.toUpperCase() : '\u2014'}
      </span>
    </header>
  )
}

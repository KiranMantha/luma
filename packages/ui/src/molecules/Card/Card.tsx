import type { CardProps } from './Card.model';
import styles from './Card.module.scss';

export function Card({ children, className, onClick, ...props }: CardProps) {
  const cardClassName = className ? `${styles.card} ${className}` : styles.card;

  return (
    <div className={cardClassName} onClick={onClick} {...props}>
      {children}
    </div>
  );
}

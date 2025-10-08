import { ReactNode } from 'react';
import styles from './Card.module.scss';

export interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Card({ children, className, onClick, ...props }: CardProps) {
  const cardClassName = className ? `${styles.card} ${className}` : styles.card;

  return (
    <div className={cardClassName} onClick={onClick} {...props}>
      {children}
    </div>
  );
}

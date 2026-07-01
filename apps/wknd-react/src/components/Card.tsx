import './Card.css';

type CardProps = {
  general: {
    image?: string;
    title: string;
    description: string;
  };
};

export const Card = ({ general }: CardProps) => {
  const { image, title, description } = general;
  return (
    <div className="card">
      <img src={image} alt="Card image" className="card-image" />

      <div className="card-body">
        <h3 className="card-title">{title}</h3>

        <p className="card-description">{description}</p>
      </div>
    </div>
  );
};

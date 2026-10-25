import { Star } from 'lucide-react';

type RatingStarsProps = {
  rating: number;
  label?: string;
  size?: number;
};

export function RatingStars({ rating, label, size = 14 }: RatingStarsProps) {
  return (
    <span className="rating-stars" aria-label={label ?? `Rated ${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((index) => (
        <Star
          key={index}
          size={size}
          className={index <= rating ? 'is-filled' : ''}
          aria-hidden="true"
        />
      ))}
      <b className="rating-value">{rating}/5</b>
    </span>
  );
}

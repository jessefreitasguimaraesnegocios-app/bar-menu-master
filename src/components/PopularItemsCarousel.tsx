import { useEffect, useRef, useState } from 'react';
import { MenuItem } from '@/data/menuData';
import MenuCard from '@/components/MenuCard';

interface PopularItemsCarouselProps {
  items: MenuItem[];
  onItemClick: (item: MenuItem) => void;
}

const PopularItemsCarousel = ({ items, onItemClick }: PopularItemsCarouselProps) => {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);

  // Duplicar itens para criar loop infinito
  const duplicatedItems = [...items, ...items];

  // O loop infinito funciona automaticamente com CSS animation
  // Não precisamos de lógica adicional aqui

  if (items.length === 0) return null;

  return (
    <div
      className="popular-carousel-container"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div
        ref={carouselRef}
        className={`popular-carousel ${isPaused ? 'paused' : ''}`}
        style={{
          '--item-count': items.length,
        } as React.CSSProperties}
      >
        {duplicatedItems.map((item, index) => (
          <div key={`${item.id}-${index}`} className="popular-carousel-item">
            <MenuCard
              item={item}
              index={index}
              onClick={() => onItemClick(item)}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default PopularItemsCarousel;


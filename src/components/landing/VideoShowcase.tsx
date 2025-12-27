import { useState } from "react";

interface VideoCard {
  id: number;
  views: string;
  style: string;
  thumbnail: string;
}

const videoCards: VideoCard[] = [
  { id: 1, views: "13.2k", style: "AutoShorts", thumbnail: "https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?w=300&h=500&fit=crop" },
  { id: 2, views: "43.7k", style: "AutoShorts", thumbnail: "https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=300&h=500&fit=crop" },
  { id: 3, views: "28.8k", style: "Childrens Book", thumbnail: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=500&fit=crop" },
  { id: 4, views: "62.3k", style: "AutoShorts V2", thumbnail: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=300&h=500&fit=crop" },
  { id: 5, views: "22.6k", style: "UGC Hook", thumbnail: "https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=300&h=500&fit=crop" },
  { id: 6, views: "96.4k", style: "AutoShorts", thumbnail: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=300&h=500&fit=crop" },
  { id: 7, views: "17.1k", style: "Lego", thumbnail: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=300&h=500&fit=crop" },
  { id: 8, views: "71.9k", style: "Disney Toon", thumbnail: "https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?w=300&h=500&fit=crop" },
  { id: 9, views: "55.3k", style: "Expressionism", thumbnail: "https://images.unsplash.com/photo-1504608524841-42fe6f032b4b?w=300&h=500&fit=crop" },
  { id: 10, views: "92.7k", style: "Minecraft", thumbnail: "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=300&h=500&fit=crop" },
  { id: 11, views: "33.8k", style: "AutoShorts", thumbnail: "https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=300&h=500&fit=crop" },
  { id: 12, views: "67.2k", style: "GTAV", thumbnail: "https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=300&h=500&fit=crop" },
];

export function VideoShowcase() {
  const [isPaused, setIsPaused] = useState(false);

  // Duplicate the cards for seamless loop
  const allCards = [...videoCards, ...videoCards];

  return (
    <section className="py-16 relative overflow-hidden bg-gradient-to-b from-primary via-accent to-primary">
      <div className="text-center mb-12">
        <h2 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-4">
          UNIQUE VIDEOS EACH TIME
        </h2>
        <p className="text-xl text-primary-foreground/80 uppercase tracking-wide">
          Choose a video in any niche
        </p>
      </div>

      {/* Scrolling video carousel */}
      <div 
        className="relative"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div 
          className={`flex gap-4 ${isPaused ? '' : 'animate-scroll'}`}
          style={{ 
            width: 'max-content',
            animationPlayState: isPaused ? 'paused' : 'running'
          }}
        >
          {allCards.map((card, index) => (
            <div
              key={`${card.id}-${index}`}
              className="relative flex-shrink-0 w-40 h-72 rounded-2xl overflow-hidden group cursor-pointer transition-transform hover:scale-105"
            >
              <img
                src={card.thumbnail}
                alt={`${card.style} video`}
                className="w-full h-full object-cover"
              />
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              
              {/* Views count */}
              <div className="absolute top-3 left-3 px-2 py-1 bg-black/50 rounded-lg text-white text-xs font-medium">
                {card.views}
              </div>
              
              {/* Style label */}
              <div className="absolute bottom-3 left-3 right-3">
                <p className="text-white/70 text-xs">Style:</p>
                <p className="text-white font-semibold text-sm truncate">{card.style}</p>
              </div>

              {/* Play button on hover */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                  <svg className="w-5 h-5 text-primary ml-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

import React, { useEffect, useState } from "react";
import { Music, Volume2, VolumeX, AlertCircle } from "lucide-react";

interface BackgroundMusicProps {
  audioUrl: string;
  title?: string;
  enabled?: boolean;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  audioRef: React.RefObject<HTMLAudioElement | null>;
}

export default function BackgroundMusic({
  audioUrl,
  title = "Beautiful in White",
  enabled = true,
  isPlaying,
  setIsPlaying,
  audioRef
}: BackgroundMusicProps) {
  const [playbackError, setPlaybackError] = useState<string | null>(null);

  // Auto-play attempt on user interaction
  useEffect(() => {
    if (!enabled || !audioUrl) {
      setIsPlaying(false);
      return;
    }

    const tryAutoPlay = () => {
      if (audioRef.current && audioRef.current.paused) {
        audioRef.current.play()
          .then(() => {
            setIsPlaying(true);
            setPlaybackError(null);
            cleanupEvents(); // remove listeners once played successfully
          })
          .catch((err) => {
            console.log("Autoplay blocked, waiting for more interaction:", err);
          });
      }
    };

    const cleanupEvents = () => {
      window.removeEventListener("click", tryAutoPlay);
      window.removeEventListener("touchstart", tryAutoPlay);
      window.removeEventListener("scroll", tryAutoPlay);
    };

    window.addEventListener("click", tryAutoPlay);
    window.addEventListener("touchstart", tryAutoPlay);
    window.addEventListener("scroll", tryAutoPlay);

    // Initial silent load & play check
    if (audioRef.current) {
      audioRef.current.load();
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true);
          setPlaybackError(null);
          cleanupEvents();
        })
        .catch((err) => {
          console.log("Autoplay policy active. Waiting for guest interaction.");
          setPlaybackError("Vui lòng nhấp màn hình để nghe nhạc");
        });
    }

    return () => {
      cleanupEvents();
    };
  }, [audioUrl, enabled, audioRef, setIsPlaying]);

  const togglePlay = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        // Clear error and play
        setPlaybackError(null);
        audioRef.current.play()
          .then(() => {
            setIsPlaying(true);
          })
          .catch((err) => {
            console.error("Manual play failed:", err);
            setPlaybackError("Vui lòng tương tác để phát nhạc");
            setIsPlaying(false);
          });
      }
    }
  };

  const preventSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  };

  if (!enabled || !audioUrl) return null;

  return (
    <div
      id="bg-music-station"
      onContextMenu={preventSave}
      className="fixed bottom-20 right-4 z-40 bg-white/90 backdrop-blur-md rounded-full shadow-lg border border-stone-200/80 p-2 flex items-center gap-2 max-w-[260px] animate-fade-in transition-all hover:bg-white select-none"
      title="Nhấn chuột phải bị vô hiệu hóa để bảo vệ tác quyền nhạc"
    >
      {/* Dynamic play animation rings */}
      <div className="relative flex items-center justify-center">
        {isPlaying && (
          <>
            <span className="absolute animate-ping inline-flex h-8 w-8 rounded-full bg-rose-400/30 opacity-75"></span>
            <span className="absolute animate-pulse inline-flex h-10 w-10 rounded-full bg-rose-400/15"></span>
          </>
        )}
        <button
          onClick={togglePlay}
          className="relative z-10 p-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer"
          aria-label={isPlaying ? "Dừng nhạc" : "Phát nhạc"}
        >
          {isPlaying ? (
            <Volume2 className="w-4 h-4 animate-bounce" />
          ) : (
            <VolumeX className="w-4 h-4" />
          )}
        </button>
      </div>

      <div className="flex flex-col pr-3 max-w-[170px] leading-tight">
        <span className="text-[9px] uppercase tracking-wider text-rose-600 font-bold flex items-center gap-0.5">
          <Music className="w-2.5 h-2.5" />
          Nhạc Nền Thiệp
        </span>
        <span className="text-[10px] font-semibold text-stone-800 truncate" title={title}>
          {title}
        </span>
        {playbackError && (
          <span className="text-[8px] text-amber-600 flex items-center gap-0.5 mt-0.5 leading-none">
            <AlertCircle className="w-2 h-2" />
            {playbackError}
          </span>
        )}
      </div>
    </div>
  );
}

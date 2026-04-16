import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function EmojiRain({ socket }) {
  const [emojis, setEmojis] = useState([]);

  useEffect(() => {
    if (!socket) return;

    const handleReaction = (data) => {
      const id = Math.random().toString(36).substr(2, 9);
      const newEmoji = {
        id,
        emoji: data.emoji,
        x: Math.random() * 80 + 10, // 10% to 90% of screen width
        duration: Math.random() * 2 + 2,
      };

      setEmojis((prev) => [...prev, newEmoji]);
      setTimeout(() => {
        setEmojis((prev) => prev.filter((e) => e.id !== id));
      }, 4000);
    };

    socket.on('reaction', handleReaction);
    return () => socket.off('reaction', handleReaction);
  }, [socket]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      <AnimatePresence>
        {emojis.map((e) => (
          <motion.div
            key={e.id}
            initial={{ y: '110vh', x: `${e.x}vw`, opacity: 0, scale: 0.5, rotate: 0 }}
            animate={{ y: '-10vh', opacity: 1, scale: 1.5, rotate: 360 }}
            exit={{ opacity: 0 }}
            transition={{ duration: e.duration, ease: 'easeOut' }}
            style={{ position: 'absolute', fontSize: '3rem' }}
          >
            {e.emoji}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

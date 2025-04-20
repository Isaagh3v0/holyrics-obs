import { useContext, useEffect, useState, useRef } from "react";
import { SocketContext } from "../context/SocketContext";
import { motion, AnimatePresence } from "framer-motion";
import MusicContent from "../components/MusicContent";
import React from "react";

interface TextData {
  type: "MUSIC" | "EMPTY";
  header: string | null;
  content: string;
}

export default function Lyrics() {
  const { socket } = useContext(SocketContext);
  const [textData, setTextData] = useState<TextData>({
    type: "MUSIC",
    header: null,
    content: "",
  });
  const [fontSize, setFontSize] = useState(35);
  const [visible, setVisible] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const visibleRef = useRef<HTMLDivElement>(null);
  const invisibleRef = useRef<HTMLDivElement>(null);

  // Socket event listener
  useEffect(() => {
    if (!socket) return;

    socket.on("text", (data: TextData) => {
      if (data.type !== "MUSIC" && data.type !== "EMPTY") {
        setVisible(false);
        return;
      }

      if (data.type === "EMPTY") {
        setVisible(false);
      } else {
        const isEmpty = !data.content || data.content.trim() === "";
        setVisible(!isEmpty);
      }

      setTextData(data);
    });

    return () => {
      socket.off("text");
    };
  }, [socket]);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) =>
        console.error(`Error entering fullscreen: ${err.message}`)
      );
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  };

  // Adjust text size
  const adjustTextSize = () => {
    if (!visibleRef.current || !invisibleRef.current || !containerRef.current) return;

    const invisibleDiv = invisibleRef.current;
    const container = containerRef.current;
    let currentSize = fontSize;
    const maxSize = 100;
    const minSize = 10;

    invisibleDiv.style.fontSize = `${maxSize}px`;

    if (
      invisibleDiv.scrollHeight > container.clientHeight ||
      invisibleDiv.scrollWidth > container.clientWidth
    ) {
      let min = minSize;
      let max = maxSize;

      while (min <= max) {
        const mid = Math.floor((min + max) / 2);
        invisibleDiv.style.fontSize = `${mid}px`;

        if (
          invisibleDiv.scrollHeight > container.clientHeight ||
          invisibleDiv.scrollWidth > container.clientWidth
        ) {
          max = mid - 1;
        } else {
          min = mid + 1;
          currentSize = mid;
        }
      }
    } else {
      currentSize = maxSize;
    }

    setFontSize(currentSize);
  };

  // Adjust text size on text change or window resize
  useEffect(() => {
    if (visible) {
      adjustTextSize();
    }

    const handleResize = () => {
      if (visible) {
        adjustTextSize();
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [textData, visible]);

  // Render invisible content for text size calculation
  const renderInvisibleContent = () => {
    if (textData.type === "EMPTY" || !textData.content) return null;

    return (
      <>
        {textData.header && (
          <span className="block text-[70%] mb-4">{textData.header}</span>
        )}
        <div>
          {textData.content.split("\n").map((line, index) => (
            <React.Fragment key={index}>
              {line}
              {index < textData.content.split("\n").length - 1 && <br />}
            </React.Fragment>
          ))}
        </div>
      </>
    );
  };

  return (
    <AnimatePresence mode="wait">
      {visible && (
        <motion.div
          key="screen-container"
          ref={containerRef}
          className="w-screen h-screen bg-gradient-to-b from-black/70 to-blue-900/70 overflow-hidden relative"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          onDoubleClick={toggleFullscreen}
        >
          <motion.div
            key="text-container"
            className="w-full h-full flex items-center justify-center text-white text-center"
          >
            <motion.div
              ref={visibleRef}
              className="font-arial pt-4 px-4 w-full h-full flex flex-col items-center justify-center text-shadow-lg glow"
            >
              <MusicContent
                header={textData.header}
                content={textData.content}
                fontSize={fontSize}
              />
            </motion.div>
          </motion.div>
          <div
            ref={invisibleRef}
            className="absolute invisible font-arial pt-4 px-4 w-full h-full"
          >
            {renderInvisibleContent()}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
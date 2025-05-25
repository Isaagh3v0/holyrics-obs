import { useContext, useEffect, useState, useRef } from "react";
import { SocketContext } from "../context/SocketContext";
import { motion, AnimatePresence } from "framer-motion";
import BibleContent from "../components/BibleContent";

interface TextData {
  type: "BIBLE" | "EMPTY";
  header: string | null;
  content: string[];
}

export default function Verses() {
  const { socket } = useContext(SocketContext);
  const [textData, setTextData] = useState<TextData>({
    type: "BIBLE",
    header: null,
    content: [],
  });
  const [fontSize, setFontSize] = useState(35);
  const [visible, setVisible] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const visibleRef = useRef<HTMLDivElement>(null);
  const invisibleRef = useRef<HTMLDivElement>(null);

  // WebSocket event listener
  useEffect(() => {
    if (!socket) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const data: TextData = JSON.parse(event.data);
        if (data.type !== "BIBLE" && data.type !== "EMPTY") {
          setVisible(false);
          return;
        }

        if (data.type === "EMPTY") {
          setVisible(false);
        } else {
          const isEmpty = !data.content || data.content.length === 0;
          setVisible(!isEmpty);
        }

        setTextData(data);
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    socket.addEventListener("message", handleMessage);

    return () => {
      socket.removeEventListener("message", handleMessage);
    };
  }, [socket]);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) =>
        console.error(`Ошибка перехода в полноэкранный режим: ${err.message}`)
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
    if (textData.type === "EMPTY" || !textData.content || textData.content.length === 0) return null;

    const primaryText = textData.content[0] || "";
    const secondaryText = textData.content[1] || "";
    const verseNumber = textData.header ? parseInt(textData.header.split(":")[1]?.trim() || "0") : 0;
    const fullText = `${primaryText}${secondaryText ? " " + secondaryText : ""}`;
    const words = fullText.split(" ");
    const maxWordsPerLine = Math.ceil(words.length / 2);
    const firstLine = words.slice(0, maxWordsPerLine).join(" ");
    const secondLine = words.slice(maxWordsPerLine).join(" ") || "";

    return (
      <>
        {textData.header && (
          <span className="block text-[70%] mb-4">{textData.header}</span>
        )}
        <div className="flex flex-col space-y-4 leading-tight">
          <span className="inline-flex items-baseline">
            <span className="text-[50%]">
              <sup>{verseNumber}</sup>
            </span>
            <span className="text-[50%] mx-1"> </span>
            {firstLine}
          </span>
          {secondLine && (
            <span className="inline-flex items-baseline">
              <span className="text-[50%]">
                <sup>{verseNumber}</sup>
              </span>
              <span className="text-[50%] mx-1"> </span>
              {secondLine}
            </span>
          )}
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
          className="w-screen h-screen overflow-hidden relative bg-black"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          onDoubleClick={toggleFullscreen}
        >
          <motion.div
            key="text-container"
            className="w-full h-full flex items-center justify-center text-white text-center relative z-10"
          >
            <motion.div
              ref={visibleRef}
              className="font-arial pt-4 px-4 w-full h-full flex flex-col items-center justify-center text-shadow-lg glow"
            >
              <BibleContent
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